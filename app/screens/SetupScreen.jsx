import React, { useEffect, useMemo, useState } from 'react';
import { LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT, INGREDIENTS, ING_BG, getIngName } from '../../constants/index.js';
import { randInt, uid } from '../../game/utils.js';
import { Btn } from '../components/Btn.jsx';
import { Modal } from '../components/Modal.jsx';
import { InstallFloatingCard } from '../components/InstallFloatingCard.jsx';
import { getUILang, KEY_TO_LANG } from '../../src/translations.js';
import { ING_IMG } from '../utils/gameHelpers.js';
import { genBurger } from '../../game/deck.js';
import { HatBadge, PercheroSVG } from '../../components/HatComponents.jsx';
import HatSVG from '../../components/HatSVG.jsx';
import hamImg from '../../imagenes/hamburguesas/ham.png';
import onlineImg from '../../imagenes/online.png';
import modoclon from '../../imagenes/modos/clones.png';
import modoescalera from '../../imagenes/modos/escalera.png';
import modocaotico from '../../imagenes/modos/caotico.png';
import vsiaImg from '../../imagenes/vsia.png';
import actionEnsaladaImg from '../../imagenes/acciones/ensalada3.png';
import actionPizzaImg from '../../imagenes/acciones/pizza.png';
import actionParrillaImg from '../../imagenes/acciones/parrilla2.png';
import percheroImg from '../../imagenes/sombreros/perchero/percherofinal.png';
import burgerPanArriba from '../../imagenes/hamburguesas/ingredientes/pan arriba.png';
import burgerPanAbajo from '../../imagenes/hamburguesas/ingredientes/pan abajo.png';
import burgerCarne from '../../imagenes/hamburguesas/ingredientes/carne.png';
import burgerQueso from '../../imagenes/hamburguesas/ingredientes/queso.png';
import burgerLechuga from '../../imagenes/hamburguesas/ingredientes/lechuga.png';
import burgerCebolla from '../../imagenes/hamburguesas/ingredientes/cebolla.png';
import burgerTomate from '../../imagenes/hamburguesas/ingredientes/tomates.png';
import burgerPollo from '../../imagenes/hamburguesas/ingredientes/pollo.png';
import burgerHuevo from '../../imagenes/hamburguesas/ingredientes/huevo.png';
import burgerPalta from '../../imagenes/hamburguesas/ingredientes/palta.png';

