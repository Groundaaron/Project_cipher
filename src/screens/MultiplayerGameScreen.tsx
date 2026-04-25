import { useState, useCallback, useEffect, useRef } from 'react';
import anime from 'animejs';
import type { Difficulty, Guess } from '../game/types';
import { DIFFICULTY_CONFIGS, GAME_COLORS, COLORBLIND_PATTERNS } from '../game/constants';
import TimerDisplay from '../components/TimerDisplay';
import FeedbackPegs from '../components/FeedbackPegs';
import { playClick, playSlotFill, playSubmit, playPegReveal } from '../utils/sounds';

interface MultiplayerGameScreenProps {
  difficulty: Difficulty;
  myName: string;
  opponentName: string;
  myGuesses: Guess[];
  opponentAttempts: number;
  maxAttempts: number;
  isMyTurn: boolean;
  isOpponentFinished: boolean;
  elapsedTime: number;
  timeLimit: number;
  onSubmitGuess: (guessColors: string[]) => Promise<Guess | null>;
  onStartTimer: () => void;
  onLeave: () => void;
}

export default function MultiplayerGameScreen({
  difficulty,
  myName,
  opponentName,
  myGuesses,
  opponentAttempts,
  maxAttempts,
  isMyTurn,
  isOpponentFinished,
  elapsedTime,
  timeLimit,
  onSubmitGuess,
  onStartTimer,
  onLeave,
}: MultiplayerGameScreenProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const availableColors = GAME_COLORS[difficulty];
  const [currentInput, setCurrentInput] = useState<(string | null)[]>(Array(config.slots).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
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

  // Start timer on first interaction
  useEffect(() => {
    if (isMyTurn && !timerStarted) {
      onStartTimer();
      setTimerStarted(true);
    }
  }, [isMyTurn, timerStarted, onStartTimer]);

  const handleColorSelect = useCallback((color: string) => {
    if (selectedSlot === null || !isMyTurn) return;
    playSlotFill();
    const newInput = [...currentInput];
    newInput[selectedSlot] = color;
    setCurrentInput(newInput);

    const nextEmpty = newInput.findIndex((c, i) => c === null && i > selectedSlot);
    if (nextEmpty !== -1) {
      setSelectedSlot(nextEmpty);
    } else {
      const anyEmpty = newInput.findIndex((c) => c === null);
      setSelectedSlot(anyEmpty !== -1 ? anyEmpty : null);
    }
  }, [selectedSlot, currentInput, isMyTurn]);

  const handleSubmit = useCallback(async () => {
    if (isAnimating || !currentInput.every(c => c !== null)) return;
    setIsAnimating(true);
    playSubmit();

    const result = await onSubmitGuess(currentInput as string[]);
    if (result) {
      setCurrentInput(Array(config.slots).fill(null));
      setSelectedSlot(0);
      setTimeout(() => {
        if (boardRef.current) boardRef.current.scrollTop = boardRef.current.scrollHeight;
        setIsAnimating(false);
        playPegReveal();
      }, 600);
    } else {
      setIsAnimating(false);
    }
  }, [isAnimating, currentInput, config.slots, onSubmitGuess]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMyTurn) return;
      if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); return; }
      const num = parseInt(e.key);
      if (num >= 1 && num <= config.slots) { setSelectedSlot(num - 1); playClick(); return; }
      if (selectedSlot !== null) {
        const colorIdx = e.key.charCodeAt(0) - 97;
        if (colorIdx >= 0 && colorIdx < availableColors.length) {
          handleColorSelect(availableColors[colorIdx]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMyTurn, selectedSlot, config.slots, availableColors, handleSubmit, handleColorSelect]);

  const isGameOver = myGuesses.length >= maxAttempts || (myGuesses.length > 0 && myGuesses[myGuesses.length - 1].feedback.black === config.slots);

  return (
    <div ref={screenRef} className="min-h-screen flex flex-col" style={{ opacity: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => { playClick(); onLeave(); }}
          className="text-xs tracking-wider uppercase"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Leave
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: isMyTurn ? 'var(--accent)' : 'var(--text-muted)' }}>
            {myName}
          </span>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>vs</span>
          <span className="text-xs font-semibold" style={{ color: isOpponentFinished ? 'var(--success)' : 'var(--text-tertiary)' }}>
            {opponentName}
          </span>
        </div>
        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {isMyTurn ? 'Your turn' : 'Waiting...'}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-5">
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {myGuesses.length}<span style={{ color: 'var(--text-muted)' }}>/{maxAttempts}</span>
            </div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Attempts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--text-tertiary)' }}>
              {opponentAttempts}/{maxAttempts}
            </div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Opponent</div>
          </div>
        </div>
        <TimerDisplay timeRemaining={Math.max(0, timeLimit - elapsedTime)} timeLimit={timeLimit} />
      </div>

      {/* Game Board */}
      <div
        ref={boardRef}
        className="flex-1 mx-4 rounded-2xl p-2 overflow-y-auto space-y-1"
        style={{
          background: 'var(--board-bg)',
          border: '1px solid var(--board-border)',
          backdropFilter: 'blur(10px)',
          maxHeight: 'calc(100vh - 360px)',
        }}
      >
        {/* My guesses */}
        {myGuesses.map((guess, i) => (
          <div
            key={`my-${i}`}
            className="flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{
              background: i === myGuesses.length - 1 ? 'var(--board-row-active-bg)' : 'transparent',
              border: i === myGuesses.length - 1 ? '1px solid var(--board-row-active-border)' : '1px solid transparent',
            }}
          >
            <span className="text-[10px] font-mono w-5 text-right" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
            <div className="flex gap-2">
              {guess.colors.map((color, j) => (
                <div
                  key={j}
                  className="rounded-lg flex items-center justify-center"
                  style={{ width: 36, height: 36, backgroundColor: color, boxShadow: `0 2px 8px ${color}44` }}
                />
              ))}
            </div>
            <div className="ml-auto">
              <FeedbackPegs feedback={guess.feedback} totalSlots={config.slots} />
            </div>
          </div>
        ))}

        {/* Current input row */}
        {isMyTurn && !isGameOver && (
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{
              background: 'var(--board-row-active-bg)',
              border: '1px solid var(--board-row-active-border)',
              boxShadow: `0 0 15px var(--accent-glow)`,
            }}
          >
            <span className="text-[10px] font-mono w-5 text-right" style={{ color: 'var(--accent)' }}>{'>'}</span>
            <div className="flex gap-2">
              {currentInput.map((color, i) => (
                <button
                  key={i}
                  className="rounded-lg flex items-center justify-center transition-all duration-150"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: color || 'var(--slot-empty-bg)',
                    border: color ? 'none' : selectedSlot === i ? '2px solid var(--slot-selected-border)' : '2px dashed var(--slot-empty-border)',
                    boxShadow: color ? `0 2px 8px ${color}44` : selectedSlot === i ? 'var(--slot-selected-glow)' : 'none',
                    cursor: 'pointer',
                    transform: selectedSlot === i ? 'scale(1.08)' : 'scale(1)',
                  }}
                  onClick={() => { playClick(); setSelectedSlot(i); }}
                >
                  {!color && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!currentInput.every(c => c !== null) || isAnimating}
              className="ml-auto px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-200"
              style={{
                backgroundColor: currentInput.every(c => c !== null) && !isAnimating ? 'var(--accent)' : 'var(--btn-secondary-bg)',
                color: currentInput.every(c => c !== null) && !isAnimating ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                cursor: currentInput.every(c => c !== null) && !isAnimating ? 'pointer' : 'not-allowed',
                boxShadow: currentInput.every(c => c !== null) ? `0 0 12px var(--accent-glow)` : 'none',
              }}
            >
              SUBMIT
            </button>
          </div>
        )}

        {/* Empty rows */}
        {isMyTurn && !isGameOver && Array.from({ length: maxAttempts - myGuesses.length - 1 }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center gap-3 px-3 py-2">
            <span className="text-[10px] font-mono w-5 text-right" style={{ color: 'var(--text-muted)' }}>{myGuesses.length + 2 + i}</span>
            <div className="flex gap-2">
              {Array.from({ length: config.slots }).map((_, j) => (
                <div key={j} className="rounded-lg" style={{ width: 36, height: 36, backgroundColor: 'var(--slot-empty-bg)', border: '1px solid var(--slot-empty-border)' }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Color Palette */}
      {selectedSlot !== null && isMyTurn && !isGameOver && (
        <div className="mx-4 mt-3 rounded-xl p-2 glass-panel">
          <div className="text-[9px] uppercase tracking-wider text-center mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Slot {selectedSlot + 1}
          </div>
          <div className="flex gap-2.5 justify-center">
            {availableColors.map((color) => (
              <button
                key={color}
                className="rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                style={{ width: 34, height: 34, backgroundColor: color, boxShadow: `0 2px 12px ${color}55` }}
                onClick={() => handleColorSelect(color)}
              >
                <span className="text-[8px] font-bold text-white/90 drop-shadow">
                  {COLORBLIND_PATTERNS[color] || ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opponent progress bar */}
      <div className="mx-4 mt-3 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {opponentName}'s progress
          </span>
          <span className="text-[9px]" style={{ color: isOpponentFinished ? 'var(--success)' : 'var(--text-tertiary)' }}>
            {isOpponentFinished ? 'Finished' : `${opponentAttempts}/${maxAttempts} attempts`}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--slot-empty-bg)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (opponentAttempts / maxAttempts) * 100)}%`,
              background: isOpponentFinished ? 'var(--success)' : 'var(--accent-gradient)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
