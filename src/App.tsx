import { useState, useCallback, useRef, useEffect } from 'react';
import anime from 'animejs';
import type { Difficulty } from './game/types';
import { ThemeContext, useThemeProvider } from './hooks/useTheme';
import { AmbientContext, useAmbientProvider } from './hooks/useAmbient';
import { useMultiplayer } from './multiplayer/useMultiplayer';
import type { RoomData } from './multiplayer/types';
import ParticleBackground from './components/ParticleBackground';
import ThemeToggle from './components/ThemeToggle';
import AmbientSettings from './components/AmbientSettings';
import StartScreen from './screens/StartScreen';
import GameScreen from './screens/GameScreen';
import EndScreen from './screens/EndScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ModeSelectScreen from './screens/ModeSelectScreen';
import LobbyScreen from './screens/LobbyScreen';
import WaitingRoomScreen from './screens/WaitingRoomScreen';
import CodeSetterScreen from './screens/CodeSetterScreen';
import MultiplayerGameScreen from './screens/MultiplayerGameScreen';
import MultiplayerResultScreen from './screens/MultiplayerResultScreen';

type Screen = 'start' | 'game' | 'end' | 'leaderboard' | 'modeSelect' | 'lobby' | 'waiting' | 'codeSetting' | 'mpGame' | 'mpResult';

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

  // Multiplayer state
  const mp = useMultiplayer();
  const [mpRoom, setMpRoom] = useState<RoomData | null>(null);

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
  const handlePlay = useCallback(() => {
    transitionTo('game');
  }, [transitionTo]);

  const handleGameEnd = useCallback((data: EndGameData) => {
    setEndData(data);
    transitionTo('end');
  }, [transitionTo]);

  const handlePlayAgain = useCallback(() => {
    transitionTo('game');
  }, [transitionTo]);

  const handleHome = useCallback(() => {
    transitionTo('start');
  }, [transitionTo]);

  const handleLeaderboard = useCallback(() => {
    setPreviousScreen(screen);
    transitionTo('leaderboard');
  }, [screen, transitionTo]);

  const handleBackFromLeaderboard = useCallback(() => {
    transitionTo(previousScreen === 'game' ? 'game' : 'start');
  }, [previousScreen, transitionTo]);

  const handleBackFromGame = useCallback(() => {
    transitionTo('start');
  }, [transitionTo]);

  // Multiplayer handlers
  const handleModeSelect = useCallback(() => {
    transitionTo('modeSelect');
  }, [transitionTo]);

  const handleSinglePlayer = useCallback(() => {
    transitionTo('start');
  }, [transitionTo]);

  const handleMultiplayer = useCallback(() => {
    transitionTo('lobby');
  }, [transitionTo]);

  const handleCreateRoom = useCallback(async (diff: Difficulty, playerName: string) => {
    try {
      const { room } = await mp.handleCreateRoom(diff, playerName);
      setMpRoom(room);
      transitionTo('waiting');
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  }, [mp, transitionTo]);

  const handleJoinRoom = useCallback(async (code: string, playerName: string) => {
    try {
      const { room } = await mp.handleJoinRoom(code, playerName);
      setMpRoom(room);
      transitionTo('waiting');
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  }, [mp, transitionTo]);

  const handleLeaveRoom = useCallback(async () => {
    await mp.leaveRoom();
    transitionTo('lobby');
  }, [mp, transitionTo]);

  // Watch for multiplayer state changes to drive screen transitions
  const prevStatus = useRef<string>('');
  useEffect(() => {
    if (!mp.state.room) return;

    const status = mp.state.room.status;
    if (status === prevStatus.current) return;
    prevStatus.current = status;

    if (status === 'setting' && (screen === 'waiting' || screen === 'codeSetting')) {
      // Both players in room, move to code setting
      if (screen !== 'codeSetting') {
        transitionTo('codeSetting');
      }
    } else if (status === 'guessing' && screen === 'codeSetting') {
      // Both codes set, start guessing
      mp.startTimer();
      transitionTo('mpGame');
    } else if (status === 'switching' && screen === 'mpGame') {
      // Round 1 done, switching to round 2
      mp.startTimer();
      // Stay on mpGame - the data will update via realtime
    } else if (status === 'finished' && screen === 'mpGame') {
      // Game over
      mp.stopTimer();
      transitionTo('mpResult');
    }
  }, [mp.state.room?.status, screen, mp, transitionTo]);

  const handleSetCode = useCallback(async (code: string[]) => {
    await mp.handleSetCode(code);
  }, [mp]);

  const handleSubmitGuess = useCallback(async (guessColors: string[]) => {
    return await mp.handleSubmitGuess(guessColors);
  }, [mp]);

  const handleRematch = useCallback(async () => {
    if (!mp.state.room) return;
    // For simplicity, go back to lobby for a new room
    await mp.leaveRoom();
    transitionTo('lobby');
  }, [mp, transitionTo]);

  // Determine if both players are ready (for waiting screen)
  const bothReady = mp.state.myPlayer?.is_ready && mp.state.opponent?.is_ready;

  // Determine if current player should set code
  const shouldSetCode = mp.state.room?.status === 'setting' && !mp.state.myPlayer?.is_ready;

  // Determine if it's my turn to guess
  const isMyTurn = mp.state.room?.status === 'guessing' && mp.state.room?.current_turn === mp.state.mySlot;

  // Check if opponent finished
  const isOpponentFinished = mp.state.opponent?.finished_at !== null && mp.state.opponent?.finished_at !== undefined;

  // Build result data for multiplayer result screen
  const getMpResultData = () => {
    if (!mp.state.myPlayer || !mp.state.opponent) return null;
    const myGuesses = mp.state.myPlayer.guesses ? JSON.parse(mp.state.myPlayer.guesses) : [];
    const oppGuesses = mp.state.opponent.guesses ? JSON.parse(mp.state.opponent.guesses) : [];
    const config = mp.state.room ? { slots: mp.state.room.difficulty === 'easy' ? 4 : mp.state.room.difficulty === 'medium' ? 5 : 6 } : { slots: 4 };
    return {
      player1: {
        name: mp.state.myPlayer.name,
        attempts: mp.state.myPlayer.attempts,
        timeTaken: mp.state.myPlayer.time_taken,
        won: myGuesses.length > 0 && myGuesses[myGuesses.length - 1]?.feedback?.black === config.slots,
        hintsUsed: mp.state.myPlayer.hints_used,
      },
      player2: {
        name: mp.state.opponent.name,
        attempts: mp.state.opponent.attempts,
        timeTaken: mp.state.opponent.time_taken,
        won: oppGuesses.length > 0 && oppGuesses[oppGuesses.length - 1]?.feedback?.black === config.slots,
        hintsUsed: mp.state.opponent.hints_used,
      },
    };
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden theme-transition"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--bg-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--bg-grid-color) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      <ParticleBackground />

      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setShowAmbientSettings(true)}
          className="relative flex items-center justify-center rounded-full transition-all duration-300"
          style={{
            width: 40,
            height: 40,
            background: 'var(--toggle-bg)',
            border: '1px solid var(--toggle-border)',
            boxShadow: 'var(--toggle-shadow)',
          }}
          aria-label="Ambient sound settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </button>
        <ThemeToggle />
      </div>

      {/* Ambient settings panel */}
      <AmbientSettings open={showAmbientSettings} onClose={() => setShowAmbientSettings(false)} />

      {/* Screen content */}
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
            onMultiplayer={handleMultiplayer}
            onBack={handleHome}
          />
        )}

        {screen === 'lobby' && (
          <LobbyScreen
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onBack={handleModeSelect}
          />
        )}

        {screen === 'waiting' && mpRoom && (
          <WaitingRoomScreen
            roomCode={mpRoom.code}
            playerName={mp.state.myPlayer?.name || 'Player'}
            opponentName={mp.state.opponent?.name || null}
            isReady={!!bothReady}
            onLeave={handleLeaveRoom}
          />
        )}

        {screen === 'codeSetting' && mp.state.room && shouldSetCode && (
          <CodeSetterScreen
            difficulty={mp.state.room.difficulty}
            playerName={mp.state.myPlayer?.name || 'Player'}
            opponentName={mp.state.opponent?.name || 'Opponent'}
            round={mp.state.room.round}
            onSubmitCode={handleSetCode}
          />
        )}

        {screen === 'codeSetting' && mp.state.room && !shouldSetCode && mp.state.myPlayer?.is_ready && (
          <div className="min-h-screen flex flex-col items-center justify-center px-4">
            <h2
              className="text-2xl font-bold tracking-[0.15em] mb-4"
              style={{
                background: 'var(--title-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CODE LOCKED
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Waiting for {mp.state.opponent?.name || 'opponent'} to set their code...
            </p>
            <div className="mt-6 flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: 'var(--accent)',
                    animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <style>{`
              @keyframes pulse {
                0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                40% { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </div>
        )}

        {screen === 'mpGame' && mp.state.room && (
          <MultiplayerGameScreen
            difficulty={mp.state.room.difficulty}
            myName={mp.state.myPlayer?.name || 'Player'}
            opponentName={mp.state.opponent?.name || 'Opponent'}
            myGuesses={mp.myGuesses}
            opponentAttempts={mp.state.opponent?.attempts || 0}
            maxAttempts={mp.config.maxAttempts}
            isMyTurn={!!isMyTurn}
            isOpponentFinished={!!isOpponentFinished}
            elapsedTime={mp.elapsedTime}
            timeLimit={mp.config.timeLimit}
            onSubmitGuess={handleSubmitGuess}
            onStartTimer={mp.startTimer}
            onLeave={handleLeaveRoom}
          />
        )}

        {screen === 'mpResult' && mp.state.room && (() => {
          const resultData = getMpResultData();
          if (!resultData) return null;
          return (
            <MultiplayerResultScreen
              difficulty={mp.state.room.difficulty}
              player1={resultData.player1}
              player2={resultData.player2}
              onRematch={handleRematch}
              onHome={handleHome}
            />
          );
        })()}
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
