import React, { useState, useEffect, useRef } from 'react';
import { GameMode, TurnState, GameResult, JudgeFeedback, BeatOption } from '../types';
import { getRandomRhymeGroup } from '../constants';
import { MicOff, RefreshCw, Home, Gavel } from 'lucide-react';
import BarMeter from './BarMeter';
import Visualizer from './Visualizer';
import Bulldog from './Bulldog';
import { audioService } from '../services/audioService';
import { calculateScore, generateGameResults } from '../services/scoringService';
import { transcribeWithElevenLabs } from '../services/elevenLabs';
import { saveTranscript, updateTranscriptGrade } from '../services/supabase';

interface GameScreenProps {
  mode: GameMode;
  beat: BeatOption;
  onFinish: (result: GameResult) => void;
  onExit: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ mode, beat, onFinish, onExit }) => {
  const [turnState, setTurnState] = useState<TurnState>(TurnState.INTRO);
  const [currentWords, setCurrentWords] = useState<string[]>([]);
  
  const [p1Transcript, setP1Transcript] = useState("");
  const [p2Transcript, setP2Transcript] = useState("");
  const [p1Words, setP1Words] = useState<string[]>([]);
  const [p2Words, setP2Words] = useState<string[]>([]);

  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [judgeLogs, setJudgeLogs] = useState<string[]>([]);

  const [liveTranscript, setLiveTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownTimerRef = useRef<number | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const recordStopTimeoutRef = useRef<number | null>(null);
  const activePlayerRef = useRef<1 | 2 | null>(null);

  const COUNTDOWN_SECONDS = 3;
  const RECORD_SECONDS = 20;

  const p1Color = mode === GameMode.BATTLE ? 'purple' : 'pink';
  const p2Color = mode === GameMode.BATTLE ? 'green' : 'cyan';
  const themeColor = mode === GameMode.BATTLE ? 'text-purple-400' : 'text-pink-400';

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interimTranscript += event.results[i][0].transcript;
        }
        setLiveTranscript(interimTranscript);
      };
    }
    
    startP1Turn();
    
    return () => {
      audioService.stopBeatTrack();
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      if (recordStopTimeoutRef.current) window.clearTimeout(recordStopTimeoutRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) { console.error(e); }
      }
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    audioService.setBeatSource(beat.src);
  }, [beat]);

  useEffect(() => {
    if (turnState === TurnState.P1_READY) startCountdown(1);
    if (turnState === TurnState.P2_READY) startCountdown(2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnState]);

  const startAudioCapture = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : '';
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.warn("Audio capture failed:", e);
    }
  };

  const stopAudioCapture = async (): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return null;

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });

        audioChunksRef.current = [];
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        resolve(blob);
      };

      try { recorder.stop(); } catch (e) {
        console.warn("Recorder stop failed:", e);
        resolve(null);
      }
    });
  };

  const buildFeedbackSummary = (judges: JudgeFeedback[]) => {
    return judges
      .map(judge => `${judge.name}: ${judge.comment} (P1 ${judge.scoreP1}, P2 ${judge.scoreP2}) - ${judge.advice}`)
      .join(" | ");
  };

  const startP1Turn = () => {
    const words = getRandomRhymeGroup(mode);
    setCurrentWords(words);
    setP1Words(words);
    setTurnState(TurnState.INTRO);
    setTimeout(() => {
        setTurnState(TurnState.P1_READY);
        audioService.playSnare();
    }, 2500);
  };

  const startP2Turn = () => {
    const words = getRandomRhymeGroup(mode);
    setCurrentWords(words);
    setP2Words(words);
    setTurnState(TurnState.P2_READY);
    audioService.playSnare();
  };

  const clearTimers = () => {
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
    if (recordStopTimeoutRef.current) window.clearTimeout(recordStopTimeoutRef.current);
    countdownTimerRef.current = null;
    recordTimerRef.current = null;
    recordStopTimeoutRef.current = null;
  };

  const startCountdown = (player: 1 | 2) => {
    clearTimers();
    activePlayerRef.current = player;
    setCountdownValue(COUNTDOWN_SECONDS);

    let remaining = COUNTDOWN_SECONDS;
    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setCountdownValue(null);
        handleStartRecording(player);
      } else {
        setCountdownValue(remaining);
      }
    }, 1000);
  };

  const handleStartRecording = async (player: 1 | 2) => {
    setLiveTranscript("");
    setIsListening(true);
    setTimerRemaining(RECORD_SECONDS);
    await startAudioCapture();
    // Start music for player
    audioService.startBeatTrack(20);
    audioService.playKick();
    
    if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch(e) { console.error(e); }
    }

    setTurnState(player === 1 ? TurnState.P1_RECORDING : TurnState.P2_RECORDING);

    let remaining = RECORD_SECONDS;
    recordTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      setTimerRemaining(remaining);
      if (remaining <= 0 && recordTimerRef.current) {
        window.clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }, 1000);

    recordStopTimeoutRef.current = window.setTimeout(() => {
      handleStopRecording(player);
    }, RECORD_SECONDS * 1000);
  };

  const handleStopRecording = async (player: 1 | 2) => {
    if (activePlayerRef.current !== player) return;
    activePlayerRef.current = null;
    clearTimers();
    setCountdownValue(null);
    setTimerRemaining(null);
    setIsListening(false);
    audioService.stopBeatTrack();
    audioService.playSnare();
    
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) { console.error(e); }
    }

    const audioBlob = await stopAudioCapture();
    let finalTranscript = liveTranscript || "(No audio detected)";

    if (audioBlob) {
      try {
        const elevenTranscript = await transcribeWithElevenLabs(audioBlob);
        if (elevenTranscript.trim()) {
          finalTranscript = elevenTranscript.trim();
        }
      } catch (e) {
        console.warn("ElevenLabs transcription failed, using fallback:", e);
      }
    }

    if (player === 1) setP1Transcript(finalTranscript);
    else setP2Transcript(finalTranscript);

    setTurnState(player === 1 ? TurnState.P1_PROCESSING : TurnState.P2_PROCESSING);

    // Temp visual score
    const tempScore = await calculateScore(finalTranscript, currentWords, mode);
    if (player === 1) setP1Score(tempScore.score);
    else setP2Score(tempScore.score);

    const p1Text = player === 1 ? finalTranscript : p1Transcript;
    const p2Text = player === 2 ? finalTranscript : p2Transcript;

    // Flow
    if (player === 1) {
        setTimeout(() => {
            startP2Turn();
        }, 2000);
    } else {
        // FINAL PHASE
        // Wait a beat before showing judging screen
        setTimeout(async () => {
            setTurnState(TurnState.ROUND_END);
            setJudgeLogs([]);
            
            const addLog = (msg: string) => {
              console.log(msg);
              setJudgeLogs(prev => [...prev, msg]);
            };
            
            addLog("🎤 Starting judge evaluation...");
            addLog(`P1: ${p1Text.substring(0, 50)}${p1Text.length > 50 ? '...' : ''}`);
            addLog(`P2: ${p2Text.substring(0, 50)}${p2Text.length > 50 ? '...' : ''}`);

            const combinedTranscript = `P1: ${p1Text}\nP2: ${p2Text}`;
            const savePromise = saveTranscript(combinedTranscript).catch((err) => {
              console.warn("Supabase save failed:", err);
              return null;
            });
            
            addLog("⚖️ Calling judges...");
            // Execute Scoring
            const results = await generateGameResults(
                p1Text, 
                p1Words, 
                p2Text, 
                p2Words, 
                mode,
                (log: string) => addLog(log)
            );
            addLog("✅ Judging complete!");
            addLog(`Final: ${results.p1TotalScore} vs ${results.p2TotalScore}`);

            const saved = await savePromise;
            if (saved) {
              const grade = `P1 ${results.p1TotalScore} vs P2 ${results.p2TotalScore}`;
              const feedback = buildFeedbackSummary(results.judges);
              try {
                await updateTranscriptGrade(saved.id, grade, feedback);
              } catch (err) {
                console.warn("Supabase update failed:", err);
              }
            }
            
            onFinish(results);
        }, 1000);
    }
  };

  const renderWords = () => (
    <div className="grid grid-cols-2 gap-4 my-6 w-full max-w-md z-20">
      {currentWords.map((word, i) => (
        <div 
          key={i} 
          className={`bg-gray-800/90 border border-white/20 rounded-lg p-3 text-center text-xl font-bold tracking-wider animate-float shadow-lg`}
          style={{ animationDelay: `${i * 0.2}s` }}
        >
          {word.toUpperCase()}
        </div>
      ))}
    </div>
  );

  const renderControl = () => {
    switch (turnState) {
      case TurnState.INTRO:
        return <div className="text-5xl font-bangers animate-bounce text-yellow-400 drop-shadow-lg">ARE YOU READY?</div>;
      
      case TurnState.P1_READY:
        return (
          <div className="flex flex-col items-center">
            <div className="text-6xl font-bangers text-yellow-400 drop-shadow-lg animate-pulse">
              {countdownValue ?? COUNTDOWN_SECONDS}
            </div>
            <div className="text-xs font-mono text-gray-400 mt-2">P1 STARTING</div>
          </div>
        );

      case TurnState.P1_RECORDING:
        return (
          <div className="flex flex-col items-center gap-3">
            <div className="text-sm font-mono text-gray-300">
              {timerRemaining !== null ? `${timerRemaining}s` : `${RECORD_SECONDS}s`}
            </div>
            <button onClick={() => handleStopRecording(1)} className="bg-red-600 hover:bg-red-500 text-white rounded-full p-6 animate-pulse shadow-[0_0_20px_red]">
               <MicOff size={32} /> <span className="block text-xs font-bold mt-1">END EARLY</span>
            </button>
          </div>
        );

      case TurnState.P1_PROCESSING:
      case TurnState.P2_PROCESSING:
         return (
             <div className="flex flex-col items-center bg-black/60 p-4 rounded-xl backdrop-blur-md">
                 <RefreshCw className="animate-spin mb-2 text-yellow-400" size={32} />
                 <span className="text-sm font-mono text-white">ANALYZING BAR...</span>
             </div>
         );

      case TurnState.P2_READY:
        return (
            <div className="flex flex-col items-center">
              <div className="text-6xl font-bangers text-yellow-400 drop-shadow-lg animate-pulse">
                {countdownValue ?? COUNTDOWN_SECONDS}
              </div>
              <div className="text-xs font-mono text-gray-400 mt-2">P2 STARTING</div>
            </div>
          );
  
      case TurnState.P2_RECORDING:
        return (
           <div className="flex flex-col items-center gap-3">
             <div className="text-sm font-mono text-gray-300">
               {timerRemaining !== null ? `${timerRemaining}s` : `${RECORD_SECONDS}s`}
             </div>
             <button onClick={() => handleStopRecording(2)} className="bg-red-600 hover:bg-red-500 text-white rounded-full p-6 animate-pulse shadow-[0_0_20px_red]">
                <MicOff size={32} /> <span className="block text-xs font-bold mt-1">END EARLY</span>
             </button>
           </div>
          );
      
      case TurnState.ROUND_END: // Acts as "JUDGING" state
        return (
            <div className="flex flex-col items-center bg-black/80 p-6 rounded-xl border border-yellow-500/50 backdrop-blur-xl max-w-2xl">
                <div className="text-4xl font-bangers text-yellow-400 animate-pulse mb-4">
                  GIVING FEEDBACK...
                </div>
                <div className="text-xs font-mono text-gray-300 space-y-1 text-left w-full max-h-40 overflow-y-auto">
                  {judgeLogs.map((log, i) => (
                    <p key={i} className="animate-fadeIn">{log}</p>
                  ))}
                </div>
            </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen relative bg-black overflow-hidden">
        {/* BG */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 pointer-events-none" />

        {/* Header */}
        <div className="z-10 w-full flex justify-between items-center p-4 bg-black/40 backdrop-blur-sm border-b border-white/10">
            <button onClick={() => { audioService.stopBeatTrack(); onExit(); }} className="text-gray-400 hover:text-white"><Home /></button>
            <h1 className={`font-graffiti text-2xl ${themeColor} drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]`}>
                {mode === GameMode.BATTLE ? "STREET BATTLE" : "KILL 'EM W/ KINDNESS"}
            </h1>
            <div className="text-gray-400 font-mono text-sm">FINAL ROUND</div>
        </div>

        {/* Main Stage */}
        <div className="z-10 flex-1 flex flex-col md:flex-row items-stretch justify-center p-2 gap-2 md:gap-4 overflow-hidden">
            
            {/* P1 Meter */}
            <div className={`flex-1 flex flex-col items-center justify-center transition-opacity duration-500 ${turnState.includes('P1') ? 'opacity-100' : 'opacity-40'}`}>
                <BarMeter score={p1Score} label="P1" color={p1Color} side="left" isActive={turnState.includes('P1')} />
            </div>

            {/* Center Area */}
            <div className="flex-[2] flex flex-col items-center justify-center relative">
                
                {/* The Bulldog Avatar - Always present in center */}
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10 transition-opacity duration-500 ${turnState === TurnState.ROUND_END ? 'opacity-20' : 'opacity-80'}`}>
                    <Bulldog />
                </div>

                {/* Visualizer (Top of center) */}
                <div className="w-full max-w-lg mb-4">
                    <Visualizer isListening={isListening} color={turnState.includes('P1') ? '#a855f7' : '#22c55e'} />
                </div>

                {/* Dynamic Words */}
                {turnState !== TurnState.ROUND_END && renderWords()}

                {/* Controls */}
                <div className="mt-8 z-20">
                    {renderControl()}
                </div>

                {/* Live Text Overlay */}
                {isListening && (
                    <div className="absolute bottom-8 w-full max-w-xl bg-black/80 p-4 text-center rounded-xl backdrop-blur border border-white/20 z-30">
                        <p className="text-xl font-mono text-white animate-pulse">"{liveTranscript}"</p>
                    </div>
                )}
            </div>

            {/* P2 Meter */}
            <div className={`flex-1 flex flex-col items-center justify-center transition-opacity duration-500 ${turnState.includes('P2') ? 'opacity-100' : 'opacity-40'}`}>
                <BarMeter score={p2Score} label="P2" color={p2Color} side="right" isActive={turnState.includes('P2')} />
            </div>

        </div>
    </div>
  );
};

export default GameScreen;
