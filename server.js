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

function getRequestUserId(req) {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = verifyToken(token);
  return payload?.id || null;
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
      'INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, username, display_name, avatar_url, wins, games_played',
      [username.toLowerCase(), hash, displayName]
    );
    const user = result.rows[0];
    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, displayName: user.display_name, avatarUrl: user.avatar_url, wins: user.wins, gamesPlayed: user.games_played } });
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
    res.json({ token, user: { id: user.id, username: user.username, displayName: user.display_name, avatarUrl: user.avatar_url, wins: user.wins, gamesPlayed: user.games_played } });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/profile/:id', requireDB, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (!Number.isFinite(targetUserId)) return res.status(400).json({ error: 'Usuario invÃ¡lido' });

    const viewerUserId = getRequestUserId(req);
    const result = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.display_name,
         u.avatar_url,
         u.wins,
         u.games_played,
         u.created_at,
         COALESCE((
           SELECT COUNT(*)::int
           FROM friendships f
           WHERE f.user_id = u.id
         ), 0) AS friends_count
       FROM users u
       WHERE u.id = $1`,
      [targetUserId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    const u = result.rows[0];

    let relationship = 'none';
    let friendSince = null;
    let mutualFriendsCount = 0;
    let mutualFriends = [];

    if (viewerUserId) {
      if (viewerUserId === targetUserId) {
        relationship = 'self';
      } else {
        const [friendshipResult, requestResult, mutualCountResult, mutualNamesResult] = await Promise.all([
          pool.query(
            'SELECT created_at FROM friendships WHERE user_id = $1 AND friend_id = $2 LIMIT 1',
            [viewerUserId, targetUserId]
          ),
          pool.query(
            `SELECT from_user_id, to_user_id
             FROM friend_requests
             WHERE (from_user_id = $1 AND to_user_id = $2)
                OR (from_user_id = $2 AND to_user_id = $1)
             LIMIT 1`,
            [viewerUserId, targetUserId]
          ),
          pool.query(
            `SELECT COUNT(*)::int AS count
             FROM friendships f1
             JOIN friendships f2 ON f1.friend_id = f2.friend_id
             WHERE f1.user_id = $1 AND f2.user_id = $2`,
            [viewerUserId, targetUserId]
          ),
          pool.query(
            `SELECT u.display_name
             FROM friendships f1
             JOIN friendships f2 ON f1.friend_id = f2.friend_id
             JOIN users u ON u.id = f1.friend_id
             WHERE f1.user_id = $1 AND f2.user_id = $2
             ORDER BY u.display_name
             LIMIT 6`,
            [viewerUserId, targetUserId]
          ),
        ]);

        if (friendshipResult.rows[0]) {
          relationship = 'friends';
          friendSince = friendshipResult.rows[0].created_at;
        } else if (requestResult.rows[0]) {
          relationship = requestResult.rows[0].from_user_id === viewerUserId ? 'outgoing_request' : 'incoming_request';
        }

        mutualFriendsCount = mutualCountResult.rows[0]?.count || 0;
        mutualFriends = mutualNamesResult.rows.map((row) => row.display_name);
      }
    }

    res.json({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      wins: u.wins,
      gamesPlayed: u.games_played,
      losses: Math.max(0, Number(u.games_played || 0) - Number(u.wins || 0)),
      createdAt: u.created_at,
      friendsCount: u.friends_count || 0,
      mutualFriendsCount,
      mutualFriends,
      relationship,
      friendSince,
    });
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
      id: r.id, roomCode: r.room_code, winnerId: r.winner_id, winnerName: r.winner_name,
      playerCount: r.player_count, difficulty: r.difficulty,
      players: r.players, finishedAt: r.finished_at,
    })));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Online user tracking (userId → socketId) ──
const onlineUsers = new Map();

// ── Auth middleware for protected routes ──
function requireAuth(req, res, next) {
  const payload = verifyToken(req.headers.authorization?.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'No autorizado' });
  req.userId = payload.id;
  next();
}

// ── Search users by username ──
app.get('/api/users/search', requireDB, requireAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q || q.length < 2) return res.json([]);
    const result = await pool.query(
      `SELECT id, username, display_name, avatar_url FROM users
       WHERE username LIKE $1 AND id != $2 LIMIT 10`,
      [`%${q}%`, req.userId]
    );
    res.json(result.rows.map(u => ({ id: u.id, username: u.username, displayName: u.display_name, avatarUrl: u.avatar_url })));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Friends list ──
app.get('/api/friends', requireDB, requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.wins, u.games_played
       FROM friendships f JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1 ORDER BY u.display_name`,
      [req.userId]
    );
    res.json(result.rows.map(u => ({
      id: u.id, username: u.username, displayName: u.display_name,
      avatarUrl: u.avatar_url,
      wins: u.wins, gamesPlayed: u.games_played,
      online: onlineUsers.has(u.id),
    })));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Send friend request ──
