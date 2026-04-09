import React, { useEffect, useMemo, useState } from 'react';
import { Btn } from '../components/Btn.jsx';
import { Modal } from '../components/Modal.jsx';
import { getUnlockedWords } from '../../src/api.js';
import { getUILang } from '../../src/translations.js';
import { getUnlockableWordById } from '../../src/palabras/unlockedWordsCatalog.js';
import { readUnlockedWordEntries, syncUnlockedWordEntries } from '../../src/palabras/unlockedWordsStorage.js';

function formatUnlockedDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function UnlockedWordsScreen({ user, onBack, T }) {
  const uiKey = getUILang();
  const [entries, setEntries] = useState(() => readUnlockedWordEntries(user));
  const [loading, setLoading] = useState(!!user?.id);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadWords() {
      if (!user?.id) {
        setEntries(readUnlockedWordEntries(null));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const words = await getUnlockedWords();
        if (cancelled) return;
        const nextEntries = syncUnlockedWordEntries(user, Array.isArray(words) ? words : []);
        setEntries(nextEntries);
      } catch (err) {
        if (cancelled) return;
        setEntries(readUnlockedWordEntries(user));
        setError(err.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadWords();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const enrichedEntries = useMemo(() => (
    entries
      .map((entry) => ({
        ...entry,
        wordData: getUnlockableWordById(entry.wordId),
      }))
      .filter((entry) => !!entry.wordData)
  ), [entries]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif",
      padding: '24px 0',
    }}>
      <div style={{
        background: '#16213e',
        borderRadius: 24,
        padding: 'clamp(20px, 5vw, 38px)',
        maxWidth: 980,
        width: '92vw',
        boxShadow: '0 18px 48px rgba(0,0,0,.5)',
        border: '2px solid #2a2a4a',
      }}>
        <button onClick={onBack} style={{
          background: 'none',
          border: 'none',
          color: '#8a8fa8',
          fontFamily: "'Fredoka',sans-serif",
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          marginBottom: 14,
        }}>
          {T('back')}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <div style={{ color: '#FFD700', fontSize: 28, fontWeight: 900 }}>{T('unlockedWordsTitle')}</div>
            <div style={{ color: '#8a8fa8', fontSize: 13, fontWeight: 700, marginTop: 6 }}>
              {T('unlockedWordsDesc')}
            </div>
          </div>
          <div style={{
            minWidth: 120,
            padding: '12px 14px',
            borderRadius: 16,
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.2)',
            textAlign: 'center',
          }}>
            <div style={{ color: '#8a8fa8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7 }}>
              {T('unlockedWordsCount')}
            </div>
            <div style={{ color: '#FFD700', fontSize: 28, fontWeight: 900, marginTop: 4 }}>
              {enrichedEntries.length}
            </div>
          </div>
        </div>

        {!!error && (
          <div style={{ color: '#ff9b94', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#a6abc2', textAlign: 'center', padding: '42px 0', fontSize: 15 }}>{T('loading')}</div>
        ) : enrichedEntries.length === 0 ? (
          <div style={{
            borderRadius: 22,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '34px 24px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#fff3bf', fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
              {T('unlockedWordsEmptyTitle')}
            </div>
            <div style={{ color: '#8a8fa8', fontSize: 14, fontWeight: 700 }}>
              {T('unlockedWordsEmptyDesc')}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}>
            {enrichedEntries.map((entry) => (
              <button
                key={`${entry.wordId}-${entry.unlockedAt}`}
                type="button"
                onClick={() => setSelectedEntry(entry)}
                style={{
                  borderRadius: 18,
                  padding: '16px 16px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: "'Fredoka',sans-serif",
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ color: '#fff3bf', fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
                    {entry.wordData.word}
                  </div>
                  <div style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: 'rgba(78,205,196,0.12)',
                    border: '1px solid rgba(78,205,196,0.24)',
                    color: '#9ee6d8',
                    fontSize: 11,
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                  }}>
                    {T(entry.wordData.language)}
                  </div>
                </div>
                <div style={{ color: '#d8ddf3', fontSize: 13, fontWeight: 700, marginTop: 10 }}>
                  {entry.wordData.meanings[uiKey] || entry.wordData.meanings.es}
                </div>
                <div style={{ color: '#8a8fa8', fontSize: 11, fontWeight: 700, marginTop: 12 }}>
                  {T('unlockedAtLabel')}: {formatUnlockedDate(entry.unlockedAt)}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedEntry?.wordData && (
          <Modal title={selectedEntry.wordData.word} maxWidth={680}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                background: 'rgba(78,205,196,0.12)',
                border: '1px solid rgba(78,205,196,0.24)',
                color: '#9ee6d8',
                fontSize: 12,
                fontWeight: 800,
                alignSelf: 'flex-start',
              }}>
                <span>{T('wordLanguageLabel')}:</span>
                <span>{T(selectedEntry.wordData.language)}</span>
              </div>

              <div>
                <div style={{ color: '#FFD700', fontSize: 13, fontWeight: 900, marginBottom: 6 }}>{T('wordMeaningLabel')}</div>
                <div style={{ color: '#d9dded', fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>
                  {selectedEntry.wordData.meanings[uiKey] || selectedEntry.wordData.meanings.es}
                </div>
              </div>

              <div>
                <div style={{ color: '#FFD700', fontSize: 13, fontWeight: 900, marginBottom: 6 }}>{T('wordExampleLabel')}</div>
                <div style={{
                  color: '#fff3bf',
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1.5,
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {selectedEntry.wordData.example}
                </div>
              </div>

              <div style={{ color: '#8a8fa8', fontSize: 12, fontWeight: 700 }}>
                {T('unlockedAtLabel')}: {formatUnlockedDate(selectedEntry.unlockedAt)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn onClick={() => setSelectedEntry(null)} color="#2a2a4a" style={{ color: '#fff' }}>
                  {T('close')}
                </Btn>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
