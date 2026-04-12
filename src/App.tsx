import { useEffect, useState } from "react";
import icon from "./assets/crkicon.png";
import hangmanBase from "./assets/hangmanbase.png";
import hangman1 from "./assets/hangman1.png";
import hangman2 from "./assets/hangman2.png";
import hangman3 from "./assets/hangman3.png";
import hangman4 from "./assets/hangman4.png";
import hangman5 from "./assets/hangman5.png";
import hangman6 from "./assets/hangman6.png";
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
  const [inputError, setInputError] = useState(false);
  const [gameStatus, setGameStatus] = useState<"idle" | "correct" | "wrong" | "won" | "lost">("idle");

  const maskedWord = getMaskedWord(word, guessedLetters);
  const maskedLetters = maskedWord.split(" ");

  useEffect(() => {
    if (gameStatus !== "correct" && gameStatus !== "wrong") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setGameStatus("idle");
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [gameStatus]);

  const handleGuess = () => {
    const normalized = input.toLowerCase().trim().replace(/[^a-z]/g, "");

    if (!normalized) return;
    if (guessedLetters.includes(normalized)) {
      setInputError(true);
      return;
    }

    setInputError(false);
    const nextGuessedLetters = [...guessedLetters, normalized];
    setGuessedLetters(nextGuessedLetters);

    if (word.includes(normalized)) {
      if (isWordGuessed(word, nextGuessedLetters)) {
        setGameStatus("won");
      } else {
        setGameStatus("correct");
      }
    } else {
      const nextWrong = wrongGuesses + 1;
      setWrongGuesses(nextWrong);
      setGameStatus(nextWrong >= MAX_WRONG ? "lost" : "wrong");
    }

    setInput("");
  };

  const resetGame = () => {
    setWord(getRandomWord());
    setGuessedLetters([]);
    setWrongGuesses(0);
    setInput("");
    setInputError(false);
    setGameStatus("idle");
  };

  const won = isWordGuessed(word, guessedLetters);
  const lost = wrongGuesses >= MAX_WRONG;

  const hangmanImages = [
    hangmanBase,
    hangman1,
    hangman2,
    hangman3,
    hangman4,
    hangman5,
    hangman6,
  ];
  const currentHangmanImage = hangmanImages[Math.min(wrongGuesses, MAX_WRONG)];

  return (
    <div className="app-shell">
      <header className="app-header">
        <img src={icon} alt="CRK icon" className="app-logo" />
        <div className="app-title-wrapper">
          <p className="app-eyebrow">CRK Hangman</p>
          <h1>Guess the Cookie's Name</h1>
        </div>
      </header>

      <main className="game-panel">
        <div className="status-row">
          <div className="status-card">
            <img
              src={currentHangmanImage}
              alt={`Hangman stage ${wrongGuesses} of ${MAX_WRONG}`}
              className="hangman-image"
            />
            <span>Wrong guesses</span>
            <strong>{wrongGuesses} / {MAX_WRONG}</strong>
          </div>
          <div className={`status-card status-${won ? "won" : lost ? "lost" : gameStatus}`}>
            <span>
              {won
                ? "You Win"
                : lost
                ? "You Lose"
                : gameStatus === "correct"
                ? "Correct Guess"
                : gameStatus === "wrong"
                ? "Wrong Guess"
                : "Keep Guessing"}
            </span>
          </div>
        </div>

        <section className="guess-summary">
          <div className="guessed-letters-panel">
            <div className="guessed-letters-label">Already guessed letters</div>
            <div className="guessed-letters">
              {guessedLetters.length > 0 ? (
                guessedLetters.map((letter) => (
                  <span key={letter} className="guessed-letter-chip">
                    {letter.toUpperCase()}
                  </span>
                ))
              ) : (
                <span className="empty-state">None yet</span>
              )}
            </div>
          </div>

          <div className="word-display" aria-label="Masked word">
            <div className="word-display-inner">
              {maskedLetters.map((letter, index) => (
                <span key={`${letter}-${index}`} className="word-tile">
                  {letter}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="controls-panel">
          {!won && !lost ? (
            <form
              className="guess-form"
              onSubmit={(event) => {
                event.preventDefault();
                handleGuess();
              }}
            >
              <label className="letter-input-wrapper">
                <span className="screen-reader-only">Enter letter</span>
                <input
                  className={`letter-input${inputError ? " letter-input-error" : ""}`}
                  value={input}
                  onChange={(e) => {
                    const newValue = e.target.value.slice(0, 1);
                    const normalizedValue = newValue.toLowerCase().replace(/[^a-z]/g, "");
                    setInput(newValue);
                    if (!normalizedValue || !guessedLetters.includes(normalizedValue)) {
                      setInputError(false);
                    }
                  }}
                  maxLength={1}
                  placeholder="a"
                  aria-label="Guess a letter"
                />
              </label>
              <button className="primary-button" type="submit">
                Guess
              </button>
            </form>
          ) : (
            <button className="primary-button" onClick={resetGame}>
              Play Again
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;