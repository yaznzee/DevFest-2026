import React from 'react';
import { GameResult, JudgeFeedback } from '../types';
import { RefreshCw, Home, Crown, Star } from 'lucide-react';

interface ResultsScreenProps {
  result: GameResult;
  onRestart: () => void;
  onExit: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onRestart, onExit }) => {
  const coach = result.judges.find(j => j.judgeType === "advisor" || j.name.toLowerCase().includes("coach"));
  const [showCoach, setShowCoach] = React.useState(false);

  // Parse and split the coach's combined feedback
  let p1CoachFeedback = coach?.comment || "";
  let p2CoachFeedback = coach?.advice || "";

  if (coach && typeof p1CoachFeedback === 'string' && p1CoachFeedback.toLowerCase().includes('player 2:')) {
    // If both players' feedback is crammed into the comment string
    const p1Match = p1CoachFeedback.match(/Player 1:\s*([\s\S]*?)(?=Player 2:)/i);
    const p2Match = p1CoachFeedback.match(/Player 2:\s*([\s\S]*)/i);
    
    if (p1Match && p2Match) {
      p1CoachFeedback = p1Match[1].trim();
      p2CoachFeedback = p2Match[1].trim();
    } else {
      // Fallback split if regex fails
      const parts = p1CoachFeedback.split(/Player 2:/i);
      p1CoachFeedback = parts[0].replace(/Player 1:/i, '').trim();
      p2CoachFeedback = parts[1] ? parts[1].trim() : p2CoachFeedback;
    }
  } else if (coach) {
    // If they are separate but still contain the unwanted prefixes
    p1CoachFeedback = p1CoachFeedback.replace(/Player 1:/i, '').trim();
    p2CoachFeedback = typeof p2CoachFeedback === 'string' ? p2CoachFeedback.replace(/Player 2:/i, '').trim() : '';
  }

  return (
    <div className="flex flex-col items-center h-screen bg-black/95 text-white overflow-hidden">
      <div className="flex-1 w-full overflow-y-auto p-4">
        {/* Header Result */}
        <div className="text-center mt-8 mb-8 animate-float">
          <h1 className="font-bangers text-6xl md:text-8xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
            {result.winner === 'TIE' ? "IT'S A TIE!" : `${result.winner === 'P1' ? 'PLAYER 1' : 'PLAYER 2'} WINS!`}
          </h1>
          <p className="font-mono text-gray-400">FINAL SCORE: {result.p1TotalScore} vs {result.p2TotalScore}</p>
        </div>

        {/* Judges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mb-12">
        {result.judges.filter(j => j.scoreP1 > 0).map((judge, idx) => (
          <div key={idx} className="bg-gray-800/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{judge.avatar}</span>
              <div>
                <h3 className="font-bold font-bangers text-xl tracking-wide text-yellow-400">{judge.name}</h3>
                <p className="text-xs text-gray-400 uppercase">{judge.role}</p>
              </div>
            </div>
            
            {/* Bar Chart Comparison */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-purple-400 font-bold">P1</span>
                  <span className="text-purple-300">{judge.scoreP1}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${judge.scoreP1}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-400 font-bold">P2</span>
                  <span className="text-green-300">{judge.scoreP2}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${judge.scoreP2}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-sm italic text-gray-300 mt-4 whitespace-pre-wrap leading-relaxed">"{judge.comment}"</p>
          </div>
        ))}
      </div>

      {/* Transcripts Review */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-purple-900/20 p-6 rounded-lg border border-purple-500/30">
            <div className="flex items-center gap-2 mb-4">
              {result.winner === 'P1' && <Crown className="text-yellow-400" />}
              <h3 className="font-bangers text-2xl text-purple-400">Player 1 Bars</h3>
            </div>
            <p className="font-mono text-sm text-gray-300 whitespace-pre-wrap mb-4">"{result.p1Transcript}"</p>
            
            {/* Word Tracking */}
            <div className="border-t border-purple-500/30 pt-4 mt-4">
              <p className="text-xs text-gray-400 mb-2 font-bold">WORD USAGE:</p>
              <div className="flex flex-wrap gap-2">
                {result.judges[0]?.matchedWordsP1?.map((word, i) => (
                  <span key={i} className="text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded border border-green-500/50">✓ {word}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-green-900/20 p-6 rounded-lg border border-green-500/30">
             <div className="flex items-center gap-2 mb-4">
              {result.winner === 'P2' && <Crown className="text-yellow-400" />}
              <h3 className="font-bangers text-2xl text-green-400">Player 2 Bars</h3>
            </div>
            <p className="font-mono text-sm text-gray-300 whitespace-pre-wrap mb-4">"{result.p2Transcript}"</p>
            
            {/* Word Tracking */}
            <div className="border-t border-green-500/30 pt-4 mt-4">
              <p className="text-xs text-gray-400 mb-2 font-bold">WORD USAGE:</p>
              <div className="flex flex-wrap gap-2">
                {result.judges[0]?.matchedWordsP2?.map((word, i) => (
                  <span key={i} className="text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded border border-green-500/50">✓ {word}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coach K2 Feedback - Centered collapsible card */}
      {coach && (
        <div className="w-full max-w-4xl mx-auto mb-12">
          <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <button
              onClick={() => setShowCoach(prev => !prev)}
              className="w-full flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🎓</span>
                <h3 className="font-bold font-bangers text-xl tracking-wide text-yellow-400">
                  Coach K2 Feedback
                </h3>
              </div>
              <span className="text-gray-400 text-lg">{showCoach ? '▲' : '▼'}</span>
            </button>

            {showCoach && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <h4 className="font-bold text-purple-400 mb-2 text-lg">Player 1</h4>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {p1CoachFeedback}
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-green-400 mb-2 text-lg">Player 2</h4>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {p2CoachFeedback}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex gap-6 p-8 bg-black/50 backdrop-blur-sm w-full justify-center border-t border-white/10">
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