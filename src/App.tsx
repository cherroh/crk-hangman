import { useEffect, useState } from "react";
import icon from "./assets/crkicon.png";
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
  const [gameStatus, setGameStatus] = useState<"idle" | "correct" | "wrong" | "won" | "lost">("idle");

  const maskedWord = getMaskedWord(word, guessedLetters);
  const maskedWordLength = maskedWord.length;
  const maskedLetters = maskedWord.split(" ");
  const wordFontSize = Math.max(2, Math.min(48, Math.floor(720 / Math.max(maskedWordLength, 10))));

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

    if (!normalized || guessedLetters.includes(normalized)) return;

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
    setGameStatus("idle");
  };

  const won = isWordGuessed(word, guessedLetters);
  const lost = wrongGuesses >= MAX_WRONG;

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

          <div
            className="word-display"
            aria-label="Masked word"
            style={{ fontSize: `${wordFontSize}px` }}
          >
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
            <>
              <label className="letter-input-wrapper">
                <span className="screen-reader-only">Enter letter</span>
                <input
                  className="letter-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 1))}
                  maxLength={1}
                  placeholder="a"
                  aria-label="Guess a letter"
                />
              </label>
              <button className="primary-button" onClick={handleGuess}>
                Guess
              </button>
            </>
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