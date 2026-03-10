import React from 'react';
import HatSVG from './HatSVG';
import {
  ING_EMOJI, ING_BG, LANG_BORDER, LANG_BG, LANG_TEXT,
  LANG_BADGE, LANG_SHORT, getIngName, getActionInfo,
  ING_IMG, ACTION_IMG
} from '../constants';

// ═══ INGREDIENT CARD (Lotería style) ═══
export const IngredientCard = ({ card, onClick, selected, small, playable }) => {
  const { language: lang, ingredient: ing } = card;
  const isWild = ing === "perrito";
  const border = LANG_BORDER[lang];
  const bg = LANG_BG[lang];
  const txtColor = LANG_TEXT[lang];
  const isDark = lang === "inglés";
  const w = small ? 64 : 86, h = small ? 94 : 126;
  const dimmed = playable === false;

  return (
    <div onClick={onClick} style={{
      width: w, height: h, borderRadius: 8, overflow: "hidden", cursor: "pointer",
      border: selected ? "3px solid #FFD700" : `4px solid ${border}`,
      boxShadow: selected ? "0 0 18px rgba(255,215,0,0.6),0 4px 12px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.25)",
      transform: selected ? "translateY(-10px) scale(1.06)" : "scale(1)",
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
        position: "absolute", top: 2, left: 2, width: small ? 16 : 20, height: small ? 16 : 20,
        borderRadius: "50%", background: LANG_BADGE[lang], display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: small ? 9 : 12, lineHeight: 1,
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
      }}>
        {isWild ? <span style={{ fontWeight: 900, color: isDark ? "#eee" : "#fff" }}>?</span> : ING_EMOJI[ing]}
      </div>
      {/* Language label */}
      <div style={{
        marginTop: small ? 3 : 5, fontSize: small ? 10 : 14, fontWeight: 900,
        color: txtColor, letterSpacing: 2, fontFamily: "'Fredoka',sans-serif",
        textShadow: isDark ? "none" : "0 1px 0 rgba(255,255,255,0.3)"
      }}>
        {LANG_SHORT[lang]}
      </div>
      {/* Center: hat on ingredient */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: -2 }}>
        <div style={{ transform: small ? "scale(0.38)" : "scale(0.48)", transformOrigin: "bottom center", lineHeight: 0, marginBottom: small ? -6 : -4 }}>
          <HatSVG lang={lang} size={36} />
        </div>
        {ING_IMG[ing] ? (
          <img src={ING_IMG[ing]} alt={ing} style={{
            width: small ? 28 : 38, height: small ? 28 : 38, objectFit: "contain",
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.2))"
          }} />
        ) : (
          <span style={{ fontSize: small ? 26 : 36, lineHeight: 1, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.15))" }}>
            {ING_EMOJI[ing]}
          </span>
        )}
      </div>
      {/* Name in language */}
      <div style={{
        marginBottom: small ? 3 : 6, fontSize: small ? 7 : 10, fontWeight: 700,
        color: isDark ? "#ccc" : "#444", fontFamily: "'Fredoka',sans-serif"
      }}>
        {getIngName(ing, lang)}
      </div>
    </div>
  );
};

// ═══ ACTION CARD ═══
export const ActionCard = ({ card, onClick, selected, small }) => {
  const info = getActionInfo(card.action);
  const w = small ? 64 : 86, h = small ? 94 : 126;

  return (
    <div onClick={onClick} style={{
      width: w, height: h, borderRadius: 8, cursor: "pointer",
      border: selected ? "3px solid #FFD700" : "3px solid #555",
      background: "linear-gradient(170deg,#1A1A2E 0%,#16213E 100%)",
      boxShadow: selected ? "0 0 18px rgba(255,215,0,0.6)" : "0 2px 8px rgba(0,0,0,0.3)",
      transform: selected ? "translateY(-10px) scale(1.06)" : "scale(1)",
      transition: "all 0.2s", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 2, color: "#eee", fontFamily: "'Fredoka',sans-serif", padding: "4px 3px",
    }}>
      {ACTION_IMG[card.action] ? (
        <img src={ACTION_IMG[card.action]} alt={card.action} style={{
          width: small ? 30 : 44, height: small ? 30 : 44, objectFit: "contain",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
        }} />
      ) : (
        <span style={{ fontSize: small ? 22 : 32 }}>{info?.emoji}</span>
      )}
      <span style={{ fontSize: small ? 7 : 9, fontWeight: 700, textAlign: "center", lineHeight: 1.1 }}>{info?.name}</span>
      <span style={{ fontSize: small ? 5 : 7, color: "#777", textAlign: "center", lineHeight: 1.1 }}>{info?.desc}</span>
    </div>
  );
};

// ═══ GAME CARD (wrapper) ═══
export const GameCard = ({ card, playable, ...props }) => {
  return card.type === "ingredient"
    ? <IngredientCard card={card} playable={playable} {...props} />
    : <ActionCard card={card} {...props} />;
};
