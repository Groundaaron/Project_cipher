import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { COLORBLIND_PATTERNS } from '../game/constants';

interface ColorPaletteProps {
  availableColors: string[];
  selectedSlot: number | null;
  onColorSelect: (color: string) => void;
  colorblindMode: boolean;
}

export default function ColorPalette({
  availableColors,
  selectedSlot,
  onColorSelect,
  colorblindMode,
}: ColorPaletteProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    anime({
      targets: ref.current.querySelectorAll('.palette-color'),
      scale: [0.8, 1],
      opacity: [0, 1],
      delay: anime.stagger(40),
      duration: 300,
      easing: 'easeOutBack',
    });
  }, [availableColors.length]);

  if (selectedSlot === null) return null;

  return (
    <div ref={ref} className="flex gap-2.5 justify-center py-1">
      {availableColors.map((color, i) => (
        <button
          key={color}
          className="palette-color rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 relative"
          style={{
            width: 34,
            height: 34,
            backgroundColor: color,
            boxShadow: `0 2px 12px ${color}55`,
            opacity: 0,
          }}
          onClick={() => onColorSelect(color)}
        >
          {colorblindMode && (
            <span className="text-[8px] font-bold text-white/90 drop-shadow">
              {COLORBLIND_PATTERNS[color] || ''}
            </span>
          )}
          <span className="absolute text-[8px] font-mono" style={{ color: 'var(--text-muted)', marginTop: 28 }}>
            {String.fromCharCode(97 + i)}
          </span>
        </button>
      ))}
    </div>
  );
}
