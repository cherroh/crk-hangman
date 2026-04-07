import { useState } from "react";
import "./App.css";
import { WORDS } from "./data/words";
import { getMaskedWord, isWordGuessed } from "./utils/gameLogic";

const MAX_WRONG = 6;

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function App() {
  const [word, setWord] = useState(getRandomWord());
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [input, setInput] = useState("");

  const maskedWord = getMaskedWord(word, guessedLetters);

  const handleGuess = () => {
    const letter = input.toLowerCase();

    if (!letter || guessedLetters.includes(letter)) return;

    setGuessedLetters((prev) => [...prev, letter]);

    if (!word.includes(letter)) {
      setWrongGuesses((prev) => prev + 1);
    }

    setInput("");
  };

  const resetGame = () => {
    setWord(getRandomWord());
    setGuessedLetters([]);
    setWrongGuesses(0);
    setInput("");
  };

  const won = isWordGuessed(word, guessedLetters);
  const lost = wrongGuesses >= MAX_WRONG;

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>CRK Hangman Test</h1>

      <h2>{maskedWord}</h2>

      <p>Wrong guesses: {wrongGuesses} / {MAX_WRONG}</p>

      {won && <h2>You Win!</h2>}
      {lost && <h2>You Lose! Word was: {word}</h2>}

      {!won && !lost && (
        <>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1}
          />
          <button onClick={handleGuess}>Guess</button>
        </>
      )}

      {(won || lost) && (
        <button onClick={resetGame}>Play Again</button>
      )}
    </div>
  );
}

export default App;