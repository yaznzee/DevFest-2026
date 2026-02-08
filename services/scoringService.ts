import { GameMode, GameResult, JudgeFeedback } from "../types";
import { callFeatherless, ChatMessage } from "./featherless";
import { callK2, isK2Configured } from "./k2";

const STRONG_EMOTION_WORDS = [
  "hate", "love", "fire", "destroy", "kill", "slay", "ugly", "beautiful", "amazing", "terrible",
  "sick", "ill", "dope", "weak", "strong", "crush", "burn", "freeze", "explode", "rage", "fury",
  "passion", "intense", "fierce", "brutal", "savage", "vicious", "raw", "pure", "electric", "thunder"
];

const countEmotionalWords = (text: string): number => {
  const lower = text.toLowerCase();
  let count = 0;
  STRONG_EMOTION_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    count += (lower.match(regex) || []).length;
  });
  return count;
};

const getMatchedWords = (text: string, targetWords: string[]): string[] => {
  const lower = text.toLowerCase();
  return targetWords.filter(word => lower.includes(word.toLowerCase()));
};

type JudgeConfig = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  judgeType: "scorer" | "advisor";
  weight?: number;
  model?: string;
  prompt: (p1Text: string, p2Text: string, p1Matched: string[], p2Matched: string[]) => string;
};

// Simple, direct judge prompts
const JUDGES_CONFIG: JudgeConfig[] = [
  {
    id: "passion",
    name: "Passion Meter",
    role: "Energy & Delivery",
    avatar: "🔥",
    judgeType: "scorer",
    weight: 0.2,
    prompt: (p1Text, p2Text, p1Matched, p2Matched) => `
You are a rap battle judge evaluating two rappers' verses.

P1 (${p1Text.split(/\s+/).length} words): "${p1Text}"
P2 (${p2Text.split(/\s+/).length} words): "${p2Text}"

Score both 0-100 on their energy, delivery, and presence. Look for passion, confidence, and emotional impact in their raps. Longer verses with strong delivery should score higher.

Format: P1 Score: X, P2 Score: Y
Verdict: (brief analysis of their energy and delivery)
`
  },
  {
    id: "coherence",
    name: "Flow Check",
    role: "Rhyme & Rhythm",
    avatar: "🎯",
    judgeType: "scorer",
    weight: 0.8,
    prompt: (p1Text, p2Text, p1Matched, p2Matched) => `
You are a rap battle judge evaluating two rappers' verses.

P1 (${p1Text.split(/\s+/).length} words, used ${p1Matched.length} rhyme words): "${p1Text}"
P2 (${p2Text.split(/\s+/).length} words, used ${p2Matched.length} rhyme words): "${p2Text}"

Score both 0-100 on their flow, rhyme scheme, and rhythm. Look for consistent rhyming, clever wordplay, and bars that fit the beat. Longer verses with tight rhymes and flow should score higher.

Format: P1 Score: X, P2 Score: Y
Verdict: (brief analysis of their flow and rhyme scheme)
`
  },
  {
    id: "coach",
    name: "Coach K2",
    role: "Personalized Feedback",
    avatar: "🎓",
    judgeType: "advisor",
    model: "k2-think-v2",
    prompt: (p1Text, p2Text, p1Matched, p2Matched) => `
You are a rap coach giving personalized feedback to two rappers about how they can improve next time.

Player 1's verse: "${p1Text}"
Player 2's verse: "${p2Text}"

Give 3 lines of personalized feedback for Player 1 about how they can do better next time, then 3 lines for Player 2. Focus on specific improvements they can make. Just write the feedback, nothing else.`
  }
];

export interface EnhancedJudgeFeedback extends JudgeFeedback {
  matchedWordsP1?: string[];
  matchedWordsP2?: string[];
  emotionalWordsP1?: number;
  emotionalWordsP2?: number;
}

