import React from 'react';
import { BurgerTarget } from '../../components/GameUI.jsx';
import { Btn } from '../components/Btn.jsx';

export function TransitionScreen({ player, onContinue, isExtraPlay, T }) {
  return (
    <div
      onClick={onContinue}
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      {/* Sombreros principales del jugador */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        {(player?.mainHats || []).map(h => (
          <HatBadge key={h} lang={h} isMain size="lg" />
        ))}
      </div>
      {/* Cabeza del Glotón */}
      <div style={{
        width: 120, height: 120, borderRadius: '50%', overflow: 'hidden',
        border: '3px solid #FFD700', boxShadow: '0 0 30px rgba(255,215,0,0.3)',
        marginBottom: 16,
      }}>
        <img src={imgGlotonHead} alt="El Glotón" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#FFD700', marginBottom: 8 }}>
        {isExtraPlay ? T('extraPlayMsg') : T('yourTurn')}
      </h2>
      <div style={{ fontSize: 22, color: '#eee', marginBottom: 6 }}>
        {player?.name}
      </div>
      <div style={{ fontSize: 13, color: '#555', marginTop: 20 }}>
        {T('tapContinue')}
      </div>
    </div>
  );
}

