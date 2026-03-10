import React from 'react';
import { ING_EMOJI, ING_BG } from '../constants';

// ═══ BURGER TARGET (horizontal) ═══
export const BurgerTarget = ({ ingredients, table, isCurrent }) => {
  const counts = {};
  ingredients.forEach(ing => { counts[ing] = (counts[ing] || 0) + 1; });
  const rendered = {};

  return (
    <div style={{
      display: "flex", flexDirection: "row", flexWrap: "wrap",
      alignItems: "center", gap: 3, padding: "6px 10px", borderRadius: 10,
      background: isCurrent ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
      border: isCurrent ? "2px solid #FFD700" : "2px solid transparent",
    }}>
      {ingredients.map((ing, i) => {
        rendered[ing] = (rendered[ing] || 0) + 1;
        const thisOccurrence = rendered[ing];
        const have = table.filter(t => t === ing).length;
        const filled = have >= thisOccurrence;
        const isDupe = counts[ing] > 1;

        return (
          <div key={i} style={{
            position: "relative", width: 26, height: 26, borderRadius: 6,
            background: filled ? ING_BG[ing] : "rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: filled ? "none" : `2px dashed ${ING_BG[ing]}44`,
            fontSize: 15, opacity: filled ? 1 : 0.35, transition: "all 0.3s",
          }}>
            {ING_EMOJI[ing]}
            {isDupe && (
              <div style={{
                position: "absolute", top: -4, right: -6, fontSize: 6, fontWeight: 900,
                background: "#FF6B35", color: "#fff", borderRadius: 4,
                padding: "0 2px", lineHeight: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
              }}>
                x{thisOccurrence}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ═══ LOG ENTRY ═══
export const LogEntry = ({ e }) => (
  <div style={{
    padding: "3px 8px", fontSize: 10, color: "#888",
    borderLeft: `3px solid ${e.color || "#555"}`,
    marginBottom: 2, fontFamily: "monospace",
  }}>
    <span style={{ color: e.color || "#FFD700", fontWeight: 700 }}>{e.player}</span>
    {" "}{e.text}
  </div>
);
