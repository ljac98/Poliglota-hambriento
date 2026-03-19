import React, { useCallback, useEffect, useState } from 'react';
import socket from '../../src/socket.js';
import { searchUsers, getFriends, sendFriendRequest, getFriendRequests, acceptFriendRequest, declineFriendRequest, removeFriend, blockUser, unblockUser, getBlockedUsers } from '../../src/api.js';
import { Btn } from '../components/Btn.jsx';
import { Modal } from '../components/Modal.jsx';

export function FriendsScreen({ user, onBack, T }) {
  const [tab, setTab] = useState('list');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [f, r, b] = await Promise.all([getFriends(), getFriendRequests(), getBlockedUsers()]);
      setFriends(f); setRequests(r); setBlocked(b);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time updates
  useEffect(() => {
    const handleOnline = ({ userId }) => setFriends(prev => prev.map(f => f.id === userId ? { ...f, online: true } : f));
    const handleOffline = ({ userId }) => setFriends(prev => prev.map(f => f.id === userId ? { ...f, online: false } : f));
    const handleNewRequest = () => loadData();
    const handleAccepted = () => loadData();
    socket.on('friendOnline', handleOnline);
    socket.on('friendOffline', handleOffline);
    socket.on('friendRequestReceived', handleNewRequest);
    socket.on('friendRequestAccepted', handleAccepted);
    return () => {
      socket.off('friendOnline', handleOnline);
      socket.off('friendOffline', handleOffline);
      socket.off('friendRequestReceived', handleNewRequest);
      socket.off('friendRequestAccepted', handleAccepted);
    };
  }, [loadData]);

  async function handleSearch() {
    if (searchQuery.trim().length < 2) return;
    setSearchLoading(true); setMsg('');
    try {
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch { setMsg('Error'); } finally { setSearchLoading(false); }
  }

  async function handleSendRequest(username) {
    setMsg('');
    try {
      const res = await sendFriendRequest(username);
      if (res.status === 'accepted') { setMsg(T('autoAccepted')); loadData(); }
      else setMsg(T('requestSent'));
      setSearchResults(prev => prev.filter(u => u.username !== username));
    } catch (err) { setMsg(err.message); }
  }

  async function handleAccept(id) {
    try { await acceptFriendRequest(id); loadData(); } catch {}
  }
  async function handleDecline(id) {
    try { await declineFriendRequest(id); loadData(); } catch {}
  }
  async function handleRemove(id) {
    try { await removeFriend(id); setFriends(prev => prev.filter(f => f.id !== id)); } catch {}
  }
  async function handleBlock(id) {
    try { await blockUser(id); loadData(); } catch {}
  }
  async function handleUnblock(id) {
    try { await unblockUser(id); setBlocked(prev => prev.filter(b => b.id !== id)); } catch {}
  }

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 0', border: 'none', borderRadius: 10,
    background: active ? 'rgba(255,215,0,.15)' : 'transparent',
    color: active ? '#FFD700' : '#666', fontFamily: "'Fredoka',sans-serif",
    fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .2s',
  });

  const btnSmall = (bg, color) => ({
    padding: '5px 12px', borderRadius: 8, border: 'none', background: bg,
    color, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11,
    cursor: 'pointer',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif", overflowY: 'auto', padding: '20px 0',
    }}>
      <div style={{
        background: '#16213e', borderRadius: 20,
        padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 40px)',
        maxWidth: 520, width: '92vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#888', fontSize: 14,
          cursor: 'pointer', fontFamily: "'Fredoka',sans-serif", fontWeight: 700, marginBottom: 16,
        }}>{T('back')}</button>

        <h2 style={{ color: '#FFD700', fontSize: 22, fontWeight: 900, textAlign: 'center', marginBottom: 20 }}>
          {T('friends')}
        </h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          <button onClick={() => setTab('list')} style={tabStyle(tab === 'list')}>{T('friendsList')}</button>
          <button onClick={() => setTab('requests')} style={tabStyle(tab === 'requests')}>
            {T('friendRequests')}{requests.length > 0 ? ` (${requests.length})` : ''}
          </button>
          <button onClick={() => setTab('add')} style={tabStyle(tab === 'add')}>{T('addFriend')}</button>
          <button onClick={() => setTab('blocked')} style={tabStyle(tab === 'blocked')}>{T('blockedUsers')}</button>
        </div>

        {loading ? <p style={{ color: '#888', textAlign: 'center' }}>{T('loading')}</p> : (
          <>
            {/* Friends List */}
            {tab === 'list' && (
              <div>
                {friends.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>{T('noFriends')}</p>
                ) : friends.sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0)).map(f => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10,
                    marginBottom: 8, border: '1px solid #2a2a4a',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: f.online ? '#4CAF50' : '#555',
                      }} />
                      <div>
                        <div style={{ color: '#eee', fontSize: 14, fontWeight: 700 }}>{f.displayName}</div>
                        <div style={{ color: '#666', fontSize: 11 }}>
                          @{f.username} — {f.online ? T('onlineStatus') : T('offlineStatus')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleBlock(f.id)} style={btnSmall('rgba(255,87,34,.15)', '#FF5722')}>
                        {T('blockUser')}
                      </button>
                      <button onClick={() => handleRemove(f.id)} style={btnSmall('rgba(244,67,54,.15)', '#F44336')}>
                        {T('removeFriend')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friend Requests */}
            {tab === 'requests' && (
              <div>
                {requests.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>{T('noRequests')}</p>
                ) : requests.map(r => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10,
                    marginBottom: 8, border: '1px solid #2a2a4a',
                  }}>
                    <div>
                      <div style={{ color: '#eee', fontSize: 14, fontWeight: 700 }}>{r.displayName}</div>
                      <div style={{ color: '#666', fontSize: 11 }}>@{r.username}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleAccept(r.id)} style={btnSmall('rgba(76,175,80,.2)', '#4CAF50')}>
                        {T('accept')}
                      </button>
                      <button onClick={() => handleDecline(r.id)} style={btnSmall('rgba(244,67,54,.15)', '#F44336')}>
                        {T('decline')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Friend (search) */}
            {tab === 'add' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder={T('searchUsers')}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 10, border: '2px solid #2a2a4a',
                      background: '#0d1526', color: '#eee', fontSize: 14,
                      fontFamily: "'Fredoka',sans-serif", outline: 'none',
                    }}
                  />
                  <button onClick={handleSearch} disabled={searchLoading} style={{
                    padding: '10px 18px', borderRadius: 10, border: 'none',
                    background: '#FFD700', color: '#000', fontFamily: "'Fredoka',sans-serif",
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}>{searchLoading ? '...' : T('sendRequest').split(' ')[0]}</button>
                </div>
                {msg && <p style={{ color: '#4ecdc4', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>{msg}</p>}
                {searchResults.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10,
                    marginBottom: 8, border: '1px solid #2a2a4a',
                  }}>
                    <div>
                      <div style={{ color: '#eee', fontSize: 14, fontWeight: 700 }}>{u.displayName}</div>
                      <div style={{ color: '#666', fontSize: 11 }}>@{u.username}</div>
                    </div>
                    <button onClick={() => handleSendRequest(u.username)} style={btnSmall('rgba(255,215,0,.15)', '#FFD700')}>
                      {T('sendRequest')}
                    </button>
                  </div>
                ))}
                {searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
                  <p style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>{T('noResults')}</p>
                )}
              </div>
            )}

            {/* Blocked Users */}
            {tab === 'blocked' && (
              <div>
                {blocked.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>{T('noBlocked')}</p>
                ) : blocked.map(b => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10,
                    marginBottom: 8, border: '1px solid #2a2a4a',
                  }}>
                    <div>
                      <div style={{ color: '#eee', fontSize: 14, fontWeight: 700 }}>{b.displayName}</div>
                      <div style={{ color: '#666', fontSize: 11 }}>@{b.username}</div>
                    </div>
                    <button onClick={() => handleUnblock(b.id)} style={btnSmall('rgba(76,175,80,.2)', '#4CAF50')}>
                      {T('unblockUser')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

