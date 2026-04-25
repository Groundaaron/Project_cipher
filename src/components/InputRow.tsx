import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { COLORBLIND_PATTERNS } from '../game/constants';

interface InputRowProps {
  currentInput: (string | null)[];
  onSlotClick: (slotIndex: number) => void;
  onSubmit: () => void;
  isDisabled: boolean;
  colorblindMode: boolean;
  revealedHints: number[];
  secretCode: string[];
  selectedSlot: number | null;
}

export default function InputRow({
  currentInput,
  onSlotClick,
  onSubmit,
  isDisabled,
  colorblindMode,
  revealedHints,
  secretCode,
  selectedSlot,
}: InputRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isFilled = currentInput.every(c => c !== null);

  useEffect(() => {
    if (!rowRef.current) return;
    anime({
      targets: rowRef.current.querySelectorAll('.input-slot'),
      scale: [0.9, 1],
      opacity: [0, 1],
      delay: anime.stagger(50),
      duration: 300,
      easing: 'easeOutBack',
    });
  }, [currentInput.length]);

  const handleSlotClick = (slotIndex: number) => {
    if (isDisabled) return;
    if (revealedHints.includes(slotIndex)) return;
    onSlotClick(slotIndex);
  };

  return (
    <div
      ref={rowRef}
      className="flex items-center gap-3 px-3 py-2 rounded-xl"
      style={{
        background: 'var(--board-row-active-bg)',
        border: '1px solid var(--board-row-active-border)',
        boxShadow: `0 0 15px var(--accent-glow)`,
      }}
    >
      <span className="text-[10px] font-mono w-5 text-right" style={{ color: 'var(--accent)' }}>
        {'>'}
      </span>
      <div className="flex gap-2">
        {currentInput.map((color, i) => {
          const isHint = revealedHints.includes(i);
          const displayColor = isHint ? secretCode[i] : color;
          const isSelected = selectedSlot === i;
          return (
            <button
              key={i}
              className="input-slot rounded-lg flex items-center justify-center transition-all duration-150"
              style={{
                width: 36,
                height: 36,
                backgroundColor: displayColor || 'var(--slot-empty-bg)',
                border: displayColor
                  ? 'none'
                  : isSelected
                  ? '2px solid var(--slot-selected-border)'
                  : '2px dashed var(--slot-empty-border)',
                boxShadow: displayColor
                  ? `0 2px 8px ${displayColor}44`
                  : isSelected
                  ? 'var(--slot-selected-glow)'
                  : 'none',
                cursor: isHint ? 'default' : 'pointer',
                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
              }}
              onClick={() => handleSlotClick(i)}
              disabled={isHint}
            >
              {colorblindMode && displayColor && (
                <span className="text-[9px] font-bold text-white/90 drop-shadow">
                  {COLORBLIND_PATTERNS[displayColor] || ''}
                </span>
              )}
              {!displayColor && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
              )}
            </button>
          );
        })}
      </div>
      <button
        onClick={onSubmit}
        disabled={!isFilled || isDisabled}
        className="ml-auto px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-200"
        style={{
          backgroundColor: isFilled && !isDisabled ? 'var(--accent)' : 'var(--btn-secondary-bg)',
          color: isFilled && !isDisabled ? 'var(--btn-primary-text)' : 'var(--text-muted)',
          cursor: isFilled && !isDisabled ? 'pointer' : 'not-allowed',
          boxShadow: isFilled && !isDisabled ? `0 0 12px var(--accent-glow)` : 'none',
        }}
      >
        SUBMIT
      </button>
    </div>
  );
}
