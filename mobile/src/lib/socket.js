import { io } from 'socket.io-client';

let reconnectId = `mobile-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

export function createMobileSocket(gameUrl, getAuthState) {
  const baseUrl = (gameUrl || 'https://hungry-poly.up.railway.app').replace(/\/$/, '');
  return io(baseUrl, {
    autoConnect: false,
    transports: ['polling'],
    auth: (cb) => {
      const authState = typeof getAuthState === 'function' ? getAuthState() : null;
      cb({
        reconnectId,
        ...(authState?.token ? { token: authState.token } : {}),
      });
    },
  });
}
