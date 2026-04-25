import { supabase } from './supabase';
import type { RoomData, PlayerData, RoomStatus, PlayerSlot } from './types';
import { generateRoomCode } from './types';
import type { Difficulty } from '../game/types';

export async function createRoom(difficulty: Difficulty, playerName: string): Promise<{ room: RoomData; player: PlayerData }> {
  const code = generateRoomCode();

  const { data: room, error: roomError } = await supabase
    .from('mp_rooms')
    .insert({ code, difficulty, status: 'waiting' })
    .select()
    .single();

  if (roomError || !room) throw new Error('Failed to create room');

  const { data: player, error: playerError } = await supabase
    .from('mp_players')
    .insert({ room_id: room.id, player_number: 1, name: playerName })
    .select()
    .single();

  if (playerError || !player) throw new Error('Failed to create player');

  return { room, player };
}

export async function joinRoom(code: string, playerName: string): Promise<{ room: RoomData; player: PlayerData }> {
  const { data: room, error: roomError } = await supabase
    .from('mp_rooms')
    .select()
    .eq('code', code.toUpperCase())
    .single();

  if (roomError || !room) throw new Error('Room not found');

  if (room.status !== 'waiting') throw new Error('Room is not accepting players');

  const { data: existingPlayers } = await supabase
    .from('mp_players')
    .select('player_number')
    .eq('room_id', room.id);

  if (existingPlayers && existingPlayers.length >= 2) throw new Error('Room is full');

  const { data: player, error: playerError } = await supabase
    .from('mp_players')
    .insert({ room_id: room.id, player_number: 2, name: playerName })
    .select()
    .single();

  if (playerError || !player) throw new Error('Failed to join room');

  // Update room status to setting
  await supabase
    .from('mp_rooms')
    .update({ status: 'setting' })
    .eq('id', room.id);

  return { room: { ...room, status: 'setting' }, player };
}

export async function setSecretCode(playerId: string, code: string[]): Promise<void> {
  await supabase
    .from('mp_players')
    .update({ secret_code: JSON.stringify(code), is_ready: true })
    .eq('id', playerId);
}

export async function submitGuess(playerId: string, guesses: string, attempts: number): Promise<void> {
  await supabase
    .from('mp_players')
    .update({ guesses, attempts })
    .eq('id', playerId);
}

export async function playerFinished(playerId: string, timeTaken: number, attempts: number, guesses: string): Promise<void> {
  await supabase
    .from('mp_players')
    .update({ time_taken: timeTaken, attempts, guesses, finished_at: new Date().toISOString() })
    .eq('id', playerId);
}

export async function updateRoomStatus(roomId: string, status: RoomStatus, extra?: Partial<RoomData>): Promise<void> {
  const update: Record<string, unknown> = { status, ...extra };
  await supabase
    .from('mp_rooms')
    .update(update)
    .eq('id', roomId);
}

export async function startGuessingPhase(roomId: string): Promise<void> {
  await updateRoomStatus(roomId, 'guessing', { current_turn: 'player1' });
}

export async function switchTurns(roomId: string, nextTurn: PlayerSlot): Promise<void> {
  await supabase
    .from('mp_rooms')
    .update({ current_turn: nextTurn })
    .eq('id', roomId);
}

export async function startRound2(roomId: string): Promise<void> {
  // Reset players for round 2 - swap who sets the code
  const { data: players } = await supabase
    .from('mp_players')
    .select()
    .eq('room_id', roomId);

  if (!players) return;

  for (const p of players) {
    await supabase
      .from('mp_players')
      .update({
        guesses: '[]',
        attempts: 0,
        time_taken: 0,
        hints_used: 0,
        is_ready: false,
        finished_at: null,
        // Keep secret_code from round 1, it will be overwritten by the other player
      })
      .eq('id', p.id);
  }

  await updateRoomStatus(roomId, 'setting', { round: 2, current_turn: 'player2' });
}

export async function finishGame(roomId: string): Promise<void> {
  await updateRoomStatus(roomId, 'finished');
}

export async function getPlayers(roomId: string): Promise<PlayerData[]> {
  const { data } = await supabase
    .from('mp_players')
    .select()
    .eq('room_id', roomId)
    .order('player_number');
  return data || [];
}

export async function deleteRoom(roomId: string): Promise<void> {
  await supabase.from('mp_rooms').delete().eq('id', roomId);
}
