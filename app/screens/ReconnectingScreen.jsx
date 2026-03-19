import React from 'react';

export function ReconnectingScreen({ T }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0e1a',
        color: '#FFD700',
        fontFamily: "'Fredoka',sans-serif",
        fontSize: 22,
      }}
    >
      {T('reconnecting')}
    </div>
  );
}