app.get('/api/profile/:id/friends', requireDB, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (!Number.isFinite(targetUserId)) return res.status(400).json({ error: 'Usuario invalido' });
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.wins, u.games_played
       FROM friendships f JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1 ORDER BY u.display_name`,
      [targetUserId]
    );
    res.json(result.rows.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      wins: u.wins,
      gamesPlayed: u.games_played,
      online: onlineUsers.has(u.id),
    })));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/friends/request', requireDB, requireAuth, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Falta username' });

    const target = await pool.query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
    if (!target.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    const toId = target.rows[0].id;
    if (toId === req.userId) return res.status(400).json({ error: 'No puedes agregarte a ti mismo' });

    // Check if blocked
    const blocked = await pool.query(
      'SELECT 1 FROM blocked_users WHERE (user_id=$1 AND blocked_id=$2) OR (user_id=$2 AND blocked_id=$1)',
      [req.userId, toId]
    );
    if (blocked.rows.length > 0) return res.status(400).json({ error: 'No se puede enviar solicitud' });

    // Check if already friends
    const existing = await pool.query(
      'SELECT 1 FROM friendships WHERE user_id=$1 AND friend_id=$2',
      [req.userId, toId]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Ya son amigos' });

    // Check if request already exists in either direction
    const reqExists = await pool.query(
      'SELECT id FROM friend_requests WHERE (from_user_id=$1 AND to_user_id=$2) OR (from_user_id=$2 AND to_user_id=$1)',
      [req.userId, toId]
    );
    if (reqExists.rows.length > 0) {
      // If reverse request exists, auto-accept
      const reverse = reqExists.rows.find(r => true);
      const reverseCheck = await pool.query(
        'SELECT id FROM friend_requests WHERE from_user_id=$1 AND to_user_id=$2',
        [toId, req.userId]
      );
      if (reverseCheck.rows.length > 0) {
        // Auto-accept: they already sent us a request
        await pool.query('DELETE FROM friend_requests WHERE id=$1', [reverseCheck.rows[0].id]);
        await pool.query('INSERT INTO friendships (user_id, friend_id) VALUES ($1,$2),($2,$1) ON CONFLICT DO NOTHING', [req.userId, toId]);
        // Notify via socket
        const friendSocket = onlineUsers.get(toId);
        if (friendSocket) {
          const fromUser = await pool.query('SELECT display_name FROM users WHERE id=$1', [req.userId]);
          io.to(friendSocket).emit('friendRequestAccepted', {
            userId: req.userId,
            displayName: fromUser.rows[0]?.display_name || 'Jugador',
          });
        }
        return res.json({ status: 'accepted', message: 'Solicitud aceptada automáticamente' });
      }
      return res.status(400).json({ error: 'Solicitud ya enviada' });
    }

    await pool.query(
      'INSERT INTO friend_requests (from_user_id, to_user_id) VALUES ($1, $2)',
      [req.userId, toId]
    );

    // Real-time notification
    const friendSocket = onlineUsers.get(toId);
    if (friendSocket) {
      const fromUser = await pool.query('SELECT display_name FROM users WHERE id=$1', [req.userId]);
      io.to(friendSocket).emit('friendRequestReceived', {
        fromUserId: req.userId,
        fromDisplayName: fromUser.rows[0]?.display_name || 'Unknown',
      });
    }

    res.json({ status: 'sent' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Solicitud ya enviada' });
    console.error('Friend request error:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Get pending friend requests ──
app.get('/api/friends/requests', requireDB, requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fr.id, fr.from_user_id, u.username, u.display_name, u.avatar_url, fr.created_at
       FROM friend_requests fr JOIN users u ON u.id = fr.from_user_id
       WHERE fr.to_user_id = $1 ORDER BY fr.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows.map(r => ({
      id: r.id, fromUserId: r.from_user_id, username: r.username,
      displayName: r.display_name, avatarUrl: r.avatar_url, createdAt: r.created_at,
    })));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Accept friend request ──
app.post('/api/friends/accept/:requestId', requireDB, requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM friend_requests WHERE id=$1 AND to_user_id=$2',
      [req.params.requestId, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const fromId = result.rows[0].from_user_id;
    await pool.query('DELETE FROM friend_requests WHERE id=$1', [req.params.requestId]);
    await pool.query(
      'INSERT INTO friendships (user_id, friend_id) VALUES ($1,$2),($2,$1) ON CONFLICT DO NOTHING',
      [req.userId, fromId]
    );
    // Notify the sender
    const senderSocket = onlineUsers.get(fromId);
    if (senderSocket) {
      const accepter = await pool.query('SELECT display_name FROM users WHERE id=$1', [req.userId]);
      io.to(senderSocket).emit('friendRequestAccepted', {
        userId: req.userId,
        displayName: accepter.rows[0]?.display_name || 'Jugador',
      });
    }
    res.json({ status: 'accepted' });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Decline friend request ──
app.post('/api/friends/decline/:requestId', requireDB, requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM friend_requests WHERE id=$1 AND to_user_id=$2', [req.params.requestId, req.userId]);
    res.json({ status: 'declined' });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Remove friend ──
app.delete('/api/friends/:friendId', requireDB, requireAuth, async (req, res) => {
  try {
    const friendId = parseInt(req.params.friendId, 10);
    await pool.query(
      'DELETE FROM friendships WHERE (user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1)',
      [req.userId, friendId]
    );
    const friendSocket = onlineUsers.get(friendId);
    if (friendSocket) {
      const remover = await pool.query('SELECT display_name FROM users WHERE id=$1', [req.userId]);
      io.to(friendSocket).emit('friendRemoved', {
        userId: req.userId,
        displayName: remover.rows[0]?.display_name || 'Jugador',
      });
    }
    res.json({ status: 'removed' });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Block user ──
app.post('/api/users/block', requireDB, requireAuth, async (req, res) => {
  try {
    const { userId: blockedId } = req.body;
    if (!blockedId || blockedId === req.userId) return res.status(400).json({ error: 'ID inválido' });
    // Remove friendship if exists
    await pool.query(
      'DELETE FROM friendships WHERE (user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1)',
      [req.userId, blockedId]
    );
    // Remove pending requests in both directions
    await pool.query(
      'DELETE FROM friend_requests WHERE (from_user_id=$1 AND to_user_id=$2) OR (from_user_id=$2 AND to_user_id=$1)',
      [req.userId, blockedId]
    );
    await pool.query(
      'INSERT INTO blocked_users (user_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.userId, blockedId]
    );
    res.json({ status: 'blocked' });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Unblock user ──
app.delete('/api/users/unblock/:userId', requireDB, requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM blocked_users WHERE user_id=$1 AND blocked_id=$2', [req.userId, parseInt(req.params.userId)]);
    res.json({ status: 'unblocked' });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Get blocked users ──
app.get('/api/users/blocked', requireDB, requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url
       FROM blocked_users b JOIN users u ON u.id = b.blocked_id
       WHERE b.user_id = $1 ORDER BY u.display_name`,
      [req.userId]
    );
    res.json(result.rows.map(u => ({ id: u.id, username: u.username, displayName: u.display_name, avatarUrl: u.avatar_url })));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.patch('/api/profile/avatar', requireDB, requireAuth, async (req, res) => {
  try {
    const { avatarUrl } = req.body || {};
    if (avatarUrl && (typeof avatarUrl !== 'string' || avatarUrl.length > 800000)) {
      return res.status(400).json({ error: 'Imagen demasiado grande' });
    }
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, display_name, avatar_url, wins, games_played',
      [avatarUrl || null, req.userId]
    );
    const updated = result.rows[0];
    res.json({
      user: {
        id: updated.id,
        username: updated.username,
        displayName: updated.display_name,
        avatarUrl: updated.avatar_url,
        wins: updated.wins,
        gamesPlayed: updated.games_played,
      },
    });
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
const ROOM_AI_NAMES = ['Chef Bot', 'Maestro IA', 'Hambre IA', 'Cocinero Bot', 'Rival Bot'];
const ROOM_AI_HATS = ['español', 'inglés', 'francés', 'italiano', 'alemán', 'portugués'];
const MAX_ROOM_PLAYERS = 6;

// Track which rooms already saved history (prevent duplicates)
const savedGames = new Set();

// Grace period timers for disconnected players (reconnectId → timeoutId)
const disconnectTimers = new Map();
const GRACE_PERIOD_MS = 30000;

function getActiveRoomPlayers(room) {
  return room.players.filter(p => p.isAI || !p.disconnected);
}

function serializeRoomPlayers(room) {
  return getActiveRoomPlayers(room).map(p => ({
    name: p.name,
    idx: p.idx,
    userId: p.userId || null,
    username: p.username || null,
    isAI: !!p.isAI,
    hat: p.hat || null,
  }));
}

function reindexRoomPlayers(room) {
  room.players.forEach((player, idx) => {
    player.idx = idx;
  });
}

function resetLobbyHats(room) {
  room.players.forEach((player) => {
    player.hat = null;
  });
}

function getNextRoomAiName(room) {
  const used = new Set(room.players.map(p => p.name));
  for (const name of ROOM_AI_NAMES) {
    if (!used.has(name)) return name;
  }
  let num = 2;
  while (used.has(`Chef Bot ${num}`)) num += 1;
  return `Chef Bot ${num}`;
}

function getNextRoomAiHat(room) {
  const used = new Set(room.players.map(p => p.hat).filter(Boolean));
  const free = ROOM_AI_HATS.find(hat => !used.has(hat));
  return free || ROOM_AI_HATS[Math.floor(Math.random() * ROOM_AI_HATS.length)];
}

// ── Helper: get public rooms list for lobby browser ──
function getPublicRoomsList() {
  const list = [];
  for (const [code, room] of rooms) {
    const activePlayers = getActiveRoomPlayers(room);
    if (room.isPublic && !room.started && activePlayers.length < MAX_ROOM_PLAYERS) {
      list.push({
        code,
        roomName: room.roomName,
        playerCount: activePlayers.length,
        hostName: activePlayers[0]?.name || '',
        mode: room.gameConfig?.mode || 'clon',
      });
    }
  }
  return list;
}

function broadcastLobbyList() {
  io.to('lobby-browser').emit('lobbyListUpdate', getPublicRoomsList());
}

// ── Notify friends when a user goes online/offline ──
async function notifyFriendsStatus(userId, isOnline) {
  if (!dbAvailable) return;
  try {
    const result = await pool.query('SELECT friend_id FROM friendships WHERE user_id=$1', [userId]);
    for (const row of result.rows) {
      const friendSocketId = onlineUsers.get(row.friend_id);
      if (friendSocketId) {
        io.to(friendSocketId).emit(isOnline ? 'friendOnline' : 'friendOffline', { userId });
      }
    }
  } catch {}
}

io.on('connection', socket => {
  console.log(`🔌 Socket connected: ${socket.id} (userId: ${socket.data.userId || 'guest'})`);

  // ── Track online users & notify friends ──
  if (socket.data.userId) {
    onlineUsers.set(socket.data.userId, socket.id);
    notifyFriendsStatus(socket.data.userId, true);
  }

  socket.on('disconnect', reason => {
    console.log(`❌ Socket disconnected: ${socket.id} reason: ${reason}`);
    if (socket.data.userId && onlineUsers.get(socket.data.userId) === socket.id) {
      onlineUsers.delete(socket.data.userId);
      notifyFriendsStatus(socket.data.userId, false);
    }
  });

  // ── Create room ──
  socket.on('createRoom', ({ playerName, isPublic, roomName }) => {
    console.log(`📦 createRoom from ${socket.id}: playerName=${playerName}, isPublic=${isPublic}, roomName=${roomName}`);
    const code = genCode();
    rooms.set(code, {
      hostId: socket.id,
      players: [{ id: socket.id, name: playerName, idx: 0, userId: socket.data.userId || null, username: socket.data.username || null, reconnectId: socket.data.reconnectId, isAI: false, hat: null }],
      started: false,
      isPublic: !!isPublic,
      roomName: roomName || '',
      gameConfig: { mode: 'clon', burgerCount: 2, ingredientCount: 5 },
    });
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('roomCreated', { code, isPublic: !!isPublic, roomName: roomName || '' });
    io.to(code).emit('lobbyUpdate', {
      players: serializeRoomPlayers(rooms.get(code)),
    });
    if (isPublic) broadcastLobbyList();
  });

  // ── Join room ──
  socket.on('joinRoom', ({ code, playerName }) => {
    const room = rooms.get(code);
    if (!room) return socket.emit('joinError', 'Sala no encontrada');
    if (room.started) return socket.emit('joinError', 'El juego ya comenzó');
    if (room.players.length >= MAX_ROOM_PLAYERS) return socket.emit('joinError', 'Sala llena (máximo 6 jugadores)');
    const firstAiIdx = room.players.findIndex(p => p.isAI);
    const idx = firstAiIdx === -1 ? room.players.length : firstAiIdx;
    room.players.splice(idx, 0, { id: socket.id, name: playerName, idx, userId: socket.data.userId || null, username: socket.data.username || null, reconnectId: socket.data.reconnectId, isAI: false, hat: null });
    reindexRoomPlayers(room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('roomJoined', { code, myIdx: idx, isPublic: room.isPublic, roomName: room.roomName });
    io.to(code).emit('lobbyUpdate', {
      players: serializeRoomPlayers(room),
    });
    if (room.isPublic) broadcastLobbyList();
  });

  socket.on('addAiPlayer', ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id || room.started) return;
    if (room.players.length >= MAX_ROOM_PLAYERS) return;
    const aiName = getNextRoomAiName(room);
    const aiHat = getNextRoomAiHat(room);
    room.players.push({
      id: null,
      name: aiName,
      idx: room.players.length,
      userId: null,
      username: null,
      reconnectId: `ai-${code}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      isAI: true,
      hat: aiHat,
    });
    reindexRoomPlayers(room);
    io.to(code).emit('lobbyUpdate', { players: serializeRoomPlayers(room) });
    if (room.isPublic) broadcastLobbyList();
  });

  socket.on('removeAiPlayer', ({ code, playerIdx }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id || room.started) return;
    const idx = room.players.findIndex(p => p.idx === playerIdx && p.isAI);
    if (idx === -1) return;
    room.players.splice(idx, 1);
    reindexRoomPlayers(room);
    io.to(code).emit('lobbyUpdate', { players: serializeRoomPlayers(room) });
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
      players: serializeRoomPlayers(room),
      roomIsPublic: room.isPublic,
      roomDisplayName: room.roomName,
      gameState: (isHost && room.started && room.lastGameState) ? room.lastGameState : null,
    });
    // Notify others that player reconnected
    const activePlayers = getActiveRoomPlayers(room);
    io.to(code).emit('lobbyUpdate', {
      players: serializeRoomPlayers(room),
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

  // ── Room invite: invite a friend to your current room ──
  socket.on('roomInvite', async ({ friendUserId }) => {
    if (!socket.data.userId || !socket.data.roomCode) return;
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.started) return;
    if (getActiveRoomPlayers(room).length >= MAX_ROOM_PLAYERS) return;
    const friendSocketId = onlineUsers.get(friendUserId);
    if (!friendSocketId) return;
    try {
      const fromUser = await pool.query('SELECT display_name FROM users WHERE id=$1', [socket.data.userId]);
      io.to(friendSocketId).emit('roomInviteReceived', {
        fromUserId: socket.data.userId,
        fromDisplayName: fromUser.rows[0]?.display_name || 'Unknown',
        roomCode: socket.data.roomCode,
        roomName: room.roomName || '',
      });
    } catch {}
  });

  // ── Relay hat pick in lobby ──
  socket.on('lobbyHatPick', ({ code, playerName, hat }) => {
    const room = rooms.get(code);
    if (room) {
      const player = room.players.find(p => p.name === playerName);
      if (player) player.hat = hat;
      io.to(code).emit('lobbyUpdate', { players: serializeRoomPlayers(room) });
    }
    socket.to(code).emit('lobbyHatPick', { playerName, hat });
  });

  // ── Host starts the game ──
  socket.on('startGame', ({ code, hatPicks, gameConfig }) => {
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;
    room.started = true;
    room.gameConfig = gameConfig || { mode: 'clon', burgerCount: 2, ingredientCount: 5 };
    io.to(code).emit('gameStarted', {
      hatPicks,
      gameConfig,
      players: serializeRoomPlayers(room),
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

  // ── Permanent leave: player chose to leave for good (from leftRoom screen) ──
  socket.on('permanentLeave', ({ code, reconnectId }) => {
    const room = rooms.get(code);
    if (!room) return;
    const pi = room.players.findIndex(p => p.reconnectId === reconnectId);
    if (pi === -1) return;
    const player = room.players[pi];
    const wasPublic = room.isPublic;

    // Cancel grace period timer
    const timerKey = `${code}:${reconnectId}`;
    if (disconnectTimers.has(timerKey)) {
      clearTimeout(disconnectTimers.get(timerKey));
      disconnectTimers.delete(timerKey);
    }

    // Transfer host if needed
    if (room.hostId === player.id || player.wasHost) {
      const newHost = room.players.find(p => p.id && !p.disconnected && p.reconnectId !== reconnectId);
      if (newHost) {
        room.hostId = newHost.id;
        if (!room.started) resetLobbyHats(room);
        io.to(newHost.id).emit('becameHost');
      }
    }

    room.players.splice(pi, 1);
    reindexRoomPlayers(room);
    const activePlayers = getActiveRoomPlayers(room);

    if (room.players.length === 0) {
      rooms.delete(code);
      savedGames.delete(code);
    } else {
      // Notify remaining players to remove this player from game
      io.to(code).emit('playerRemovedFromGame', {
        playerIdx: player.idx,
        playerName: player.name,
        activePlayers: serializeRoomPlayers(room),
        activeCount: activePlayers.length,
      });
      io.to(code).emit('lobbyUpdate', {
        players: serializeRoomPlayers(room),
      });
    }
    if (wasPublic) broadcastLobbyList();
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
      const connectedPlayer = room.players.find(p => p.id && !p.disconnected);
      if (connectedPlayer) {
        room.hostId = connectedPlayer.id;
        if (!room.started) resetLobbyHats(room);
        io.to(connectedPlayer.id).emit('becameHost');
      }
    }

    // Count active (non-disconnected) players
    const activePlayers = getActiveRoomPlayers(room);

    // Notify others
    io.to(code).emit('playerVoluntaryLeft', {
      playerName: player.name,
      playerIdx: player.idx,
      activePlayers: serializeRoomPlayers(room),
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
      reindexRoomPlayers(currentRoom);
      if (currentRoom.players.length === 0) {
        rooms.delete(code);
        savedGames.delete(code);
      } else {
        io.to(code).emit('playerLeft', {
          players: serializeRoomPlayers(currentRoom),
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
        const connectedPlayer = room.players.find(p => p.id && !p.disconnected);
        if (connectedPlayer) {
          room.hostId = connectedPlayer.id;
          if (!room.started) resetLobbyHats(room);
          io.to(connectedPlayer.id).emit('becameHost');
        }
      }

      // Notify others that player is temporarily disconnected
      io.to(code).emit('lobbyUpdate', {
        players: serializeRoomPlayers(room),
      });

      // Start grace period timer
      const timer = setTimeout(() => {
        disconnectTimers.delete(timerKey);
        const currentRoom = rooms.get(code);
        if (!currentRoom) return;
        const pi = currentRoom.players.findIndex(p => p.reconnectId === player.reconnectId);
        if (pi === -1) return;
        currentRoom.players.splice(pi, 1);
        reindexRoomPlayers(currentRoom);
        if (currentRoom.players.length === 0) {
          rooms.delete(code);
          savedGames.delete(code);
        } else {
          io.to(code).emit('playerLeft', {
            players: serializeRoomPlayers(currentRoom),
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
    reindexRoomPlayers(room);
    if (room.players.length === 0) {
      rooms.delete(code);
      savedGames.delete(code);
    } else {
      if (room.hostId === socket.id) {
        room.hostId = room.players.find(p => p.id)?.id || null;
        if (room.hostId) {
          if (!room.started) resetLobbyHats(room);
          io.to(room.hostId).emit('becameHost');
        }
      }
      io.to(code).emit('playerLeft', {
        players: serializeRoomPlayers(room),
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
      [code, winnerId, winner.name, room.players.length, room.gameConfig?.mode || 'clon', JSON.stringify(playersData)]
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
