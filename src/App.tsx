import { useState, useCallback, useRef } from 'react';
import anime from 'animejs';
import type { Difficulty } from './game/types';
import { ThemeContext, useThemeProvider } from './hooks/useTheme';
import { AmbientContext, useAmbientProvider } from './hooks/useAmbient';

import ParticleBackground from './components/ParticleBackground';
import ThemeToggle from './components/ThemeToggle';
import AmbientSettings from './components/AmbientSettings';
import StartScreen from './screens/StartScreen';
import GameScreen from './screens/GameScreen';
import EndScreen from './screens/EndScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ModeSelectScreen from './screens/ModeSelectScreen';

type Screen = 'start' | 'game' | 'end' | 'leaderboard' | 'modeSelect';

interface EndGameData {
  isWin: boolean;
  attempts: number;
  timeTaken: number;
  hintsUsed: number;
  secretCode: string[];
  difficulty: Difficulty;
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [endData, setEndData] = useState<EndGameData | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen>('start');
  const [showAmbientSettings, setShowAmbientSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const transitionTo = useCallback((nextScreen: Screen) => {
    if (!containerRef.current) {
      setScreen(nextScreen);
      return;
    }
    anime({
      targets: containerRef.current,
      opacity: [1, 0],
      translateY: [0, -15],
      scale: [1, 0.98],
      duration: 300,
      easing: 'easeInCubic',
      complete: () => {
        setScreen(nextScreen);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (containerRef.current) {
              anime({
                targets: containerRef.current,
                opacity: [0, 1],
                translateY: [15, 0],
                scale: [0.98, 1],
                duration: 400,
                easing: 'easeOutCubic',
              });
            }
          });
        });
      },
    });
  }, []);

  // Single player handlers
  const handlePlay = () => transitionTo('game');
  const handleGameEnd = (data: EndGameData) => {
    setEndData(data);
    transitionTo('end');
  };
  const handlePlayAgain = () => transitionTo('game');
  const handleHome = () => transitionTo('start');

  const handleLeaderboard = () => {
    setPreviousScreen(screen);
    transitionTo('leaderboard');
  };

  const handleBackFromLeaderboard = () => {
    transitionTo(previousScreen === 'game' ? 'game' : 'start');
  };

  const handleBackFromGame = () => transitionTo('start');

  const handleModeSelect = () => transitionTo('modeSelect');
  const handleSinglePlayer = () => transitionTo('start');

  return (
    <div
      className="min-h-screen relative overflow-hidden theme-transition"
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--bg-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--bg-grid-color) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <ParticleBackground />

      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setShowAmbientSettings(true)}
          className="rounded-full w-10 h-10 flex items-center justify-center"
          style={{
            background: 'var(--toggle-bg)',
            border: '1px solid var(--toggle-border)',
          }}
        >
          🎧
        </button>
        <ThemeToggle />
      </div>

      <AmbientSettings open={showAmbientSettings} onClose={() => setShowAmbientSettings(false)} />

      <div ref={containerRef} className="relative z-10 max-w-lg mx-auto min-h-screen">

        {screen === 'start' && (
          <StartScreen
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            onPlay={handlePlay}
            onLeaderboard={handleLeaderboard}
            onMultiplayer={handleModeSelect}
          />
        )}

        {screen === 'game' && (
          <GameScreen
            difficulty={difficulty}
            onGameEnd={handleGameEnd}
            onBack={handleBackFromGame}
            onLeaderboard={handleLeaderboard}
          />
        )}

        {screen === 'end' && endData && (
          <EndScreen
            isWin={endData.isWin}
            difficulty={endData.difficulty}
            attempts={endData.attempts}
            timeTaken={endData.timeTaken}
            hintsUsed={endData.hintsUsed}
            secretCode={endData.secretCode}
            onPlayAgain={handlePlayAgain}
            onLeaderboard={handleLeaderboard}
            onHome={handleHome}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen onBack={handleBackFromLeaderboard} />
        )}

        {screen === 'modeSelect' && (
          <ModeSelectScreen
            onSinglePlayer={handleSinglePlayer}
            onMultiplayer={() => alert("Multiplayer disabled for now")}
            onBack={handleHome}
          />
        )}

      </div>
    </div>
  );
}

export default function App() {
  const { theme, toggleTheme, animationsEnabled, setAnimationsEnabled } = useThemeProvider();
  const ambient = useAmbientProvider();

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, animationsEnabled, setAnimationsEnabled }}>
      <AmbientContext.Provider value={ambient}>
        <AppContent />
      </AmbientContext.Provider>
    </ThemeContext.Provider>
  );
}