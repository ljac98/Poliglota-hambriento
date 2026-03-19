import React from 'react';
import { ING_EMOJI, ING_BG } from '../constants';
import ingPan    from '../imagenes/hamburguesas/objetivos/pan.png';
import ingLechuga from '../imagenes/hamburguesas/objetivos/lechuga.png';
import ingTomate  from '../imagenes/hamburguesas/objetivos/tomate.png';
import ingCarne   from '../imagenes/hamburguesas/objetivos/carne.png';
import ingQueso   from '../imagenes/hamburguesas/objetivos/queso.png';
import ingPollo   from '../imagenes/hamburguesas/objetivos/pollo.png';
import ingHuevo   from '../imagenes/hamburguesas/objetivos/huevo.png';
import ingCebolla from '../imagenes/hamburguesas/objetivos/cebolla.png';
import ingPalta   from '../imagenes/hamburguesas/objetivos/palta.png';

// Burger stack images
import burgerCarne   from '../imagenes/hamburguesas/ingredientes/carne.png';
import burgerCebolla from '../imagenes/hamburguesas/ingredientes/cebolla.png';
import burgerChoclo  from '../imagenes/hamburguesas/ingredientes/choclo.png';
import burgerHuevo   from '../imagenes/hamburguesas/ingredientes/huevo.png';
import burgerLechuga from '../imagenes/hamburguesas/ingredientes/lechuga.png';
import burgerPalta   from '../imagenes/hamburguesas/ingredientes/palta.png';
import burgerPanAbajo from '../imagenes/hamburguesas/ingredientes/pan abajo.png';
import burgerPanArriba from '../imagenes/hamburguesas/ingredientes/pan arriba.png';
import burgerPollo   from '../imagenes/hamburguesas/ingredientes/pollo.png';
import burgerQueso   from '../imagenes/hamburguesas/ingredientes/queso.png';
import burgerTomate  from '../imagenes/hamburguesas/ingredientes/tomates.png';

const ING_IMG = {
  pan: ingPan, lechuga: ingLechuga, tomate: ingTomate, carne: ingCarne,
  queso: ingQueso, pollo: ingPollo, huevo: ingHuevo, cebolla: ingCebolla,
  palta: ingPalta,
};

const BURGER_STACK_IMG = {
  carne: burgerCarne, cebolla: burgerCebolla, choclo: burgerChoclo,
  huevo: burgerHuevo, lechuga: burgerLechuga, palta: burgerPalta,
  pollo: burgerPollo, queso: burgerQueso, tomate: burgerTomate,
};

// Resolve wildcard entries in the table to the ingredient slots they fill.
// 'perrito|lechuga' uses the chosen ingredient; bare 'perrito' fills the first unfilled slot.
function resolveWildcards(table, target) {
  const resolved = [];
  let barePerritos = 0;
  table.forEach(t => {
    if (t === 'perrito') { barePerritos++; }
    else if (t.startsWith('perrito|')) { resolved.push(t.split('|')[1]); }
    else { resolved.push(t); }
  });
  if (barePerritos === 0) return resolved;
  const covered = {};
  resolved.forEach(t => { covered[t] = (covered[t] || 0) + 1; });
  let left = barePerritos;
  for (const ing of target) {
    if (left === 0) break;
    if ((covered[ing] || 0) > 0) { covered[ing]--; }
    else { resolved.push(ing); left--; }
  }
  return resolved;
}

// ═══ BURGER TARGET (horizontal) with stacked burger visual ═══
export const BurgerTarget = ({ ingredients, table, isCurrent }) => {
  const resolvedTable = resolveWildcards(table, ingredients);
  const counts = {};
  ingredients.forEach(ing => { counts[ing] = (counts[ing] || 0) + 1; });
  const rendered = {};

  // Build filled status per ingredient for the stack
  const stackRendered = {};
  const stackFilled = ingredients.map(ing => {
    stackRendered[ing] = (stackRendered[ing] || 0) + 1;
    const have = resolvedTable.filter(t => t === ing).length;
    return have >= stackRendered[ing];
  });
  const panFilled = (() => {
    const panIdx = ingredients.indexOf('pan');
    if (panIdx === -1) return true;
    return stackFilled[panIdx];
  })();

  return (
    <div style={{
      display: "flex", flexDirection: "row", alignItems: "center", gap: 8,
      padding: "6px 10px", borderRadius: 10,
      background: isCurrent ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
      border: isCurrent ? "2px solid #FFD700" : "2px solid transparent",
    }}>
      {/* Stacked burger visual — only for the current target */}
      {isCurrent && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          flexShrink: 0, width: 70,
        }}>
          <img src={burgerPanArriba} alt="pan" style={{
            width: 70, height: 'auto', marginBottom: -4,
            opacity: panFilled ? 1 : 0.25, transition: 'opacity 0.3s',
            filter: panFilled ? 'none' : 'grayscale(0.5)',
          }} />
          {[...ingredients].reverse().map((ing, i) => {
            const realIdx = ingredients.length - 1 - i;
            const filled = stackFilled[realIdx];
            return (
              BURGER_STACK_IMG[ing] && <img
                key={i}
                src={BURGER_STACK_IMG[ing]}
                alt={ing}
                style={{
                  width: 64, height: 'auto', marginTop: -4, marginBottom: -4,
                  opacity: filled ? 1 : 0.25,
                  transition: 'opacity 0.3s',
                  filter: filled ? 'none' : 'grayscale(0.5)',
                }}
              />
            );
          })}
          <img src={burgerPanAbajo} alt="pan" style={{
            width: 70, height: 'auto', marginTop: -4,
            opacity: panFilled ? 1 : 0.25, transition: 'opacity 0.3s',
            filter: panFilled ? 'none' : 'grayscale(0.5)',
          }} />
        </div>
      )}

      {/* Ingredient icons row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
        {isCurrent ? ingredients.map((ing, i) => {
          rendered[ing] = (rendered[ing] || 0) + 1;
          const thisOccurrence = rendered[ing];
          const have = resolvedTable.filter(t => t === ing).length;
          const filled = have >= thisOccurrence;
          const isDupe = counts[ing] > 1;

          return (
            <div key={i} style={{
              position: "relative", width: 36, height: 36, borderRadius: 6,
              background: filled ? ING_BG[ing] : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: filled ? "none" : `2px dashed ${ING_BG[ing]}44`,
              opacity: filled ? 1 : 0.35, transition: "all 0.3s",
            }}>
              {ING_IMG[ing]
                ? <img src={ING_IMG[ing]} alt={ing} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                : ING_EMOJI[ing]}
              {isDupe && (
                <div style={{
                  position: "absolute", top: -4, right: -6, fontSize: 8, fontWeight: 900,
                  background: "#FF6B35", color: "#fff", borderRadius: 4,
                  padding: "0 2px", lineHeight: "10px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                }}>
                  x{thisOccurrence}
                </div>
              )}
            </div>
          );
        }) : ingredients.map((_, i) => (
          <div key={i} style={{
            width: 36, height: 36, borderRadius: 6,
            background: "rgba(255,205,155,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px dashed rgba(255,255,255,0.15)",
            fontSize: 14, color: "rgba(255,255,255,0.3)",
          }}>?</div>
        ))}
      </div>
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
