import React from 'react';

export function Modal({ title, children, maxWidth = 480, width = '90vw' }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#16213e',
          borderRadius: 16,
          padding: '24px 28px',
          maxWidth,
          width,
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '2px solid #2a2a4a',
          boxShadow: '0 8px 40px rgba(0,0,0,.7)',
        }}
      >
        {title && (
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#FFD700', marginBottom: 16 }}>
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}
