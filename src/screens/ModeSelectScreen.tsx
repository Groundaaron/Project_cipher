import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { playClick } from '../utils/sounds';

interface ModeSelectScreenProps {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
  onBack: () => void;
}

export default function ModeSelectScreen({ onSinglePlayer, onMultiplayer, onBack }: ModeSelectScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!screenRef.current) return;
    const tl = anime.timeline({ easing: 'easeOutCubic' });

    tl.add({
      targets: screenRef.current.querySelector('.mode-title'),
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
    })
    .add({
      targets: cardsRef.current?.querySelectorAll('.mode-card'),
      opacity: [0, 1],
      translateY: [25, 0],
      scale: [0.95, 1],
      delay: anime.stagger(120),
      duration: 500,
    }, '-=300');
  }, []);

  return (
    <div ref={screenRef} className="min-h-screen flex flex-col items-center justify-center px-4">
      <button
        onClick={() => { playClick(); onBack(); }}
        className="absolute top-4 left-4 text-xs tracking-wider uppercase"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Back
      </button>

      <h2
        className="mode-title text-3xl font-bold tracking-[0.15em] mb-2"
        style={{
          opacity: 0,
          background: 'var(--title-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        SELECT MODE
      </h2>
      <p className="text-sm mb-10" style={{ color: 'var(--text-tertiary)' }}>
        Choose your challenge
      </p>

      <div ref={cardsRef} className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {/* Single Player Card */}
        <button
          className="mode-card flex-1 rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            opacity: 0,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
          }}
          onClick={() => { playClick(); onSinglePlayer(); }}
        >
          <div className="text-2xl mb-3" style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
              <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Solo Mode</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Crack the code against the system. Classic Mastermind gameplay.
          </p>
        </button>

        {/* Multiplayer Card */}
        <button
          className="mode-card flex-1 rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            opacity: 0,
            background: 'var(--glass-bg)',
            border: '1px solid var(--accent-glow)',
            boxShadow: `var(--glass-shadow), 0 0 20px var(--accent-glow)`,
          }}
          onClick={() => { playClick(); onMultiplayer(); }}
        >
          <div className="text-2xl mb-3" style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
              <circle cx="9" cy="7" r="4" /><circle cx="17" cy="7" r="3" /><path d="M5 21a6 6 0 0 1 8 0" /><path d="M17 14a5 5 0 0 1 4 3.5" />
            </svg>
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>1v1 Battle</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Set a code, guess theirs. Best of two rounds wins.
          </p>
        </button>
      </div>
    </div>
  );
}
