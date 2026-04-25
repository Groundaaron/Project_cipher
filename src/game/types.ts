export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Feedback {
  black: number;
  white: number;
}

export interface Guess {
  colors: string[];
  feedback: Feedback;
}

export interface GameState {
  difficulty: Difficulty;
  secretCode: string[];
  guesses: Guess[];
  currentInput: (string | null)[];
  currentRow: number;
  isGameOver: boolean;
  isWin: boolean;
  timeRemaining: number;
  hintsUsed: number;
  revealedHints: number[];
}

export interface LeaderboardEntry {
  playerName: string;
  difficulty: Difficulty;
  attempts: number;
  timeTaken: number;
  date: string;
  hintsUsed: number;
}
