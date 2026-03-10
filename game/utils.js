export const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

export const uid = () => Math.random().toString(36).substr(2, 9);

export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
