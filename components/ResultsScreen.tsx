import React from 'react';
import { GameResult, JudgeFeedback } from '../types';
import { RefreshCw, Home, Crown, Star } from 'lucide-react';

interface ResultsScreenProps {
  result: GameResult;
  onRestart: () => void;
  onExit: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onRestart, onExit }) => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-black/95 text-white p-4 overflow-y-auto">
      {/* Header Result */}
      <div className="text-center mt-8 mb-8 animate-float">
        <h1 className="font-bangers text-6xl md:text-8xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
          {result.winner === 'TIE' ? "IT'S A TIE!" : `${result.winner === 'P1' ? 'PLAYER 1' : 'PLAYER 2'} WINS!`}
        </h1>
        <p className="font-mono text-gray-400">FINAL SCORE: {result.p1TotalScore} vs {result.p2TotalScore}</p>
      </div>

      {/* Judges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl mb-12">
        {result.judges.map((judge, idx) => (
          <div key={idx} className="bg-gray-800/50 border border-white/10 rounded-xl p-6 flex flex-col gap-3 backdrop-blur-sm transform transition hover:scale-105 duration-300">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-4xl">{judge.avatar}</span>
              <div>
                <h3 className="font-bold font-bangers text-xl tracking-wide text-yellow-400">{judge.name}</h3>
                <p className="text-xs text-gray-400 uppercase">{judge.role}</p>
              </div>
            </div>
            
            <div className="flex justify-between font-mono text-sm font-bold">
              <span className="text-purple-400">P1: {judge.scoreP1}</span>
              <span className="text-green-400">P2: {judge.scoreP2}</span>
            </div>

            <div className="flex-1">
              <p className="text-sm italic text-gray-300 mb-2">"{judge.comment}"</p>
              <div className="bg-black/40 p-2 rounded text-xs text-gray-400">
                <span className="text-blue-400 font-bold block mb-1">PRO TIP:</span>
                {judge.advice}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transcripts Review */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-purple-900/20 p-6 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2 mb-4">
            {result.winner === 'P1' && <Crown className="text-yellow-400" />}
            <h3 className="font-bangers text-2xl text-purple-400">Player 1 Bars</h3>
          </div>
          <p className="font-mono text-sm text-gray-300 whitespace-pre-wrap">"{result.p1Transcript}"</p>
        </div>
        <div className="bg-green-900/20 p-6 rounded-lg border border-green-500/30">
           <div className="flex items-center gap-2 mb-4">
            {result.winner === 'P2' && <Crown className="text-yellow-400" />}
            <h3 className="font-bangers text-2xl text-green-400">Player 2 Bars</h3>
          </div>
          <p className="font-mono text-sm text-gray-300 whitespace-pre-wrap">"{result.p2Transcript}"</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-6 mb-8">
        <button 
          onClick={onRestart}
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-4 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
        >
          <RefreshCw /> REMATCH
        </button>
        <button 
          onClick={onExit}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
        >
          <Home /> MENU
        </button>
      </div>

    </div>
  );
};

export default ResultsScreen;