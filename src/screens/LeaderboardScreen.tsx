import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import type { Difficulty } from '../game/types';
import { DIFFICULTY_CONFIGS } from '../game/constants';
import { getLeaderboard, clearLeaderboard, type TimePeriod } from '../game/leaderboard';
import { useTheme } from '../hooks/useTheme';
import { playClick } from '../utils/sounds';
import Confetti from '../components/Confetti';

interface LeaderboardScreenProps {
  onBack: () => void;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

const RANK_STYLES = [
  { badge: '\u{1F947}', glow: 'var(--accent-glow-strong)', border: 'var(--accent-glow-strong)' },
  { badge: '\u{1F948}', glow: 'var(--accent-glow)', border: 'var(--accent-glow)' },
  { badge: '\u{1F949}', glow: 'var(--warning-glow)', border: 'var(--warning-glow)' },
];

const TABS: { key: TimePeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export default function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [period, setPeriod] = useState<TimePeriod>('today');
  const [showConfetti, setShowConfetti] = useState(false);
  const [topRowConfetti, setTopRowConfetti] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const { animationsEnabled, setAnimationsEnabled } = useTheme();

  const screenRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const entries = getLeaderboard(period);

  // First-open confetti
  useEffect(() => {
    if (!hasOpenedOnce && animationsEnabled) {
      setHasOpenedOnce(true);
      setShowConfetti(true);
    }
  }, [hasOpenedOnce, animationsEnabled]);

  // Animate in
  useEffect(() => {
    if (!animationsEnabled) return;
    const tl = anime.timeline({ easing: 'easeOutCubic' });
    tl.add({
      targets: headerRef.current,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 500,
    })
    .add({
      targets: tabsRef.current,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 400,
    }, '-=300')
    .add({
      targets: listRef.current?.querySelectorAll('.lb-entry'),
      opacity: [0, 1],
      translateX: [-15, 0],
      delay: anime.stagger(40, { start: 100 }),
      duration: 400,
    }, '-=200');
  }, [animationsEnabled]);

  // Animate tab switch
  useEffect(() => {
    if (!animationsEnabled || !listRef.current) return;
    anime({
      targets: listRef.current.querySelectorAll('.lb-entry'),
      opacity: [0, 1],
      translateX: [-10, 0],
      delay: anime.stagger(30),
      duration: 350,
      easing: 'easeOutCubic',
    });
  }, [period, animationsEnabled]);

  // Top row confetti burst
  useEffect(() => {
    if (entries.length > 0 && animationsEnabled) {
      const timer = setTimeout(() => setTopRowConfetti(true), 600);
      return () => clearTimeout(timer);
    }
  }, [period, animationsEnabled]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleTabChange = (key: TimePeriod) => {
    if (key === period) return;
    playClick();
    setPeriod(key);
  };

  const handleClear = () => {
    clearLeaderboard();
    if (listRef.current && animationsEnabled) {
      anime({
        targets: listRef.current.querySelectorAll('.lb-entry'),
        opacity: [1, 0],
        translateX: [0, 15],
        delay: anime.stagger(30),
        duration: 300,
        easing: 'easeInCubic',
        complete: () => window.location.reload(),
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <div ref={screenRef} className="min-h-screen flex flex-col px-4 py-6">
      {/* Confetti */}
      {showConfetti && animationsEnabled && (
        <Confetti
          active={showConfetti}
          duration={2500}
          particleCount={50}
          onDone={() => setShowConfetti(false)}
        />
      )}
      {topRowConfetti && animationsEnabled && (
        <Confetti
          active={topRowConfetti}
          duration={1500}
          particleCount={20}
          originY={0.12}
          originX={0.5}
          spread={0.6}
          onDone={() => setTopRowConfetti(false)}
        />
      )}

      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between mb-4" style={{ opacity: animationsEnabled ? 0 : 1 }}>
        <button
          onClick={() => { playClick(); onBack(); }}
          className="text-xs tracking-wider uppercase transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Back
        </button>
        <h2
          className="text-lg font-bold tracking-[0.15em]"
          style={{
            background: 'var(--title-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          LEADERBOARD
        </h2>
        <button
          onClick={() => setAnimationsEnabled(!animationsEnabled)}
          className="text-[10px] tracking-wider uppercase transition-colors"
          style={{ color: animationsEnabled ? 'var(--accent)' : 'var(--text-muted)' }}
          title={animationsEnabled ? 'Animations on' : 'Animations off'}
        >
          {animationsEnabled ? 'FX' : 'FX'}
        </button>
      </div>

      {/* Tabs */}
      <div
        ref={tabsRef}
        className="flex gap-1 mb-4 rounded-xl p-1"
        style={{
          opacity: animationsEnabled ? 0 : 1,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-300"
            style={{
              background: period === tab.key ? 'var(--accent-gradient)' : 'transparent',
              color: period === tab.key ? 'var(--btn-primary-text)' : 'var(--text-tertiary)',
              boxShadow: period === tab.key ? 'var(--btn-primary-shadow)' : 'none',
              transform: period === tab.key ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div
        ref={listRef}
        className="flex-1 rounded-2xl p-4 overflow-y-auto glass-panel"
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-4xl mb-3" style={{ color: 'var(--text-muted)' }}>?</div>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No scores this period</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Play a game to get on the board</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
              <span className="col-span-1">#</span>
              <span className="col-span-3">Player</span>
              <span className="col-span-2">Diff</span>
              <span className="col-span-3">Attempts</span>
              <span className="col-span-3">Time</span>
            </div>

            {entries.map((entry, i) => {
              const isTop3 = i < 3;
              const rankStyle = isTop3 ? RANK_STYLES[i] : null;

              return (
                <div
                  key={`${period}-${i}`}
                  className="lb-entry grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all duration-200"
                  style={{
                    opacity: animationsEnabled ? 0 : 1,
                    background: isTop3
                      ? 'var(--lb-highlight-bg)'
                      : 'var(--lb-row-bg)',
                    border: isTop3
                      ? `1px solid ${rankStyle?.border}`
                      : '1px solid transparent',
                    boxShadow: isTop3
                      ? `0 0 16px ${rankStyle?.glow}`
                      : 'none',
                  }}
                >
                  <span className="col-span-1 font-mono text-xs flex items-center" style={{ color: isTop3 ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                    {isTop3 ? (
                      <span className="text-sm">{rankStyle?.badge}</span>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className="col-span-3 truncate text-xs font-semibold"
                    style={{ color: isTop3 ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {entry.playerName}
                  </span>
                  <span
                    className="col-span-2 text-xs font-semibold"
                    style={{ color: DIFFICULTY_COLORS[entry.difficulty] }}
                  >
                    {DIFFICULTY_LABELS[entry.difficulty]}
                  </span>
                  <span className="col-span-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {entry.attempts}/{DIFFICULTY_CONFIGS[entry.difficulty].maxAttempts}
                    {entry.hintsUsed > 0 && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>+{entry.hintsUsed}h</span>
                    )}
                  </span>
                  <span className="col-span-3 font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {formatTime(entry.timeTaken)}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex gap-2 mt-4">
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="px-4 py-2.5 rounded-xl text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'var(--error-glow)',
              color: 'var(--error)',
              border: '1px solid var(--error-glow)',
            }}
          >
            Clear All
          </button>
        )}
        <button
          onClick={() => { playClick(); onBack(); }}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02]"
          style={{
            background: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
