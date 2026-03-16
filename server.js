import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool, { initDB } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hungry-poly-secret-key-change-in-prod';

const app = express();
const httpServer = createServer(app);

app.use(express.json());

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, 'dist');

// ── Auth helpers ──
function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

// ── REST API ──

const dbAvailable = !!process.env.DATABASE_URL;

function requireDB(req, res, next) {
  if (!dbAvailable) return res.status(503).json({ error: 'Base de datos no configurada. Agrega PostgreSQL en Railway.' });
  next();
}

app.post('/api/register', requireDB, async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password || !displayName) return res.status(400).json({ error: 'Faltan campos' });
    if (username.length > 20 || displayName.length > 20) return res.status(400).json({ error: 'Máximo 20 caracteres' });
    if (password.length < 4) return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, username, display_name, wins, games_played',
      [username.toLowerCase(), hash, displayName]
    );
    const user = result.rows[0];
    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, displayName: user.display_name, wins: user.wins, gamesPlayed: user.games_played } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Ese nombre de usuario ya existe' });
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

app.post('/api/login', requireDB, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan campos' });

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, displayName: user.display_name, wins: user.wins, gamesPlayed: user.games_played } });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/profile/:id', requireDB, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, display_name, wins, games_played, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    const u = result.rows[0];
    res.json({ id: u.id, username: u.username, displayName: u.display_name, wins: u.wins, gamesPlayed: u.games_played, createdAt: u.created_at });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/history/:userId', requireDB, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM game_history WHERE players @> $1::jsonb ORDER BY finished_at DESC LIMIT 50',
      [JSON.stringify([{ userId: parseInt(req.params.userId) }])]
    );
    res.json(result.rows.map(r => ({
      id: r.id, roomCode: r.room_code, winnerName: r.winner_name,
      playerCount: r.player_count, difficulty: r.difficulty,
      players: r.players, finishedAt: r.finished_at,
    })));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Health check ──
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: Date.now() }));

// ── Socket.io (BEFORE static files to avoid catch-all interference) ──
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['polling', 'websocket'],
  allowUpgrades: false,
  addTrailingSlash: false,
});

io.engine.on('connection_error', (err) => {
  console.error('⚠️ Engine connection error:', err.req?.url, err.code, err.message);
});

io.engine.on('connection', (rawSocket) => {
  console.log('🔧 Engine.IO raw connection:', rawSocket.id);
});

io.use((socket, next) => {
  console.log('🔑 Socket middleware running for:', socket.id);
  try {
    const token = socket.handshake.auth?.token;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        socket.data.userId = decoded.id;
        socket.data.username = decoded.username;
      }
    }
    socket.data.reconnectId = socket.handshake.auth?.reconnectId || null;
    next();
  } catch (err) {
    console.error('⚠️ Socket middleware error:', err);
    next(err);
  }
});

// ── Static files ──
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')));
}

const rooms = new Map();
const genCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();

// Track which rooms already saved history (prevent duplicates)
const savedGames = new Set();

// Grace period timers for disconnected players (reconnectId → timeoutId)
const disconnectTimers = new Map();
const GRACE_PERIOD_MS = 30000;

// ── Helper: get public rooms list for lobby browser ──
function getPublicRoomsList() {
  const list = [];
  for (const [code, room] of rooms) {
    if (room.isPublic && !room.started && room.players.length < 4) {
      list.push({
        code,
        roomName: room.roomName,
        playerCount: room.players.length,
        hostName: room.players[0]?.name || '',
      });
    }
  }
  return list;
}

function broadcastLobbyList() {
  io.to('lobby-browser').emit('lobbyListUpdate', getPublicRoomsList());
}

