import { useState, useCallback, useRef, useEffect } from 'react';
import type { Difficulty, GameState, Guess } from '../game/types';
import { DIFFICULTY_CONFIGS, GAME_COLORS } from '../game/constants';
import { generateSecretCode, calculateFeedback, checkWin, checkLoss } from '../game/engine';

function createInitialState(difficulty: Difficulty): GameState {
  const config = DIFFICULTY_CONFIGS[difficulty];
  return {
    difficulty,
    secretCode: generateSecretCode(difficulty),
    guesses: [],
    currentInput: Array(config.slots).fill(null),
    currentRow: 0,
    isGameOver: false,
    isWin: false,
    timeRemaining: config.timeLimit,
    hintsUsed: 0,
    revealedHints: [],
  };
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState('easy'));
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.isGameOver || prev.timeRemaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (prev.timeRemaining <= 0 && !prev.isGameOver) {
            return { ...prev, isGameOver: true, isWin: false, timeRemaining: 0 };
          }
          return prev;
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    stopTimer();
    setGameState(createInitialState(difficulty));
  }, [stopTimer]);

  const setSlotColor = useCallback((slotIndex: number, color: string) => {
    setGameState(prev => {
      const newInput = [...prev.currentInput];
      newInput[slotIndex] = color;
      return { ...prev, currentInput: newInput };
    });
  }, []);

  const submitGuess = useCallback((): Guess | null => {
    let result: Guess | null = null;
    setGameState(prev => {
      if (prev.isGameOver) return prev;
      const config = DIFFICULTY_CONFIGS[prev.difficulty];
      if (prev.currentInput.some(c => c === null)) return prev;

      const guessColors = prev.currentInput as string[];
      const feedback = calculateFeedback(guessColors, prev.secretCode);
      const guess: Guess = { colors: guessColors, feedback };
      result = guess;

      const newGuesses = [...prev.guesses, guess];
      const newRow = prev.currentRow + 1;
      const won = checkWin(feedback, config.slots);
      const lost = checkLoss(newRow, config.maxAttempts);

      if (won || lost) stopTimer();

      return {
        ...prev,
        guesses: newGuesses,
        currentInput: Array(config.slots).fill(null),
        currentRow: newRow,
        isGameOver: won || lost,
        isWin: won,
      };
    });
    return result;
  }, [stopTimer]);

  const useHint = useCallback((): number | null => {
    let hintIndex: number | null = null;
    setGameState(prev => {
      if (prev.isGameOver) return prev;
      const config = DIFFICULTY_CONFIGS[prev.difficulty];
      const unrevealed = Array.from({ length: config.slots }, (_, i) => i)
        .filter(i => !prev.revealedHints.includes(i));
      if (unrevealed.length === 0) return prev;

      const idx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      hintIndex = idx;
      return {
        ...prev,
        revealedHints: [...prev.revealedHints, idx],
        hintsUsed: prev.hintsUsed + 1,
      };
    });
    return hintIndex;
  }, []);

  const newGame = useCallback(() => {
    stopTimer();
    setGameState(prev => createInitialState(prev.difficulty));
  }, [stopTimer]);

  const availableColors = GAME_COLORS[gameState.difficulty];
  const config = DIFFICULTY_CONFIGS[gameState.difficulty];

  return {
    gameState,
    isAnimating,
    setIsAnimating,
    setDifficulty,
    setSlotColor,
    submitGuess,
    useHint,
    newGame,
    startTimer,
    stopTimer,
    availableColors,
    config,
  };
}
