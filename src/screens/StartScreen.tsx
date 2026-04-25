import { useEffect, useRef } from 'react';
import anime from 'animejs';
import type { Difficulty } from '../game/types';
import { DIFFICULTY_CONFIGS } from '../game/constants';
import { playClick } from '../utils/sounds';

interface StartScreenProps {
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onPlay: () => void;
  onLeaderboard: () => void;
  onMultiplayer: () => void;
}

export default function StartScreen({ difficulty, onDifficultyChange, onPlay, onLeaderboard, onMultiplayer }: StartScreenProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const diffRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = anime.timeline({ easing: 'easeOutCubic' });

    tl.add({
      targets: decorRef.current,
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 800,
    })
    .add({
      targets: titleRef.current,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 900,
    }, '-=400')
    .add({
      targets: subtitleRef.current,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 600,
    }, '-=400')
    .add({
      targets: diffRef.current?.querySelectorAll('.diff-btn'),
      opacity: [0, 1],
      translateY: [15, 0],
      scale: [0.9, 1],
      delay: anime.stagger(100),
      duration: 500,
    }, '-=200')
    .add({
      targets: buttonsRef.current?.querySelectorAll('.action-btn'),
      opacity: [0, 1],
      translateY: [20, 0],
      scale: [0.9, 1],
      delay: anime.stagger(120),
      duration: 500,
    }, '-=200');

    anime({
      targets: buttonsRef.current?.querySelector('.play-btn'),
      boxShadow: [
        'var(--btn-primary-shadow)',
        `0 0 30px var(--accent-glow-strong), 0 0 60px var(--accent-glow)`,
        'var(--btn-primary-shadow)',
      ],
      duration: 3000,
      loop: true,
      easing: 'easeInOutSine',
    });
  }, []);

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  const diffDescriptions: Record<Difficulty, string> = {
    easy: `${DIFFICULTY_CONFIGS.easy.slots} slots / ${DIFFICULTY_CONFIGS.easy.colors} colors / ${DIFFICULTY_CONFIGS.easy.maxAttempts} attempts`,
    medium: `${DIFFICULTY_CONFIGS.medium.slots} slots / ${DIFFICULTY_CONFIGS.medium.colors} colors / ${DIFFICULTY_CONFIGS.medium.maxAttempts} attempts`,
    hard: `${DIFFICULTY_CONFIGS.hard.slots} slots / ${DIFFICULTY_CONFIGS.hard.colors} colors / ${DIFFICULTY_CONFIGS.hard.maxAttempts} attempts`,
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      {/* Decorative ring */}
      <div
        ref={decorRef}
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          border: '1px solid var(--accent-glow)',
          boxShadow: `0 0 80px var(--accent-glow) inset`,
          opacity: 0,
        }}
      />

      {/* Title */}
      <div ref={titleRef} className="text-center mb-4" style={{ opacity: 0 }}>
        <h1
          className="text-5xl sm:text-6xl font-bold tracking-[0.2em] mb-3"
          style={{
            background: 'var(--title-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 30px var(--accent-glow))`,
          }}
        >
          PROJECT CIPHER
        </h1>
        <div className="h-px w-48 mx-auto" style={{
          background: `linear-gradient(90deg, transparent, var(--accent-glow-strong), transparent)`,
        }} />
      </div>

      {/* Subtitle */}
      <p
        ref={subtitleRef}
        className="text-sm tracking-[0.3em] uppercase mb-12 text-center"
        style={{ opacity: 0, color: 'var(--text-tertiary)' }}
      >
        Crack the Code. Outsmart the System.
      </p>

      {/* Difficulty Selector */}
      <div ref={diffRef} className="mb-10 w-full max-w-sm">
        <div className="text-[10px] uppercase tracking-[0.2em] text-center mb-3" style={{ color: 'var(--text-muted)' }}>
          Select Difficulty
        </div>
        <div className="flex gap-2 justify-center">
          {difficulties.map(diff => (
            <button
              key={diff}
              className="diff-btn px-5 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all duration-200"
              style={{
                opacity: 0,
                background: difficulty === diff ? 'var(--accent-gradient)' : 'var(--btn-secondary-bg)',
                color: difficulty === diff ? 'var(--btn-primary-text)' : 'var(--btn-secondary-text)',
                border: difficulty === diff
                  ? '1px solid var(--accent-glow-strong)'
                  : '1px solid var(--btn-secondary-border)',
                boxShadow: difficulty === diff ? 'var(--btn-primary-shadow)' : 'none',
              }}
              onClick={() => { playClick(); onDifficultyChange(diff); }}
            >
              {diff}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          {diffDescriptions[difficulty]}
        </p>
      </div>

      {/* Action Buttons */}
      <div ref={buttonsRef} className="flex flex-col gap-3 w-full max-w-xs">
        <button
          className="action-btn play-btn w-full py-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          style={{
            opacity: 0,
            background: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            boxShadow: 'var(--btn-primary-shadow)',
          }}
          onClick={() => { playClick(); onPlay(); }}
        >
          Initialize Game
        </button>
        <button
          className="action-btn w-full py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            opacity: 0,
            background: 'var(--btn-secondary-bg)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-glow)',
          }}
          onClick={() => { playClick(); onMultiplayer(); }}
        >
          1v1 Battle
        </button>
        <button
          className="action-btn w-full py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
      </div>

      {/* Bottom tagline */}
      <p className="absolute bottom-6 text-[10px] tracking-[0.3em] uppercase" style={{ color: 'var(--text-muted)' }}>
        Mastermind Deduction System v2.0
      </p>
    </div>
  );
}
