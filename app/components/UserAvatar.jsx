import React, { useMemo } from 'react';

function hashString(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getInitials(name = '', username = '') {
  const source = String(name || username || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function UserAvatar({ name, username, avatarUrl, size = 44, square = false, style = {} }) {
  const seed = `${username || ''}-${name || ''}`;
  const hash = useMemo(() => hashString(seed), [seed]);
  const hueA = hash % 360;
  const hueB = (hash * 1.7 + 40) % 360;
  const initials = useMemo(() => getInitials(name, username), [name, username]);

  return (
    <div
      aria-label={name || username || 'avatar'}
      style={{
        width: size,
        height: size,
        borderRadius: square ? Math.max(12, Math.round(size * 0.28)) : '50%',
        background: `linear-gradient(135deg, hsl(${hueA} 72% 56%), hsl(${hueB} 72% 44%))`,
        border: '2px solid rgba(255,255,255,0.14)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff7d1',
        fontFamily: "'Fredoka',sans-serif",
        fontWeight: 900,
        fontSize: Math.max(12, Math.round(size * 0.34)),
        letterSpacing: 0.4,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || username || 'avatar'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28), transparent 36%)',
            }}
          />
          <span style={{ position: 'relative', zIndex: 1 }}>{initials}</span>
        </>
      )}
    </div>
  );
}
