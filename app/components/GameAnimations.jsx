import React, { useEffect } from 'react';
import { ING_EMOJI } from '../../constants';
import { ING_IMG } from '../utils/gameHelpers.js';
import HatSVG from '../../components/HatSVG.jsx';

import campeonImg from '../../imagenes/campeon.png';
import actionTenedor from '../../imagenes/acciones/tenedor.png';
import actionGloton from '../../imagenes/acciones/comer.png';
import actionComeComodines from '../../imagenes/acciones/comecomodines.png';
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
import actionLadron1 from '../../imagenes/acciones/ladron1.png';
import actionLadron2 from '../../imagenes/acciones/ladron2.png';
import burgerCarne from '../../imagenes/hamburguesas/ingredientes/carne.png';
import burgerCebolla from '../../imagenes/hamburguesas/ingredientes/cebolla.png';
import burgerHuevo from '../../imagenes/hamburguesas/ingredientes/huevo.png';
import burgerLechuga from '../../imagenes/hamburguesas/ingredientes/lechuga.png';
import burgerPalta from '../../imagenes/hamburguesas/ingredientes/palta.png';
import burgerPanArriba from '../../imagenes/hamburguesas/ingredientes/pan arriba.png';
import burgerPanAbajo from '../../imagenes/hamburguesas/ingredientes/pan abajo.png';
import burgerPollo from '../../imagenes/hamburguesas/ingredientes/pollo.png';
import burgerQueso from '../../imagenes/hamburguesas/ingredientes/queso.png';
import burgerTomate from '../../imagenes/hamburguesas/ingredientes/tomates.png';
import { renderActionCardAnimation } from './actionAnimationFactory.jsx';

const BURGER_STACK_IMG = {
  carne: burgerCarne,
  cebolla: burgerCebolla,
  huevo: burgerHuevo,
  lechuga: burgerLechuga,
  palta: burgerPalta,
  pollo: burgerPollo,
  queso: burgerQueso,
  tomate: burgerTomate,
};

const ACTION_STACK_IMG = {
  ...BURGER_STACK_IMG,
  pan: burgerPanAbajo,
};

