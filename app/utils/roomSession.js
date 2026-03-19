export function saveRoomSession(data) {
  sessionStorage.setItem('hp_room_session', JSON.stringify(data));
}

export function clearRoomSession() {
  sessionStorage.removeItem('hp_room_session');
}

export function getRoomSession() {
  try {
    return JSON.parse(sessionStorage.getItem('hp_room_session'));
  } catch {
    return null;
  }
}
