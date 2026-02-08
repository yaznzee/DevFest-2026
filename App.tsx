import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';
import { GameMode, GameState, GameResult, BeatOption } from './types';
import { BEAT_OPTIONS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.BATTLE);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [selectedBeat, setSelectedBeat] = useState<BeatOption>(BEAT_OPTIONS[0]);

  const handleStartGame = (mode: GameMode) => {
    setSelectedMode(mode);
    setGameState(GameState.GAME_LOOP);
  };

  const handleFinishGame = (result: GameResult) => {
    setGameResult(result);
    setGameState(GameState.RESULTS);
  };

  const handleRestart = () => {
    setGameState(GameState.GAME_LOOP);
  };

  const handleExitGame = () => {
    setGameState(GameState.MENU);
  };

  return (
    <div className="w-full h-screen bg-[#0f0f0f] text-white overflow-hidden font-sans">
      {gameState === GameState.MENU && (
        <MainMenu
          onStart={handleStartGame}
          selectedBeat={selectedBeat}
          onSelectBeat={setSelectedBeat}
        />
      )}
      
      {gameState === GameState.GAME_LOOP && (
        <GameScreen 
          mode={selectedMode} 
          beat={selectedBeat}
          onFinish={handleFinishGame}
          onExit={handleExitGame} 
        />
      )}

      {gameState === GameState.RESULTS && gameResult && (
        <ResultsScreen 
          result={gameResult}
          onRestart={handleRestart}
          onExit={handleExitGame}
        />
      )}
    </div>
  );
};

export default App;