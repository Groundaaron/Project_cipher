import { useRef } from 'react';
import anime from 'animejs';
import { useTheme } from '../hooks/useTheme';
import { playClick } from '../utils/sounds';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    playClick();
    if (btnRef.current) {
      anime({
        targets: btnRef.current,
        scale: [1, 0.85, 1.1, 1],
        rotate: [0, theme === 'dark' ? -15 : 15, 0],
        duration: 400,
        easing: 'easeOutBack',
      });
    }
    toggleTheme();
  };

  return (
    <button
      ref={btnRef}
      onClick={handleToggle}
      className="relative flex items-center justify-center rounded-full transition-all duration-300"
      style={{
        width: 40,
        height: 40,
        background: 'var(--toggle-bg)',
        border: '1px solid var(--toggle-border)',
        boxShadow: 'var(--toggle-shadow)',
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span
        className="text-base transition-all duration-300"
        style={{ filter: 'drop-shadow(0 0 4px var(--accent))' }}
      >
        {theme === 'dark' ? '\u2600' : '\u263E'}
      </span>
    </button>
  );
}
