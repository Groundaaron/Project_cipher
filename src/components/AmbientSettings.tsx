import { useRef, useEffect } from 'react';
import anime from 'animejs';
import { useAmbient } from '../hooks/useAmbient';
import type { AmbientTheme } from '../utils/ambient';
import { playClick } from '../utils/sounds';

interface AmbientSettingsProps {
  open: boolean;
  onClose: () => void;
}

const THEMES: { key: AmbientTheme; label: string; desc: string }[] = [
  { key: 'rain', label: 'Rain', desc: 'Soft rain and distant rumble' },
  { key: 'forest', label: 'Night Forest', desc: 'Wind, leaves, and crickets' },
  { key: 'space', label: 'Space Hum', desc: 'Deep cosmic drone and ethereal pads' },
];

export default function AmbientSettings({ open, onClose }: AmbientSettingsProps) {
  const { ambientEnabled, setAmbientEnabled, ambientVolume, setAmbientVolumeState, ambientTheme, setAmbientTheme, startGameAmbient, stopGameAmbient } = useAmbient();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && panelRef.current) {
      anime({
        targets: panelRef.current,
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 300,
        easing: 'easeOutCubic',
      });
    }
  }, [open]);

  if (!open) return null;

  const handleToggle = () => {
    playClick();
    const next = !ambientEnabled;
    setAmbientEnabled(next);
    if (next) {
      startGameAmbient();
    } else {
      stopGameAmbient();
    }
  };

  const handleThemeChange = (theme: AmbientTheme) => {
    playClick();
    setAmbientTheme(theme);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
      <div
        ref={panelRef}
        className="relative w-full max-w-lg rounded-t-2xl p-5 mb-0"
        style={{
          opacity: 0,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)',
          boxShadow: 'var(--glass-shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold tracking-[0.1em]" style={{ color: 'var(--text-primary)' }}>
            AMBIENT SOUND
          </h3>
          <button
            onClick={onClose}
            className="text-xs tracking-wider uppercase"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Done
          </button>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Enable ambient sound</span>
          <button
            onClick={handleToggle}
            className="relative w-11 h-6 rounded-full transition-all duration-300"
            style={{
              background: ambientEnabled ? 'var(--accent-gradient)' : 'var(--btn-secondary-bg)',
              border: ambientEnabled ? '1px solid var(--accent-glow-strong)' : '1px solid var(--btn-secondary-border)',
            }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
              style={{
                left: ambientEnabled ? 22 : 2,
                background: ambientEnabled ? 'var(--btn-primary-text)' : 'var(--text-muted)',
              }}
            />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Volume</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{Math.round(ambientVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(ambientVolume * 100)}
            onChange={(e) => setAmbientVolumeState(parseInt(e.target.value) / 100)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--accent) ${ambientVolume * 100}%, var(--btn-secondary-bg) ${ambientVolume * 100}%)`,
            }}
          />
        </div>

        {/* Theme Selector */}
        <div>
          <span className="text-xs block mb-2" style={{ color: 'var(--text-secondary)' }}>Sound Theme</span>
          <div className="space-y-2">
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => handleThemeChange(t.key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200"
                style={{
                  background: ambientTheme === t.key ? 'var(--lb-highlight-bg)' : 'transparent',
                  border: ambientTheme === t.key ? '1px solid var(--lb-highlight-border)' : '1px solid transparent',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    background: ambientTheme === t.key ? 'var(--accent)' : 'var(--btn-secondary-bg)',
                    boxShadow: ambientTheme === t.key ? '0 0 8px var(--accent-glow)' : 'none',
                  }}
                />
                <div>
                  <div className="text-xs font-semibold" style={{ color: ambientTheme === t.key ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {t.label}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
