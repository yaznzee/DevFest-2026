export enum GameMode {
  BATTLE = 'BATTLE',
  KINDNESS = 'KINDNESS'
}

export enum GameState {
  MENU = 'MENU',
  MODE_SELECT = 'MODE_SELECT',
  GAME_LOOP = 'GAME_LOOP',
  RESULTS = 'RESULTS'
}

export enum TurnState {
  INTRO = 'INTRO',
  P1_READY = 'P1_READY',
  P1_RECORDING = 'P1_RECORDING',
  P1_PROCESSING = 'P1_PROCESSING',
  P2_READY = 'P2_READY',
  P2_RECORDING = 'P2_RECORDING',
  P2_PROCESSING = 'P2_PROCESSING',
  ROUND_END = 'ROUND_END'
}

export interface PlayerStats {
  score: number; // 0 to 100
  history: number[]; // History of scores per round
  lastTranscription: string;
  lastAnalysis: string;
}

export interface JudgeFeedback {
  name: string;
  role: string;
  avatar: string;
  scoreP1: number;
  scoreP2: number;
  comment: string;
  advice: string;
}

export interface GameResult {
  winner: 'P1' | 'P2' | 'TIE';
  p1TotalScore: number;
  p2TotalScore: number;
  p1Transcript: string;
  p2Transcript: string;
  judges: JudgeFeedback[];
}

export interface RoundData {
  roundNumber: number;
  words: string[];
}