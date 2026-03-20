import React from 'react';
import HatSVG from './HatSVG';
import { LANG_BORDER, LANG_TEXT, LANG_SHORT } from '../constants';

// ═══ HAT BADGE ═══
export const HatBadge = ({ lang, isMain, onClick, size = "md" }) => {
  const s = size === "sm" ? 22 : size === "lg" ? 42 : 32;
  const HAT_TILE_BG = {
    'espaÃ±ol': '#FFD978',
    'inglÃ©s': '#2F3640',
    'francÃ©s': '#FFDCC8',
    italiano: '#F2E6C9',
    'alemÃ¡n': '#CCEFCE',
    'portuguÃ©s': '#E8D8C9',
  };
  const HAT_TILE_TEXT = {
    'espaÃ±ol': '#4F2A00',
    'inglÃ©s': '#FFFFFF',
    'francÃ©s': '#6A2C00',
    italiano: '#4A3A23',
    'alemÃ¡n': '#155E1E',
    'portuguÃ©s': '#3F2B1D',
  };
  const tileBg = HAT_TILE_BG[lang] || 'rgba(255,255,255,0.08)';
  const tileText = HAT_TILE_TEXT[lang] || LANG_TEXT[lang] || '#222';
  return (
    <div onClick={onClick} style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1,
      minWidth: size === "sm" ? 46 : 58,
      padding: size === "sm" ? 5 : 6,
      borderRadius: 10,
      cursor: onClick ? "pointer" : "default",
      border: isMain ? `2px solid #FFD700` : `2px solid ${LANG_BORDER[lang]}99`,
      background: tileBg,
      boxShadow: isMain ? "0 0 10px rgba(255,215,0,0.35)" : "0 2px 6px rgba(0,0,0,0.15)",
      transition: "all 0.2s",
    }}>
      <HatSVG lang={lang} size={s} />
      <span style={{
        fontSize: size === "sm" ? 9 : 10,
        fontWeight: 900,
        color: isMain ? "#5C3A00" : tileText,
        letterSpacing: 0.4,
        lineHeight: 1.05,
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
            <HatSVG lang={lang} size={22} />
            <div style={{ textAlign: "center", fontSize: 5, fontWeight: 800, color: LANG_TEXT[lang], marginTop: -2 }}>
              {LANG_SHORT[lang]}
            </div>
          </div>
        );
      })}
    </div>
  );
};
