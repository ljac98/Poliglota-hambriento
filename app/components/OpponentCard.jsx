import React from 'react';
import { ING_EMOJI, ING_BG, EXTRA_PLAY_INDICATOR_STYLE } from '../../constants/index.js';
import { HatBadge } from '../../components/HatComponents.jsx';
import { ING_IMG, ingChosen, ingKey } from '../utils/gameHelpers.js';
import burgerIcon from '../../imagenes/hamburguesas/ham.png';
import { UserAvatar } from './UserAvatar.jsx';

export function OpponentCard({ player, index, color, isActive, showExtraPlay = false, onIngredientClick, onRegisterRef, onRegisterIngredientRef, onRegisterMainHatRef, T }) {
  const burger = player.burgers[player.currentBurger];
  const currentBurgerProgress = (() => {
    if (!burger || player.currentBurger >= player.totalBurgers) return null;
    const needed = [...burger];
    const tableCopy = (player.table || []).map((item) => {
      if (item === 'perrito') return 'perrito';
      return ingChosen(item) || ingKey(item);
    });

    let matched = 0;
    for (let ingredientIndex = needed.length - 1; ingredientIndex >= 0; ingredientIndex -= 1) {
      const exactIdx = tableCopy.indexOf(needed[ingredientIndex]);
      if (exactIdx !== -1) {
        matched += 1;
        needed.splice(ingredientIndex, 1);
        tableCopy.splice(exactIdx, 1);
        continue;
      }
      const wildcardIdx = tableCopy.indexOf('perrito');
      if (wildcardIdx !== -1) {
        matched += 1;
        needed.splice(ingredientIndex, 1);
        tableCopy.splice(wildcardIdx, 1);
      }
    }

    return { matched, total: burger.length };
  })();

  return (
    <div
      ref={(el) => onRegisterRef?.(index, el)}
      style={{
        background: isActive ? 'rgba(255,215,0,.06)' : 'rgba(255,255,255,.03)',
        border: `2px solid ${isActive ? '#FFD700' : color + '44'}`,
        borderRadius: 12,
        padding: '10px 12px',
        transition: 'all .2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <UserAvatar
          name={player.name}
          username={player.username}
          avatarUrl={player.avatarUrl}
          size={28}
        />
        <span style={{ fontWeight: 800, color, fontSize: 13 }}>{player.name}</span>
        {isActive && <span style={{ fontSize: 10, color: '#FFD700', marginLeft: 'auto' }}>{T('turn')}</span>}
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
        {player.mainHats.map((h, hatIdx) => (
          <div
            key={`${h}-${hatIdx}`}
            ref={(el) => onRegisterMainHatRef?.(index, h, hatIdx, el)}
            style={{ display: 'inline-flex' }}
          >
            <HatBadge lang={h} isMain size="sm" />
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#777', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        <img src={burgerIcon} alt="hamburguesa" style={{ width: 14, height: 14, objectFit: 'contain' }} />
        {player.currentBurger}/{player.totalBurgers}
      </div>

      {player.table.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
          {player.table.map((ing, tableIdx) => {
            const base = ingKey(ing);
            const chosen = ingChosen(ing);
            return (
              <div
                key={tableIdx}
                ref={(el) => onRegisterIngredientRef?.(index, tableIdx, el)}
                onClick={() => onIngredientClick?.(ing)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 9,
                  background: chosen
                    ? `linear-gradient(to right, ${ING_BG.perrito || '#9b59b6'} 50%, ${ING_BG[chosen]} 50%)`
                    : ING_BG[base],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                {chosen ? (
                  <>
                    <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={ING_IMG.perrito} alt="comodin" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                    </div>
                    <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ING_IMG[chosen]
                        ? <img src={ING_IMG[chosen]} alt={chosen} style={{ width: 22, height: 22, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 15 }}>{ING_EMOJI[chosen]}</span>}
                    </div>
                  </>
                ) : (
                  ING_IMG[base]
                    ? <img src={ING_IMG[base]} alt={base} style={{ width: 34, height: 34, objectFit: 'contain' }} />
                    : ING_EMOJI[base]
                )}
              </div>
            );
          })}
        </div>
      )}

      {showExtraPlay && (
        <div style={{
          ...EXTRA_PLAY_INDICATOR_STYLE,
          marginTop: 4,
          marginBottom: 4,
          padding: '7px 9px',
          borderRadius: 8,
          fontSize: 11,
          lineHeight: 1.2,
        }}>
          {T('extraPlayLabel')}
        </div>
      )}

      {currentBurgerProgress && (
        <div style={{
          marginTop: 4,
          padding: '7px 9px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          <span style={{ fontSize: 10, color: '#888', fontWeight: 700, letterSpacing: 0.4 }}>
            HAMBURGUESA ACTUAL
          </span>
          <span style={{ fontSize: 12, color: '#ddd', fontWeight: 800 }}>
            {currentBurgerProgress.matched}/{currentBurgerProgress.total} ingredientes
          </span>
        </div>
      )}

      <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
        {typeof T('cardsInHand') === 'function' ? T('cardsInHand')(player.hand.length) : `Cartas: ${player.hand.length}`}
      </div>
    </div>
  );
}
