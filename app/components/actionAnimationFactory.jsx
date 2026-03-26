import React from 'react';
import { ING_IMG } from '../utils/gameHelpers.js';

import actionMilanesaSinHuevo from '../../imagenes/acciones/pmilanesa sin huevo.png';
import actionMilanesa from '../../imagenes/acciones/milanesa.png';
import actionEnsalada1 from '../../imagenes/acciones/ensalada3.png';
import actionEnsalada2 from '../../imagenes/acciones/ensalada4.png';
import actionPizza from '../../imagenes/acciones/pizza.png';
import actionPizzaConQueso from '../../imagenes/acciones/pizza con queso.png';
import actionParrilla1 from '../../imagenes/acciones/parrilla2.png';
import actionParrilla2 from '../../imagenes/acciones/parrilla3.png';
import actionParrilla3 from '../../imagenes/acciones/parrilla4.png';
import actionTridente from '../../imagenes/acciones/tridente.png';
import burgerQueso from '../../imagenes/hamburguesas/ingredientes/queso.png';

const PARRILLA_FRAMES = [actionParrilla1, actionParrilla2, actionParrilla3];

export function renderActionCardAnimation(type, context) {
  const strategy = ACTION_ANIMATION_STRATEGIES[type];
  return strategy ? strategy(context) : null;
}

