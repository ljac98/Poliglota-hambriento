import React from 'react';
import HatSVG from './HatSVG';
import {
  ING_EMOJI, ING_BG, LANG_BORDER, LANG_BG, LANG_TEXT,
  LANG_BADGE, LANG_SHORT, getIngName, getActionInfo
} from '../constants';
import ingPan    from '../imagenes/hamburguesas/objetivos/pan.png';
import ingLechuga from '../imagenes/hamburguesas/objetivos/lechuga.png';
import ingTomate  from '../imagenes/hamburguesas/objetivos/tomate.png';
import ingCarne   from '../imagenes/hamburguesas/objetivos/carne.png';
import ingQueso   from '../imagenes/hamburguesas/objetivos/queso.png';
import ingPollo   from '../imagenes/hamburguesas/objetivos/pollo.png';
import ingHuevo   from '../imagenes/hamburguesas/objetivos/huevo.png';
import ingCebolla from '../imagenes/hamburguesas/objetivos/cebolla.png';
import ingPalta   from '../imagenes/hamburguesas/objetivos/palta.png';
import comodinImg from '../imagenes/ingredientes/comodines/comodin.png';

// ── Imágenes de cartas de acción ──
import imgMilanesa        from '../imagenes/acciones/milanesa.png';
import imgEnsalada        from '../imagenes/acciones/ensalada3.png';
import imgPizza           from '../imagenes/acciones/pizza.png';
import imgParrilla        from '../imagenes/acciones/parrilla.png';
import imgTenedor         from '../imagenes/acciones/tenedor.png';
import imgLadron          from '../imagenes/acciones/ladron.png';
import imgIntercambioSomb from '../imagenes/acciones/intercambio de sombreros.png';
import imgIntercambioHamb from '../imagenes/acciones/intercambio de hamburguesar.png';
import imgBasurero        from '../imagenes/acciones/robar descarte.png';
import imgGloton          from '../imagenes/acciones/comer.png';
import imgNegacion        from '../imagenes/acciones/cancel.png';
import imgComeComodines   from '../imagenes/acciones/comecomodines.png';
import eqingredientes from '../imagenes/hamburguesas/ham.png';

// ── Esquinas de cartas de acción ──
import eqMilanesa        from '../imagenes/acciones/esquina/milanga.png';
import eqEnsalada        from '../imagenes/acciones/esquina/ensalada2.png';
import eqPizza           from '../imagenes/acciones/esquina/pizza2.png';
import eqParrilla        from '../imagenes/acciones/esquina/parrilla.png';
import eqTenedor         from '../imagenes/acciones/esquina/tenedor2.png';
import eqLadron          from '../imagenes/acciones/esquina/robo.png';
import eqIntercambioSomb from '../imagenes/acciones/esquina/intercambiosomb.png';
import eqIntercambioHamb from '../imagenes/acciones/esquina/intercam.png';
import eqBasurero        from '../imagenes/acciones/esquina/9-trash-can-drawing-tutorial.png';
import eqGloton          from '../imagenes/acciones/esquina/comelona.png';
import eqNegacion        from '../imagenes/acciones/esquina/cancelh.png';
import eqComeComodines   from '../imagenes/acciones/esquina/pancho.png';
import eqaccionesg   from '../imagenes/acciones/esquina derecha/global.png';
import eqaccioness   from '../imagenes/acciones/esquina derecha/singular.png';
import eqdescarte   from '../imagenes/acciones/esquina derecha/descarte.png';

