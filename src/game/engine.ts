import type { Feedback, Difficulty } from './types';
import { DIFFICULTY_CONFIGS, GAME_COLORS } from './constants';

export function generateSecretCode(difficulty: Difficulty): string[] {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const colors = GAME_COLORS[difficulty];
  const code: string[] = [];
  for (let i = 0; i < config.slots; i++) {
    const idx = Math.floor(Math.random() * config.colors);
    code.push(colors[idx]);
  }
  return code;
}

export function calculateFeedback(guess: string[], secret: string[]): Feedback {
  const slots = secret.length;
  let black = 0;
  let white = 0;

  const secretRemaining: Record<string, number> = {};
  const guessRemaining: Record<string, number> = {};

  // First pass: count exact matches (black pegs)
  for (let i = 0; i < slots; i++) {
    if (guess[i] === secret[i]) {
      black++;
    } else {
      secretRemaining[secret[i]] = (secretRemaining[secret[i]] || 0) + 1;
      guessRemaining[guess[i]] = (guessRemaining[guess[i]] || 0) + 1;
    }
  }

  // Second pass: count partial matches (white pegs)
  for (const color of Object.keys(guessRemaining)) {
    if (secretRemaining[color]) {
      white += Math.min(guessRemaining[color], secretRemaining[color]);
    }
  }

  return { black, white };
}

export function checkWin(feedback: Feedback, slots: number): boolean {
  return feedback.black === slots;
}

export function checkLoss(currentRow: number, maxAttempts: number): boolean {
  return currentRow >= maxAttempts;
}