const parseK2Response = async (
  rawContent: string,
  judge: JudgeConfig,
  p1Transcript: string,
  p2Transcript: string,
  p1Matched: string[],
  p2Matched: string[]
): Promise<EnhancedJudgeFeedback> => {
  // Split response: first 3 lines for P1, rest for P2
  const lines = rawContent.trim().split('\n').filter(l => l.trim());
  const p1Feedback = lines.slice(0, 3).join('\n').trim();
  const p2Feedback = lines.slice(3).join('\n').trim();
  
  const emotionalP1 = countEmotionalWords(p1Transcript);
  const emotionalP2 = countEmotionalWords(p2Transcript);
  
  return {
    name: judge.name,
    role: judge.role,
    avatar: judge.avatar,
    scoreP1: 0,
    scoreP2: 0,
    comment: p1Feedback,
    advice: p2Feedback,
    matchedWordsP1: p1Matched,
    matchedWordsP2: p2Matched,
    emotionalWordsP1: emotionalP1,
    emotionalWordsP2: emotionalP2
  };
};

const parseFeatherlessResponse = async (
  rawContent: string,
  judge: JudgeConfig,
  p1Transcript: string,
  p2Transcript: string,
  p1Matched: string[],
  p2Matched: string[]
): Promise<EnhancedJudgeFeedback> => {
  console.log(`Parsing ${judge.name} response...`);
  
  // Extract scores - format "P1 Score: X, P2 Score: Y"
  const scoreRegex = /P1\s+Score:\s*(\d+).*?P2\s+Score:\s*(\d+)/s;
  const scoreMatch = rawContent.match(scoreRegex);
  
  const p1Score = scoreMatch ? Math.min(100, Math.max(0, Number(scoreMatch[1]))) : 50;
  const p2Score = scoreMatch ? Math.min(100, Math.max(0, Number(scoreMatch[2]))) : 50;
  
  console.log(`${judge.name}: P1=${p1Score}, P2=${p2Score}`);
  
  // Extract verdict/comment - everything after "Verdict:"
  const verdictMatch = rawContent.match(/Verdict:\s*(.+?)(?:\n\n|$)/s);
  const verdict = verdictMatch ? verdictMatch[1].trim() : rawContent.trim();
  
  const emotionalP1 = countEmotionalWords(p1Transcript);
  const emotionalP2 = countEmotionalWords(p2Transcript);
  
  return {
    name: judge.name,
    role: judge.role,
    avatar: judge.avatar,
    scoreP1: p1Score,
    scoreP2: p2Score,
    comment: verdict,
    advice: "",
    matchedWordsP1: p1Matched,
    matchedWordsP2: p2Matched,
    emotionalWordsP1: emotionalP1,
    emotionalWordsP2: emotionalP2
  };
};

const fetchJudgeVerdict = async (
  judge: JudgeConfig,
  p1Transcript: string,
  p2Transcript: string,
  p1Matched: string[],
  p2Matched: string[]
): Promise<EnhancedJudgeFeedback> => {
  const prompt = judge.prompt(p1Transcript, p2Transcript, p1Matched, p2Matched);
  const messages: ChatMessage[] = [
    { role: "user", content: prompt }
  ];

  try {
    // Use K2 for advisor, Featherless for scorers
    if (judge.judgeType === "advisor" && judge.model === "k2-think-v2" && isK2Configured()) {
      console.log("\n🎓 === COACH K2 DEBUG START ===");
      console.log("Judge name:", judge.name);
      console.log("Calling K2 API...");
      console.log("Prompt:", prompt);
      
      const rawContent = await callK2(messages, judge.model);
      
      console.log("\n🎓 K2 RAW RESPONSE:");
      console.log(rawContent);
      console.log("\n🎓 K2 Response length:", rawContent.length);
      console.log("🎓 === COACH K2 DEBUG END ===\n");
      
      return await parseK2Response(rawContent, judge, p1Transcript, p2Transcript, p1Matched, p2Matched);
    } else {
      const rawContent = await callFeatherless(messages, "OmniDimen/OmniDimen-V1.5-4B-Emotion");
      return await parseFeatherlessResponse(rawContent, judge, p1Transcript, p2Transcript, p1Matched, p2Matched);
    }
  } catch (e) {
    console.error(`Judge ${judge.name} failed:`, e);

    const emotionalP1 = countEmotionalWords(p1Transcript);
    const emotionalP2 = countEmotionalWords(p2Transcript);

    return {
      name: judge.name,
      role: judge.role,
      avatar: judge.avatar,
      scoreP1: 50,
      scoreP2: 50,
      comment: "Error",
      advice: "Try again",
      matchedWordsP1: p1Matched,
      matchedWordsP2: p2Matched,
      emotionalWordsP1: emotionalP1,
      emotionalWordsP2: emotionalP2
    };
  }
};

