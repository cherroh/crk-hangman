import { useEffect, useRef, useState } from "react";
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
import { getMaskedLetters, isWordGuessed } from "./utils/gameLogic";

const MAX_WRONG = 6;

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

const WORD_BANK_TEXT = WORDS.join(", ");

function getCandidateWords(maskedLetters: string[], guessedLetters: string[]) {
  const wrongLetters = guessedLetters.filter((letter) => !maskedLetters.includes(letter));

  return WORDS.filter((candidate) => {
    const normalizedCandidate = candidate.toLowerCase();
    if (normalizedCandidate.length !== maskedLetters.length) {
      return false;
    }

    for (let index = 0; index < normalizedCandidate.length; index += 1) {
      const candidateChar = normalizedCandidate[index];
      const maskChar = maskedLetters[index];

      if (maskChar === " ") {
        if (candidateChar !== " ") {
          return false;
        }
        continue;
      }

      if (maskChar !== "_") {
        if (candidateChar !== maskChar) {
          return false;
        }
      } else if (guessedLetters.includes(candidateChar)) {
        return false;
      }
    }

    return wrongLetters.every((letter) => !normalizedCandidate.includes(letter));
  });
}

function App() {
  const [word, setWord] = useState(getRandomWord());
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState(false);
  const [gameStatus, setGameStatus] = useState<"idle" | "correct" | "wrong" | "won" | "lost">("idle");
  const [aiHint, setAiHint] = useState("Press Hint to ask GingerBrave for help.");
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [hintLoading, setHintLoading] = useState(false);
  const [showHintPanel, setShowHintPanel] = useState(false);
  const [hasHintedThisRound, setHasHintedThisRound] = useState(false);
  const aiGenerator = useRef<any>(null);

  const maskedLetters = getMaskedLetters(word, guessedLetters);
  const won = isWordGuessed(word, guessedLetters);
  const lost = wrongGuesses >= MAX_WRONG;
  const availableLetters = "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .filter((letter) => !guessedLetters.includes(letter));

  function fallbackLetter() {
    const frequencyOrder = [
      "e",
      "a",
      "r",
      "i",
      "o",
      "t",
      "n",
      "s",
      "l",
      "c",
      "u",
      "d",
      "p",
      "m",
      "h",
      "g",
      "b",
      "f",
      "y",
      "w",
      "k",
      "v",
      "x",
      "z",
      "j",
      "q",
    ];
    return frequencyOrder.find((letter) => availableLetters.includes(letter)) ?? availableLetters[0];
  }

  async function ensureAiGenerator() {
    if (aiGenerator.current) {
      return aiGenerator.current;
    }

    if (aiStatus === "loading") {
      return null;
    }

    setAiStatus("loading");
    setAiHint("GingerBrave is coming...");

    try {
      const { pipeline } = await import("@xenova/transformers");
      const generator = await pipeline("text-generation", "Xenova/distilgpt2");
      aiGenerator.current = generator;
      setAiStatus("ready");
      return generator;
    } catch (error) {
      console.error("GingerBrave failed to show up", error);
      setAiStatus("error");
      setAiHint("GingerBrave is unavailable.");
      return null;
    }
  }

  async function requestAiHint() {
    if (won || lost) {
      setAiHint("Game over. Click play again to restart.");
      return;
    }

    setShowHintPanel(true);
    setHintLoading(true);
    setAiStatus("loading");
    setAiHint(!hasHintedThisRound ? "GingerBrave is coming..." : "GingerBrave is thinking...");
    setHasHintedThisRound(true);

    const generator = await ensureAiGenerator();
    if (!generator) {
      setHintLoading(false);
      return;
    }

    setAiHint("GingerBrave is thinking...");

    const wrongLetters = guessedLetters.filter((letter) => !word.toLowerCase().includes(letter));
    const pattern = maskedLetters.join(" ");
    const patternPositions = maskedLetters
      .map((letter, index) =>
        letter === " "
          ? `${index + 1}=space`
          : letter === "_"
          ? `${index + 1}=unknown`
          : `${index + 1}=${letter}`
      )
      .join(", ");
    const unknownGroups = maskedLetters
      .join("")
      .split(" ")
      .map((group) => group.replace(/[^_]/g, ""))
      .filter((group) => group.length > 0)
      .map((group) => `${group.length}`)
      .join(", ");
    const candidateWords = getCandidateWords(maskedLetters, guessedLetters);
    const candidateSample = candidateWords.slice(0, 30);

    if (candidateWords.length === 1) {
      const uniqueCandidate = candidateWords[0].toLowerCase();
      const nextLetter = uniqueCandidate
        .split("")
        .find((char, index) =>
          char !== " " &&
          !guessedLetters.includes(char) &&
          maskedLetters[index] === "_"
        );

      if (nextLetter) {
        setAiHint(`GingerBrave: Try “${nextLetter.toUpperCase()}”!`);
        setHintLoading(false);
        return;
      }
    }

    if (candidateWords.length > 1 && candidateWords.length <= 10) {
      const letterCounts: Record<string, number> = {};
      candidateWords.forEach((candidate) => {
        candidate.toLowerCase().split("").forEach((char, index) => {
          if (
            char !== " " &&
            !guessedLetters.includes(char) &&
            maskedLetters[index] === "_"
          ) {
            letterCounts[char] = (letterCounts[char] || 0) + 1;
          }
        });
      });
      const bestLetter = Object.entries(letterCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([letter]) => letter)
        .find((letter) => availableLetters.includes(letter));

      if (bestLetter) {
        setAiHint(`GingerBrave: Try “${bestLetter.toUpperCase()}”!`);
        setHintLoading(false);
        return;
      }
    }

    const revealedLetters = maskedLetters
      .filter((letter) => letter !== "_" && letter !== " ")
      .map((letter, index) => `${index + 1}=${letter}`)
      .join(", ");

    const prompt = [
      "You are a Hangman assistant that knows the full list of possible hidden words.",
      `Full word list: ${WORD_BANK_TEXT}`,
      `Word template: ${pattern}`,
      `Groups of unknown letters by segment: ${unknownGroups}`,
      `Letter positions: ${patternPositions}`,
      `Revealed letters: ${revealedLetters.length > 0 ? revealedLetters : "none"}`,
      `Already guessed letters: ${guessedLetters.length > 0 ? guessedLetters.join(", ") : "none"}`,
      `Wrong letters: ${wrongLetters.length > 0 ? wrongLetters.join(", ") : "none"}`,
      `Allowed letters: ${availableLetters.join(", ")}`,
      `Possible words (${candidateWords.length}): ${candidateSample.join(", ")}${candidateWords.length > candidateSample.length ? ", ..." : ""}`,
      "Use the revealed letters and exact pattern to eliminate impossible words and choose the best next unguessed letter.",
      "Choose only one letter. Output exactly that letter."
    ].join("\n");

    try {
      const response = await generator(prompt, {
        max_new_tokens: 8,
        temperature: 0.0,
        top_p: 1.0,
        do_sample: false,
        return_full_text: false,
      });

      const generatedText = Array.isArray(response)
        ? response[0]?.generated_text
        : response?.generated_text;
      const nextLetter = String(generatedText)
        .toLowerCase()
        .split("")
        .find((letter) => availableLetters.includes(letter));

      const chosenLetter = nextLetter ?? fallbackLetter();

      setAiHint(`GingerBrave: Try “${chosenLetter.toUpperCase()}”!`);
    } catch (error) {
      console.error("GingerBrave failed to send a message", error);
      setAiStatus("error");
      setAiHint("GingerBrave can't come up with a hint");
    } finally {
      setHintLoading(false);
    }
  }

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
    setAiHint("Press Hint to ask GingerBrave for help.");
    setAiStatus("idle");
    setHintLoading(false);
    setShowHintPanel(false);
    setHasHintedThisRound(false);
  };

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
            {lost && (
              <span className="status-answer">Answer: {word}</span>
            )}
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
              {maskedLetters.map((letter, index) =>
                letter === " " ? (
                  <span key={`space-${index}`} className="word-space" aria-hidden="true" />
                ) : (
                  <span key={`${letter}-${index}`} className="word-tile">
                    {letter}
                  </span>
                )
              )}
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
              <button
                className="secondary-button"
                type="button"
                onClick={requestAiHint}
                disabled={won || lost || hintLoading}
              >
                {hintLoading ? "Loading..." : "Hint"}
              </button>
            </form>
          ) : (
            <button className="primary-button" onClick={resetGame}>
              Play Again
            </button>
          )}
        </section>

        {showHintPanel && (
          <section className="hint-panel">
            <div className="hint-card">
              <span className="hint-label">Message GingerBrave</span>
              <p className="hint-text">{aiHint}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;