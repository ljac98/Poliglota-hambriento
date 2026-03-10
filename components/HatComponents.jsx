import React from 'react';
import HatSVG from './HatSVG';
import { LANG_BORDER, LANG_TEXT, LANG_SHORT, HAT_IMG } from '../constants';

// ═══ HAT BADGE ═══
export const HatBadge = ({ lang, isMain, onClick, size = "md" }) => {
  const s = size === "sm" ? 22 : size === "lg" ? 42 : 32;
  return (
    <div onClick={onClick} style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1,
      padding: 4, borderRadius: 8, cursor: onClick ? "pointer" : "default",
      border: isMain ? `2px solid #FFD700` : `2px solid ${LANG_BORDER[lang]}44`,
      background: isMain ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
      boxShadow: isMain ? "0 0 8px rgba(255,215,0,0.25)" : "none",
      transition: "all 0.2s",
    }}>
      {HAT_IMG[lang] ? (
        <img src={HAT_IMG[lang]} alt={lang} style={{ width: s, height: s, objectFit: "contain" }} />
      ) : (
        <HatSVG lang={lang} size={s} />
      )}
      <span style={{
        fontSize: size === "sm" ? 6 : 7, fontWeight: 800,
        color: isMain ? "#FFD700" : LANG_TEXT[lang], letterSpacing: 0.5
      }}>
        {LANG_SHORT[lang]}
      </span>
    </div>
  );
};

// ═══ PERCHERO (Hat Rack) ═══
export const PercheroSVG = ({ hats, onClickHat, height = 120 }) => {
  const branches = [
    { x: 22, y: 30, side: "left" },
    { x: 78, y: 25, side: "right" },
    { x: 18, y: 55, side: "left" },
    { x: 82, y: 50, side: "right" },
    { x: 25, y: 75, side: "left" },
  ];
  const w = 100, h = 100;

  return (
    <div style={{ position: "relative", width: height * 1.1, height, display: "inline-block" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width={height * 1.1} height={height}>
        <path d="M35 95 Q50 92 65 95" stroke="#2D5A27" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M30 97 Q50 93 70 97" stroke="#2D5A27" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <line x1="50" y1="12" x2="50" y2="95" stroke="#2D5A27" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="50" cy="10" r="3" fill="#3A7A32" />
        {hats.map((_, i) => {
          if (i >= branches.length) return null;
          const b = branches[i];
          return (
            <line key={`br-${i}`} x1={50} y1={b.y} x2={b.x} y2={b.y - 4}
              stroke="#3A7A32" strokeWidth="2.5" strokeLinecap="round" />
          );
        })}
      </svg>
      {hats.map((lang, i) => {
        if (i >= branches.length) return null;
        const b = branches[i];
        const leftPx = (b.x / w) * height * 1.1;
        const topPx = ((b.y - 16) / h) * height;
        return (
          <div key={i} onClick={onClickHat ? () => onClickHat(i) : undefined}
            style={{
              position: "absolute", left: leftPx - 18, top: topPx,
              transform: `rotate(${b.side === "left" ? -12 : 12}deg)`,
              cursor: onClickHat ? "pointer" : "default",
              transition: "transform 0.2s",
              filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
            }}
            onMouseOver={e => { if (onClickHat) e.currentTarget.style.transform = `rotate(${b.side === "left" ? -12 : 12}deg) scale(1.2)`; }}
            onMouseOut={e => { e.currentTarget.style.transform = `rotate(${b.side === "left" ? -12 : 12}deg) scale(1)`; }}
          >
            {HAT_IMG[lang] ? (
              <img src={HAT_IMG[lang]} alt={lang} style={{ width: 28, height: 28, objectFit: "contain" }} />
            ) : (
              <HatSVG lang={lang} size={22} />
            )}
            <div style={{ textAlign: "center", fontSize: 5, fontWeight: 800, color: LANG_TEXT[lang], marginTop: -2 }}>
              {LANG_SHORT[lang]}
            </div>
          </div>
        );
      })}
    </div>
  );
};
