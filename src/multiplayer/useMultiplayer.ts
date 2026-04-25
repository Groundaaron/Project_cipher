import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import type { RoomData, PlayerSlot, MultiplayerState } from './types';
import {
  createRoom,
  joinRoom,
  setSecretCode,
  submitGuess,
  playerFinished,
  startGuessingPhase,
  startRound2,
  finishGame,
  getPlayers,
} from './room';
import { calculateFeedback } from '../game/engine';
import { DIFFICULTY_CONFIGS, GAME_COLORS } from '../game/constants';
import type { Difficulty, Guess } from '../game/types';

export function useMultiplayer() {
  const [state, setState] = useState<MultiplayerState>({
    room: null,
    myPlayer: null,
    opponent: null,
    mySlot: 'player1',
    isConnected: false,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Subscribe to realtime updates
  const subscribeToRoom = useCallback((roomId: string, myPlayerId: string, _mySlot: PlayerSlot) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`room-${roomId}`, {
      config: { broadcast: { self: true } },
    });

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'mp_rooms', filter: `id=eq.${roomId}` },
      (payload) => {
        const roomData = payload.new as RoomData;
        setState(prev => ({ ...prev, room: roomData }));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'mp_players', filter: `room_id=eq.${roomId}` },
      async () => {
        // Refetch all players to get latest state
        const players = await getPlayers(roomId);
        const me = players.find(p => p.id === myPlayerId) || null;
        const opp = players.find(p => p.id !== myPlayerId) || null;
        setState(prev => ({ ...prev, myPlayer: me, opponent: opp }));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mp_players', filter: `room_id=eq.${roomId}` },
      async () => {
        const players = await getPlayers(roomId);
        const me = players.find(p => p.id === myPlayerId) || null;
        const opp = players.find(p => p.id !== myPlayerId) || null;
        setState(prev => ({ ...prev, myPlayer: me, opponent: opp }));
      }
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setState(prev => ({ ...prev, isConnected: true }));
      }
    });

    channelRef.current = channel;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleCreateRoom = useCallback(async (difficulty: Difficulty, playerName: string) => {
    const { room, player } = await createRoom(difficulty, playerName);
    setState({
      room,
      myPlayer: player,
      opponent: null,
      mySlot: 'player1',
      isConnected: false,
    });
    subscribeToRoom(room.id, player.id, 'player1');
    return { room, player };
  }, [subscribeToRoom]);

  const handleJoinRoom = useCallback(async (code: string, playerName: string) => {
    const { room, player } = await joinRoom(code, playerName);
    // Fetch existing players
    const players = await getPlayers(room.id);
    const me = players.find(p => p.id === player.id) || player;
    const opp = players.find(p => p.id !== player.id) || null;
    setState({
      room,
      myPlayer: me,
      opponent: opp,
      mySlot: 'player2',
      isConnected: false,
    });
    subscribeToRoom(room.id, player.id, 'player2');
    return { room, player };
  }, [subscribeToRoom]);

  const handleSetCode = useCallback(async (code: string[]) => {
    if (!state.myPlayer) return;
    await setSecretCode(state.myPlayer.id, code);
    // Check if both players are ready
    const players = await getPlayers(state.myPlayer.room_id);
    const allReady = players.every(p => p.is_ready);
    if (allReady && players.length === 2) {
      await startGuessingPhase(state.myPlayer.room_id);
    }
  }, [state.myPlayer]);

  const handleSubmitGuess = useCallback(async (guessColors: string[]) => {
    if (!state.myPlayer || !state.opponent) return null;

    // Get the secret code we're guessing against
    // In round 1, player1 guesses player2's code; in round 2, player2 guesses player1's code
    const codeSetter = state.room?.round === 1 ? state.opponent : state.opponent;
    const secretCode: string[] = codeSetter.secret_code ? JSON.parse(codeSetter.secret_code) : [];

    if (secretCode.length === 0) return null;

    const feedback = calculateFeedback(guessColors, secretCode);
    const guess: Guess = { colors: guessColors, feedback };

    const currentGuesses: Guess[] = state.myPlayer.guesses ? JSON.parse(state.myPlayer.guesses) : [];
    const newGuesses = [...currentGuesses, guess];
    const newAttempts = state.myPlayer.attempts + 1;

    await submitGuess(state.myPlayer.id, JSON.stringify(newGuesses), newAttempts);

    // Check win/loss
    const config = DIFFICULTY_CONFIGS[state.room!.difficulty];
    const won = feedback.black === config.slots;
    const lost = newAttempts >= config.maxAttempts;

    if (won || lost) {
      setIsTimerRunning(false);
      await playerFinished(state.myPlayer.id, elapsedTime, newAttempts, JSON.stringify(newGuesses));

      // Check if both players have finished this round
      const players = await getPlayers(state.myPlayer.room_id);
      const allFinished = players.every(p => p.finished_at !== null);

      if (allFinished) {
        if (state.room!.round === 1) {
          // Switch to round 2
          await startRound2(state.myPlayer.room_id);
        } else {
          await finishGame(state.myPlayer.room_id);
        }
      }
    }

    return guess;
  }, [state.myPlayer, state.opponent, state.room, elapsedTime]);

  const handleUseHint = useCallback(async () => {
    if (!state.myPlayer) return;
    const newHints = state.myPlayer.hints_used + 1;
    await supabase
      .from('mp_players')
      .update({ hints_used: newHints })
      .eq('id', state.myPlayer.id);
  }, [state.myPlayer]);

  const startTimer = useCallback(() => {
    setElapsedTime(0);
    setIsTimerRunning(true);
  }, []);

  const stopTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const leaveRoom = useCallback(async () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsTimerRunning(false);
    setState({
      room: null,
      myPlayer: null,
      opponent: null,
      mySlot: 'player1',
      isConnected: false,
    });
  }, []);

  // Determine if it's my turn to guess
  const isMyTurn = state.room?.status === 'guessing' && state.room?.current_turn === state.mySlot;

  // Determine if I should set a code
  const shouldSetCode = state.room?.status === 'setting' && !state.myPlayer?.is_ready;

  // Get the secret code I'm guessing against (opponent's code)
  const opponentSecretCode = state.opponent?.secret_code ? JSON.parse(state.opponent.secret_code) : [];

  // Get my guesses
  const myGuesses: Guess[] = state.myPlayer?.guesses ? JSON.parse(state.myPlayer.guesses) : [];

  // Get opponent guesses (for progress preview)
  const opponentGuesses: Guess[] = state.opponent?.guesses ? JSON.parse(state.opponent.guesses) : [];

  const config = state.room ? DIFFICULTY_CONFIGS[state.room.difficulty] : DIFFICULTY_CONFIGS.easy;
  const availableColors = state.room ? GAME_COLORS[state.room.difficulty] : GAME_COLORS.easy;

  return {
    state,
    elapsedTime,
    isMyTurn,
    shouldSetCode,
    opponentSecretCode,
    myGuesses,
    opponentGuesses,
    config,
    availableColors,
    handleCreateRoom,
    handleJoinRoom,
    handleSetCode,
    handleSubmitGuess,
    handleUseHint,
    startTimer,
    stopTimer,
    leaveRoom,
  };
}
