import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { playClick } from '../utils/sounds';

interface WaitingRoomScreenProps {
  roomCode: string;
  playerName: string;
  opponentName: string | null;
  isReady: boolean;
  onLeave: () => void;
}

export default function WaitingRoomScreen({ roomCode, playerName, opponentName, isReady, onLeave }: WaitingRoomScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!screenRef.current) return;
    anime({
      targets: screenRef.current,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 500,
      easing: 'easeOutCubic',
    });

    // Pulse the room code
    if (codeRef.current) {
      anime({
        targets: codeRef.current,
        boxShadow: [
          `0 0 0px var(--accent-glow)`,
          `0 0 30px var(--accent-glow-strong)`,
          `0 0 0px var(--accent-glow)`,
        ],
        duration: 2500,
        loop: true,
        easing: 'easeInOutSine',
      });
    }
  }, []);

  // Animate opponent joining
  const prevOpponent = useRef<string | null>(null);
  useEffect(() => {
    if (opponentName && !prevOpponent.current) {
      anime({
        targets: '.opponent-badge',
        scale: [0, 1],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutBack',
      });
    }
    prevOpponent.current = opponentName;
  }, [opponentName]);

  return (
    <div ref={screenRef} className="min-h-screen flex flex-col items-center justify-center px-4" style={{ opacity: 0 }}>
      <h2
        className="text-lg font-bold tracking-[0.15em] mb-6"
        style={{
          background: 'var(--title-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        WAITING ROOM
      </h2>

      {/* Room Code */}
      <div className="mb-8 text-center">
        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Share this code with your opponent
        </p>
        <div
          ref={codeRef}
          className="inline-block px-8 py-4 rounded-xl font-mono text-3xl font-bold tracking-[0.3em]"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--accent-glow)',
            color: 'var(--accent)',
          }}
        >
          {roomCode}
        </div>
      </div>

      {/* Players */}
      <div className="w-full max-w-xs space-y-3 mb-8">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-gradient)', color: 'var(--btn-primary-text)' }}>
            P1
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{playerName}</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider" style={{ color: 'var(--success)' }}>Ready</span>
        </div>

        <div
          className="opponent-badge flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: 'var(--glass-bg)',
            border: opponentName ? '1px solid var(--glass-border)' : '1px dashed var(--btn-secondary-border)',
            opacity: opponentName ? 1 : 0.5,
          }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: opponentName ? 'var(--accent-gradient)' : 'var(--btn-secondary-bg)', color: opponentName ? 'var(--btn-primary-text)' : 'var(--text-muted)' }}>
            P2
          </div>
          <span className="text-sm font-semibold" style={{ color: opponentName ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {opponentName || 'Waiting...'}
          </span>
          {opponentName && (
            <span className="ml-auto text-[10px] uppercase tracking-wider" style={{ color: 'var(--success)' }}>Joined</span>
          )}
          {!opponentName && (
            <div className="ml-auto flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'var(--accent)',
                    animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isReady && (
        <div className="text-center mb-6">
          <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Both players ready!</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Setting phase starting...</p>
        </div>
      )}

      <button
        onClick={() => { playClick(); onLeave(); }}
        className="px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200"
        style={{
          background: 'var(--btn-secondary-bg)',
          color: 'var(--btn-secondary-text)',
          border: '1px solid var(--btn-secondary-border)',
        }}
      >
        Leave Room
      </button>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
