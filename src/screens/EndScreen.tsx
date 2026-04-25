import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import type { Difficulty } from '../game/types';
import { DIFFICULTY_CONFIGS } from '../game/constants';
import { addLeaderboardEntry } from '../game/leaderboard';
import { useTheme } from '../hooks/useTheme';
import { playClick, playWin, playLose } from '../utils/sounds';
import Confetti from '../components/Confetti';

interface EndScreenProps {
  isWin: boolean;
  difficulty: Difficulty;
  attempts: number;
  timeTaken: number;
  hintsUsed: number;
  secretCode: string[];
  onPlayAgain: () => void;
  onLeaderboard: () => void;
  onHome: () => void;
}

export default function EndScreen({
  isWin,
  difficulty,
  attempts,
  timeTaken,
  hintsUsed,
  secretCode,
  onPlayAgain,
  onLeaderboard,
  onHome,
}: EndScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [playerName, setPlayerName] = useState('');
  const [scoreSaved, setScoreSaved] = useState(false);
  const [rankJump, setRankJump] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const { animationsEnabled } = useTheme();

  useEffect(() => {
    if (isWin) playWin();
    else playLose();

    const tl = anime.timeline({ easing: 'easeOutCubic' });

    tl.add({
      targets: messageRef.current,
      opacity: [0, 1],
      scale: [0.5, 1],
      duration: 800,
      easing: 'easeOutBack',
    })
    .add({
      targets: codeRef.current,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 500,
    }, '-=300')
    .add({
      targets: statsRef.current?.querySelectorAll('.stat-card'),
      opacity: [0, 1],
      translateY: [15, 0],
      delay: anime.stagger(80),
      duration: 400,
    }, '-=200')
    .add({
      targets: buttonsRef.current?.querySelectorAll('.end-btn'),
      opacity: [0, 1],
      translateY: [15, 0],
      delay: anime.stagger(80),
      duration: 400,
    }, '-=100');

    if (isWin && messageRef.current) {
      anime({
        targets: messageRef.current,
        textShadow: [
          `0 0 20px var(--success-glow)`,
          `0 0 60px var(--success-glow)`,
          `0 0 20px var(--success-glow)`,
        ],
        duration: 2500,
        loop: true,
        easing: 'easeInOutSine',
      });
    }
  }, [isWin]);

  const handleSaveScore = () => {
    if (!playerName.trim()) return;
    const rankImprovement = addLeaderboardEntry({
      playerName: playerName.trim(),
      difficulty,
      attempts,
      timeTaken,
      date: new Date().toISOString(),
      hintsUsed,
    });
    setScoreSaved(true);
    setRankJump(rankImprovement);
    playClick();
    // Trigger confetti for rank #1 or 3+ position jump
    if (animationsEnabled && (rankImprovement >= 3)) {
      setShowConfetti(true);
    }
  };

  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const maxAttempts = DIFFICULTY_CONFIGS[difficulty].maxAttempts;

  return (
    <div ref={screenRef} className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Confetti */}
      {showConfetti && animationsEnabled && (
        <Confetti
          active={showConfetti}
          duration={2500}
          particleCount={50}
          onDone={() => setShowConfetti(false)}
        />
      )}

      {/* Result Message */}
      <div ref={messageRef} className="text-center mb-8" style={{ opacity: 0 }}>
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-[0.15em] mb-2"
          style={{
            color: isWin ? 'var(--success)' : 'var(--error)',
            textShadow: isWin
              ? `0 0 20px var(--success-glow)`
              : `0 0 20px var(--error-glow)`,
          }}
        >
          {isWin ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
        </h1>
        <p className="text-sm tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          {isWin ? 'Code deciphered successfully' : 'The code remains unbroken'}
        </p>
      </div>

      {/* Secret Code Reveal */}
      <div ref={codeRef} className="flex gap-2 mb-8" style={{ opacity: 0 }}>
        {secretCode.map((color, i) => (
          <div
            key={i}
            className="rounded-lg"
            style={{
              width: 40,
              height: 40,
              backgroundColor: color,
              boxShadow: `0 0 15px ${color}55, 0 2px 8px ${color}33`,
            }}
          />
        ))}
      </div>

      {/* Stats Grid */}
      <div ref={statsRef} className="grid grid-cols-2 gap-3 mb-8 w-full max-w-xs">
        <div
          className="stat-card rounded-xl p-4 text-center"
          style={{
            opacity: 0,
            background: 'var(--stat-bg)',
            border: '1px solid var(--stat-border)',
          }}
        >
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {attempts}<span style={{ color: 'var(--text-muted)' }}>/{maxAttempts}</span>
          </div>
          <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Attempts</div>
        </div>
        <div
          className="stat-card rounded-xl p-4 text-center"
          style={{
            opacity: 0,
            background: 'var(--stat-bg)',
            border: '1px solid var(--stat-border)',
          }}
        >
          <div className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{timeDisplay}</div>
          <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Time</div>
        </div>
        <div
          className="stat-card rounded-xl p-4 text-center"
          style={{
            opacity: 0,
            background: 'var(--stat-bg)',
            border: '1px solid var(--stat-border)',
          }}
        >
          <div className="text-xl font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{difficulty}</div>
          <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Difficulty</div>
        </div>
        <div
          className="stat-card rounded-xl p-4 text-center"
          style={{
            opacity: 0,
            background: 'var(--stat-bg)',
            border: '1px solid var(--stat-border)',
          }}
        >
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{hintsUsed}</div>
          <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Hints Used</div>
        </div>
      </div>

      {/* Save Score */}
      {isWin && !scoreSaved && (
        <div className="w-full max-w-xs mb-6">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter name for leaderboard"
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none mb-2 theme-transition"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveScore()}
            maxLength={20}
          />
          <button
            onClick={handleSaveScore}
            disabled={!playerName.trim()}
            className="w-full py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200"
            style={{
              background: playerName.trim() ? 'var(--accent-glow)' : 'var(--btn-secondary-bg)',
              color: playerName.trim() ? 'var(--accent-light)' : 'var(--text-muted)',
              border: playerName.trim() ? '1px solid var(--accent-glow-strong)' : '1px solid var(--btn-secondary-border)',
            }}
          >
            Save Score
          </button>
        </div>
      )}

      {scoreSaved && (
        <div className="mb-6 text-center">
          <p className="text-xs tracking-wider" style={{ color: 'var(--success)' }}>Score saved to leaderboard</p>
          {rankJump >= 3 && (
            <p className="text-[10px] mt-1 tracking-wider" style={{ color: 'var(--accent)' }}>
              Rank improved by {rankJump} positions!
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div ref={buttonsRef} className="flex flex-col gap-2 w-full max-w-xs">
        <button
          className="end-btn w-full py-3.5 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            opacity: 0,
            background: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            boxShadow: 'var(--btn-primary-shadow)',
          }}
          onClick={() => { playClick(); onPlayAgain(); }}
        >
          Play Again
        </button>
        <button
          className="end-btn w-full py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            opacity: 0,
            background: 'var(--btn-secondary-bg)',
            color: 'var(--btn-secondary-text)',
            border: '1px solid var(--btn-secondary-border)',
          }}
          onClick={() => { playClick(); onLeaderboard(); }}
        >
          Leaderboard
        </button>
        <button
          className="end-btn w-full py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            opacity: 0,
            background: 'var(--btn-secondary-bg)',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--btn-secondary-border)',
          }}
          onClick={() => { playClick(); onHome(); }}
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
