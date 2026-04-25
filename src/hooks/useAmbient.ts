import { useState, useCallback, createContext, useContext } from 'react';
import type { AmbientTheme } from '../utils/ambient';
import { startAmbient, stopAmbient, setAmbientVolume, setAmbientIntensity, switchTheme, isAmbientPlaying } from '../utils/ambient';

const AMBIENT_ENABLED_KEY = 'project-cipher-ambient-enabled';
const AMBIENT_VOLUME_KEY = 'project-cipher-ambient-volume';
const AMBIENT_THEME_KEY = 'project-cipher-ambient-theme';

interface AmbientContextValue {
  ambientEnabled: boolean;
  setAmbientEnabled: (v: boolean) => void;
  ambientVolume: number;
  setAmbientVolumeState: (v: number) => void;
  ambientTheme: AmbientTheme;
  setAmbientTheme: (v: AmbientTheme) => void;
  startGameAmbient: () => void;
  stopGameAmbient: () => void;
  setTension: (intensity: number) => void;
}

export const AmbientContext = createContext<AmbientContextValue>({
  ambientEnabled: false,
  setAmbientEnabled: () => {},
  ambientVolume: 0.3,
  setAmbientVolumeState: () => {},
  ambientTheme: 'rain',
  setAmbientTheme: () => {},
  startGameAmbient: () => {},
  stopGameAmbient: () => {},
  setTension: () => {},
});

export function useAmbient() {
  return useContext(AmbientContext);
}

function loadBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch {}
  return fallback;
}

function loadNum(key: string, fallback: number): number {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return parseFloat(v);
  } catch {}
  return fallback;
}

function loadTheme(key: string, fallback: AmbientTheme): AmbientTheme {
  try {
    const v = localStorage.getItem(key);
    if (v === 'rain' || v === 'forest' || v === 'space') return v;
  } catch {}
  return fallback;
}

export function useAmbientProvider() {
  const [ambientEnabled, setAmbientEnabledState] = useState<boolean>(() => loadBool(AMBIENT_ENABLED_KEY, false));
  const [ambientVolume, setAmbientVolumeState] = useState<number>(() => loadNum(AMBIENT_VOLUME_KEY, 0.3));
  const [ambientTheme, setAmbientThemeState] = useState<AmbientTheme>(() => loadTheme(AMBIENT_THEME_KEY, 'rain'));

  const persist = useCallback((key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch {}
  }, []);

  const setAmbientEnabled = useCallback((v: boolean) => {
    setAmbientEnabledState(v);
    persist(AMBIENT_ENABLED_KEY, String(v));
    if (!v && isAmbientPlaying()) {
      stopAmbient();
    }
  }, [persist]);

  const setAmbientVolumeStatePersist = useCallback((v: number) => {
    setAmbientVolumeState(v);
    persist(AMBIENT_VOLUME_KEY, String(v));
    setAmbientVolume(v);
  }, [persist]);

  const setAmbientTheme = useCallback((v: AmbientTheme) => {
    setAmbientThemeState(v);
    persist(AMBIENT_THEME_KEY, v);
    if (isAmbientPlaying()) {
      switchTheme(v);
    }
  }, [persist]);

  const startGameAmbient = useCallback(() => {
    if (ambientEnabled) {
      startAmbient(ambientTheme, ambientVolume);
    }
  }, [ambientEnabled, ambientTheme, ambientVolume]);

  const stopGameAmbient = useCallback(() => {
    stopAmbient();
  }, []);

  const setTension = useCallback((intensity: number) => {
    if (ambientEnabled) {
      setAmbientIntensity(intensity);
    }
  }, [ambientEnabled]);

  return {
    ambientEnabled,
    setAmbientEnabled,
    ambientVolume,
    setAmbientVolumeState: setAmbientVolumeStatePersist,
    ambientTheme,
    setAmbientTheme,
    startGameAmbient,
    stopGameAmbient,
    setTension,
  };
}