export function GameAnimations({
  forkAnim,
  comeComodinesAnim,
  glotonAnim,
  milanesaAnim,
  pizzaAnim,
  parrillaAnim,
  hatStealAnim,
  ensaladaAnim,
  isMobile,
}) {
  useEffect(() => {
    if (document.getElementById('pulse-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'pulse-keyframes';
    style.textContent = `
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      @keyframes forkHook{
        0%{transform:translate(-50%,-50%) scale(.55) rotate(-22deg);opacity:0}
        20%{opacity:1}
        55%{transform:translate(-50%,-58%) scale(1.04) rotate(-8deg);opacity:1}
        100%{transform:translate(-50%,-50%) scale(.96) rotate(0deg);opacity:1}
      }
      @keyframes forkDrop{
        0%{transform:translate(-50%,-64%) scale(.72);opacity:0}
        45%{opacity:1}
        70%{transform:translate(-50%,-52%) scale(1.12);opacity:1}
        100%{transform:translate(-50%,-50%) scale(1);opacity:1}
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <>
      {forkAnim && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9490,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'fixed',
            left: forkAnim.x,
            top: forkAnim.y,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transform: `translate(-50%, -50%) ${forkAnim.moving ? 'scale(1)' : 'scale(.92)'}`,
            transition: forkAnim.moving
              ? 'left 0.62s cubic-bezier(.17,.84,.44,1), top 0.62s cubic-bezier(.17,.84,.44,1), transform 0.2s ease'
              : 'transform 0.12s ease',
          }}>
            <div style={{
              width: isMobile ? 58 : 72,
              height: isMobile ? 58 : 72,
              borderRadius: 18,
              background: 'rgba(15,17,23,.92)',
              border: '2px solid rgba(78,205,196,.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 28px rgba(0,0,0,.35)',
            }}>
              {ACTION_STACK_IMG[forkAnim.ingredient] || ING_IMG[forkAnim.ingredient]
                ? <img src={ACTION_STACK_IMG[forkAnim.ingredient] || ING_IMG[forkAnim.ingredient]} alt={forkAnim.ingredient} style={{ width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, objectFit: 'contain' }} />
                : <span style={{ fontSize: isMobile ? 28 : 34 }}>{ING_EMOJI[forkAnim.ingredient] || '🍴'}</span>}
            </div>
            <img
              src={actionTenedor}
              alt="Tenedor"
              style={{
                width: isMobile ? 72 : 94,
                height: isMobile ? 72 : 94,
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.35))',
                transform: forkAnim.moving ? 'rotate(14deg)' : 'rotate(-8deg)',
                transition: 'transform 0.22s ease',
              }}
            />
          </div>
        </div>
      )}

      {comeComodinesAnim && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9488,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'fixed',
            left: comeComodinesAnim.x,
            top: comeComodinesAnim.y,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            transform: `translate(-50%, -50%) ${comeComodinesAnim.moving ? 'scale(1)' : 'scale(.96)'}`,
            transition: comeComodinesAnim.moving
              ? 'left 0.62s cubic-bezier(.17,.84,.44,1), top 0.62s cubic-bezier(.17,.84,.44,1), transform 0.18s ease'
              : 'transform 0.16s ease',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(15,17,23,.88)',
              border: '2px solid rgba(255,215,0,.35)',
              boxShadow: '0 10px 22px rgba(0,0,0,.32)',
              opacity: comeComodinesAnim.pickedCount > 0 || comeComodinesAnim.stoppingAt ? 1 : 0,
              transform: comeComodinesAnim.stoppingAt ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
              transition: 'all 0.16s ease',
            }}>
              {Array.from({ length: Math.max(1, Math.min(3, comeComodinesAnim.stoppingAt?.count || comeComodinesAnim.pickedCount || 0)) }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: isMobile ? 22 : 26,
                    height: isMobile ? 22 : 26,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,.08)',
                  }}
                >
                  <img
                    src={ING_IMG.perrito}
                    alt="Comodín"
                    style={{ width: isMobile ? 16 : 20, height: isMobile ? 16 : 20, objectFit: 'contain' }}
                  />
                </div>
              ))}
              {comeComodinesAnim.pickedCount > 1 && (
                <span style={{ color: '#FFD700', fontWeight: 900, fontSize: isMobile ? 12 : 14 }}>
                  x{comeComodinesAnim.pickedCount}
                </span>
              )}
            </div>
            <img
              src={actionComeComodines}
              alt="Come Comodines"
              style={{
                width: isMobile ? 92 : 118,
                height: isMobile ? 92 : 118,
                objectFit: 'contain',
                filter: 'drop-shadow(0 12px 22px rgba(0,0,0,.36))',
                transform: comeComodinesAnim.moving
                  ? 'rotate(-4deg)'
                  : (comeComodinesAnim.stoppingAt ? 'rotate(0deg) scale(1.12) translateY(-4px)' : 'rotate(0deg) scale(1.02)'),
                transition: 'transform 0.18s ease',
              }}
            />
          </div>
        </div>
      )}

      {glotonAnim && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9489,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'fixed',
            left: glotonAnim.x,
            top: glotonAnim.y,
            width: isMobile ? 90 : 118,
            height: isMobile ? 90 : 118,
            transform: `translate(-50%, -50%) ${glotonAnim.showChampion ? 'scale(0.72)' : (glotonAnim.moving ? 'scale(1)' : `scale(${glotonAnim.biteTick % 2 === 0 ? 1.02 : 1.1})`)}`,
            transition: glotonAnim.moving
              ? 'left 0.62s cubic-bezier(.17,.84,.44,1), top 0.62s cubic-bezier(.17,.84,.44,1), transform 0.18s ease'
              : 'transform 0.18s ease',
            filter: 'drop-shadow(0 14px 26px rgba(0,0,0,.36))',
            opacity: glotonAnim.showChampion ? 0 : 1,
          }}>
            <img
              src={actionGloton}
              alt="Glotón"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: glotonAnim.moving ? 'rotate(-8deg)' : `rotate(${glotonAnim.biteTick % 2 === 0 ? '-2deg' : '5deg'})`,
                transition: 'transform 0.18s ease',
              }}
            />
            {glotonAnim.biteFlash && (
              <div style={{
                position: 'absolute',
                left: '52%',
                top: '54%',
                width: isMobile ? 34 : 44,
                height: isMobile ? 34 : 44,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,215,0,.9) 0%, rgba(255,140,0,.58) 45%, rgba(255,90,0,0) 72%)',
                boxShadow: '0 0 18px rgba(255,215,0,.45)',
                animation: 'gloton-bite-flash .13s ease-out',
              }} />
            )}
          </div>

          {!glotonAnim.showChampion && (
            <div style={{
              position: 'fixed',
              left: glotonAnim.stackX,
              top: glotonAnim.stackY,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0,
            }}>
              <img
                src={burgerPanArriba}
                alt="Pan arriba"
                style={{
                  width: isMobile ? 70 : 70,
                  height: 'auto',
                  objectFit: 'contain',
                  marginBottom: -4,
                  filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.28))',
                }}
              />
              {glotonAnim.ingredients.slice().reverse().map((ing, idx) => (
                <div
                  key={`${ing}-${idx}-${glotonAnim.biteTick}`}
                  style={{
                    width: isMobile ? 64 : 64,
                    height: 'auto',
                    marginTop: -4,
                    marginBottom: -4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: idx === 0 && !glotonAnim.moving
                      ? `scale(${glotonAnim.biteFlash ? 0.72 : (glotonAnim.biteTick % 2 === 0 ? 1 : 0.92)})`
                      : 'scale(1)',
                    opacity: idx === 0 && glotonAnim.biteFlash ? 0.22 : 1,
                    transition: 'transform 0.16s ease, opacity 0.16s ease',
                    filter: idx === 0 && glotonAnim.biteFlash
                      ? 'drop-shadow(0 0 16px rgba(255,215,0,.34))'
                      : 'drop-shadow(0 8px 14px rgba(0,0,0,.24))',
                  }}
                >
                  {BURGER_STACK_IMG[ing]
                    ? <img src={BURGER_STACK_IMG[ing]} alt={ing} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                    : ING_IMG[ing]
                    ? <img src={ING_IMG[ing]} alt={ing} style={{ width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, objectFit: 'contain' }} />
                    : <span style={{ fontSize: isMobile ? 24 : 30 }}>{ING_EMOJI[ing] || '🍔'}</span>}
                </div>
              ))}
              <img
                src={burgerPanAbajo}
                alt="Pan abajo"
                style={{
                  width: isMobile ? 70 : 70,
                  height: 'auto',
                  objectFit: 'contain',
                  marginTop: -4,
                  filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.28))',
                }}
              />
            </div>
          )}

          {glotonAnim.showChampion && (
            <div style={{
              position: 'fixed',
              left: glotonAnim.stackX,
              top: glotonAnim.stackY,
              transform: 'translate(-50%, -50%) scale(1)',
              width: isMobile ? 112 : 150,
              height: isMobile ? 112 : 150,
              borderRadius: 24,
              background: 'rgba(15,17,23,.66)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 14px 28px rgba(0,0,0,.34)',
            }}>
              <img
                src={campeonImg}
                alt="Campeón"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 16px rgba(255,215,0,.22))',
                }}
              />
            </div>
          )}
        </div>
      )}

      {renderActionCardAnimation('milanesa', { anim: milanesaAnim, isMobile })}

      {renderActionCardAnimation('pizza', { anim: pizzaAnim, isMobile, actionStackImg: ACTION_STACK_IMG })}

      {renderActionCardAnimation('parrilla', { anim: parrillaAnim, isMobile })}

      {hatStealAnim && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9488,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div
            style={{
              position: 'fixed',
              left: hatStealAnim.x,
              top: hatStealAnim.y,
              transform: `translate(-50%, -50%) ${
                hatStealAnim.moving
                  ? 'scale(1)'
                  : (hatStealAnim.releasing ? 'scale(0.94)' : (hatStealAnim.frame === 2 ? 'scale(1.04) rotate(-6deg)' : 'scale(0.98)'))
              }`,
              transition: hatStealAnim.moving
                ? 'left 0.92s ease-in-out, top 0.92s ease-in-out, transform 0.22s ease'
                : 'left 0.12s ease-out, top 0.12s ease-out, transform 0.22s ease, opacity 0.22s ease',
              width: isMobile ? 94 : 118,
              height: isMobile ? 94 : 118,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 14px 24px rgba(0,0,0,.34))',
            }}
          >
            <img
              src={hatStealAnim.frame === 2 ? actionLadron2 : actionLadron1}
              alt="Ladrón de sombreros"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div
            style={{
              position: 'fixed',
              left: hatStealAnim.hatX,
              top: hatStealAnim.hatY,
              transform: `translate(-50%, -50%) ${
                hatStealAnim.moving
                  ? 'scale(0.88) rotate(-10deg)'
                  : (hatStealAnim.releasing ? 'scale(1.06)' : (hatStealAnim.frame === 2 ? 'scale(1.08) rotate(-12deg)' : 'scale(1)'))
              }`,
              transition: hatStealAnim.moving
                ? 'left 0.92s ease-in-out, top 0.92s ease-in-out, transform 0.22s ease'
                : 'left 0.12s ease-out, top 0.12s ease-out, transform 0.22s ease, opacity 0.22s ease',
              opacity: hatStealAnim.releasing ? 0.86 : 1,
              filter: 'drop-shadow(0 8px 12px rgba(0,0,0,.28))',
            }}
          >
            <HatSVG lang={hatStealAnim.hatLang} size={isMobile ? 28 : 34} />
          </div>
        </div>
      )}

      {renderActionCardAnimation('ensalada', { anim: ensaladaAnim, isMobile, actionStackImg: ACTION_STACK_IMG })}

      <style>{`
        @keyframes gloton-bite-flash {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          40% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.35); opacity: 0; }
        }
        @keyframes parrilla-sizzle {
          0% { transform: translate(-50%, -50%) scale(.65); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.25); opacity: 0; }
        }
        @keyframes parrilla-spark {
          0% { transform: translate(-50%, -50%) scale(.3); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(-50%, -70%) scale(1.25); opacity: 0; }
        }
        @keyframes parrilla-smoke {
          0% { transform: translate(-50%, -50%) scale(.68); opacity: 0; }
          25% { opacity: .42; }
          100% { transform: translate(-50%, -120%) scale(1.45); opacity: 0; }
        }
        @keyframes ensalada-toss {
          0% { transform: translate(-50%, -30%) scale(.5) rotate(-14deg); opacity: 0; }
          25% { opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ensalada-glow {
          0% { transform: scale(.65); opacity: 0; }
          45% { opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </>
  );
}
