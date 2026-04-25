import { useEffect, useRef } from 'react';
import anime from 'animejs';
import type { Difficulty } from '../game/types';
import { DIFFICULTY_CONFIGS } from '../game/constants';
import { playClick, playWin } from '../utils/sounds';

interface PlayerResult {
  name: string;
  attempts: number;
  timeTaken: number;
  won: boolean;
  hintsUsed: number;
}

interface MultiplayerResultScreenProps {
  difficulty: Difficulty;
  player1: PlayerResult;
  player2: PlayerResult;
  onRematch: () => void;
  onHome: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function determineWinner(p1: PlayerResult, p2: PlayerResult): 'player1' | 'player2' | 'draw' {
  // Both failed
  if (!p1.won && !p2.won) return 'draw';
  // One solved, one didn't
  if (p1.won && !p2.won) return 'player1';
  if (!p1.won && p2.won) return 'player2';
  // Both solved - fewer attempts wins, then faster time
  if (p1.attempts !== p2.attempts) return p1.attempts < p2.attempts ? 'player1' : 'player2';
  if (p1.timeTaken !== p2.timeTaken) return p1.timeTaken < p2.timeTaken ? 'player1' : 'player2';
  return 'draw';
}

export default function MultiplayerResultScreen({ difficulty, player1, player2, onRematch, onHome }: MultiplayerResultScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const winner = determineWinner(player1, player2);

  useEffect(() => {
    if (winner !== 'draw') playWin();

    const tl = anime.timeline({ easing: 'easeOutCubic' });
    tl.add({
      targets: messageRef.current,
      opacity: [0, 1],
      scale: [0.5, 1],
      duration: 800,
      easing: 'easeOutBack',
    })
    .add({
      targets: statsRef.current?.querySelectorAll('.result-card'),
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(100),
      duration: 500,
    }, '-=300');

    if (winner !== 'draw') {
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
  }, [winner]);

  const maxAttempts = DIFFICULTY_CONFIGS[difficulty].maxAttempts;
  const winnerName = winner === 'player1' ? player1.name : winner === 'player2' ? player2.name : null;

  return (
    <div ref={screenRef} className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Winner Message */}
      <div ref={messageRef} className="text-center mb-8" style={{ opacity: 0 }}>
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-[0.15em] mb-2"
          style={{
            color: winner === 'draw' ? 'var(--warning)' : 'var(--success)',
            textShadow: `0 0 20px ${winner === 'draw' ? 'var(--warning-glow)' : 'var(--success-glow)'}`,
          }}
        >
          {winner === 'draw' ? 'DRAW' : 'VICTORY'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {winner === 'draw' ? 'Both players tied!' : `${winnerName} wins the match!`}
        </p>
      </div>

      {/* Stats Comparison */}
      <div ref={statsRef} className="w-full max-w-sm space-y-3 mb-8">
        {/* Player 1 Card */}
        <div
          className="result-card rounded-xl p-4"
          style={{
            opacity: 0,
            background: winner === 'player1' ? 'var(--lb-highlight-bg)' : 'var(--stat-bg)',
            border: winner === 'player1' ? '1px solid var(--lb-highlight-border)' : '1px solid var(--stat-border)',
            boxShadow: winner === 'player1' ? `0 0 20px var(--accent-glow)` : 'none',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{player1.name}</span>
            {winner === 'player1' && (
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--success)' }}>Winner</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{player1.attempts}/{maxAttempts}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Attempts</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{formatTime(player1.timeTaken)}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Time</div>
            </div>
            <div>
              <div className="text-base font-bold" style={{ color: player1.won ? 'var(--success)' : 'var(--error)' }}>
                {player1.won ? 'Solved' : 'Failed'}
              </div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Result</div>
            </div>
          </div>
        </div>

        {/* VS divider */}
        <div className="text-center text-xs font-bold" style={{ color: 'var(--text-muted)' }}>VS</div>

        {/* Player 2 Card */}
        <div
          className="result-card rounded-xl p-4"
          style={{
            opacity: 0,
            background: winner === 'player2' ? 'var(--lb-highlight-bg)' : 'var(--stat-bg)',
            border: winner === 'player2' ? '1px solid var(--lb-highlight-border)' : '1px solid var(--stat-border)',
            boxShadow: winner === 'player2' ? `0 0 20px var(--accent-glow)` : 'none',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{player2.name}</span>
            {winner === 'player2' && (
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--success)' }}>Winner</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{player2.attempts}/{maxAttempts}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Attempts</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{formatTime(player2.timeTaken)}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Time</div>
            </div>
            <div>
              <div className="text-base font-bold" style={{ color: player2.won ? 'var(--success)' : 'var(--error)' }}>
                {player2.won ? 'Solved' : 'Failed'}
              </div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Result</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={() => { playClick(); onRematch(); }}
          className="w-full py-3.5 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            boxShadow: 'var(--btn-primary-shadow)',
          }}
        >
          Rematch
        </button>
        <button
          onClick={() => { playClick(); onHome(); }}
          className="w-full py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'var(--btn-secondary-bg)',
            color: 'var(--btn-secondary-text)',
            border: '1px solid var(--btn-secondary-border)',
          }}
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
