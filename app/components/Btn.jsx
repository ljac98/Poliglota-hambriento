import React from 'react';

export function Btn({ onClick, children, color = '#FFD700', disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 18px',
        borderRadius: 10,
        border: 'none',
        background: disabled ? '#333' : color,
        color: disabled ? '#666' : '#111',
        fontFamily: "'Fredoka',sans-serif",
        fontWeight: 700,
        fontSize: 14,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all .15s',
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,.3)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
