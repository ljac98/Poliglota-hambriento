import { io } from 'socket.io-client';

export function createMobileSocket(gameUrl) {
  const baseUrl = (gameUrl || 'https://hungry-poly.up.railway.app').replace(/\/$/, '');
  return io(baseUrl, {
    autoConnect: false,
    transports: ['polling'],
  });
}
