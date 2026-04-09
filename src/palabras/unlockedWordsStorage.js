import { getUnlockableWordById, pickRandomLockedWordId } from './unlockedWordsCatalog.js';

const GUEST_UNLOCKED_WORDS_KEY = 'hp_unlocked_words_guest';
const USER_UNLOCKED_WORDS_KEY_PREFIX = 'hp_unlocked_words_user_';

function getStorageKey(user) {
  return user?.id ? `${USER_UNLOCKED_WORDS_KEY_PREFIX}${user.id}` : GUEST_UNLOCKED_WORDS_KEY;
}

function sanitizeUnlockedEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((entry) => entry && typeof entry.wordId === 'string')
    .map((entry) => ({
      wordId: entry.wordId,
      unlockedAt: entry.unlockedAt || new Date().toISOString(),
    }));
}

export function readUnlockedWordEntries(user = null) {
  if (typeof localStorage === 'undefined') return [];
  try {
    return sanitizeUnlockedEntries(JSON.parse(localStorage.getItem(getStorageKey(user)) || '[]'));
  } catch {
    return [];
  }
}

export function writeUnlockedWordEntries(user = null, entries = []) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(getStorageKey(user), JSON.stringify(sanitizeUnlockedEntries(entries)));
}

export function syncUnlockedWordEntries(user = null, entries = []) {
  const nextEntries = sanitizeUnlockedEntries(entries);
  writeUnlockedWordEntries(user, nextEntries);
  return nextEntries;
}

export function unlockRandomWordLocally(user = null) {
  const currentEntries = readUnlockedWordEntries(user);
  const currentIds = currentEntries.map((entry) => entry.wordId);
  const nextWordId = pickRandomLockedWordId(currentIds);
  if (!nextWordId) {
    return {
      entries: currentEntries,
      unlockedEntry: null,
      unlockedWord: null,
    };
  }
  const unlockedEntry = {
    wordId: nextWordId,
    unlockedAt: new Date().toISOString(),
  };
  const nextEntries = [unlockedEntry, ...currentEntries];
  writeUnlockedWordEntries(user, nextEntries);
  return {
    entries: nextEntries,
    unlockedEntry,
    unlockedWord: getUnlockableWordById(nextWordId),
  };
}