const ACTION_IMG = {
  milanesa: imgMilanesa, ensalada: imgEnsalada, pizza: imgPizza,
  parrilla: imgParrilla, tenedor: imgTenedor, ladron: imgLadron,
  intercambio_sombreros: imgIntercambioSomb, intercambio_hamburguesa: imgIntercambioHamb,
  basurero: imgBasurero,
  gloton: imgGloton, negacion: imgNegacion, comecomodines: imgComeComodines,
};
const ACTION_CORNER_IMG = {
  milanesa: eqMilanesa, ensalada: eqEnsalada, pizza: eqPizza,
  parrilla: eqParrilla, tenedor: eqTenedor, ladron: eqLadron,
  intercambio_sombreros: eqIntercambioSomb, intercambio_hamburguesa: eqIntercambioHamb,
  basurero: eqBasurero,
  gloton: eqGloton, negacion: eqNegacion, comecomodines: eqComeComodines,
};
const ACTION_CORNER_DER_IMG = {
  milanesa: eqaccionesg  , ensalada:  eqaccionesg , pizza:  eqaccionesg ,
  parrilla:  eqaccionesg , tenedor:  eqaccioness , ladron:  eqaccioness ,
  intercambio_sombreros:  eqaccioness, intercambio_hamburguesa:  eqaccioness ,
  basurero: eqdescarte,
  gloton:  eqaccioness ,comecomodines:  eqaccionesg,
};
const ING_IMG = {
  pan: ingPan, lechuga: ingLechuga, tomate: ingTomate, carne: ingCarne,
  queso: ingQueso, pollo: ingPollo, huevo: ingHuevo, cebolla: ingCebolla,
  palta: ingPalta,
};

// ═══ INGREDIENT CARD (Lotería style) ═══
export const IngredientCard = ({ card, onClick, selected, small, large, playable }) => {
  const { language: lang, ingredient: ing } = card;
  const isWild = ing === "perrito";
  const border = LANG_BORDER[lang];
  const bg = LANG_BG[lang];
  const txtColor = LANG_TEXT[lang];
  const isDark = lang === "inglés";
  const w = large ? 105 : (small ? 64 : 86);
  const h = large ? 154 : (small ? 94 : 126);
  const dimmed = playable === false;

  return (
    <div onClick={onClick} style={{
      width: w, height: h, borderRadius: 8, overflow: "hidden", cursor: "pointer",
      border: selected ? "3px solid #FFD700" : `4px solid ${border}`,
      boxShadow: selected ? "0 0 22px rgba(255,215,0,0.7),0 6px 16px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.25)",
      transition: "all 0.2s", background: bg, display: "flex", flexDirection: "column",
      alignItems: "center", position: "relative",
      opacity: dimmed ? 0.4 : 1,
      filter: dimmed ? "grayscale(0.5)" : "none",
    }}>
      {/* Playable glow */}
      {playable === true && !selected && (
        <div style={{ position: "absolute", inset: 0, borderRadius: 6, boxShadow: "inset 0 0 8px rgba(76,175,80,0.4)", pointerEvents: "none" }} />
      )}
      {/* Ingredient badge top-left */}
      <div style={{
        position: "absolute", top: 2, left: 2,
        width: large ? 24 : (small ? 16 : 20), height: large ? 24 : (small ? 16 : 20),
        borderRadius: "50%", background: LANG_BADGE[lang], display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: large ? 13 : (small ? 9 : 12), lineHeight: 1,
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
      }}>
        {isWild
          ? <span style={{ fontWeight: 900, color: isDark ? "#eee" : "#fff" }}>?</span>
          : ING_IMG[ing]
            ? <img src={ING_IMG[ing]} alt={ing} style={{ width: large ? 16 : (small ? 10 : 14), height: large ? 16 : (small ? 10 : 14), objectFit: 'contain' }} />
            : ING_EMOJI[ing]}
                  <img src={eqingredientes} alt="" style={{ position:"absolute", top:3, right:3, width:cornerSize, height:cornerSize, objectFit:"contain" }} />

      </div>
      {/* Language label */}
      <div style={{
        marginTop: small ? 3 : 5, fontSize: large ? 17 : (small ? 10 : 14), fontWeight: 900,
        color: txtColor, letterSpacing: 2, fontFamily: "'Fredoka',sans-serif",
        textShadow: isDark ? "none" : "0 1px 0 rgba(255,255,255,0.3)"
      }}>
        {LANG_SHORT[lang]}
      </div>
      {/* Center: hat on ingredient with eyes */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: -2 }}>
        <div style={{ transform: large ? "scale(0.58)" : (small ? "scale(0.38)" : "scale(0.48)"), transformOrigin: "bottom center", lineHeight: 0, marginBottom: large ? -2 : (small ? -6 : -4) }}>
          <HatSVG lang={lang} size={36} />
        </div>
        <div style={{ position: "relative", display: "inline-block" }}>
          {isWild
            ? <img src={comodinImg} alt="comodín" style={{ width: large ? 44 : (small ? 26 : 36), height: large ? 44 : (small ? 26 : 36), objectFit: 'contain', filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.15))", display: 'block' }} />
            : ING_IMG[ing]
              ? <img src={ING_IMG[ing]} alt={ing} style={{ width: large ? 44 : (small ? 26 : 36), height: large ? 44 : (small ? 26 : 36), objectFit: 'contain', filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.15))", display: 'block' }} />
              : <span style={{ fontSize: large ? 44 : (small ? 26 : 36), lineHeight: 1, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.15))" }}>{ING_EMOJI[ing]}</span>
          }
        </div>
      </div>
      {/* Name in language */}
      <div style={{
        marginBottom: small ? 3 : 6, fontSize: large ? 12 : (small ? 7 : 10), fontWeight: 700,
        color: isDark ? "#ccc" : "#444", fontFamily: "'Fredoka',sans-serif"
      }}>
        {getIngName(ing, lang)}
      </div>
    </div>
  );
};

