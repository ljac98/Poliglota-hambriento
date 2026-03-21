import React from 'react';
import { LANGUAGES, ING_EMOJI, ING_BG } from '../../constants/index.js';
import { BurgerTarget } from '../../components/GameUI.jsx';
import { HatBadge } from '../../components/HatComponents.jsx';
import HatSVG from '../../components/HatSVG.jsx';
import { ING_IMG, ingChosen, ingKey } from '../utils/gameHelpers.js';
import burgerIcon from '../../imagenes/hamburguesas/ham.png';

export function OpponentCard({ player, index, color, isActive, onIngredientClick, T }) {
  const burger = player.burgers[player.currentBurger];
  return (
    <div style={{
      background: isActive ? 'rgba(255,215,0,.06)' : 'rgba(255,255,255,.03)',
      border: `2px solid ${isActive ? '#FFD700' : color + '44'}`,
      borderRadius: 12, padding: '10px 12px', transition: 'all .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <HatSVG lang={player.mainHats[0] || LANGUAGES[0]} size={22} />
        <span style={{ fontWeight: 800, color, fontSize: 13 }}>{player.name}</span>
        {isActive && <span style={{ fontSize: 10, color: '#FFD700', marginLeft: 'auto' }}>{T('turn')}</span>}
        <span style={{ marginLeft: isActive ? 0 : 'auto', fontSize: 11, color: '#777', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <img src={burgerIcon} alt="hamburguesa" style={{ width: 14, height: 14, objectFit: 'contain' }} />
          {player.currentBurger}/{player.totalBurgers}
        </span>
      </div>

      {/* Main hats */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
        {player.mainHats.map(h => (
          <HatBadge key={h} lang={h} isMain size="sm" />
        ))}
      </div>

      {/* Table ingredients */}
      {player.table.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 4 }}>
          {player.table.map((ing, i) => {
            const base = ingKey(ing);
            const chosen = ingChosen(ing);
            return (
              <div key={i} onClick={() => onIngredientClick?.(ing)} style={{
                width: 30, height: 30, borderRadius: 6,
                background: chosen
                  ? `linear-gradient(to right, ${ING_BG.perrito || '#9b59b6'} 50%, ${ING_BG[chosen]} 50%)`
                  : ING_BG[base],
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                overflow: 'hidden', position: 'relative', cursor: 'pointer',
              }}>
                {chosen ? (
                  <>
                    <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={ING_IMG.perrito} alt="comodín" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                    </div>
                    <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ING_IMG[chosen]
                        ? <img src={ING_IMG[chosen]} alt={chosen} style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 10 }}>{ING_EMOJI[chosen]}</span>}
                    </div>
                  </>
                ) : (
                  ING_IMG[base]
                    ? <img src={ING_IMG[base]} alt={base} style={{ width: 22, height: 22, objectFit: 'contain' }} />
                    : ING_EMOJI[base]
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Current burger target */}
      {burger && player.currentBurger < player.totalBurgers && (
        <BurgerTarget ingredients={burger} table={player.table} isCurrent={false} />
      )}

      {/* Hand count */}
      <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
        {typeof T('cardsInHand') === 'function' ? T('cardsInHand')(player.hand.length) : `🃏 ${player.hand.length}`}
      </div>
    </div>
  );
}



