export function isLetterInWord(word: string, letter: string) {
  return word.includes(letter);
}

export function getMaskedLetters(word: string, guessedLetters: string[]) {
  return word.split("").map((letter) => {
    if (letter === " ") {
      return " ";
    }

    return guessedLetters.includes(letter) ? letter : "_";
  });
}

export function getMaskedWord(word: string, guessedLetters: string[]) {
  return getMaskedLetters(word, guessedLetters).join(" ");
}

export function isWordGuessed(word: string, guessedLetters: string[]) {
  return word.split("").every((letter) => letter === " " || guessedLetters.includes(letter));
}