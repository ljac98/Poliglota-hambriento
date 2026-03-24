import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getProfile, getHistory, getProfileFriends, removeFriend, saveUserLocally, sendFriendRequest, updateProfileAvatar, uploadProfileAvatar } from '../../src/api.js';
import { getUILang } from '../../src/translations.js';
import { Btn } from '../components/Btn.jsx';
import { Modal } from '../components/Modal.jsx';
import { UserAvatar } from '../components/UserAvatar.jsx';

const COPY = {
  es: {
    title: 'Perfil',
    stats: 'Resumen',
    wins: 'Victorias',
    losses: 'Derrotas',
    games: 'Partidas',
    friends: 'Amigos',
    mutual: 'Amigos en común',
    memberSince: 'Miembro desde',
    recentGames: 'Partidas recientes',
    noGames: 'Todavía no hay partidas registradas',
    sendRequest: 'Enviar solicitud de amistad',
    requestSent: 'Solicitud enviada',
    alreadyFriends: 'Amigos',
    incomingRequest: 'Te envió solicitud',
    seeFriends: 'Ver en amigos',
    selfProfile: 'Este eres tú',
    signInToAdd: 'Inicia sesión para enviar solicitud',
    since: 'Desde hace',
    mutualNone: 'No tienen amigos en común',
    changePhoto: 'Cambiar foto',
    removePhoto: 'Quitar foto',
    photoHint: 'Puedes subir una imagen cuadrada o rectangular.',
    friendsList: 'Lista de amigos',
    openFriendsList: 'Ver amigos',
    removeFriend: 'Dejar de ser amigos',
    removingFriend: 'Quitando amistad...',
    removeFriendConfirm: '¿Seguro que quieres dejar de ser amigos?',
    removedFriend: 'Ya no son amigos',
  },
  en: {
    title: 'Profile',
    stats: 'Summary',
    wins: 'Wins',
    losses: 'Losses',
    games: 'Games',
    friends: 'Friends',
    mutual: 'Mutual friends',
    memberSince: 'Member since',
    recentGames: 'Recent games',
    noGames: 'No games registered yet',
    sendRequest: 'Send friend request',
    requestSent: 'Request sent',
    alreadyFriends: 'Friends',
    incomingRequest: 'Sent you a request',
    seeFriends: 'Open friends',
    selfProfile: 'This is you',
    signInToAdd: 'Log in to send a request',
    since: 'Since',
    mutualNone: 'No mutual friends yet',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    photoHint: 'You can upload a square or rectangular image.',
    friendsList: 'Friends list',
    openFriendsList: 'View friends',
    removeFriend: 'Remove friend',
    removingFriend: 'Removing friend...',
    removeFriendConfirm: 'Are you sure you want to remove this friend?',
    removedFriend: 'You are no longer friends',
  },
};

function getCopy() {
  const lang = getUILang();
  return COPY[lang] || COPY.es;
}

