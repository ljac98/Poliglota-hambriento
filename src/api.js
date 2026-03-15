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

async function request(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
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

export async function getHistory(userId) {
  return request(`/api/history/${userId}`);
}

export { getToken };
