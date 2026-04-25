import type { Difficulty } from '../game/types';

export type RoomStatus = 'waiting' | 'setting' | 'guessing' | 'switching' | 'finished';
export type PlayerSlot = 'player1' | 'player2';

export interface RoomData {
  id: string;
  code: string;
  difficulty: Difficulty;
  status: RoomStatus;
  current_turn: PlayerSlot;
  round: number;
  created_at: string;
}

export interface PlayerData {
  id: string;
  room_id: string;
  player_number: 1 | 2;
  name: string;
  secret_code: string | null;   // JSON string of color array
  guesses: string;              // JSON string of Guess[]
  attempts: number;
  time_taken: number;
  hints_used: number;
  is_ready: boolean;
  finished_at: string | null;
  created_at: string;
}

export interface MultiplayerState {
  room: RoomData | null;
  myPlayer: PlayerData | null;
  opponent: PlayerData | null;
  mySlot: PlayerSlot;
  isConnected: boolean;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
