export function isLetterInWord(word: string, letter: string) {
  return word.includes(letter);
}

export function getMaskedWord(word: string, guessedLetters: string[]) {
  return word
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");
}

export function isWordGuessed(word: string, guessedLetters: string[]) {
  return word.split("").every((letter) => guessedLetters.includes(letter));
}