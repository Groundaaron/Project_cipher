import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import { GAME_COLORS, COLORBLIND_PATTERNS } from '../game/constants';
import type { Difficulty } from '../game/types';
import { playClick, playSlotFill } from '../utils/sounds';

interface CodeSetterScreenProps {
  difficulty: Difficulty;
  playerName: string;
  opponentName: string;
  round: number;
  onSubmitCode: (code: string[]) => void;
}

export default function CodeSetterScreen({ difficulty, opponentName, round, onSubmitCode }: CodeSetterScreenProps) {
  const [code, setCode] = useState<(string | null)[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0);
  const screenRef = useRef<HTMLDivElement>(null);
  const availableColors = GAME_COLORS[difficulty];
  const slotCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;

  useEffect(() => {
    setCode(Array(slotCount).fill(null));
    setSelectedSlot(0);
  }, [slotCount]);

  useEffect(() => {
    if (!screenRef.current) return;
    anime({
      targets: screenRef.current,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 500,
      easing: 'easeOutCubic',
    });
  }, []);

  const handleColorSelect = (color: string) => {
    if (selectedSlot === null) return;
    playSlotFill();
    const newCode = [...code];
    newCode[selectedSlot] = color;
    setCode(newCode);

    // Auto-advance
    const nextEmpty = newCode.findIndex((c, i) => c === null && i > selectedSlot);
    if (nextEmpty !== -1) {
      setSelectedSlot(nextEmpty);
    } else {
      const anyEmpty = newCode.findIndex((c) => c === null);
      setSelectedSlot(anyEmpty !== -1 ? anyEmpty : null);
    }
  };

  const isComplete = code.every(c => c !== null);

  const handleSubmit = () => {
    if (!isComplete) return;
    playClick();
    onSubmitCode(code as string[]);
  };

  return (
    <div ref={screenRef} className="min-h-screen flex flex-col items-center justify-center px-4" style={{ opacity: 0 }}>
      {/* Round indicator */}
      <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
        Round {round} of 2
      </div>

      <h2
        className="text-2xl font-bold tracking-[0.15em] mb-2"
        style={{
          background: 'var(--title-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        SET THE CODE
      </h2>
      <p className="text-xs mb-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
        Create a secret code for {opponentName} to crack
      </p>

      {/* Code Slots */}
      <div className="flex gap-3 mb-6">
        {code.map((color, i) => (
          <button
            key={i}
            className="rounded-xl flex items-center justify-center transition-all duration-150"
            style={{
              width: 48,
              height: 48,
              backgroundColor: color || 'var(--slot-empty-bg)',
              border: color
                ? 'none'
                : selectedSlot === i
                ? '2px solid var(--slot-selected-border)'
                : '2px dashed var(--slot-empty-border)',
              boxShadow: color
                ? `0 4px 12px ${color}55`
                : selectedSlot === i
                ? 'var(--slot-selected-glow)'
                : 'none',
              transform: selectedSlot === i ? 'scale(1.1)' : 'scale(1)',
            }}
            onClick={() => { playClick(); setSelectedSlot(i); }}
          >
            {!color && (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
            )}
          </button>
        ))}
      </div>

      {/* Color Palette */}
      {selectedSlot !== null && (
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-wider text-center mb-2" style={{ color: 'var(--text-muted)' }}>
            Select Color for Slot {selectedSlot + 1}
          </div>
          <div className="flex gap-3 justify-center">
            {availableColors.map((color) => (
              <button
                key={color}
                className="rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: color,
                  boxShadow: `0 2px 12px ${color}55`,
                }}
                onClick={() => handleColorSelect(color)}
              >
                <span className="text-[8px] font-bold text-white/90 drop-shadow">
                  {COLORBLIND_PATTERNS[color] || ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isComplete}
        className="w-full max-w-xs py-3.5 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: isComplete ? 'var(--btn-primary-bg)' : 'var(--btn-secondary-bg)',
          color: isComplete ? 'var(--btn-primary-text)' : 'var(--text-muted)',
          boxShadow: isComplete ? 'var(--btn-primary-shadow)' : 'none',
          cursor: isComplete ? 'pointer' : 'not-allowed',
        }}
      >
        Lock Code
      </button>

      {/* Waiting indicator */}
      {isComplete && (
        <p className="text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
          Waiting for {opponentName} to set their code...
        </p>
      )}
    </div>
  );
}