export function SetupScreen({ onStart, onStartTutorial, onOnline, onDownload, user, onLogout, onHistory, onFriends, T, installEntryVisible, installEntryTitle, installEntryDesc, installEntryButton, onOpenInstallPrompt }) {
  const uiGameLang = KEY_TO_LANG[getUILang()] || 'espanol';
  const normalModeHint =
    ({
      es: 'Escoge el modo',
      en: 'Choose the mode',
      fr: 'Choisis le mode',
      it: 'Scegli la modalita',
      de: 'Wahle den Modus',
      pt: 'Escolha o modo',
    })[getUILang()] || 'Escoge el modo';
  const cloneIngredients = INGREDIENTS.filter((ing) => ing !== 'pan');
  const [name, setName] = useState(user?.displayName || '');
  const [hat, setHat] = useState(null);
  const [gameMode, setGameMode] = useState('clon');
  const [burgerCount, setBurgerCount] = useState(2);
  const [ingredientCount, setIngredientCount] = useState(5);
  const [ingredientPool, setIngredientPool] = useState(cloneIngredients);
  const [cloneWildcardsEnabled, setCloneWildcardsEnabled] = useState(true);
  const [chaosLevel, setChaosLevel] = useState(2);
  const [aiCount, setAiCount] = useState(2);
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [showModeConfig, setShowModeConfig] = useState(false);
  const [showVsAiModal, setShowVsAiModal] = useState(false);
  const [selectedStaircasePlayer, setSelectedStaircasePlayer] = useState(0);
  const [isDesktopWide, setIsDesktopWide] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1180 : false));
  const uiKey = getUILang();
  const playerWord = ({
    es: 'Jugador',
    en: 'Player',
    fr: 'Joueur',
    it: 'Giocatore',
    de: 'Spieler',
    pt: 'Jogador',
  })[uiKey] || 'Player';
  const totalPreviewPlayers = aiCount + 1;
  useEffect(() => {
    const handleResize = () => setIsDesktopWide(window.innerWidth >= 1180);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gameModes = [
    { id: 'clon', label: T('modeClon'), desc: T('modeClonDesc') ,img:modoclon },
    { id: 'escalera', label: T('modeEscalera'), desc: T('modeEscaleraDesc'),img:modoescalera },
    { id: 'caotico', label: T('modeCaotico'), desc: T('modeCaoticoDesc') ,img:modocaotico},
  ];
  const aiDifficultyOptions = [
    { id: 'easy', label: T('aiEasy') },
    { id: 'medium', label: T('aiMedium') },
    { id: 'hard', label: T('aiHard') },
    { id: 'impossible', label: T('aiImpossible') },
  ];
  const selectedMode = gameModes.find((mode) => mode.id === gameMode) || gameModes[0];
  const burgerLayerMap = {
    carne: burgerCarne,
    queso: burgerQueso,
    lechuga: burgerLechuga,
    cebolla: burgerCebolla,
    tomate: burgerTomate,
    pollo: burgerPollo,
    huevo: burgerHuevo,
    palta: burgerPalta,
  };
  const modePreview = (() => {
    if (gameMode === 'caotico') {
      if (chaosLevel === 1) return { burgers: '1-2', ingredients: '3-5', layerCount: 5 };
      if (chaosLevel === 3) return { burgers: '3-5', ingredients: '5-8', layerCount: 8 };
      return { burgers: '2-4', ingredients: '4-7', layerCount: 7 };
    }
    if (gameMode === 'escalera') {
      return { burgers: String(burgerCount), ingredients: `4-${3 + burgerCount}`, layerCount: 3 + burgerCount };
    }
    return { burgers: String(burgerCount), ingredients: String(ingredientCount), layerCount: ingredientCount };
  })();
  const previewBurgers = useMemo(() => {
    if (gameMode === 'clon') {
      return Array.from({ length: burgerCount }, () => genBurger(ingredientCount, ingredientPool));
    }
    if (gameMode === 'escalera') {
      return Array.from({ length: burgerCount }, (_, index) => genBurger(4 + index));
    }
    const ranges = chaosLevel === 1
      ? [3, 4]
      : chaosLevel === 3
        ? [5, 6, 7]
        : [4, 5, 6];
    return ranges.map((size) => genBurger(size));
  }, [gameMode, burgerCount, ingredientCount, chaosLevel, ingredientPool]);
  const removedCloneActions = useMemo(() => {
    const poolSet = new Set(ingredientPool);
    const removed = [];
    if (!['lechuga', 'tomate', 'cebolla', 'palta'].some((ing) => poolSet.has(ing))) removed.push('ensalada');
    if (!poolSet.has('queso')) removed.push('pizza');
    if (!poolSet.has('carne') && !poolSet.has('pollo')) removed.push('parrilla');
    return removed;
  }, [ingredientPool]);
  const cloneRemovedActionImages = {
    ensalada: actionEnsaladaImg,
    pizza: actionPizzaImg,
    parrilla: actionParrillaImg,
  };
  const staircasePreviewByPlayer = useMemo(
    () => Array.from(
      { length: totalPreviewPlayers },
      () => Array.from({ length: burgerCount }, (_, index) => genBurger(4 + index)),
    ),
    [totalPreviewPlayers, burgerCount],
  );
  useEffect(() => {
    setSelectedStaircasePlayer((prev) => Math.min(prev, Math.max(totalPreviewPlayers - 1, 0)));
  }, [totalPreviewPlayers, burgerCount]);
  const markerStyle = {
    minWidth: 62,
    textAlign: 'center',
    fontSize: 11,
    color: '#8a8fa8',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    padding: '3px 8px',
    lineHeight: 1.2,
  };
  const compactBurgerWidth = 52;
  const compactLayerWidth = 44;
  const renderBurgerPreview = (burger, burgerIndex, opts = {}) => {
    const { hiddenIngredients = false, compact = false } = opts;
    const wrapperWidth = compact ? 64 : 92;
    const minHeight = compact ? 92 : 128;
    const topWidth = compact ? compactBurgerWidth : 70;
    const layerWidth = compact ? compactLayerWidth : 60;
    const badgeSize = compact ? 24 : 30;
    const badgeTop = compact ? 24 : 38;
    return (
      <div key={`preview-burger-${burgerIndex}`} style={{ position: 'relative', width: wrapperWidth, minHeight }}>
        <div style={{
          position: 'absolute',
          right: compact ? 0 : -2,
          top: badgeTop,
          minWidth: badgeSize,
          height: badgeSize,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFD700',
          color: '#1b1730',
          fontSize: compact ? 10 : 12,
          fontWeight: 900,
          boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
        }}>
          {burgerIndex + 1}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={burgerPanArriba} alt="pan" style={{ width: topWidth, height: 'auto', marginBottom: compact ? -4 : -6 }} />
          {burger.filter((ing) => ing !== 'pan').map((ing, index) => (
            hiddenIngredients ? (
              <div
                key={`${burgerIndex}-${ing}-${index}`}
                style={{
                  width: compact ? 38 : 54,
                  height: compact ? 22 : 30,
                  marginTop: compact ? -3 : -5,
                  marginBottom: compact ? -3 : -5,
                  borderRadius: 999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, #fff7c7 0%, #ffe270 100%)',
                  border: '2px solid #8a5b00',
                  color: '#5c3600',
                  fontSize: compact ? 18 : 22,
                  fontWeight: 900,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
                }}
                aria-label="ingrediente oculto"
              >
                ?
              </div>
            ) : (
              <img
                key={`${burgerIndex}-${ing}-${index}`}
                src={burgerLayerMap[ing]}
                alt={ing}
                style={{ width: layerWidth, height: 'auto', marginTop: compact ? -5 : -7, marginBottom: compact ? -5 : -7 }}
              />
            )
          ))}
          <img src={burgerPanAbajo} alt="pan" style={{ width: topWidth, height: 'auto', marginTop: compact ? -4 : -6 }} />
        </div>
      </div>
    );
  };
  const renderEscaleraPlayers = (compact = false) => {
    const safeIndex = Math.min(selectedStaircasePlayer, Math.max(staircasePreviewByPlayer.length - 1, 0));
    const selectedPlayerBurgers = staircasePreviewByPlayer[safeIndex] || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {staircasePreviewByPlayer.map((_, playerIndex) => {
            const isActive = playerIndex === safeIndex;
            return (
              <button
                key={`escalera-tab-${playerIndex}`}
                type="button"
                onClick={() => setSelectedStaircasePlayer(playerIndex)}
                style={{
                  padding: compact ? '6px 10px' : '7px 12px',
                  borderRadius: 999,
                  border: isActive ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.12)',
                  background: isActive ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#FFD700' : '#d8ddf3',
                  fontFamily: "'Fredoka',sans-serif",
                  fontSize: compact ? 11 : 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {playerWord} {playerIndex + 1}
              </button>
            );
          })}
        </div>
        <div
          style={{
            borderRadius: 12,
            padding: compact ? '8px 10px' : '10px 12px',
            background: compact ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ color: '#FFD700', fontSize: compact ? 11 : 12, fontWeight: 900, marginBottom: 6 }}>
            {playerWord} {safeIndex + 1}
          </div>
          <div style={{ display: 'flex', gap: compact ? 8 : 12, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: compact ? 'flex-start' : 'center' }}>
            {selectedPlayerBurgers.map((burger, burgerIndex) => renderBurgerPreview(burger, burgerIndex, { compact }))}
          </div>
        </div>
      </div>
    );
  };
  const renderModeSummary = () => {
    if (gameMode === 'escalera') {
      return renderEscaleraPlayers(true);
    }
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <span style={{ color: '#FFD700', fontSize: 13, fontWeight: 900 }}>{T('burgerCount')}</span>
          <span style={{ color: '#fff1b3', fontSize: 14, fontWeight: 900 }}>{modePreview.burgers}</span>
        </div>
        <div style={{ color: '#9ea4be', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          {T('ingredientsLabelShort')}: <span style={{ color: '#fff1b3', fontWeight: 900 }}>{modePreview.ingredients}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center' }}>
          {previewBurgers.map((burger, burgerIndex) => renderBurgerPreview(burger, burgerIndex, { hiddenIngredients: gameMode === 'caotico', compact: true }))}
        </div>
        {gameMode === 'clon' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
            {ingredientPool.map((ing) => (
              <span
                key={`mode-summary-pool-${ing}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <img src={ING_IMG[ing]} alt={ing} style={{ width: 20, height: 20, objectFit: 'contain' }} />
              </span>
            ))}
          </div>
        )}
      </>
    );
  };
  const renderDesktopSidebar = () => (
    <div style={floatingCardStyle}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#ffd24a', fontSize: 13, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
          {T('chooseLanguage')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          {LANGUAGES.map(lang => (
            <div
              key={`desktop-hat-${lang}`}
              onClick={() => setHat(lang)}
              style={{
                minHeight: 104,
                padding: '14px 8px 12px',
                borderRadius: 14,
                cursor: 'pointer',
                border: hat === lang ? '2px solid #FFD700' : `1px solid ${LANG_BORDER[lang]}55`,
                background: hat === lang ? 'rgba(255,215,0,.1)' : 'rgba(255,255,255,.025)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all .15s',
                boxShadow: hat === lang ? '0 0 12px rgba(255,215,0,.22)' : 'none',
              }}
            >
              <HatSVG lang={lang} size={42} />
              <span style={{ fontSize: 12, fontWeight: 800, color: hat === lang ? '#FFD700' : LANG_TEXT[lang], textAlign: 'center', lineHeight: 1.1 }}>
                {T(lang)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,215,0,0.22), rgba(255,255,255,0))', margin: '0 0 12px' }} />
      {renderModeSummary()}
    </div>
  );
  const floatingCardStyle = {
    width: isDesktopWide ? 320 : 'auto',
    borderRadius: 14,
    padding: '12px 12px 14px',
    background: 'linear-gradient(180deg, rgba(255,215,0,0.08), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,215,0,0.18)',
    boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
  };
  const modalDesktopColumns = isDesktopWide ? {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)',
    gap: 18,
    alignItems: 'start',
  } : null;
  const normalStartDisabled = !name.trim() || !hat;
  const startNormalVsAi = () => {
    onStart(name.trim(), hat, {
      mode: gameMode,
      burgerCount,
      ingredientCount,
      chaosLevel,
      ingredientPool,
      cloneWildcardsEnabled,
      aiDifficulty,
      sharedBurgers: gameMode === 'clon' ? previewBurgers : null,
    }, aiCount);
    setShowVsAiModal(false);
  };
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif",
      overflowY: 'auto', padding: '20px 0',
    }}>
      <InstallFloatingCard
        visible={installEntryVisible}
        title={installEntryTitle}
        desc={installEntryDesc}
        buttonLabel={installEntryButton}
        onInstall={onOpenInstallPrompt}
        onDownload={onDownload}
      />
      <div style={{
        display: isDesktopWide ? 'flex' : 'block',
        alignItems: 'flex-start',
        gap: isDesktopWide ? 26 : 0,
        width: 'fit-content',
        maxWidth: '96vw',
        margin: '0 auto',
      }}>
      <div style={{
        background: '#16213e', borderRadius: 20,
        padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 40px)',
        maxWidth: isDesktopWide ? 560 : 520, width: '92vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
        position: 'relative',
        overflow: 'visible',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={hamImg} alt="hamburguesa" style={{ width: 90, height: 90, objectFit: 'contain' }} />
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#FFD700', letterSpacing: 1 }}>{T('appTitle')}</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{T('tagline')}</p>
          {user && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: '#4ecdc4', fontSize: 13, fontWeight: 700 }}>
                {user.displayName} — {user.wins}W / {user.gamesPlayed}G
              </span>
              <button onClick={onHistory} style={{
                background: 'none', border: '1px solid #4ecdc4', borderRadius: 8,
                color: '#4ecdc4', fontSize: 11, padding: '3px 10px', cursor: 'pointer',
                fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
              }}>{T('history')}</button>
              <button onClick={onFriends} style={{
                background: 'none', border: '1px solid #FFD700', borderRadius: 8,
                color: '#FFD700', fontSize: 11, padding: '3px 10px', cursor: 'pointer',
                fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
              }}>{T('friends')}</button>
              <button onClick={onLogout} style={{
                background: 'none', border: '1px solid #555', borderRadius: 8,
                color: '#888', fontSize: 11, padding: '3px 10px', cursor: 'pointer',
                fontFamily: "'Fredoka',sans-serif",
              }}>{T('logout')}</button>
            </div>
          )}
        </div>

        {/* Name – only show input if not logged in */}
        {!user && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('yourName')}</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder={T('enterName')}
              maxLength={20}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #2a2a4a',
                background: '#0f1117', color: '#eee', fontFamily: "'Fredoka',sans-serif",
                fontSize: 15, outline: 'none',
              }}
            />
          </div>
        )}

        <div style={{ position: 'relative' }}>
        {/* Hat selection */}
        <div style={{ marginBottom: isDesktopWide ? 8 : 20 }}>
          {!isDesktopWide && (
            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>{T('chooseLanguage')}</label>
          )}
          {!isDesktopWide && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LANGUAGES.map(lang => (
                <div
                  key={lang}
                  onClick={() => setHat(lang)}
                  style={{
                    flex: '1 1 28%', minWidth: 80, padding: '8px 6px', borderRadius: 10, cursor: 'pointer',
                    border: hat === lang ? `2px solid #FFD700` : `2px solid ${LANG_BORDER[lang]}44`,
                    background: hat === lang ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all .15s',
                    boxShadow: hat === lang ? '0 0 12px rgba(255,215,0,.3)' : 'none',
                  }}
                >
                  <HatSVG lang={lang} size={32} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: hat === lang ? '#FFD700' : LANG_TEXT[lang] }}>
                    {T(lang)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Game Mode */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>{T('gameMode')}</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flex: '1 1 320px' }}>
              {gameModes.map(m => (
                <div
                  key={m.id}
                  onClick={() => { setGameMode(m.id); setShowModeConfig(true); }}
                  style={{
                    flex: 1, padding: '8px 6px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    border: gameMode === m.id ? '2px solid #FFD700' : '2px solid #2a2a4a',
                    background: gameMode === m.id ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
                    transition: 'all .15s',
                  }}
                >
                  <img src={m.img} alt="hamburguesa" style={{ width: 90, height: 90, objectFit: 'fill', borderRadius: '15px' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: gameMode === m.id ? '#FFD700' : '#ccc' }}>{m.label}</div>
                  <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{m.desc}</div>
                </div>
              ))}
            </div>
            {!isDesktopWide && (
              <div style={{ ...floatingCardStyle, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <img src={selectedMode.img} alt={selectedMode.label} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 10 }} />
                  <div>
                    <div style={{ color: '#FFD700', fontSize: 12, fontWeight: 900 }}>{selectedMode.label}</div>
                    <div style={{ color: '#8a8fa8', fontSize: 10, fontWeight: 700 }}>{T('perPlayerLabel')}</div>
                  </div>
                </div>
                {renderModeSummary()}
              </div>
            )}
          </div>
        </div>
        </div>

        <div style={{ marginBottom: 28 }} />

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn
            onClick={() => setShowVsAiModal(true)}
            color="#FFD700"
            style={{ flex: 1, fontSize: 16, padding: '12px 0' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <img src={vsiaImg} alt={T('vsAI')} style={{ width: 24, height: 24, objectFit: 'contain' }} />
              <span>{String(T('vsAI')).replace('🎮 ', '')}</span>
            </span>
          </Btn>
          <Btn
            onClick={onOnline}
            color="#00BCD4"
            style={{ flex: 1, fontSize: 16, padding: '12px 0' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <img src={onlineImg} alt={T('online')} style={{ width: 24, height: 24, objectFit: 'contain' }} />
              <span>{String(T('online')).replace('🌐 ', '')}</span>
            </span>
          </Btn>
        </div>
      </div>
      {isDesktopWide && (
        <div>
          {renderDesktopSidebar()}
        </div>
      )}
      </div>
      {showModeConfig && (
        <Modal
          title={`${T('gameMode')}: ${gameModes.find(m => m.id === gameMode)?.label || ''}`}
          maxWidth={isDesktopWide ? 1040 : 480}
          width={isDesktopWide ? 'min(1040px, 94vw)' : '90vw'}
        >
          <div style={modalDesktopColumns || undefined}>
            <div style={{
              marginBottom: isDesktopWide ? 0 : 16,
              borderRadius: 14,
              padding: '12px 12px 10px',
              background: 'linear-gradient(180deg, rgba(255,215,0,0.1), rgba(255,255,255,0.03))',
              border: '1px solid rgba(255,215,0,0.16)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <img src={selectedMode.img} alt={selectedMode.label} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 12 }} />
                <div>
                  <div style={{ color: '#FFD700', fontWeight: 900, fontSize: 15 }}>{selectedMode.label}</div>
                  <div style={{ color: '#9ea4be', fontSize: 11 }}>{selectedMode.desc}</div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ color: '#FFD700', fontSize: 18, fontWeight: 900, letterSpacing: 0.3 }}>
                    {T('burgerCount')}
                  </div>
                  <div style={{ color: '#9ea4be', fontSize: 15, lineHeight: 1.45, fontWeight: 700 }}>
                    {T('ingredientsLabelShort')}: <span style={{ color: '#fff1b3', fontWeight: 900, fontSize: 18 }}>{modePreview.ingredients}</span>
                  </div>
                </div>
                {gameMode === 'escalera'
                  ? renderEscaleraPlayers(false)
                  : (
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {previewBurgers.map((burger, burgerIndex) => renderBurgerPreview(burger, burgerIndex, { hiddenIngredients: gameMode === 'caotico' }))}
                    </div>
                  )}
                {gameMode === 'clon' && !isDesktopWide && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {ingredientPool.map((ing) => (
                      <span
                        key={`pool-preview-${ing}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 10px',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <img src={ING_IMG[ing]} alt={ing} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                        <span style={{ color: '#d8ddf3', fontSize: 11, fontWeight: 700 }}>{getIngName(ing, uiGameLang)}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ color: '#9ea4be', fontSize: 15, lineHeight: 1.45, fontWeight: 700, textAlign: 'center' }}>
                  {T('perPlayerLabel')}
                </div>
              </div>
            </div>
            <div>
          {gameMode !== 'caotico' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                {T('burgerCount')}: <span style={{ color: '#FFD700' }}>{burgerCount}</span>
              </label>
              <input
                type="range" min={1} max={4} value={burgerCount}
                onChange={e => setBurgerCount(+e.target.value)}
                style={{ width: '100%', accentColor: '#FFD700' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                <span style={markerStyle}>1</span>
                <span style={markerStyle}>4</span>
              </div>
            </div>
          )}
          {gameMode === 'caotico' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                {T('modeCaotico')}: <span style={{ color: '#FFD700' }}>{chaosLevel}/3</span>
              </label>
              <input
                type="range" min={1} max={3} step={1} value={chaosLevel}
                onChange={e => setChaosLevel(+e.target.value)}
                style={{ width: '100%', accentColor: '#FF7043' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                <span style={markerStyle}>Menos caótico</span>
                <span style={markerStyle}>Más caótico</span>
              </div>
            </div>
          )}
          {gameMode === 'clon' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                {T('ingredientCount')}: <span style={{ color: '#FFD700' }}>{ingredientCount}</span>
              </label>
              <input
                type="range" min={2} max={8} value={ingredientCount}
                onChange={e => setIngredientCount(+e.target.value)}
                style={{ width: '100%', accentColor: '#FFD700' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                <span style={markerStyle}>2</span>
                <span style={markerStyle}>8</span>
              </div>
            </div>
          )}
          {gameMode === 'clon' && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                {T('cloneIngredientPool')}
              </label>
              <div style={{ color: '#8a8fa8', fontSize: 11, lineHeight: 1.35, marginBottom: 10 }}>
                {T('cloneIngredientPoolHint')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {cloneIngredients.map((ing) => {
                  const active = ingredientPool.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => {
                        if (active && ingredientPool.length === 1) return;
                        setIngredientPool((prev) => active ? prev.filter((item) => item !== ing) : [...prev, ing]);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 10px',
                        borderRadius: 999,
                        border: active ? `2px solid ${ING_BG[ing]}` : '1px solid rgba(255,255,255,0.12)',
                        background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                        color: active ? '#fff' : '#8a8fa8',
                        fontFamily: "'Fredoka',sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <img src={ING_IMG[ing]} alt={ing} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                      <span>{getIngName(ing, uiGameLang)}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ color: '#6f7697', fontSize: 11 }}>{T('cloneIngredientPoolLocked')}</div>
              <div style={{ marginTop: 10, marginBottom: 10 }}>
                <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  {T('cloneWildcardsToggle')}
                </label>
                <button
                  type="button"
                  onClick={() => setCloneWildcardsEnabled((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: cloneWildcardsEnabled ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.12)',
                    background: cloneWildcardsEnabled ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                    color: cloneWildcardsEnabled ? '#FFD700' : '#8a8fa8',
                    fontFamily: "'Fredoka',sans-serif",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <img src={ING_IMG.perrito} alt={T('cloneWildcardsToggle')} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  <span>{cloneWildcardsEnabled ? T('cloneWildcardsOn') : T('cloneWildcardsOff')}</span>
                </button>
              </div>
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#FFD700', fontSize: 11, fontWeight: 900, marginBottom: 6 }}>
                  {T('cloneRemovedActions')}
                </div>
                {removedCloneActions.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {removedCloneActions.map((actionId) => (
                      <span
                        key={actionId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px 6px 6px',
                          borderRadius: 999,
                          background: 'rgba(255,112,67,0.12)',
                          border: '1px solid rgba(255,112,67,0.28)',
                          color: '#ffb199',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        <img
                          src={cloneRemovedActionImages[actionId]}
                          alt={T(`actionName_${actionId}`)}
                          style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: 999, flexShrink: 0 }}
                        />
                        {T(`actionName_${actionId}`)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#8a8fa8', fontSize: 11 }}>{T('cloneRemovedActionsNone')}</div>
                )}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
              {T('aiOpponents')}: <span style={{ color: '#FFD700' }}>{aiCount}</span>
            </label>
            <input
              type="range" min={1} max={3} value={aiCount}
              onChange={e => setAiCount(+e.target.value)}
              style={{ width: '100%', accentColor: '#FFD700' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
              <span style={markerStyle}>{T('opponent1')}</span>
              <span style={markerStyle}>{T('opponents3')}</span>
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
              {T('aiDifficulty')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {aiDifficultyOptions.map((option) => {
                const active = aiDifficulty === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAiDifficulty(option.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: active ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.12)',
                      background: active ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)',
                      color: active ? '#FFD700' : '#d8ddf3',
                      fontFamily: "'Fredoka',sans-serif",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
            </div>
          </div>
          <Btn onClick={() => setShowModeConfig(false)} color="#333" style={{ color: '#aaa' }}>{T('close')}</Btn>
        </Modal>
      )}
      {showVsAiModal && (
        <Modal title={T('vsAIModePickerTitle')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ color: '#d8ddf3', fontSize: 14, lineHeight: 1.45 }}>
              {T('vsAIModePickerDesc')}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <button
                type="button"
                onClick={startNormalVsAi}
                disabled={normalStartDisabled}
                style={{
                  width: '100%',
                  borderRadius: 16,
                  padding: '14px 16px',
                  border: normalStartDisabled ? '1px solid rgba(255,255,255,0.08)' : '2px solid rgba(255,215,0,0.35)',
                  background: normalStartDisabled ? 'rgba(255,255,255,0.04)' : 'linear-gradient(180deg, rgba(255,215,0,0.14), rgba(255,255,255,0.04))',
                  color: normalStartDisabled ? '#7f859f' : '#fff4b3',
                  textAlign: 'left',
                  cursor: normalStartDisabled ? 'not-allowed' : 'pointer',
                  fontFamily: "'Fredoka',sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <img src={vsiaImg} alt={T('normalMatch')} style={{ width: 38, height: 38, objectFit: 'contain', opacity: normalStartDisabled ? 0.55 : 1 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 900 }}>{T('normalMatch')}</span>
                  <span style={{ fontSize: 12, color: normalStartDisabled ? '#7f859f' : '#c8cde4' }}>
                    {normalStartDisabled ? normalModeHint : T('vsAIModePickerNormalDesc')}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVsAiModal(false);
                  if (onStartTutorial) onStartTutorial();
                }}
                style={{
                  width: '100%',
                  borderRadius: 16,
                  padding: '14px 16px',
                  border: '2px solid rgba(78,205,196,0.3)',
                  background: 'linear-gradient(180deg, rgba(78,205,196,0.16), rgba(255,255,255,0.04))',
                  color: '#d7fffb',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: "'Fredoka',sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <img src={vsiaImg} alt={T('tutorialMatch')} style={{ width: 38, height: 38, objectFit: 'contain' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 900 }}>{T('tutorialMatch')}</span>
                  <span style={{ fontSize: 12, color: '#b9dad8' }}>{T('vsAIModePickerTutorialDesc')}</span>
                </div>
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn onClick={() => setShowVsAiModal(false)} color="#2a2a4a" style={{ color: '#fff' }}>
                {T('close')}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

