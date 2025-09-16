export const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

export const pickRandomLetter = (exclude?: string): string => {
  if (!exclude) return LETTERS[Math.floor(Math.random() * LETTERS.length)];
  let letter = exclude;
  while (letter === exclude) {
    letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return letter;
};
