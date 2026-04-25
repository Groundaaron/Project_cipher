import type { Difficulty } from './types';

export interface DifficultyConfig {
  slots: number;
  colors: number;
  maxAttempts: number;
  timeLimit: number; // seconds
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { slots: 4, colors: 4, maxAttempts: 8, timeLimit: 180 },
  medium: { slots: 5, colors: 6, maxAttempts: 10, timeLimit: 240 },
  hard: { slots: 6, colors: 8, maxAttempts: 12, timeLimit: 300 },
};

export const GAME_COLORS: Record<Difficulty, string[]> = {
  easy: ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'],
  medium: ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899'],
  hard: ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4', '#f97316'],
};

export const COLORBLIND_PATTERNS: Record<string, string> = {
  '#ef4444': '///',
  '#22c55e': '+++',
  '#3b82f6': '===',
  '#f59e0b': 'ooo',
  '#a855f7': 'xxx',
  '#ec4899': '^^^',
  '#06b6d4': '~~~',
  '#f97316': '###',
};

export const HINT_COST = 1;
