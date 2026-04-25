import { useState, useCallback, useEffect, useRef } from 'react';
import anime from 'animejs';
import { useGameState } from '../hooks/useGameState';
import { useAmbient } from '../hooks/useAmbient';
import type { Difficulty } from '../game/types';
import TimerDisplay from '../components/TimerDisplay';
import GuessRow from '../components/GuessRow';
import InputRow from '../components/InputRow';
import ColorPalette from '../components/ColorPalette';
import EmptyRow from '../components/EmptyRow';
import { playClick, playSlotFill, playSubmit, playPegReveal, playHint } from '../utils/sounds';

interface GameScreenProps {
  difficulty: Difficulty;
  onGameEnd: (result: { isWin: boolean; attempts: number; timeTaken: number; hintsUsed: number; secretCode: string[]; difficulty: Difficulty }) => void;
  onBack: () => void;
  onLeaderboard: () => void;
}

export default function GameScreen({ difficulty, onGameEnd, onBack, onLeaderboard }: GameScreenProps) {
  const {
    gameState,
    isAnimating,
    setIsAnimating,
    setDifficulty,
    setSlotColor,
    submitGuess,
    useHint,
    newGame,
    startTimer,
    availableColors,
    config,
  } = useGameState();

  const { startGameAmbient, stopGameAmbient, setTension } = useAmbient();

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [colorblindMode, setColorblindMode] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDifficulty(difficulty);
  }, [difficulty, setDifficulty]);

  useEffect(() => {
    if (gameStarted && !gameState.isGameOver) {
      startTimer();
    }
  }, [gameStarted, gameState.isGameOver, startTimer]);

  // Start ambient on mount, stop on unmount
  useEffect(() => {
    startGameAmbient();
    return () => {
      stopGameAmbient();
    };
  }, [startGameAmbient, stopGameAmbient]);

  // Dynamic tension: increase intensity during tense moments
  useEffect(() => {
    if (gameState.isGameOver) {
      setTension(0);
      return;
    }

    const attemptFraction = gameState.currentRow / config.maxAttempts;
    const timeFraction = gameState.timeRemaining / config.timeLimit;

    // Tense when: low time, many attempts used, or last few attempts
    let tension = 0;
    if (timeFraction < 0.2) tension = Math.max(tension, 1 - timeFraction / 0.2);
    if (attemptFraction > 0.7) tension = Math.max(tension, (attemptFraction - 0.7) / 0.3);
    if (config.maxAttempts - gameState.currentRow <= 2) tension = Math.max(tension, 0.8);

    setTension(Math.min(1, tension));
  }, [gameState.currentRow, gameState.timeRemaining, gameState.isGameOver, config.maxAttempts, config.timeLimit, setTension]);

  useEffect(() => {
    if (!screenRef.current) return;
    anime({
      targets: screenRef.current,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 600,
      easing: 'easeOutCubic',
    });
  }, []);

  useEffect(() => {
    if (gameState.isGameOver) {
      const timeTaken = config.timeLimit - gameState.timeRemaining;
      const timer = setTimeout(() => {
        onGameEnd({
          isWin: gameState.isWin,
          attempts: gameState.currentRow,
          timeTaken,
          hintsUsed: gameState.hintsUsed,
          secretCode: gameState.secretCode,
          difficulty: gameState.difficulty,
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.isGameOver, gameState.isWin, gameState.currentRow, gameState.hintsUsed, gameState.secretCode, gameState.difficulty, config.timeLimit, onGameEnd]);

  const handleSlotClick = useCallback((slotIndex: number) => {
    if (gameState.isGameOver) return;
    if (gameState.revealedHints.includes(slotIndex)) return;
    if (!gameStarted) setGameStarted(true);
    setSelectedSlot(slotIndex);
    playClick();
  }, [gameState.isGameOver, gameState.revealedHints, gameStarted]);

  const handleColorSelect = useCallback((color: string) => {
    if (selectedSlot === null) return;
    setSlotColor(selectedSlot, color);
    playSlotFill();
    const nextEmpty = gameState.currentInput.findIndex((c, i) => c === null && i > selectedSlot);
    if (nextEmpty !== -1) {
      setSelectedSlot(nextEmpty);
    } else {
      const anyEmpty = gameState.currentInput.findIndex((c, i) => c === null && i !== selectedSlot);
      setSelectedSlot(anyEmpty !== -1 ? anyEmpty : null);
    }
  }, [selectedSlot, setSlotColor, gameState.currentInput]);

  const handleSubmit = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    playSubmit();
    const result = submitGuess();
    if (result) {
      setTimeout(() => {
        if (boardRef.current) {
          boardRef.current.scrollTop = boardRef.current.scrollHeight;
        }
        setIsAnimating(false);
        playPegReveal();
      }, 600);
    } else {
      setIsAnimating(false);
    }
  }, [isAnimating, setIsAnimating, submitGuess]);

  const handleHint = useCallback(() => {
    if (gameState.isGameOver) return;
    if (!gameStarted) setGameStarted(true);
    useHint();
    playHint();
  }, [gameState.isGameOver, gameStarted, useHint]);

  const handleBack = useCallback(() => {
    stopGameAmbient();
    playClick();
    onBack();
  }, [stopGameAmbient, onBack]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isGameOver) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
        return;
      }

      const num = parseInt(e.key);
      if (num >= 1 && num <= config.slots) {
        setSelectedSlot(num - 1);
        playClick();
        return;
      }

      if (selectedSlot !== null) {
        const colorIdx = e.key.charCodeAt(0) - 97;
        if (colorIdx >= 0 && colorIdx < availableColors.length) {
          setSlotColor(selectedSlot, availableColors[colorIdx]);
          playSlotFill();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isGameOver, selectedSlot, config.slots, availableColors, setSlotColor, handleSubmit]);

  return (
    <div ref={screenRef} className="min-h-screen flex flex-col" style={{ opacity: 0 }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={handleBack}
          className="text-xs tracking-wider uppercase transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Back
        </button>
        <h2
          className="text-sm font-bold tracking-[0.15em]"
          style={{
            background: 'var(--title-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PROJECT CIPHER
        </h2>
        <button
          onClick={() => { playClick(); setShowRules(!showRules); }}
          className="text-xs tracking-wider uppercase transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Rules
        </button>
      </div>

      {/* Rules overlay */}
      {showRules && (
        <div className="mx-4 mb-3 rounded-xl p-4 glass-panel">
          <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <p>Crack the hidden color code within the allowed attempts.</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--peg-black)', border: '1px solid var(--peg-empty-border)' }} />
              <span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Black peg</span> = correct color, correct position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--peg-white)' }} />
              <span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>White peg</span> = correct color, wrong position</span>
            </div>
            <p className="pt-1" style={{ color: 'var(--text-muted)', fontSize: 10 }}>Keyboard: 1-6 select slot, A-F pick color, Enter to submit</p>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-5">
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {gameState.currentRow}<span style={{ color: 'var(--text-muted)' }}>/{config.maxAttempts}</span>
            </div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Attempts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{gameState.hintsUsed}</div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Hints</div>
          </div>
        </div>
        <TimerDisplay timeRemaining={gameState.timeRemaining} timeLimit={config.timeLimit} />
      </div>

      {/* Game Board */}
      <div
        ref={boardRef}
        className="flex-1 mx-4 rounded-2xl p-2 overflow-y-auto space-y-1"
        style={{
          background: 'var(--board-bg)',
          border: '1px solid var(--board-border)',
          backdropFilter: 'blur(10px)',
          maxHeight: 'calc(100vh - 340px)',
        }}
      >
        {gameState.guesses.map((guess, i) => (
          <GuessRow
            key={i}
            guess={guess}
            totalSlots={config.slots}
            rowIndex={i}
            colorblindMode={colorblindMode}
            isLatest={i === gameState.guesses.length - 1}
          />
        ))}

        {!gameState.isGameOver && (
          <InputRow
            currentInput={gameState.currentInput}
            onSlotClick={handleSlotClick}
            onSubmit={handleSubmit}
            isDisabled={isAnimating}
            colorblindMode={colorblindMode}
            revealedHints={gameState.revealedHints}
            secretCode={gameState.secretCode}
            selectedSlot={selectedSlot}
          />
        )}

        {!gameState.isGameOver && Array.from({ length: config.maxAttempts - gameState.currentRow - 1 }).map((_, i) => (
          <EmptyRow
            key={`empty-${i}`}
            totalSlots={config.slots}
            rowIndex={gameState.currentRow + 1 + i}
          />
        ))}
      </div>

      {/* Color Palette */}
      {selectedSlot !== null && !gameState.isGameOver && (
        <div className="mx-4 mt-3 rounded-xl p-2 glass-panel">
          <div className="text-[9px] uppercase tracking-wider text-center mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Slot {selectedSlot + 1} &mdash; Select Color
          </div>
          <ColorPalette
            availableColors={availableColors}
            selectedSlot={selectedSlot}
            onColorSelect={handleColorSelect}
            colorblindMode={colorblindMode}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mx-4 mt-3 mb-4">
        <button
          onClick={handleHint}
          disabled={gameState.isGameOver || gameState.revealedHints.length >= config.slots}
          className="flex-1 py-2.5 rounded-xl text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: gameState.isGameOver || gameState.revealedHints.length >= config.slots
              ? 'var(--btn-secondary-bg)'
              : 'var(--warning-glow)',
            color: gameState.isGameOver || gameState.revealedHints.length >= config.slots
              ? 'var(--text-muted)'
              : 'var(--warning)',
            border: '1px solid var(--warning-glow)',
          }}
        >
          Hint
        </button>
        <button
          onClick={() => setColorblindMode(!colorblindMode)}
          className="px-3 py-2.5 rounded-xl text-[10px] font-semibold transition-all duration-200"
          style={{
            background: colorblindMode ? 'var(--accent-glow)' : 'var(--btn-secondary-bg)',
            color: colorblindMode ? 'var(--accent-light)' : 'var(--text-muted)',
            border: colorblindMode ? '1px solid var(--accent-glow-strong)' : '1px solid var(--btn-secondary-border)',
          }}
        >
          Aa
        </button>
        <button
          onClick={() => { playClick(); onLeaderboard(); }}
          className="px-3 py-2.5 rounded-xl text-[10px] font-semibold transition-all duration-200"
          style={{
            background: 'var(--btn-secondary-bg)',
            color: 'var(--text-muted)',
            border: '1px solid var(--btn-secondary-border)',
          }}
        >
          Rank
        </button>
        <button
          onClick={() => { playClick(); newGame(); setGameStarted(false); setSelectedSlot(null); }}
          className="px-3 py-2.5 rounded-xl text-[10px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'var(--btn-secondary-bg)',
            color: 'var(--text-muted)',
            border: '1px solid var(--btn-secondary-border)',
          }}
        >
          New
        </button>
      </div>
    </div>
  );
}
