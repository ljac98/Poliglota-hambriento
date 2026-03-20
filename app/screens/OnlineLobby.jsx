import React, { useEffect, useMemo, useRef, useState } from 'react';
import socket from '../../src/socket.js';
import { LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT } from '../../constants/index.js';
import { getFriends, sendFriendRequest } from '../../src/api.js';
import { HatBadge, PercheroSVG } from '../../components/HatComponents.jsx';
import HatSVG from '../../components/HatSVG.jsx';
import { Btn } from '../components/Btn.jsx';
import { Modal } from '../components/Modal.jsx';
import percheroImg from '../../imagenes/sombreros/perchero/percherofinal.png';

export function OnlineLobby({ roomCode, myName, isHost, players, onStart, onBack, isPublic, roomDisplayName, T, user }) {
  const [gameMode, setGameMode] = useState('clon');
  const [burgerCount, setBurgerCount] = useState(2);
  const [ingredientCount, setIngredientCount] = useState(5);
  const [showModeConfig, setShowModeConfig] = useState(false);
  const [hatPicks, setHatPicks] = useState({});
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteFriends, setInviteFriends] = useState([]);
  const [inviteSentTo, setInviteSentTo] = useState(new Set());
  const [friendReqSent, setFriendReqSent] = useState(new Set());
  const [existingFriends, setExistingFriends] = useState(new Set());
  const [lobbyChat, setLobbyChat] = useState([]);
  const [lobbyChatInput, setLobbyChatInput] = useState('');
  const [showLobbyChat, setShowLobbyChat] = useState(false);
  const lobbyChatEndRef = useRef(null);

  // Load existing friends on mount to hide "Add" button for them
  useEffect(() => {
    if (!user) return;
    getFriends().then(friends => {
      setExistingFriends(new Set(friends.map(f => f.username)));
    }).catch(() => {});
  }, [user]);

  // Lobby chat listener
  useEffect(() => {
    const handleChat = (msg) => setLobbyChat(prev => [...prev, msg]);
    socket.on('chatMessage', handleChat);
    return () => socket.off('chatMessage', handleChat);
  }, []);

  useEffect(() => {
    if (showLobbyChat && lobbyChatEndRef.current) {
      lobbyChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lobbyChat, showLobbyChat]);

  function sendLobbyChat() {
    if (!lobbyChatInput.trim()) return;
    socket.emit('chatMessage', { code: roomCode, playerName: myName, text: lobbyChatInput.trim() });
    setLobbyChatInput('');
  }

  function handleCopyLink() {
    const link = window.location.origin + '/?sala=' + roomCode;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function toggleInvitePanel() {
    if (showInvite) { setShowInvite(false); return; }
    setShowInvite(true);
    try {
      const friends = await getFriends();
      setInviteFriends(friends.filter(f => f.online));
    } catch { setInviteFriends([]); }
  }

  function handleInvite(friendId) {
    socket.emit('roomInvite', { friendUserId: friendId });
    setInviteSentTo(prev => new Set([...prev, friendId]));
  }

  async function handleAddFriendFromLobby(username) {
    setFriendReqSent(prev => new Set([...prev, username]));
    try { await sendFriendRequest(username); } catch {}
  }

  const myHat = hatPicks[myName];

  // Listen for other players' hat picks
  useEffect(() => {
    const handleHatPick = ({ playerName, hat }) => {
      setHatPicks(prev => ({ ...prev, [playerName]: hat }));
    };
    socket.on('lobbyHatPick', handleHatPick);
    return () => socket.off('lobbyHatPick', handleHatPick);
  }, []);

  const gameModes = [
    { id: 'clon', label: T('modeClon'), desc: T('modeClonDesc'),img:modoclon },
    { id: 'escalera', label: T('modeEscalera'), desc: T('modeEscaleraDesc'),img:modoescalera },
    { id: 'caotico', label: T('modeCaotico'), desc: T('modeCaoticoDesc'),img:modocaotico },
  ];
  const markerStyle = {
    minWidth: 54,
    textAlign: 'center',
    fontSize: 10,
    color: '#8a8fa8',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    padding: '2px 7px',
    lineHeight: 1.2,
  };

  function pickHat(lang) {
    const taken = Object.values(hatPicks);
    if (taken.includes(lang) && hatPicks[myName] !== lang) return;
    setHatPicks(prev => ({ ...prev, [myName]: lang }));
    socket.emit('lobbyHatPick', { code: roomCode, playerName: myName, hat: lang });
  }

  function handleStart() {
    if (!myHat) return;
    const gameConfig = { mode: gameMode, burgerCount, ingredientCount };
    socket.emit('startGame', { code: roomCode, hatPicks, gameConfig });
    onStart(hatPicks, gameConfig);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif",
      overflowY: 'auto', padding: '20px 0',
    }}>
      <div style={{
        background: '#16213e', borderRadius: 20,
        padding: 'clamp(18px, 4vw, 32px) clamp(14px, 4vw, 36px)',
        maxWidth: 560, width: '94vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
      }}>
        {/* Room info display */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {isPublic ? (
            <>
              <div style={{ fontSize: 13, color: '#888', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{T('publicRoom')}</div>
              <div style={{
                fontSize: 24, fontWeight: 900, color: '#FFD700',
                background: 'rgba(255,215,0,.08)', borderRadius: 12, padding: '10px 20px',
                border: '2px dashed rgba(255,215,0,.3)',
              }}>
                {roomDisplayName}
              </div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>{T('codeLabel')}: {roomCode}</div>
              <button
                onClick={handleCopyLink}
                style={{
                  marginTop: 10, padding: '7px 18px', borderRadius: 10,
                  border: '1px solid rgba(255,215,0,.35)',
                  background: copied ? 'rgba(76,175,80,.18)' : 'rgba(255,215,0,.08)',
                  color: copied ? '#81C784' : '#FFD700',
                  fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', transition: 'all .2s',
                }}
              >
                {copied ? T('linkCopied') : T('inviteLink')}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#888', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{T('privateRoom')}</div>
              <div style={{
                fontSize: 36, fontWeight: 900, color: '#FFD700', letterSpacing: 8,
                background: 'rgba(255,215,0,.08)', borderRadius: 12, padding: '10px 20px',
                border: '2px dashed rgba(255,215,0,.3)',
              }}>
                {roomCode}
              </div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>{T('shareCode')}</div>
              <button
                onClick={handleCopyLink}
                style={{
                  marginTop: 10, padding: '7px 18px', borderRadius: 10,
                  border: '1px solid rgba(255,215,0,.35)',
                  background: copied ? 'rgba(76,175,80,.18)' : 'rgba(255,215,0,.08)',
                  color: copied ? '#81C784' : '#FFD700',
                  fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', transition: 'all .2s',
                }}
              >
                {copied ? T('linkCopied') : T('inviteLink')}
              </button>
            </>
          )}
          {/* Invite Friend Button */}
          {user && players.length < 4 && (
            <div style={{ marginTop: 12, position: 'relative' }}>
              <button onClick={toggleInvitePanel} style={{
                padding: '7px 18px', borderRadius: 10,
                border: '1px solid rgba(78,205,196,.35)',
                background: showInvite ? 'rgba(78,205,196,.18)' : 'rgba(78,205,196,.08)',
                color: '#4ecdc4', fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
                fontSize: 13, cursor: 'pointer', transition: 'all .2s',
              }}>
                {T('inviteFriend')}
              </button>
              {showInvite && (
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  marginTop: 8, background: '#1a2744', borderRadius: 12,
                  border: '1px solid #2a2a4a', padding: 12, minWidth: 220,
                  boxShadow: '0 8px 24px rgba(0,0,0,.5)', zIndex: 10,
                }}>
                  {inviteFriends.length === 0 ? (
                    <p style={{ color: '#666', fontSize: 12, textAlign: 'center', margin: 0 }}>{T('noFriends')}</p>
                  ) : inviteFriends.map(f => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 8px', borderRadius: 8, marginBottom: 4,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50' }} />
                        <span style={{ color: '#eee', fontSize: 13, fontWeight: 700 }}>{f.displayName}</span>
                      </div>
                      <button
                        onClick={() => handleInvite(f.id)}
                        disabled={inviteSentTo.has(f.id)}
                        style={{
                          padding: '3px 10px', borderRadius: 6, border: 'none',
                          background: inviteSentTo.has(f.id) ? 'rgba(76,175,80,.15)' : 'rgba(78,205,196,.15)',
                          color: inviteSentTo.has(f.id) ? '#81C784' : '#4ecdc4',
                          fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11,
                          cursor: inviteSentTo.has(f.id) ? 'default' : 'pointer',
                        }}
                      >
                        {inviteSentTo.has(f.id) ? T('inviteSent') : T('inviteToRoom')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Players */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 10 }}>
            {typeof T('playersCount') === 'function' ? T('playersCount')(players.length) : `PLAYERS (${players.length}/4)`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 10, background: 'rgba(255,255,255,.04)',
                border: `2px solid ${PLAYER_COLORS[i % PLAYER_COLORS.length]}44`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: PLAYER_COLORS[i % PLAYER_COLORS.length] + '33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900, color: PLAYER_COLORS[i % PLAYER_COLORS.length],
                }}>
                  {i + 1}
                </div>
                <span style={{ fontWeight: 700, color: '#eee' }}>{p.name}</span>
                {p.name === myName && <span style={{ fontSize: 11, color: '#888' }}>{T('you')}</span>}
                {i === 0 && <span style={{ fontSize: 11, color: '#FFD700', marginLeft: 'auto' }}>{T('host')}</span>}
                {hatPicks[p.name] && (
                  <HatSVG lang={hatPicks[p.name]} size={24} />
                )}
                {user && p.username && p.name !== myName && !existingFriends.has(p.username) && (
                  <button
                    onClick={() => handleAddFriendFromLobby(p.username)}
                    disabled={friendReqSent.has(p.username)}
                    style={{
                      marginLeft: i === 0 ? 0 : 'auto', padding: '3px 10px', borderRadius: 8,
                      border: 'none', fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
                      fontSize: 11, cursor: friendReqSent.has(p.username) ? 'default' : 'pointer',
                      background: friendReqSent.has(p.username) ? 'rgba(76,175,80,.15)' : 'rgba(78,205,196,.15)',
                      color: friendReqSent.has(p.username) ? '#81C784' : '#4ecdc4',
                      transition: 'all .2s',
                    }}
                  >
                    {friendReqSent.has(p.username) ? '✓' : T('addFriendShort')}
                  </button>
                )}
              </div>
            ))}
            {players.length < 2 && (
              <div style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: 8 }}>
                {T('waitingPlayers')}
              </div>
            )}
          </div>
        </div>

        {/* Hat selection for current player */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
            {T('yourLanguage')} {myHat ? '✅' : T('chooseOne')}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {LANGUAGES.map(lang => {
              const takenBy = Object.entries(hatPicks).find(([n, h]) => h === lang && n !== myName);
              const isTaken = !!takenBy;
              return (
                <div
                  key={lang}
                  onClick={() => !isTaken && pickHat(lang)}
                  style={{
                    flex: '1 1 28%', minWidth: 75, padding: '6px 4px', borderRadius: 8, cursor: isTaken ? 'not-allowed' : 'pointer',
                    border: myHat === lang ? '2px solid #FFD700' : `2px solid ${LANG_BORDER[lang]}44`,
                    background: myHat === lang ? 'rgba(255,215,0,.1)' : isTaken ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.02)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    opacity: isTaken ? 0.4 : 1, transition: 'all .15s',
                  }}
                >
                  <HatSVG lang={lang} size={28} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: myHat === lang ? '#FFD700' : LANG_TEXT[lang] }}>
                    {T(lang)}
                  </span>
                  {isTaken && <span style={{ fontSize: 9, color: '#888' }}>{takenBy[0]}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Mode (host only) */}
        {isHost && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>{T('gameMode')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {gameModes.map(m => (
                <div
                  key={m.id}
                  onClick={() => { setGameMode(m.id); setShowModeConfig(true); }}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                    border: gameMode === m.id ? '2px solid #FFD700' : '2px solid #2a2a4a',
                    background: gameMode === m.id ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
                    transition: 'all .15s',
                  }}
                >
                                            <img src={m.img} alt="hamburguesa" style={{ width: 90, height: 90, objectFit: 'fill',borderRadius:'15px'}} />

                  <div style={{ fontSize: 12, fontWeight: 700, color: gameMode === m.id ? '#FFD700' : '#ccc' }}>{m.label}</div>
                  <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isHost ? (
          <Btn
            onClick={handleStart}
            disabled={players.length < 2 || !myHat || Object.keys(hatPicks).length < players.length}
            color="#4CAF50"
            style={{ width: '100%', fontSize: 15, padding: '12px 0' }}
          >
            {Object.keys(hatPicks).length < players.length
              ? (typeof T('waitingHats') === 'function' ? T('waitingHats')(Object.keys(hatPicks).length, players.length) : T('waitingHats'))
              : T('startGame')}
          </Btn>
        ) : (
          <div style={{ textAlign: 'center', padding: 12, color: '#888', fontSize: 13 }}>
            {!myHat ? T('chooseHat') : T('waitingHost')}
          </div>
        )}

        {/* Lobby Chat */}
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setShowLobbyChat(s => !s)} style={{
            background: 'none', border: '1px solid #2a2a4a', borderRadius: 10,
            color: showLobbyChat ? '#FFD700' : '#888', fontFamily: "'Fredoka',sans-serif",
            fontWeight: 700, fontSize: 12, padding: '6px 16px', cursor: 'pointer',
            width: '100%', transition: 'all .2s',
          }}>
            {T('chat')} {!showLobbyChat && lobbyChat.length > 0 ? `(${lobbyChat.length})` : ''}
          </button>
          {showLobbyChat && (
            <div style={{
              marginTop: 8, background: 'rgba(0,0,0,.2)', borderRadius: 12,
              border: '1px solid #2a2a4a', overflow: 'hidden',
            }}>
              <div style={{
                maxHeight: 160, overflowY: 'auto', padding: '8px 12px',
              }}>
                {lobbyChat.length === 0 && (
                  <p style={{ color: '#555', fontSize: 12, textAlign: 'center', margin: '8px 0' }}>{T('noMessages')}</p>
                )}
                {lobbyChat.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <span style={{ color: '#4ecdc4', fontSize: 12, fontWeight: 700 }}>{msg.playerName}: </span>
                    <span style={{ color: '#ccc', fontSize: 12 }}>{msg.text}</span>
                  </div>
                ))}
                <div ref={lobbyChatEndRef} />
              </div>
              <div style={{ display: 'flex', borderTop: '1px solid #2a2a4a' }}>
                <input
                  value={lobbyChatInput}
                  onChange={e => setLobbyChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendLobbyChat()}
                  placeholder={T('typeMessage')}
                  maxLength={200}
                  style={{
                    flex: 1, padding: '8px 12px', border: 'none', background: 'transparent',
                    color: '#eee', fontSize: 13, fontFamily: "'Fredoka',sans-serif", outline: 'none',
                  }}
                />
                <button onClick={sendLobbyChat} style={{
                  padding: '8px 14px', border: 'none', background: 'rgba(255,215,0,.1)',
                  color: '#FFD700', fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
                  fontSize: 12, cursor: 'pointer',
                }}>
                  {T('send')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: '#555', cursor: 'pointer',
            fontFamily: "'Fredoka',sans-serif", fontSize: 12,
          }}>
            {T('leaveRoom')}
          </button>
        </div>
      </div>
      {isHost && showModeConfig && (
        <Modal title={`${T('gameMode')}: ${gameModes.find(m => m.id === gameMode)?.label || ''}`}>
          {gameMode !== 'caotico' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
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
          {gameMode === 'clon' && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
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
          <Btn onClick={() => setShowModeConfig(false)} color="#333" style={{ color: '#aaa' }}>{T('close')}</Btn>
        </Modal>
      )}
    </div>
  );
}

