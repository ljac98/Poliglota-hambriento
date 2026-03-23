import React, { useEffect, useState } from 'react';
import { getHistory } from '../../src/api.js';
import { Btn } from '../components/Btn.jsx';
import ganador from '../../imagenes/campeon.png';
import perdedor from '../../imagenes/perdedor.png';

export function HistoryScreen({ user, onBack, T, initialFilter = 'all' }) {
  const [history, setHistory] = useState(null);
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    getHistory(user.id).then(setHistory).catch(() => setHistory([]));
  }, [user.id]);

  useEffect(() => {
    setFilter(initialFilter || 'all');
  }, [initialFilter]);

  const wins = history ? history.filter(g => g.winnerName === user.displayName).length : 0;
  const losses = history ? history.filter(g => g.winnerName !== user.displayName).length : 0;
  const total = history ? history.length : 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const filtered = history ? history.filter(g => {
    if (filter === 'wins') return g.winnerName === user.displayName;
    if (filter === 'losses') return g.winnerName !== user.displayName;
    return true;
  }) : [];

  const filters = [
    { id: 'all', label: T('all'), count: total },
    { id: 'wins', label: T('winsFilter'), count: wins },
    { id: 'losses', label: T('lossesFilter'), count: losses },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif", padding: '40px 0',
    }}>
      <div style={{
        background: '#16213e', borderRadius: 20, padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 40px)',
        maxWidth: 520, width: '92vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#888', fontSize: 14,
          cursor: 'pointer', fontFamily: "'Fredoka',sans-serif", marginBottom: 12, padding: 0,
        }}>
          {T('back')}
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FFD700', marginBottom: 6, textAlign: 'center' }}>
          {T('gameHistory')}
        </h2>
        <p style={{ color: '#4ecdc4', fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
          {user.displayName}
        </p>

        {/* Stats bar */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 20,
          background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '12px 16px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFD700' }}>{total}</div>
            <div style={{ fontSize: 10, color: '#777', fontWeight: 700 }}>{T('games')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#66BB6A' }}>{wins}</div>
            <div style={{ fontSize: 10, color: '#777', fontWeight: 700 }}>{T('wins')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FF7043' }}>{losses}</div>
            <div style={{ fontSize: 10, color: '#777', fontWeight: 700 }}>{T('losses')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#CE93D8' }}>{winRate}%</div>
            <div style={{ fontSize: 10, color: '#777', fontWeight: 700 }}>{T('winrate')}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
              background: filter === f.id ? (f.id === 'wins' ? '#66BB6A' : f.id === 'losses' ? '#FF7043' : '#FFD700') : '#2a2a4a',
              color: filter === f.id ? '#111' : '#888',
              fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer',
              transition: 'all .15s',
            }}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Game list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '50vh', overflowY: 'auto' }}>
          {!history ? (
            <p style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 20 }}>{T('loading')}</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 20 }}>{T('noGames')}</p>
          ) : filtered.map(g => {
            const isWin = g.winnerName === user.displayName;
            return (
              <div key={g.id} style={{
                background: isWin ? 'rgba(102,187,106,.08)' : 'rgba(255,112,67,.08)',
                border: `1px solid ${isWin ? 'rgba(102,187,106,.25)' : 'rgba(255,112,67,.25)'}`,
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>{isWin ? '🏆' : '❌'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isWin ? '#66BB6A' : '#FF7043' }}>
                    {isWin ? T('victory') : (typeof T('defeatBy') === 'function' ? T('defeatBy')(g.winnerName) : T('defeatBy'))}
                  </div>
                  <div style={{ fontSize: 11, color: '#777' }}>
                    {g.playerCount} {T('players')} · {g.difficulty} · {new Date(g.finishedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

