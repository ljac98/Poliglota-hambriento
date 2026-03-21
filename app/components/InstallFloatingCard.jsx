import React from 'react';
import { Btn } from './Btn.jsx';

export function InstallFloatingCard({
  visible,
  title,
  desc,
  buttonLabel,
  onInstall,
  onDownload,
}) {
  if (!visible) return null;

  return (
    <div
      className="hp-install-floating-card"
      style={{
        position: 'fixed',
        bottom: 18,
        right: 18,
        width: 'min(280px, calc(100vw - 32px))',
        padding: '12px 12px 10px',
        borderRadius: 16,
        background: 'rgba(22,33,62,0.96)',
        border: '1px solid rgba(255,215,0,.18)',
        boxShadow: '0 16px 34px rgba(0,0,0,.32)',
        zIndex: 2200,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          background: 'rgba(255,215,0,.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}>
          {'\u{1F4F1}'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#FFD700', fontSize: 13, fontWeight: 900, lineHeight: 1.15 }}>{title}</div>
          <div style={{ color: '#b7bdd4', fontSize: 11, lineHeight: 1.35, marginTop: 4 }}>{desc}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Btn onClick={onInstall} color="#FFD700" style={{ flex: 1, color: '#111', fontWeight: 900, justifyContent: 'center', padding: '8px 10px' }}>
          {buttonLabel}
        </Btn>
        <button
          onClick={onDownload}
          style={{
            background: 'rgba(78,205,196,.12)',
            border: '1px solid rgba(78,205,196,.35)',
            color: '#4ecdc4',
            borderRadius: 10,
            padding: '8px 10px',
            cursor: 'pointer',
            fontFamily: "'Fredoka',sans-serif",
            fontSize: 11,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          QR
        </button>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .hp-install-floating-card {
            position: fixed !important;
            top: auto !important;
            right: 12px !important;
            bottom: 12px !important;
            left: 12px !important;
            width: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
