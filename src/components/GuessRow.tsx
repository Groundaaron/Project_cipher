import { useEffect, useRef } from 'react';
import anime from 'animejs';
import type { Guess } from '../game/types';
import FeedbackPegs from './FeedbackPegs';
import { COLORBLIND_PATTERNS } from '../game/constants';

interface GuessRowProps {
  guess: Guess;
  totalSlots: number;
  rowIndex: number;
  colorblindMode: boolean;
  isLatest?: boolean;
}

export default function GuessRow({ guess, totalSlots, rowIndex, colorblindMode, isLatest }: GuessRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rowRef.current) return;
    anime({
      targets: rowRef.current,
      translateY: [12, 0],
      opacity: [0, 1],
      duration: 500,
      easing: 'easeOutCubic',
    });

    if (slotsRef.current) {
      anime({
        targets: slotsRef.current.querySelectorAll('.guess-slot'),
        scale: [0.8, 1],
        opacity: [0, 1],
        delay: anime.stagger(60, { start: 200 }),
        duration: 400,
        easing: 'easeOutBack',
      });
    }

    if (isLatest && guess.feedback.black === totalSlots && slotsRef.current) {
      anime({
        targets: slotsRef.current.querySelectorAll('.guess-slot'),
        boxShadow: (el: Element) => {
          const bg = (el as HTMLElement).style.backgroundColor;
          return [`0 0 20px ${bg}66, 0 0 40px ${bg}33`, `0 2px 8px ${bg}44`];
        },
        duration: 1000,
        easing: 'easeOutCubic',
      });
    }
  }, [guess, isLatest, totalSlots]);

  return (
    <div
      ref={rowRef}
      className="flex items-center gap-3 px-3 py-2 rounded-xl"
      style={{
        opacity: 0,
        background: isLatest ? 'var(--board-row-active-bg)' : 'transparent',
        border: isLatest ? '1px solid var(--board-row-active-border)' : '1px solid transparent',
      }}
    >
      <span className="text-[10px] font-mono w-5 text-right" style={{ color: 'var(--text-muted)' }}>{rowIndex + 1}</span>
      <div ref={slotsRef} className="flex gap-2">
        {guess.colors.map((color, i) => (
          <div
            key={i}
            className="guess-slot rounded-lg flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              backgroundColor: color,
              boxShadow: `0 2px 8px ${color}44`,
              opacity: 0,
            }}
          >
            {colorblindMode && (
              <span className="text-[9px] font-bold text-white/90 drop-shadow">
                {COLORBLIND_PATTERNS[color] || ''}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="ml-auto">
        <FeedbackPegs feedback={guess.feedback} totalSlots={totalSlots} />
      </div>
    </div>
  );
}