io.on('connection', socket => {
  console.log(`🔌 Socket connected: ${socket.id} (userId: ${socket.data.userId || 'guest'})`);
  socket.on('disconnect', reason => {
    console.log(`❌ Socket disconnected: ${socket.id} reason: ${reason}`);
  });

  // ── Create room ──
  socket.on('createRoom', ({ playerName, isPublic, roomName }) => {
    console.log(`📦 createRoom from ${socket.id}: playerName=${playerName}, isPublic=${isPublic}, roomName=${roomName}`);
    const code = genCode();
    rooms.set(code, {
      hostId: socket.id,
      players: [{ id: socket.id, name: playerName, idx: 0, userId: socket.data.userId || null, reconnectId: socket.data.reconnectId }],
      started: false,
      isPublic: !!isPublic,
      roomName: roomName || '',
      difficulty: 'medio',
    });
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('roomCreated', { code, isPublic: !!isPublic, roomName: roomName || '' });
    io.to(code).emit('lobbyUpdate', {
      players: rooms.get(code).players.map(p => ({ name: p.name, idx: p.idx })),
    });
    if (isPublic) broadcastLobbyList();
  });

  // ── Join room ──
  socket.on('joinRoom', ({ code, playerName }) => {
    const room = rooms.get(code);
    if (!room) return socket.emit('joinError', 'Sala no encontrada');
    if (room.started) return socket.emit('joinError', 'El juego ya comenzó');
    if (room.players.length >= 4) return socket.emit('joinError', 'Sala llena (máximo 4 jugadores)');
    const idx = room.players.length;
    room.players.push({ id: socket.id, name: playerName, idx, userId: socket.data.userId || null, reconnectId: socket.data.reconnectId });
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('roomJoined', { code, myIdx: idx, isPublic: room.isPublic, roomName: room.roomName });
    io.to(code).emit('lobbyUpdate', {
      players: room.players.map(p => ({ name: p.name, idx: p.idx })),
    });
    if (room.isPublic) broadcastLobbyList();
  });

  // ── Rejoin room after refresh ──
  socket.on('rejoinRoom', ({ reconnectId, roomCode: code }) => {
    const room = rooms.get(code);
    if (!room) return socket.emit('rejoinError', 'Sala no encontrada');
    // Find player by reconnectId — may or may not be marked disconnected yet
    // (polling transport can delay disconnect detection by several seconds)
    const player = room.players.find(p => p.reconnectId === reconnectId);
    if (!player) return socket.emit('rejoinError', 'No se puede reconectar');
    // Cancel grace period timer if any
    const timerKey = `${code}:${reconnectId}`;
    if (disconnectTimers.has(timerKey)) {
      clearTimeout(disconnectTimers.get(timerKey));
      disconnectTimers.delete(timerKey);
    }
    // Disconnect the old socket if it's still lingering
    const oldSocketId = player.id;
    if (oldSocketId !== socket.id) {
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket) {
        oldSocket.data.roomCode = null; // prevent disconnect handler cleanup
        oldSocket.disconnect(true);
      }
    }
    // Restore player connection
    player.id = socket.id;
    player.disconnected = false;
    socket.join(code);
    socket.data.roomCode = code;
    // Restore host if this player was originally the host
    if (player.wasHost) {
      room.hostId = socket.id;
      player.wasHost = false;
    }
    // Also restore host if the old socket was still the hostId
    if (room.hostId === oldSocketId) {
      room.hostId = socket.id;
    }
    const isHost = room.hostId === socket.id;
    socket.emit('rejoinSuccess', {
      myIdx: player.idx,
      isHost,
      phase: room.started ? 'playing' : 'onlineLobby',
      players: room.players.filter(p => !p.disconnected).map(p => ({ name: p.name, idx: p.idx })),
      roomIsPublic: room.isPublic,
      roomDisplayName: room.roomName,
      gameState: (isHost && room.started && room.lastGameState) ? room.lastGameState : null,
    });
    // Notify others that player reconnected
    const activePlayers = room.players.filter(p => !p.disconnected);
    io.to(code).emit('lobbyUpdate', {
      players: activePlayers.map(p => ({ name: p.name, idx: p.idx })),
    });
    io.to(code).emit('playerRejoined', {
      playerName: player.name,
      playerIdx: player.idx,
      activeCount: activePlayers.length,
    });
  });

  // ── List public rooms (lobby browser) ──
  socket.on('listRooms', (callback) => {
    if (typeof callback === 'function') callback(getPublicRoomsList());
  });

  // ── Join/leave lobby browser channel ──
  socket.on('joinLobbyBrowser', () => socket.join('lobby-browser'));
  socket.on('leaveLobbyBrowser', () => socket.leave('lobby-browser'));

  // ── Relay hat pick in lobby ──
  socket.on('lobbyHatPick', ({ code, playerName, hat }) => {
    socket.to(code).emit('lobbyHatPick', { playerName, hat });
  });

  // ── Host starts the game ──
  socket.on('startGame', ({ code, hatPicks, difficulty }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;
    room.started = true;
    room.difficulty = difficulty || 'medio';
    io.to(code).emit('gameStarted', {
      hatPicks,
      difficulty,
      players: room.players.map(p => ({ name: p.name, idx: p.idx })),
    });
    if (room.isPublic) broadcastLobbyList();
  });

  // ── Host syncs full game state to all clients ──
  socket.on('syncState', ({ code, state }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;
    room.lastGameState = state;  // Cache for host reconnection
    socket.to(code).emit('stateUpdate', { state });

    // Save game history when a winner is declared
    if (state.winner && !savedGames.has(code)) {
      savedGames.add(code);
      const playersData = room.players.map(p => ({
        userId: p.userId,
        name: p.name,
      }));
      saveGameHistory(code, state.winner, room, playersData).catch(() => {});
    }
  });

  // ── Non-host sends action → relay to host with player index ──
  socket.on('playerAction', ({ code, action }) => {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    io.to(room.hostId).emit('remoteAction', { fromId: socket.id, playerIdx: player.idx, action });
  });

  // ── Chat message relay ──
  socket.on('chatMessage', ({ code, playerName, text }) => {
    const room = rooms.get(code);
    if (!room) return;
    io.to(code).emit('chatMessage', { playerName, text, timestamp: Date.now() });
  });

  // ── Intentional leave (skip grace period) ──
  socket.on('leaveRoom', () => {
    socket.data.intentionalLeave = true;
  });

  // ── Voluntary leave during game (player wants to leave but may rejoin) ──
  socket.on('voluntaryLeave', ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Mark as disconnected with grace period (like a refresh)
    player.disconnected = true;
    player.voluntaryLeft = true;
    const timerKey = `${code}:${player.reconnectId}`;

    // Transfer host if needed
    if (room.hostId === socket.id) {
      player.wasHost = true;
      const connectedPlayer = room.players.find(p => !p.disconnected);
      if (connectedPlayer) {
        room.hostId = connectedPlayer.id;
        io.to(connectedPlayer.id).emit('becameHost');
      }
    }

    // Count active (non-disconnected) players
    const activePlayers = room.players.filter(p => !p.disconnected);

    // Notify others
    io.to(code).emit('playerVoluntaryLeft', {
      playerName: player.name,
      playerIdx: player.idx,
      activePlayers: activePlayers.map(p => ({ name: p.name, idx: p.idx })),
      activeCount: activePlayers.length,
      gameStarted: room.started,
    });

    // Leave the socket.io room but keep player in array for potential rejoin
    socket.leave(code);
    socket.data.roomCode = null;

    // Start grace period (longer for voluntary leave — 120 seconds)
    const timer = setTimeout(() => {
      disconnectTimers.delete(timerKey);
      const currentRoom = rooms.get(code);
      if (!currentRoom) return;
      const pi = currentRoom.players.findIndex(p => p.reconnectId === player.reconnectId);
      if (pi === -1) return;
      currentRoom.players.splice(pi, 1);
      if (currentRoom.players.length === 0) {
        rooms.delete(code);
        savedGames.delete(code);
      } else {
        io.to(code).emit('playerLeft', {
          players: currentRoom.players.filter(p => !p.disconnected).map(p => ({ name: p.name, idx: p.idx })),
        });
      }
      if (currentRoom.isPublic) broadcastLobbyList();
    }, 120000);
    disconnectTimers.set(timerKey, timer);
  });

  // ── Disconnect cleanup with grace period for reconnection ──
  socket.on('disconnect', () => {
    const code = socket.data?.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const wasPublic = room.isPublic;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // If player has a reconnectId and didn't leave intentionally, give grace period
    if (player.reconnectId && !socket.data.intentionalLeave) {
      player.disconnected = true;
      const timerKey = `${code}:${player.reconnectId}`;

      // Transfer host temporarily to a connected player if needed
      if (room.hostId === socket.id) {
        player.wasHost = true;
        const connectedPlayer = room.players.find(p => !p.disconnected);
        if (connectedPlayer) {
          room.hostId = connectedPlayer.id;
          io.to(connectedPlayer.id).emit('becameHost');
        }
      }

      // Notify others that player is temporarily disconnected
      io.to(code).emit('lobbyUpdate', {
        players: room.players.filter(p => !p.disconnected).map(p => ({ name: p.name, idx: p.idx })),
      });

      // Start grace period timer
      const timer = setTimeout(() => {
        disconnectTimers.delete(timerKey);
        const currentRoom = rooms.get(code);
        if (!currentRoom) return;
        const pi = currentRoom.players.findIndex(p => p.reconnectId === player.reconnectId);
        if (pi === -1) return;
        currentRoom.players.splice(pi, 1);
        if (currentRoom.players.length === 0) {
          rooms.delete(code);
          savedGames.delete(code);
        } else {
          io.to(code).emit('playerLeft', {
            players: currentRoom.players.filter(p => !p.disconnected).map(p => ({ name: p.name, idx: p.idx })),
          });
        }
        if (wasPublic) broadcastLobbyList();
      }, GRACE_PERIOD_MS);
      disconnectTimers.set(timerKey, timer);

      if (wasPublic) broadcastLobbyList();
      return;
    }

    // No reconnectId — remove immediately (legacy behavior)
    const pi = room.players.findIndex(p => p.id === socket.id);
    if (pi === -1) return;
    room.players.splice(pi, 1);
    if (room.players.length === 0) {
      rooms.delete(code);
      savedGames.delete(code);
    } else {
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
        io.to(room.hostId).emit('becameHost');
      }
      io.to(code).emit('playerLeft', {
        players: room.players.map(p => ({ name: p.name, idx: p.idx })),
      });
    }
    if (wasPublic) broadcastLobbyList();
  });
});

