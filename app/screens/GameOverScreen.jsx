import React from 'react';
import { Btn } from '../components/Btn.jsx';
import { LANGUAGES } from '../../constants/index.js';
import HatSVG from '../../components/HatSVG.jsx';
import ganador from '../../imagenes/campeon.png';
import perdedor from '../../imagenes/perdedor.png';
import burgerIcon from '../../imagenes/hamburguesas/ham.png';
import { UserAvatar } from '../components/UserAvatar.jsx';

export function GameOverScreen({ winner, players, onRestart, user, onHistory, T, isTutorial, tutorialWinText }) {
  const didWin = !!user && (winner?.id === user?.id || winner?.name === user?.displayName);
  const wonByAbandon = winner?.reason === 'abandon';
  const headerImage = didWin ? ganador : perdedor;
  const titleText = isTutorial && didWin
    ? (tutorialWinText || 'Congratulations!')
    : didWin
      ? (wonByAbandon
        ? T('wonByAbandon')
        : (typeof T('playerWon') === 'function' ? T('playerWon')(winner.name) : T('playerWon')))
      : T('youLost');
  const subtitleText = didWin
    ? (wonByAbandon
      ? (typeof T('abandonSubtitle') === 'function' ? T('abandonSubtitle')(winner.leftPlayerName || '') : T('abandonSubtitle'))
      : T('completedBurgers'))
    : (typeof T('defeatBy') === 'function' ? T('defeatBy')(winner.name) : T('defeatBy'));

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      }}
    >
      <img
        src={headerImage}
        alt={didWin ? 'Ganador' : 'Perdedor'}
        style={{ width: '25%', height: '25%', objectFit: 'cover' }}
      />
      <h1 style={{ fontSize: 34, fontWeight: 900, color: '#FFD700', marginBottom: 6 }}>{titleText}</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>{subtitleText}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32, minWidth: 220 }}>
        {players.map((p, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              borderRadius: 10,
              background: p.name === winner.name ? 'rgba(255,215,0,.12)' : 'rgba(255,255,255,.04)',
              border: p.name === winner.name ? '2px solid #FFD700' : '2px solid transparent',
            }}
          >
            <UserAvatar
              name={p.name}
              username={p.username}
              avatarUrl={p.avatarUrl}
              size={38}
            />
            <HatSVG lang={p.mainHats[0] || LANGUAGES[0]} size={24} />
            <span style={{ fontWeight: 700, color: p.name === winner.name ? '#FFD700' : '#ccc' }}>{p.name}</span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 12,
                color: '#777',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <img src={burgerIcon} alt="hamburguesa" style={{ width: 15, height: 15, objectFit: 'contain' }} />
              {p.currentBurger}/{p.totalBurgers}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Btn onClick={onRestart} color="#FFD700" style={{ fontSize: 16, padding: '12px 32px' }}>
          {T('playAgain')}
        </Btn>
        {user && (
          <Btn onClick={onHistory} color="#4ecdc4" style={{ fontSize: 14, padding: '12px 24px' }}>
            {T('historyBtn')}
          </Btn>
        )}
      </div>
    </div>
  );
}
