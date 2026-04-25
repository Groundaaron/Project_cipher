import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import type { Difficulty } from '../game/types';
import { DIFFICULTY_CONFIGS } from '../game/constants';
import { playClick } from '../utils/sounds';

interface LobbyScreenProps {
  onCreateRoom: (difficulty: Difficulty, playerName: string) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  onBack: () => void;
}

export default function LobbyScreen({ onCreateRoom, onJoinRoom, onBack }: LobbyScreenProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!screenRef.current) return;
    anime({
      targets: screenRef.current,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 500,
      easing: 'easeOutCubic',
    });
  }, []);

  useEffect(() => {
    setError('');
  }, [tab]);

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  const handleCreate = () => {
    if (!playerName.trim()) { setError('Enter your name'); return; }
    playClick();
    onCreateRoom(difficulty, playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim()) { setError('Enter your name'); return; }
    if (!roomCode.trim()) { setError('Enter room code'); return; }
    playClick();
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div ref={screenRef} className="min-h-screen flex flex-col items-center justify-center px-4" style={{ opacity: 0 }}>
      <button
        onClick={() => { playClick(); onBack(); }}
        className="absolute top-4 left-4 text-xs tracking-wider uppercase"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Back
      </button>

      <h2
        className="text-2xl font-bold tracking-[0.15em] mb-2"
        style={{
          background: 'var(--title-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        1v1 BATTLE
      </h2>
      <p className="text-xs mb-8" style={{ color: 'var(--text-tertiary)' }}>
        Create or join a room to compete
      </p>

      {/* Tab Switch */}
      <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
        <button
          onClick={() => { playClick(); setTab('create'); }}
          className="px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200"
          style={{
            background: tab === 'create' ? 'var(--accent-gradient)' : 'transparent',
            color: tab === 'create' ? 'var(--btn-primary-text)' : 'var(--text-tertiary)',
          }}
        >
          Create
        </button>
        <button
          onClick={() => { playClick(); setTab('join'); }}
          className="px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200"
          style={{
            background: tab === 'join' ? 'var(--accent-gradient)' : 'transparent',
            color: tab === 'join' ? 'var(--btn-primary-text)' : 'var(--text-tertiary)',
          }}
        >
          Join
        </button>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {/* Player Name */}
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={15}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none theme-transition"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {tab === 'create' && (
          <>
            {/* Difficulty */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Difficulty
              </label>
              <div className="flex gap-2">
                {difficulties.map(diff => (
                  <button
                    key={diff}
                    onClick={() => { playClick(); setDifficulty(diff); }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
                    style={{
                      background: difficulty === diff ? 'var(--accent-gradient)' : 'var(--btn-secondary-bg)',
                      color: difficulty === diff ? 'var(--btn-primary-text)' : 'var(--btn-secondary-text)',
                      border: difficulty === diff ? '1px solid var(--accent-glow-strong)' : '1px solid var(--btn-secondary-border)',
                    }}
                  >
                    {diff}
                  </button>
                ))}
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                {DIFFICULTY_CONFIGS[difficulty].slots} slots / {DIFFICULTY_CONFIGS[difficulty].colors} colors / {DIFFICULTY_CONFIGS[difficulty].maxAttempts} attempts
              </p>
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                boxShadow: 'var(--btn-primary-shadow)',
              }}
            >
              Create Room
            </button>
          </>
        )}

        {tab === 'join' && (
          <>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-mono tracking-widest text-center outline-none theme-transition"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <button
              onClick={handleJoin}
              className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                boxShadow: 'var(--btn-primary-shadow)',
              }}
            >
              Join Room
            </button>
          </>
        )}

        {error && (
          <p className="text-xs text-center" style={{ color: 'var(--error)' }}>{error}</p>
        )}
      </div>
    </div>
  );
}
