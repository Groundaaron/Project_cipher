import { useEffect, useRef } from 'react';
import anime from 'animejs';

interface TimerDisplayProps {
  timeRemaining: number;
  timeLimit: number;
}

export default function TimerDisplay({ timeRemaining, timeLimit }: TimerDisplayProps) {
  const progressRef = useRef<SVGCircleElement>(null);
  const prevColorRef = useRef('');

  const fraction = timeRemaining / timeLimit;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - fraction);

  // Resolve colors for anime.js (it can't animate CSS var strings)
  const resolvedColor = fraction < 0.25 ? '#ef4444' : fraction < 0.5 ? '#f59e0b' : '#22c55e';

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  useEffect(() => {
    if (progressRef.current && resolvedColor !== prevColorRef.current) {
      anime({
        targets: progressRef.current,
        stroke: resolvedColor,
        duration: 500,
        easing: 'easeInOutQuad',
      });
      prevColorRef.current = resolvedColor;
    }
  }, [resolvedColor]);

  useEffect(() => {
    if (fraction < 0.2 && progressRef.current) {
      anime({
        targets: progressRef.current,
        strokeWidth: [5, 7, 5],
        duration: 1000,
        loop: true,
        easing: 'easeInOutSine',
      });
    }
  }, [fraction]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke="var(--timer-track)"
          strokeWidth="5"
        />
        <circle
          ref={progressRef}
          cx="50" cy="50" r="42"
          fill="none"
          stroke={resolvedColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="text-xs font-mono font-bold" style={{
        color: fraction < 0.25 ? 'var(--error)' : 'var(--timer-text)',
      }}>
        {display}
      </span>
    </div>
  );
}