const ACTION_ANIMATION_STRATEGIES = {
  milanesa: ({ anim, isMobile }) => {
    if (!anim?.visible) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9487, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'fixed',
          left: anim.x,
          top: anim.y,
          transform: `translate(-50%, -50%) scale(${anim.pop ? 1.18 : (anim.cooked ? 1.06 : 0.96)})`,
          transition: anim.pop
            ? 'transform 0.12s cubic-bezier(.2,1.35,.45,1), opacity 0.2s ease'
            : 'transform 0.2s ease, opacity 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          filter: 'drop-shadow(0 14px 26px rgba(0,0,0,.36))',
        }}>
          <img
            src={anim.cooked ? actionMilanesa : actionMilanesaSinHuevo}
            alt="Milanesa"
            style={{
              width: isMobile ? 88 : 118,
              height: isMobile ? 88 : 118,
              objectFit: 'contain',
              filter: anim.pop ? 'drop-shadow(0 0 16px rgba(255,215,0,.38))' : 'none',
            }}
          />
          <div style={{
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(15,17,23,.86)',
            border: '2px solid rgba(255,215,0,.28)',
            color: '#FFD700',
            fontWeight: 900,
            fontSize: isMobile ? 12 : 14,
          }}>
            + huevo x{anim.targetCount}
          </div>
        </div>
      </div>
    );
  },

  pizza: ({ anim, isMobile, actionStackImg }) => {
    if (!anim?.visible) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9487, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'fixed',
          left: anim.x,
          top: anim.y,
          transform: `translate(-50%, -50%) scale(${anim.pop ? 1.18 : (anim.cheesy ? 1.06 : 0.96)})`,
          transition: anim.pop
            ? 'transform 0.12s cubic-bezier(.2,1.35,.45,1), opacity 0.2s ease'
            : 'transform 0.2s ease, opacity 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          filter: 'drop-shadow(0 14px 26px rgba(0,0,0,.36))',
        }}>
          <img
            src={anim.cheesy ? actionPizzaConQueso : actionPizza}
            alt="Pizza"
            style={{
              width: isMobile ? 88 : 118,
              height: isMobile ? 88 : 118,
              objectFit: 'contain',
              filter: anim.pop ? 'drop-shadow(0 0 16px rgba(255,215,0,.38))' : 'none',
            }}
          />
          <div style={{
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(15,17,23,.86)',
            border: '2px solid rgba(255,215,0,.28)',
            color: '#FFD700',
            fontWeight: 900,
            fontSize: isMobile ? 12 : 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <img src={anim.ingredientImg || actionStackImg.queso || burgerQueso} alt="Queso" style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, objectFit: 'contain' }} />
            <span>x{anim.targetCount}</span>
          </div>
        </div>
      </div>
    );
  },

  ensalada: ({ anim, isMobile, actionStackImg }) => {
    if (!anim?.visible) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9486, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'fixed',
          left: anim.x,
          top: anim.y,
          transform: 'translate(-50%, -50%)',
          width: isMobile ? 126 : 162,
          height: isMobile ? 126 : 162,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 16px 24px rgba(0,0,0,.26))',
        }}>
          <img src={anim.frameIdx % 2 === 0 ? actionEnsalada1 : actionEnsalada2} alt="Ensalada" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <div style={{
            position: 'absolute',
            inset: '20% 18%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(170,255,130,.16) 0%, rgba(170,255,130,0) 72%)',
            animation: 'ensalada-glow 0.55s ease-out',
          }} />
          {(anim.ingredients || []).slice(0, 6).map((ing, idx) => {
            const angle = ((Math.PI * 2) / Math.max(1, (anim.ingredients || []).length)) * idx;
            const radius = isMobile ? 34 : 44;
            return (
              <div
                key={`${ing}-${idx}-${anim.tossTick}`}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                  top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? 24 : 30,
                  height: isMobile ? 24 : 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'ensalada-toss 0.5s ease-out forwards',
                  animationDelay: `${idx * 0.03}s`,
                }}
              >
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'rgba(15,17,23,.74)',
                  border: '1px solid rgba(255,255,255,.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <img src={actionStackImg[ing] || ING_IMG[ing]} alt={ing} style={{ width: isMobile ? 22 : 28, height: isMobile ? 22 : 28, objectFit: 'contain' }} />
                </div>
              </div>
            );
          })}
          <div style={{
            position: 'absolute',
            right: isMobile ? 10 : 12,
            bottom: isMobile ? 12 : 14,
            padding: '4px 8px',
            borderRadius: 999,
            background: 'rgba(15,17,23,.84)',
            border: '2px solid rgba(170,255,130,.28)',
            color: '#d9ffb4',
            fontWeight: 900,
            fontSize: isMobile ? 11 : 13,
          }}>
            - verduras x{anim.targetCount}
          </div>
        </div>
      </div>
    );
  },

  parrilla: ({ anim, isMobile }) => {
    if (!anim?.visible) return null;
    const grillEffectOffsetX = isMobile ? -12 : -18;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9487, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'fixed',
          left: anim.x,
          top: anim.y,
          transform: 'translate(-50%, -50%)',
          width: isMobile ? 170 : 220,
          height: isMobile ? 170 : 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 16px 26px rgba(0,0,0,.34))',
          overflow: 'visible',
        }}>
          <img src={PARRILLA_FRAMES[anim.frameIdx] || actionParrilla1} alt="Parrilla" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`smoke-${idx}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${grillEffectOffsetX + (idx - 1) * (isMobile ? 12 : 18)}px)`,
                top: isMobile ? 48 : 58,
                width: isMobile ? 24 : 32,
                height: isMobile ? 24 : 32,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,245,245,.28) 0%, rgba(210,210,210,.18) 44%, rgba(180,180,180,0) 76%)',
                filter: 'blur(1px)',
                animation: `parrilla-smoke ${1.95 + idx * 0.22}s ease-in-out infinite`,
                animationDelay: `${idx * 0.22}s`,
              }}
            />
          ))}
          {anim.sizzle && (
            <>
              <div style={{
                position: 'absolute',
                left: `calc(50% + ${grillEffectOffsetX}px)`,
                top: isMobile ? 78 : 98,
                width: isMobile ? 84 : 108,
                height: isMobile ? 84 : 108,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,196,64,.55) 0%, rgba(255,120,32,.35) 36%, rgba(255,80,0,0) 72%)',
                animation: 'parrilla-sizzle 0.44s ease-out forwards',
              }} />
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${grillEffectOffsetX + Math.cos((Math.PI * 2 * idx) / 6) * (isMobile ? 16 : 20)}px)`,
                    top: (isMobile ? 80 : 100) + Math.sin((Math.PI * 2 * idx) / 6) * (isMobile ? 8 : 10),
                    width: isMobile ? 8 : 10,
                    height: isMobile ? 8 : 10,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    background: idx % 2 === 0 ? '#FFD700' : '#FF8C42',
                    boxShadow: '0 0 10px rgba(255,180,50,.7)',
                    animation: 'parrilla-spark 0.34s ease-out forwards',
                    animationDelay: `${idx * 0.018}s`,
                  }}
                />
              ))}
            </>
          )}
        </div>

        {anim.showMeat && (
          <>
            <img
              src={actionTridente}
              alt="Tridente"
              style={{
                position: 'fixed',
                left: anim.tridentX,
                top: anim.tridentY,
                transform: 'translate(-50%, -50%)',
                width: isMobile ? 66 : 88,
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.32))',
                transition: 'left 0.42s ease-in-out, top 0.42s ease-in-out',
              }}
            />
            <img
              src={anim.meatImg}
              alt="Carne a la parrilla"
              style={{
                position: 'fixed',
                left: anim.meatX,
                top: anim.meatY,
                transform: 'translate(-50%, -50%)',
                width: isMobile ? 34 : 42,
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.26))',
                transition: 'left 0.42s ease-in-out, top 0.42s ease-in-out, opacity 0.18s ease',
              }}
            />
            <div style={{
              position: 'fixed',
              left: anim.x,
              top: anim.y + (isMobile ? 58 : 74),
              transform: 'translate(-50%, -50%)',
              padding: '5px 10px',
              borderRadius: 999,
              background: 'rgba(15,17,23,.86)',
              border: '2px solid rgba(255,140,66,.28)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#ffd8b8',
              fontWeight: 900,
              fontSize: isMobile ? 11 : 13,
            }}>
              <img src={anim.meatImg} alt={anim.meatLabel || 'carne'} style={{ width: isMobile ? 22 : 28, height: isMobile ? 22 : 28, objectFit: 'contain' }} />
              <span>{Math.max(anim.activePickup, 1)}/{anim.totalPickups || 1}</span>
            </div>
          </>
        )}
      </div>
    );
  },
};
