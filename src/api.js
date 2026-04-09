const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

function getToken() {
  return localStorage.getItem('hp_token');
}

function setToken(token) {
  localStorage.setItem('hp_token', token);
}

export function clearAuth() {
  localStorage.removeItem('hp_token');
  localStorage.removeItem('hp_user');
}

export function getSavedUser() {
  try {
    const u = localStorage.getItem('hp_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

function saveUser(user) {
  localStorage.setItem('hp_user', JSON.stringify(user));
}

export function saveUserLocally(user) {
  saveUser(user);
}

async function request(path, opts = {}) {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export async function register(username, password, displayName) {
  const data = await request('/api/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, displayName }),
  });
  setToken(data.token);
  saveUser(data.user);
  return data.user;
}

export async function login(username, password) {
  const data = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  saveUser(data.user);
  return data.user;
}

export async function getProfile(userId) {
  return request(`/api/profile/${userId}`);
}

export async function updateProfileAvatar(avatarUrl) {
  const data = await request('/api/profile/avatar', {
    method: 'PATCH',
    body: JSON.stringify({ avatarUrl }),
  });
  if (data?.user) saveUser(data.user);
  return data.user;
}

export async function uploadProfileAvatar(file) {
  const form = new FormData();
  form.append('avatar', file);
  const data = await request('/api/profile/avatar', {
    method: 'POST',
    body: form,
  });
  if (data?.user) saveUser(data.user);
  return data.user;
}

export async function getHistory(userId) {
  return request(`/api/history/${userId}`);
}

// ── Friends API ──
export async function searchUsers(query) {
  return request(`/api/users/search?q=${encodeURIComponent(query)}`);
}

export async function getFriends() {
  return request('/api/friends');
}

export async function getProfileFriends(userId) {
  return request(`/api/profile/${userId}/friends`);
}

export async function sendFriendRequest(username) {
  return request('/api/friends/request', { method: 'POST', body: JSON.stringify({ username }) });
}

export async function getFriendRequests() {
  return request('/api/friends/requests');
}

export async function acceptFriendRequest(requestId) {
  return request(`/api/friends/accept/${requestId}`, { method: 'POST' });
}

export async function declineFriendRequest(requestId) {
  return request(`/api/friends/decline/${requestId}`, { method: 'POST' });
}

export async function removeFriend(friendId) {
  return request(`/api/friends/${friendId}`, { method: 'DELETE' });
}

export async function blockUser(userId) {
  return request('/api/users/block', { method: 'POST', body: JSON.stringify({ userId }) });
}

export async function unblockUser(userId) {
  return request(`/api/users/unblock/${userId}`, { method: 'DELETE' });
}

export async function getBlockedUsers() {
  return request('/api/users/blocked');
}

export async function getUnlockedWords() {
  return request('/api/unlocked-words');
}

export async function unlockRandomWord() {
  return request('/api/unlocked-words/unlock', { method: 'POST' });
}

export { getToken };
