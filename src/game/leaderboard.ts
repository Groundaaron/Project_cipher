import type { LeaderboardEntry } from './types';

const STORAGE_KEY = 'project-cipher-leaderboard';
const RANK_HISTORY_KEY = 'project-cipher-rank-history';

export type TimePeriod = 'today' | 'weekly' | 'monthly';

export function getLeaderboard(period?: TimePeriod): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const all: LeaderboardEntry[] = data ? JSON.parse(data) : [];
    if (!period) return all;

    const now = new Date();
    const cutoff = new Date();
    if (period === 'today') {
      cutoff.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      cutoff.setDate(now.getDate() - 7);
    } else {
      cutoff.setMonth(now.getMonth() - 1);
    }

    return all.filter(entry => new Date(entry.date) >= cutoff);
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(entry: LeaderboardEntry): number {
  const board = getLeaderboard();
  const previousRank = getPlayerRank(entry.playerName, board);
  board.push(entry);
  board.sort((a, b) => {
    if (a.difficulty !== b.difficulty) {
      const order = { hard: 0, medium: 1, easy: 2 };
      return order[a.difficulty] - order[b.difficulty];
    }
    if (a.attempts !== b.attempts) return a.attempts - b.attempts;
    return a.timeTaken - b.timeTaken;
  });
  const trimmed = board.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

  const newRank = getPlayerRank(entry.playerName, trimmed);
  saveRankHistory(entry.playerName, newRank);

  return previousRank - newRank; // positive = improvement
}

function getPlayerRank(name: string, board: LeaderboardEntry[]): number {
  const idx = board.findIndex(e => e.playerName === name);
  return idx === -1 ? 999 : idx + 1;
}

function saveRankHistory(name: string, rank: number) {
  try {
    const data = localStorage.getItem(RANK_HISTORY_KEY);
    const history: Record<string, number> = data ? JSON.parse(data) : {};
    history[name] = rank;
    localStorage.setItem(RANK_HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function getPreviousRank(name: string): number {
  try {
    const data = localStorage.getItem(RANK_HISTORY_KEY);
    const history: Record<string, number> = data ? JSON.parse(data) : {};
    return history[name] || 999;
  } catch {
    return 999;
  }
}

export function clearLeaderboard(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RANK_HISTORY_KEY);
}
