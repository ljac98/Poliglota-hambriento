import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const app = express();
const httpServer = createServer(app);

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')));
}
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const rooms = new Map();
const genCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();

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
  // ── Create room ──
  socket.on('createRoom', ({ playerName, isPublic, roomName }) => {
    const code = genCode();
    rooms.set(code, {
      hostId: socket.id,
      players: [{ id: socket.id, name: playerName, idx: 0 }],
      started: false,
      isPublic: !!isPublic,
      roomName: roomName || '',
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
    room.players.push({ id: socket.id, name: playerName, idx });
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('roomJoined', { code, myIdx: idx, isPublic: room.isPublic, roomName: room.roomName });
    io.to(code).emit('lobbyUpdate', {
      players: room.players.map(p => ({ name: p.name, idx: p.idx })),
    });
    if (room.isPublic) broadcastLobbyList();
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
    socket.to(code).emit('stateUpdate', { state });
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

  // ── Disconnect cleanup ──
  socket.on('disconnect', () => {
    const code = socket.data?.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const wasPublic = room.isPublic;
    const pi = room.players.findIndex(p => p.id === socket.id);
    if (pi === -1) return;
    room.players.splice(pi, 1);
    if (room.players.length === 0) {
      rooms.delete(code);
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

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Servidor HUNGRY POLY en puerto ${PORT}`);
});
