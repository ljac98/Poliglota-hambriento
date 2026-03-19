import React from 'react';
import { Btn } from '../components/Btn.jsx';

export function LeftRoomScreen({ T, roomCode, onReturn, onLeave }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
        fontFamily: "'Fredoka',sans-serif",
      }}
    >
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🚪</div>
        <h2 style={{ color: '#FFD700', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
          {T('leftRoom')}
        </h2>
        <p style={{ color: '#aaa', fontSize: 15, marginBottom: 32 }}>
          {T('roomLabel')}: {roomCode}
        </p>
        <p style={{ color: '#ccc', fontSize: 17, marginBottom: 28 }}>
          {T('wantToReturn')}
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Btn onClick={onReturn} color="#4ecdc4" style={{ fontSize: 16, padding: '12px 32px' }}>
            {T('returnToRoom')}
          </Btn>
          <Btn onClick={onLeave} color="#ff4444" style={{ fontSize: 16, padding: '12px 32px', color: '#fff' }}>
            {T('noGoLobby')}
          </Btn>
        </div>
      </div>
    </div>
  );
}