// ── Save game history to PostgreSQL ──
async function saveGameHistory(code, winner, room, playersData) {
  try {
    const winnerPlayer = room.players.find(p => p.name === winner.name);
    const winnerId = winnerPlayer?.userId || null;

    await pool.query(
      `INSERT INTO game_history (room_code, winner_id, winner_name, player_count, difficulty, players)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [code, winnerId, winner.name, room.players.length, room.difficulty, JSON.stringify(playersData)]
    );

    // Update stats for registered players
    for (const p of playersData) {
      if (!p.userId) continue;
      if (p.name === winner.name) {
        await pool.query('UPDATE users SET wins = wins + 1, games_played = games_played + 1 WHERE id = $1', [p.userId]);
      } else {
        await pool.query('UPDATE users SET games_played = games_played + 1 WHERE id = $1', [p.userId]);
      }
    }
  } catch (err) {
    console.error('Error guardando historial:', err.message);
  }
}

// ── Start server ──
const PORT = process.env.PORT || 3001;

async function start() {
  if (process.env.DATABASE_URL) {
    await initDB();
  } else {
    console.log('⚠️  DATABASE_URL no configurada — PostgreSQL deshabilitado (modo invitado solamente)');
  }
  httpServer.listen(PORT, () => {
    console.log(`🎮 Servidor HUNGRY POLY en puerto ${PORT}`);
  });
}

start();