function formatSince(dateValue, locale = 'es') {
  if (!dateValue) return '';
  const target = new Date(dateValue);
  const now = new Date();
  const diffMs = Math.max(0, now - target);
  const day = 1000 * 60 * 60 * 24;
  const days = Math.floor(diffMs / day);
  const isEs = locale === 'es';
  if (days < 1) return isEs ? 'hoy' : 'today';
  if (days < 30) return isEs ? `${days} día${days === 1 ? '' : 's'}` : `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return isEs ? `${months} mes${months === 1 ? '' : 'es'}` : `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  return isEs ? `${years} año${years === 1 ? '' : 's'}` : `${years} year${years === 1 ? '' : 's'}`;
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  try {
    return new Date(dateValue).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

export function ProfileScreen({ profileUserId, user, onUserUpdate, onOpenProfile, onBack, onOpenFriends, onOpenHistory, T }) {
  const uiKey = getUILang();
  const text = getCopy();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [removingFriend, setRemovingFriend] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [profileFriends, setProfileFriends] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  async function loadProfileData(targetUserId, { keepStatus = false } = {}) {
    setLoading(true);
    if (!keepStatus) setStatusMessage('');
    try {
      const [profileData, historyData] = await Promise.all([getProfile(targetUserId), getHistory(targetUserId)]);
      setProfile(profileData);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setStatusMessage(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setStatusMessage('');
      try {
        const [profileData, historyData] = await Promise.all([getProfile(profileUserId), getHistory(profileUserId)]);
        if (cancelled) return;
        setProfile(profileData);
        setHistory(Array.isArray(historyData) ? historyData : []);
      } catch (err) {
        if (cancelled) return;
        setStatusMessage(err.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileUserId]);

  const historyItems = useMemo(() => history.slice(0, 10), [history]);

  const isOwnProfile = !!profile && !!user && profile.id === user.id;

  function resizeImageToBlob(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxSide = 320;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('No se pudo procesar la imagen'));
            resolve(blob);
          }, 'image/jpeg', 0.86);
        };
        img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.readAsDataURL(file);
    });
  }

  async function handleSendRequest() {
    if (!profile?.username) return;
    setSending(true);
    setStatusMessage('');
    try {
      await sendFriendRequest(profile.username);
      setProfile((prev) => prev ? { ...prev, relationship: 'outgoing_request' } : prev);
      setStatusMessage(text.requestSent);
    } catch (err) {
      setStatusMessage(err.message || 'Error');
    } finally {
      setSending(false);
    }
  }

  async function handleRemoveFriend() {
    if (!profile?.id || !window.confirm(text.removeFriendConfirm)) return;
    setRemovingFriend(true);
    setStatusMessage('');
    try {
      await removeFriend(profile.id);
      await loadProfileData(profile.id, { keepStatus: true });
      setStatusMessage(text.removedFriend);
    } catch (err) {
      setStatusMessage(err.message || 'Error');
    } finally {
      setRemovingFriend(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSavingAvatar(true);
    setStatusMessage('');
    try {
      const avatarBlob = await resizeImageToBlob(file);
      const uploadFile = new File([avatarBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const updatedUser = await uploadProfileAvatar(uploadFile);
      setProfile((prev) => prev ? { ...prev, avatarUrl: updatedUser.avatarUrl } : prev);
      if (user && updatedUser) {
        const nextUser = { ...user, avatarUrl: updatedUser.avatarUrl };
        saveUserLocally(nextUser);
        onUserUpdate?.(nextUser);
      }
      setStatusMessage(text.changePhoto);
    } catch (err) {
      setStatusMessage(err.message || 'Error');
    } finally {
      setSavingAvatar(false);
      if (event.target) event.target.value = '';
    }
  }

  async function handleRemoveAvatar() {
    setSavingAvatar(true);
    setStatusMessage('');
    try {
      const updatedUser = await updateProfileAvatar(null);
      setProfile((prev) => prev ? { ...prev, avatarUrl: null } : prev);
      if (user && updatedUser) {
        const nextUser = { ...user, avatarUrl: null };
        saveUserLocally(nextUser);
        onUserUpdate?.(nextUser);
      }
    } catch (err) {
      setStatusMessage(err.message || 'Error');
    } finally {
      setSavingAvatar(false);
    }
  }

  async function openFriendsModal() {
    if (!profile) return;
    setShowFriendsModal(true);
    setFriendsLoading(true);
    try {
      const items = await getProfileFriends(profile.id);
      setProfileFriends(Array.isArray(items) ? items : []);
    } catch (err) {
      setStatusMessage(err.message || 'Error');
    } finally {
      setFriendsLoading(false);
    }
  }

  function renderFriendAction() {
    if (!profile) return null;
    if (profile.relationship === 'self') {
      return (
        <div style={{ color: '#9ee6d8', fontWeight: 800, fontSize: 14 }}>
          {text.selfProfile}
        </div>
      );
    }
    if (!user) {
      return <div style={{ color: '#8a8fa8', fontSize: 13, fontWeight: 700 }}>{text.signInToAdd}</div>;
    }
    if (profile.relationship === 'friends') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ color: '#7ef0a2', fontSize: 16, fontWeight: 900 }}>{text.alreadyFriends}</div>
          {profile.friendSince && (
            <div style={{ color: '#d6d9e8', fontSize: 13, fontWeight: 700 }}>
              {text.since} {formatSince(profile.friendSince, uiKey)}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <Btn onClick={handleRemoveFriend} color="#ff8a80" disabled={removingFriend} style={{ color: '#201313', fontSize: 13 }}>
              {removingFriend ? text.removingFriend : text.removeFriend}
            </Btn>
          </div>
        </div>
      );
    }
    if (profile.relationship === 'incoming_request') {
      return (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ color: '#FFD700', fontSize: 14, fontWeight: 800 }}>{text.incomingRequest}</div>
          <Btn onClick={onOpenFriends} color="#4ecdc4" style={{ fontSize: 13 }}>{text.seeFriends}</Btn>
        </div>
      );
    }
    if (profile.relationship === 'outgoing_request') {
      return <div style={{ color: '#FFD700', fontSize: 14, fontWeight: 800 }}>{text.requestSent}</div>;
    }
    return (
      <Btn onClick={handleSendRequest} color="#FFD700" disabled={sending} style={{ color: '#101522', fontSize: 14 }}>
        {sending ? '...' : text.sendRequest}
      </Btn>
    );
  }

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
        maxWidth: 860,
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

        <div style={{ color: '#FFD700', fontSize: 26, fontWeight: 900, marginBottom: 20 }}>{text.title}</div>

        {loading ? (
          <div style={{ color: '#a6abc2', textAlign: 'center', padding: '40px 0', fontSize: 15 }}>{T('loading')}</div>
        ) : !profile ? (
          <div style={{ color: '#ff908c', textAlign: 'center', padding: '40px 0', fontSize: 15 }}>{statusMessage || 'Error'}</div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 18,
              alignItems: 'stretch',
            }}>
              <div style={{
                borderRadius: 22,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: 20,
              }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
                  <UserAvatar name={profile.displayName} username={profile.username} avatarUrl={profile.avatarUrl} size={86} />
                  <div>
                    <div style={{ color: '#fff3bf', fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{profile.displayName}</div>
                    <div style={{ color: '#9aa0ba', fontSize: 15, fontWeight: 700, marginTop: 4 }}>@{profile.username}</div>
                    <div style={{ color: '#6fc8ff', fontSize: 13, fontWeight: 700, marginTop: 8 }}>
                      {text.memberSince}: {formatDate(profile.createdAt)}
                    </div>
                  </div>
                </div>

                {isOwnProfile && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarChange}
                    />
                    <Btn onClick={() => fileInputRef.current?.click()} color="#7ad8ff" disabled={savingAvatar} style={{ color: '#102033', fontSize: 13 }}>
                      {savingAvatar ? '...' : text.changePhoto}
                    </Btn>
                    {profile.avatarUrl && (
                      <Btn onClick={handleRemoveAvatar} color="#ff8a80" disabled={savingAvatar} style={{ color: '#201313', fontSize: 13 }}>
                        {text.removePhoto}
                      </Btn>
                    )}
                    <div style={{ width: '100%', color: '#8a8fa8', fontSize: 12, fontWeight: 700 }}>{text.photoHint}</div>
                  </div>
                )}

                <div style={{ marginBottom: 18 }}>{renderFriendAction()}</div>
                {!!statusMessage && <div style={{ color: '#8ae1d8', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{statusMessage}</div>}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                }}>
                  {[
                    { label: text.wins, value: profile.wins, clickable: isOwnProfile, onClick: () => onOpenHistory?.('wins') },
                    { label: text.losses, value: profile.losses, clickable: isOwnProfile, onClick: () => onOpenHistory?.('losses') },
                    { label: text.games, value: profile.gamesPlayed, clickable: isOwnProfile, onClick: () => onOpenHistory?.('all') },
                    { label: text.friends, value: profile.friendsCount, clickable: true },
                    ...(!isOwnProfile ? [{ label: text.mutual, value: profile.mutualFriendsCount }] : []),
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.clickable ? (item.onClick || openFriendsModal) : undefined}
                      style={{
                        borderRadius: 16,
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        textAlign: 'left',
                        cursor: item.clickable ? 'pointer' : 'default',
                        boxShadow: item.clickable ? '0 0 0 1px rgba(255,215,0,0.08) inset' : 'none',
                        fontFamily: "'Fredoka',sans-serif",
                        outline: 'none',
                      }}
                    >
                      <div style={{ color: '#8a8fa8', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>{item.label}</div>
                      <div style={{ color: '#FFD700', fontSize: 24, fontWeight: 900, marginTop: 4 }}>{item.value}</div>
                      {item.clickable && (
                        <div style={{ color: '#7ad8ff', fontSize: 11, fontWeight: 800, marginTop: 4 }}>
                          {item.onClick ? T('history') : text.openFriendsList}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {!isOwnProfile && (
                <div style={{
                  borderRadius: 22,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: 20,
                }}>
                  <div style={{ color: '#fff3bf', fontSize: 18, fontWeight: 900, marginBottom: 12 }}>{text.mutual}</div>
                  {profile.mutualFriendsCount > 0 ? (
                    <>
                      <div style={{ color: '#9ee6d8', fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
                        {profile.mutualFriendsCount} {text.mutual.toLowerCase()}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {profile.mutualFriends.map((name) => (
                          <span
                            key={name}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderRadius: 999,
                              background: 'rgba(78,205,196,0.12)',
                              border: '1px solid rgba(78,205,196,0.24)',
                              color: '#9ee6d8',
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#8a8fa8', fontSize: 13, fontWeight: 700 }}>{text.mutualNone}</div>
                  )}
                </div>
              )}
            </div>

            <div style={{
              marginTop: 18,
              borderRadius: 22,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 20,
            }}>
              <div style={{ color: '#fff3bf', fontSize: 18, fontWeight: 900, marginBottom: 12 }}>{text.recentGames}</div>
              {historyItems.length === 0 ? (
                <div style={{ color: '#8a8fa8', fontSize: 13, fontWeight: 700 }}>{text.noGames}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {historyItems.map((entry) => {
                    const didWin = entry.winnerId === profile.id;
                    return (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 12,
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderRadius: 14,
                          background: 'rgba(255,255,255,0.035)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div>
                          <div style={{ color: didWin ? '#7ef0a2' : '#ffb0a9', fontSize: 14, fontWeight: 900 }}>
                            {didWin ? T('victory') : T('defeatBy')(entry.winnerName)}
                          </div>
                          <div style={{ color: '#8a8fa8', fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                            {formatDate(entry.finishedAt)} • {entry.playerCount} {T('players')}
                          </div>
                        </div>
                        <div style={{ color: '#d9dded', fontSize: 12, fontWeight: 800 }}>
                          {entry.roomCode || 'LOCAL'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {showFriendsModal && (
        <Modal title={text.friendsList} maxWidth={560}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {friendsLoading ? (
              <div style={{ color: '#a6abc2', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>{T('loading')}</div>
            ) : profileFriends.length === 0 ? (
              <div style={{ color: '#8a8fa8', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>{T('noFriends')}</div>
            ) : profileFriends.map((friend) => (
              <button
                key={friend.id}
                type="button"
                onClick={() => {
                  setShowFriendsModal(false);
                  onOpenProfile?.(friend.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <UserAvatar name={friend.displayName} username={friend.username} avatarUrl={friend.avatarUrl} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff3bf', fontSize: 14, fontWeight: 900 }}>{friend.displayName}</div>
                  <div style={{ color: '#8a8fa8', fontSize: 12, fontWeight: 700 }}>@{friend.username}</div>
                </div>
                <div style={{ color: friend.online ? '#7ef0a2' : '#8a8fa8', fontSize: 12, fontWeight: 800 }}>
                  {friend.online ? T('onlineStatus') : T('offlineStatus')}
                </div>
              </button>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn onClick={() => setShowFriendsModal(false)} color="#2a2a4a" style={{ color: '#fff' }}>
                {T('close')}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