// ═══ ACTION CARD ═══
export const ActionCard = ({ card, onClick, selected, small, large, playable }) => {
  const info = getActionInfo(card.action);
  const dimmed = playable === false;
  const w = large ? 105 : (small ? 64 : 86);
  const h = large ? 154 : (small ? 94 : 126);
  const mainImg = ACTION_IMG[card.action];
  const cornerImg = ACTION_CORNER_IMG[card.action];
    const cornerImgDer = ACTION_CORNER_DER_IMG[card.action];
  const cornerSize = large ? 22 : (small ? 14 : 18);
  const mainSize = large ? 64 : (small ? 36 : 52);

  return (
    <div onClick={onClick} style={{
      position: "relative",
      width: w, height: h, borderRadius: 8, cursor: "pointer",
      border: selected ? "3px solid #FFD700" : "3px solid #555",
      background: "linear-gradient(170deg,#1A1A2E 0%,#16213E 100%)",
      boxShadow: selected ? "0 0 18px rgba(255,215,0,0.6)" : "0 2px 8px rgba(0,0,0,0.3)",
      transform: selected ? "translateY(-10px) scale(1.06)" : "scale(1)",
      transition: "all 0.2s", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 2, color: "#eee", fontFamily: "'Fredoka',sans-serif", padding: "4px 3px",
      opacity: dimmed ? 0.4 : 1,
      filter: dimmed ? "grayscale(0.5)" : "none",
    }}>
      {cornerImg && <>
        <img src={cornerImg} alt="" style={{ position:"absolute", top:3, left:3, width:cornerSize, height:cornerSize, objectFit:"contain" }} />
          <img src={cornerImgDer} alt="" style={{ position:"absolute", top:3, right:3, width:cornerSize, height:cornerSize, objectFit:"contain" }} />
        <img src={cornerImg} alt="" style={{ position:"absolute", bottom:3, right:3, width:cornerSize, height:cornerSize, objectFit:"contain", transform:"rotate(180deg)" }} />
      </>}
      {mainImg
        ? <img src={mainImg} alt={info?.name} style={{ width:mainSize, height:mainSize, objectFit:"contain", filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }} />
        : <span style={{ fontSize: small ? 22 : 32 }}>{info?.emoji}</span>
      }
      <span style={{ fontSize: large ? 11 : (small ? 7 : 9), fontWeight: 700, textAlign: "center", lineHeight: 1.1 }}>{info?.name}</span>
      <span style={{ fontSize: large ? 8 : (small ? 5 : 7), color: "#777", textAlign: "center", lineHeight: 1.1 }}>{info?.desc}</span>
    </div>
  );
};

// ═══ GAME CARD (wrapper) ═══
export const GameCard = ({ card, playable, large, ...props }) => {
  return card.type === "ingredient"
    ? <IngredientCard card={card} playable={playable} large={large} {...props} />
    : <ActionCard card={card} playable={playable} large={large} {...props} />;
};
