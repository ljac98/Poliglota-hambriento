import React from 'react';

const HatSVG = ({ lang, size = 40 }) => {
  const h = size, w = size * 1.3;
  const hats = {
    español: (
      <svg viewBox="0 0 120 76" width={w} height={h}>
        <ellipse cx="60" cy="60" rx="55" ry="13" fill="#C8960F" stroke="#1a1a1a" strokeWidth="2.5"/>
        <path d="M28 60Q28 34 60 26Q92 34 92 60" fill="#DAA520" stroke="#1a1a1a" strokeWidth="2.5"/>
        <ellipse cx="60" cy="26" rx="19" ry="5" fill="#E0B030" stroke="#1a1a1a" strokeWidth="1.5"/>
        <path d="M30 49Q60 43 90 49" fill="none" stroke="#C41E1E" strokeWidth="3.5"/>
        <circle cx="44" cy="45" r="3" fill="#C41E1E"/>
        <circle cx="76" cy="45" r="3" fill="#C41E1E"/>
        <path d="M15 64L30 60 45 66 60 60 75 66 90 60 105 64" fill="none" stroke="#C41E1E" strokeWidth="3"/>
      </svg>
    ),
    inglés: (
      <svg viewBox="0 0 80 85" width={h * 0.9} height={h}>
        <ellipse cx="40" cy="72" rx="30" ry="8" fill="#222" stroke="#111" strokeWidth="2.5"/>
        <rect x="18" y="16" width="44" height="56" rx="3" fill="#2D2D2D" stroke="#111" strokeWidth="2.5"/>
        <ellipse cx="40" cy="16" rx="22" ry="6" fill="#353535" stroke="#111" strokeWidth="1.5"/>
        <rect x="18" y="56" width="44" height="6" fill="#252525"/>
      </svg>
    ),
    francés: (
      <svg viewBox="0 0 85 50" width={w * 0.9} height={h * 0.65}>
        <ellipse cx="42" cy="38" rx="38" ry="10" fill="#B71C1C" stroke="#1a1a1a" strokeWidth="2.5"/>
        <ellipse cx="42" cy="28" rx="30" ry="13" fill="#D32F2F" stroke="#1a1a1a" strokeWidth="2"/>
        <ellipse cx="40" cy="20" rx="20" ry="10" fill="#E53935"/>
        <path d="M26 22Q40 10 56 22" fill="#EF5350" opacity="0.5"/>
      </svg>
    ),
    italiano: (
      <svg viewBox="0 0 108 65" width={w} height={h * 0.82}>
        <ellipse cx="54" cy="54" rx="48" ry="9" fill="#C5B896" stroke="#1a1a1a" strokeWidth="2.5"/>
        <path d="M20 54Q20 30 54 24Q88 30 88 54" fill="#E8D5B0" stroke="#1a1a1a" strokeWidth="2.5"/>
        <ellipse cx="54" cy="24" rx="18" ry="5" fill="#EDE0C4" stroke="#1a1a1a" strokeWidth="1.5"/>
        <path d="M24 44Q54 39 84 44" fill="none" stroke="#2A2A2A" strokeWidth="3"/>
      </svg>
    ),
    alemán: (
      <svg viewBox="0 0 108 68" width={w} height={h * 0.85}>
        <path d="M16 56Q16 52 54 48Q92 52 92 56Q92 62 54 64Q16 62 16 56Z" fill="#2E7D32" stroke="#1a1a1a" strokeWidth="2.5"/>
        <path d="M28 54Q28 26 54 20Q80 26 80 54" fill="#388E3C" stroke="#1a1a1a" strokeWidth="2.5"/>
        <ellipse cx="54" cy="20" rx="15" ry="5" fill="#43A047" stroke="#1a1a1a" strokeWidth="1.5"/>
        <path d="M30 42Q54 38 78 42" fill="none" stroke="#C41E1E" strokeWidth="3.5"/>
        <line x1="82" y1="30" x2="98" y2="12" stroke="#DAA520" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M96 12Q100 18 94 24" fill="none" stroke="#DAA520" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    portugués: (
      <svg viewBox="0 0 108 60" width={w} height={h * 0.75}>
        <ellipse cx="54" cy="50" rx="50" ry="8" fill="#6D4C41" stroke="#1a1a1a" strokeWidth="2.5"/>
        <path d="M22 50Q22 34 54 28Q86 34 86 50" fill="#8D6E63" stroke="#1a1a1a" strokeWidth="2.5"/>
        <rect x="22" y="28" width="64" height="8" rx="2" fill="#795548"/>
        <path d="M26 42Q54 38 82 42" fill="none" stroke="#3E2723" strokeWidth="3"/>
      </svg>
    ),
  };
  
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }}>
      {hats[lang]}
    </div>
  );
};

export default HatSVG;
