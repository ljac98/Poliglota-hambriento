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

// Build slot-by-slot coverage so we can tell if a target slot was filled by wildcard.
function resolveTargetSlots(table, target) {
  const normal = {};
  const wildcardChosen = {};
  let wildcardBare = 0;

  table.forEach((t) => {
    if (t === 'perrito') {
      wildcardBare += 1;
    } else if (t.startsWith('perrito|')) {
      const chosen = t.split('|')[1];
      wildcardChosen[chosen] = (wildcardChosen[chosen] || 0) + 1;
    } else {
      normal[t] = (normal[t] || 0) + 1;
    }
  });

  return target.map((ing) => {
    if ((normal[ing] || 0) > 0) {
      normal[ing] -= 1;
      return { filled: true, viaWildcard: false };
    }
    if ((wildcardChosen[ing] || 0) > 0) {
      wildcardChosen[ing] -= 1;
      return { filled: true, viaWildcard: true };
    }
    if (wildcardBare > 0) {
      wildcardBare -= 1;
      return { filled: true, viaWildcard: true };
    }
    return { filled: false, viaWildcard: false };
  });
}

// ═══ BURGER TARGET (horizontal) with stacked burger visual ═══
export const BurgerTarget = ({ ingredients, table, isCurrent, onIngredientClick, onRegisterSlotRef, highlightIngredient = null, highlightIngredients = null }) => {
  const slotState = resolveTargetSlots(table, ingredients);
  const counts = {};
  ingredients.forEach(ing => { counts[ing] = (counts[ing] || 0) + 1; });
  const rendered = {};
  const highlightedSet = new Set(
    Array.isArray(highlightIngredients)
      ? highlightIngredients.filter(Boolean)
      : (highlightIngredient ? [highlightIngredient] : []),
  );

  // Build filled status per ingredient for the stack
  const stackFilled = slotState.map(s => s.filled);
  const panFilled = (() => {
    const panIdx = ingredients.indexOf('pan');
    if (panIdx === -1) return true;
    return stackFilled[panIdx];
  })();

  return (
    <div style={{
      display: "flex", flexDirection: "row", alignItems: "center", gap: 8,
      padding: "6px 10px", borderRadius: 10,
      background: isCurrent ? "rgba(20,26,34,0.92)" : "rgba(255,255,255,0.03)",
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
            opacity: panFilled ? 1 : 0.7, transition: 'opacity 0.3s',
            filter: 'none',
          }} />
          {[...ingredients].reverse().map((ing, i) => {
            const realIdx = ingredients.length - 1 - i;
            const filled = stackFilled[realIdx];
            const shouldHighlight = highlightedSet.has(ing) && !filled;
            return (
              BURGER_STACK_IMG[ing] && <img
                key={i}
                src={BURGER_STACK_IMG[ing]}
                alt={ing}
                style={{
                  width: 64, height: 'auto', marginTop: -4, marginBottom: -4,
                  opacity: filled ? 1 : 0.72,
                  transition: 'opacity 0.3s, transform 0.2s, filter 0.2s',
                  filter: shouldHighlight
                    ? 'drop-shadow(0 0 10px rgba(255,215,0,0.75)) brightness(1.08)'
                    : 'none',
                  transform: shouldHighlight ? 'scale(1.06)' : 'none',
                }}
              />
            );
          })}
          <img src={burgerPanAbajo} alt="pan" style={{
            width: 70, height: 'auto', marginTop: -4,
            opacity: panFilled ? 1 : 0.7, transition: 'opacity 0.3s',
            filter: 'none',
          }} />
        </div>
      )}

      {/* Ingredient icons row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
        {isCurrent ? ingredients.map((ing, i) => {
          rendered[ing] = (rendered[ing] || 0) + 1;
          const thisOccurrence = rendered[ing];
          const filled = slotState[i].filled;
          const viaWildcard = slotState[i].viaWildcard;
          const isDupe = counts[ing] > 1;
          const shouldHighlight = highlightedSet.has(ing) && !filled;

          return (
            <div
              key={i}
              ref={(el) => onRegisterSlotRef?.(i, el)}
              onClick={() => onIngredientClick && onIngredientClick(viaWildcard ? `perrito|${ing}` : ing)}
              style={{
              position: "relative", width: 44, height: 44, borderRadius: 8,
              background: filled ? ING_BG[ing] : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: shouldHighlight
                ? "2px solid #FFD700"
                : filled
                  ? "none"
                  : `2px dashed ${ING_BG[ing]}44`,
              opacity: filled ? 1 : 0.92, transition: "all 0.3s",
              boxShadow: shouldHighlight ? "0 0 0 3px rgba(255,215,0,0.14), 0 0 14px rgba(255,215,0,0.28)" : "none",
              transform: shouldHighlight ? "translateY(-1px) scale(1.04)" : "none",
              cursor: onIngredientClick ? "pointer" : "default",
            }}
            >
              {ING_IMG[ing]
                ? <img src={ING_IMG[ing]} alt={ing} style={{ width: 42, height: 42, objectFit: 'contain' }} />
                : ING_EMOJI[ing]}
              {viaWildcard && (
                <div style={{
                  position: "absolute", left: -3, bottom: -4,
                  background: "rgba(10,16,30,0.9)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.35)", borderRadius: 8,
                  padding: "0 3px", lineHeight: "12px", fontSize: 9,
                }}>
                  {ING_EMOJI.perrito}
                </div>
              )}
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
            width: 20, height: 20, borderRadius: 6,
            background: "rgba(255,255,255,0.06)",
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