export const generateGameResults = async (
  p1Transcript: string,
  p1Words: string[],
  p2Transcript: string,
  p2Words: string[],
  mode: GameMode,
  logCallback?: (msg: string) => void
): Promise<GameResult> => {
  console.log("Starting Judge Panel Evaluation...");

  // Match rhyme words
  const p1Matched = getMatchedWords(p1Transcript, p1Words);
  const p2Matched = getMatchedWords(p2Transcript, p2Words);

  const judges: EnhancedJudgeFeedback[] = [];

  // Run judges sequentially
  for (const judge of JUDGES_CONFIG) {
    if (logCallback) {
      logCallback(`  Asking ${judge.name}...`);
    }
    const verdict = await fetchJudgeVerdict(judge, p1Transcript, p2Transcript, p1Matched, p2Matched);
    judges.push(verdict);
    if (logCallback) {
      logCallback(`  ✓ ${judge.name} responded`);
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  if (logCallback) {
    logCallback("📊 Calculating final scores...");
  }

  // Calculate weighted scores from judges (20% passion, 80% flow)
  // Only include scorers, not advisors
  const scoringJudges = judges.filter(j => j.judgeType === "scorer");
  let p1TotalScore = 0;
  let p2TotalScore = 0;
  
  for (let i = 0; i < scoringJudges.length; i++) {
    const judgeConfig = JUDGES_CONFIG.find(jc => jc.name === scoringJudges[i].name);
    const weight = judgeConfig?.weight || 0.5;
    const judgeScore1 = scoringJudges[i].scoreP1 * weight;
    const judgeScore2 = scoringJudges[i].scoreP2 * weight;
    
    if (logCallback) {
      logCallback(`  ${scoringJudges[i].name}: P1=${scoringJudges[i].scoreP1} (×${weight}=${judgeScore1.toFixed(1)}) P2=${scoringJudges[i].scoreP2} (×${weight}=${judgeScore2.toFixed(1)})`);
    }
    
    p1TotalScore += judgeScore1;
    p2TotalScore += judgeScore2;
  }

  // Small bonus for using assigned rhyme words (encourages hitting targets)
  // But not enough to overcome poor length/quality
  const p1WordBonus = Math.min(10, p1Matched.length * 3);
  const p2WordBonus = Math.min(10, p2Matched.length * 3);
  
  if (logCallback && (p1WordBonus > 0 || p2WordBonus > 0)) {
    logCallback(`  Word bonuses: P1=+${p1WordBonus} (${p1Matched.length} words) P2=+${p2WordBonus} (${p2Matched.length} words)`);
  }
  
  p1TotalScore += p1WordBonus;
  p2TotalScore += p2WordBonus;

  p1TotalScore = Math.min(100, Math.floor(p1TotalScore));
  p2TotalScore = Math.min(100, Math.floor(p2TotalScore));

  let winner: 'P1' | 'P2' | 'TIE' = 'TIE';
  if (p1TotalScore > p2TotalScore) winner = 'P1';
  if (p2TotalScore > p1TotalScore) winner = 'P2';

  return {
    winner,
    p1TotalScore,
    p2TotalScore,
    p1Transcript,
    p2Transcript,
    judges
  };
};

export const calculateScore = async (transcript: string, words: string[], mode: GameMode) => {
  const matched = getMatchedWords(transcript, words);
  const emotionalCount = countEmotionalWords(transcript);
  const score = 30 + (matched.length * 10) + (emotionalCount * 3);
  return {
    score: Math.min(100, score),
    reasoning: `Matched: ${matched.join(", ") || "none"}`
  };
};
