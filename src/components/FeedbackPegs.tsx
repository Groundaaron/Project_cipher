import { useEffect, useRef } from 'react';
import anime from 'animejs';
import type { Feedback } from '../game/types';

interface FeedbackPegsProps {
  feedback: Feedback;
  totalSlots: number;
  animate?: boolean;
}

export default function FeedbackPegs({ feedback, totalSlots, animate = true }: FeedbackPegsProps) {
  const pegsRef = useRef<HTMLDivElement>(null);
  const totalPegs = totalSlots;
  const pegs: ('black' | 'white' | 'empty')[] = [];

  for (let i = 0; i < feedback.black; i++) pegs.push('black');
  for (let i = 0; i < feedback.white; i++) pegs.push('white');
  while (pegs.length < totalPegs) pegs.push('empty');

  useEffect(() => {
    if (!animate || !pegsRef.current) return;
    const items = pegsRef.current.querySelectorAll('.feedback-peg');
    anime({
      targets: items,
      scale: [0, 1],
      opacity: [0, 1],
      delay: anime.stagger(100),
      duration: 500,
      easing: 'easeOutBack',
    });
  }, [feedback, animate]);

  const cols = totalSlots <= 4 ? 2 : totalSlots <= 6 ? 3 : 4;

  return (
    <div
      ref={pegsRef}
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {pegs.map((peg, i) => (
        <div
          key={i}
          className="feedback-peg rounded-full"
          style={{
            width: 12,
            height: 12,
            backgroundColor: peg === 'black' ? 'var(--peg-black)' : peg === 'white' ? 'var(--peg-white)' : 'var(--peg-empty)',
            border: peg === 'empty' ? '1px solid var(--peg-empty-border)' : 'none',
            boxShadow: peg === 'black'
              ? 'var(--peg-black-shadow)'
              : peg === 'white'
              ? 'var(--peg-white-shadow)'
              : 'none',
          }}
        />
      ))}
    </div>
  );
}
