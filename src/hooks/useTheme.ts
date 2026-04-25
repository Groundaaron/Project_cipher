import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'project-cipher-theme';
const ANIM_KEY = 'project-cipher-animations';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (v: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  animationsEnabled: true,
  setAnimationsEnabled: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

function getInitialAnimations(): boolean {
  try {
    const stored = localStorage.getItem(ANIM_KEY);
    if (stored === 'false') return false;
  } catch {}
  return true;
}

export function useThemeProvider() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(getInitialAnimations);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setAnimationsEnabled = useCallback((v: boolean) => {
    setAnimationsEnabledState(v);
    try {
      localStorage.setItem(ANIM_KEY, v ? 'true' : 'false');
    } catch {}
  }, []);

  return { theme, toggleTheme, animationsEnabled, setAnimationsEnabled };
}
