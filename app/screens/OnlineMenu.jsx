import React, { useEffect, useRef, useState } from 'react';
import socket from '../../src/socket.js';
import { Btn } from '../components/Btn.jsx';
import { Modal } from '../components/Modal.jsx';

export function OnlineMenu({ onCreated, onJoined, onBack, onDownload, initialCode = '', user, T, installEntryVisible, installEntryTitle, installEntryDesc, installEntryButton, onOpenInstallPrompt }) {
  const [tab, setTab] = useState(initialCode ? 'join' : 'create');
  const [name, setName] = useState(user?.displayName || '');
  const [isPublic, setIsPublic] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [joinName, setJoinName] = useState(user?.displayName || '');
  const [joinCode, setJoinCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lobbyRooms, setLobbyRooms] = useState([]);
  const [lobbyModeFilter, setLobbyModeFilter] = useState('all');
  const [lobbyLoading, setLobbyLoading] = useState(false);
  const [lobbyName, setLobbyName] = useState(user?.displayName || '');
  const joinedRoomRef = useRef(false);

  // Lobby browser: fetch & subscribe to public rooms
  useEffect(() => {
    if (tab !== 'lobby') return;
    setLobbyLoading(true);

    function fetchRooms() {
      socket.emit('listRooms', (rooms) => {
        if (rooms) setLobbyRooms(rooms);
        setLobbyLoading(false);
      });
    }

    socket.connect();
    fetchRooms();
    socket.emit('joinLobbyBrowser');
    const handleUpdate = (rooms) => setLobbyRooms(rooms);
    socket.on('lobbyListUpdate', handleUpdate);
    const pollInterval = setInterval(fetchRooms, 3000);
    return () => {
      clearInterval(pollInterval);
      socket.emit('leaveLobbyBrowser');
      socket.off('lobbyListUpdate', handleUpdate);
      if (!joinedRoomRef.current) socket.disconnect();
    };
  }, [tab]);

  function handleCreate() {
    if (!name.trim()) return;
    if (isPublic && !roomName.trim()) return;
    setLoading(true);
    setError('');

    const timeout = setTimeout(() => {
      socket.off('roomCreated');
      socket.off('connect', doCreate);
      setError(T('timeout'));
      setLoading(false);
    }, 10000);

    socket.once('roomCreated', ({ code, isPublic: pub, roomName: rn }) => {
      clearTimeout(timeout);
      setLoading(false);
      window.history.replaceState({}, '', window.location.pathname);
      onCreated(name.trim(), code, pub, rn);
    });

    function doCreate() {
      socket.emit('createRoom', { playerName: name.trim(), isPublic, roomName: roomName.trim() });
    }

    if (socket.connected) {
      doCreate();
    } else {
      socket.once('connect', doCreate);
      socket.connect();
    }
  }

  function handleJoin() {
    if (!joinName.trim() || !joinCode.trim()) return;
    setLoading(true);
    setError('');

    const timeout = setTimeout(() => {
      socket.off('roomJoined');
      socket.off('joinError');
      socket.off('connect', doJoin);
      setError(T('timeout'));
      setLoading(false);
    }, 10000);

    socket.once('joinError', (msg) => {
      clearTimeout(timeout);
      setError(msg);
      setLoading(false);
      socket.disconnect();
    });
    socket.once('roomJoined', ({ myIdx, isPublic: pub, roomName: rn }) => {
      clearTimeout(timeout);
      setLoading(false);
      window.history.replaceState({}, '', window.location.pathname);
      onJoined(joinName.trim(), joinCode.trim().toUpperCase(), myIdx, pub, rn);
    });

    function doJoin() {
      socket.emit('joinRoom', { playerName: joinName.trim(), code: joinCode.trim().toUpperCase() });
    }

    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
      socket.connect();
    }
  }

  function handleLobbyJoin(roomCode) {
    if (!lobbyName.trim()) {
      setError(T('enterNameFirst'));
      return;
    }
    setLoading(true);
    setError('');
    socket.once('joinError', (msg) => {
      setError(msg);
      setLoading(false);
    });
    socket.once('roomJoined', ({ myIdx, isPublic: pub, roomName: rn }) => {
      setLoading(false);
      joinedRoomRef.current = true;
      window.history.replaceState({}, '', window.location.pathname);
      onJoined(lobbyName.trim(), roomCode, myIdx, pub, rn);
    });
    socket.emit('joinRoom', { playerName: lobbyName.trim(), code: roomCode });
  }

  const tabStyle = (active) => ({
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Fredoka',sans-serif",
    fontWeight: 700,
    fontSize: 13,
    background: active ? '#FFD700' : 'rgba(255,255,255,.06)',
    color: active ? '#111' : '#aaa',
    transition: 'all .15s',
  });
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '2px solid #2a2a4a',
    background: '#0f1117',
    color: '#eee',
    fontFamily: "'Fredoka',sans-serif",
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  };
  const toggleStyle = (active) => ({
    flex: 1,
    padding: '8px 4px',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'center',
    border: active ? '2px solid #FFD700' : '2px solid #2a2a4a',
    background: active ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
    transition: 'all .15s',
  });
  const lobbyModeOptions = [
    { id: 'all', label: T('all') },
    { id: 'clon', label: T('modeClon') },
    { id: 'escalera', label: T('modeEscalera') },
    { id: 'caotico', label: T('modeCaotico') },
  ];
  const filteredLobbyRooms = lobbyRooms.filter((room) => (
    lobbyModeFilter === 'all' ? true : (room.mode || 'clon') === lobbyModeFilter
  ));
  const getModeLabel = (mode) => {
    if (mode === 'escalera') return T('modeEscalera');
    if (mode === 'caotico') return T('modeCaotico');
    return T('modeClon');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
        fontFamily: "'Fredoka',sans-serif",
        overflowY: 'auto',
        padding: '20px 0',
      }}
    >
      <div
        style={{
          background: '#16213e',
          borderRadius: 20,
          padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 40px)',
          maxWidth: 480,
          width: '92vw',
          boxShadow: '0 8px 40px rgba(0,0,0,.6)',
          border: '2px solid #2a2a4a',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 50, marginBottom: 8 }}>🌐</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#FFD700' }}>{T('multiplayerOnline')}</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{T('playWithFriends')}</p>
        </div>

        {installEntryVisible && (
          <div style={{
            marginBottom: 18,
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(255,215,0,.06)',
            border: '1px solid rgba(255,215,0,.16)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12, background: 'rgba(255,215,0,.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
              }}>{'\u{1F4F1}'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#FFD700', fontSize: 14, fontWeight: 900 }}>{installEntryTitle}</div>
                <div style={{ color: '#b7bdd4', fontSize: 11, lineHeight: 1.35, marginTop: 2 }}>{installEntryDesc}</div>
              </div>
            </div>
            <Btn onClick={onOpenInstallPrompt} color="#FFD700" style={{ width: '100%', marginTop: 10, color: '#111', fontWeight: 900 }}>
              {installEntryButton}
            </Btn>
            <button onClick={onDownload} style={{
              width: '100%',
              marginTop: 8,
              background: 'none',
              border: 'none',
              color: '#4ecdc4',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Fredoka',sans-serif",
              textDecoration: 'underline',
            }}>
              Ver QR y enlace
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          <button style={tabStyle(tab === 'create')} onClick={() => { setTab('create'); setError(''); }}>
            {T('createRoom')}
          </button>
          <button style={tabStyle(tab === 'lobby')} onClick={() => { setTab('lobby'); setError(''); }}>
            {T('lobby')}
          </button>
          <button style={tabStyle(tab === 'join')} onClick={() => { setTab('join'); setError(''); }}>
            {T('code')}
          </button>
        </div>

        {tab === 'create' && (
          <div>
            {!user && (
              <>
                <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('yourName')}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={T('enterName')}
                  maxLength={20}
                  style={inputStyle}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </>
            )}

            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6, marginTop: 16 }}>{T('roomType')}</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: isPublic ? 14 : 0 }}>
              <div onClick={() => setIsPublic(false)} style={toggleStyle(!isPublic)}>
                <div style={{ fontSize: 13, fontWeight: 700, color: !isPublic ? '#FFD700' : '#ccc' }}>{T('private')}</div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{T('codeOnly')}</div>
              </div>
              <div onClick={() => setIsPublic(true)} style={toggleStyle(isPublic)}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isPublic ? '#FFD700' : '#ccc' }}>{T('public')}</div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{T('visibleInLobby')}</div>
              </div>
            </div>

            {isPublic && (
              <div>
                <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('roomName')}</label>
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={T('roomNamePlaceholder')}
                  maxLength={30}
                  style={inputStyle}
                />
              </div>
            )}

            <Btn
              onClick={handleCreate}
              disabled={!name.trim() || (isPublic && !roomName.trim()) || loading}
              color="#FFD700"
              style={{ width: '100%', fontSize: 16, padding: '12px 0', marginTop: 20 }}
            >
              {loading ? T('creating') : T('createRoomBtn')}
            </Btn>
          </div>
        )}

        {tab === 'lobby' && (
          <div>
            {!user && (
              <>
                <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('yourName')}</label>
                <input
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value)}
                  placeholder={T('enterName')}
                  maxLength={20}
                  style={{ ...inputStyle, marginBottom: 16 }}
                />
              </>
            )}

            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>{T('publicRooms')}</label>
            <div style={{ color: '#777', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
              {T('filterByMode')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {lobbyModeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setLobbyModeFilter(option.id)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 999,
                    border: lobbyModeFilter === option.id ? '1px solid rgba(255,215,0,.45)' : '1px solid rgba(255,255,255,.12)',
                    background: lobbyModeFilter === option.id ? 'rgba(255,215,0,.12)' : 'rgba(255,255,255,.04)',
                    color: lobbyModeFilter === option.id ? '#FFD700' : '#aaa',
                    fontFamily: "'Fredoka',sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {lobbyLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#888', fontSize: 13 }}>
                {T('loadingRooms')}
              </div>
            ) : filteredLobbyRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#555', fontSize: 13 }}>
                <div style={{ marginBottom: 14 }}>
                  {lobbyModeFilter === 'all' ? T('noPublicRooms') : T('noPublicRoomsForMode')}
                </div>
                <Btn
                  onClick={() => setTab('create')}
                  color="#FFD700"
                  style={{ fontSize: 13, padding: '10px 16px' }}
                >
                  {T('createYourRoom')}
                </Btn>
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredLobbyRooms.map((room) => (
                  <div
                    key={room.code}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,.04)',
                      border: '2px solid #2a2a4a',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#eee', fontSize: 14 }}>{room.roomName}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                        👑 {room.hostName} · {room.playerCount}/4 {T('players')}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 9px',
                            borderRadius: 999,
                            background: 'rgba(255,215,0,.1)',
                            border: '1px solid rgba(255,215,0,.22)',
                            color: '#FFD700',
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: 0.3,
                          }}
                        >
                          {getModeLabel(room.mode)}
                        </span>
                      </div>
                    </div>
                    <Btn
                      onClick={() => handleLobbyJoin(room.code)}
                      disabled={loading}
                      color="#00BCD4"
                      style={{ fontSize: 13, padding: '8px 16px' }}
                    >
                      {T('join')}
                    </Btn>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!user && (
              <div>
                <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('yourName')}</label>
                <input
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder={T('enterName')}
                  maxLength={20}
                  style={inputStyle}
                />
              </div>
            )}
            <div>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('roomCode')}</label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={T('roomCodePlaceholder')}
                maxLength={7}
                style={{ ...inputStyle, letterSpacing: 4, textTransform: 'uppercase' }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <Btn
              onClick={handleJoin}
              disabled={!joinName.trim() || !joinCode.trim() || loading}
              color="#00BCD4"
              style={{ width: '100%', fontSize: 16, padding: '12px 0' }}
            >
              {loading ? T('joining') : T('joinBtn')}
            </Btn>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(244,67,54,.15)', border: '1px solid #f44336', color: '#ef9a9a', fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#555',
              cursor: 'pointer',
              fontFamily: "'Fredoka',sans-serif",
              fontSize: 13,
            }}
          >
            {T('backToMenu')}
          </button>
        </div>
      </div>
    </div>
  );
}
