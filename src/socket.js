import { io } from 'socket.io-client';
import { getToken } from './api.js';

const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : window.location.origin;

function getReconnectId() {
  let id = sessionStorage.getItem('hp_reconnect_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('hp_reconnect_id', id);
  }
  return id;
}

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['polling'],
  auth: (cb) => {
    const token = getToken();
    const reconnectId = getReconnectId();
    cb({ ...(token ? { token } : {}), reconnectId });
  },
});

export default socket;
