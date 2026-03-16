import { io } from 'socket.io-client';
import { getToken } from './api.js';

const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : window.location.origin;

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['polling'],
  auth: (cb) => {
    const token = getToken();
    cb(token ? { token } : {});
  },
});

export default socket;
