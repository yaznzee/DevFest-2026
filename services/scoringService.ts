import { GameMode, GameResult, JudgeFeedback } from "../types";
import { callFeatherless, ChatMessage } from "./featherless";
import { callK2, isK2Configured } from "./k2";

// Helper for local basic analysis (fallback)
const analyzeText = (text: string, words: string[]) => {
  const lower = text.toLowerCase();
  const hitCount = words.filter(w => lower.includes(w.toLowerCase())).length;
  const lengthScore = Math.min(text.length / 5, 20);
  const hitScore = hitCount * 15;
  const base = 30 + Math.random() * 20;
  return Math.min(100, Math.floor(base + lengthScore + hitScore));
};

type JudgeProvider = "featherless" | "k2";

type JudgeConfig = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  model: string;
  fallbackModel?: string;
  provider: JudgeProvider;
  systemPrompt: string;
};

// Define the Judges Personas
const JUDGES_CONFIG: JudgeConfig[] = [
  {
    id: "flowbot",
    name: "MC FlowBot",
    role: "Rhythm & Rhyme",
    avatar: "ðŸ¤–",
    model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    provider: "featherless",
    systemPrompt: "You are MC FlowBot, a robot judge who strictly analyzes rhyme density and flow patterns. Be analytical but cool. Output valid JSON only."
  },
  {
    id: "logic",
    name: "Lil' Logic",
    role: "Lyrical Analyst",
    avatar: "ðŸ¤“",
    model: (import.meta.env.VITE_K2_MODEL as string | undefined) || "k2-think-v2",
    fallbackModel: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    provider: "k2",
    systemPrompt: "You are Lil' Logic, a nerdcore rapper judge. You care about vocabulary, coherence, and clever wordplay. Output valid JSON only."
  },
  {
    id: "grandma",
    name: "Grandma Gpu",
    role: "Vibe Checker",
    avatar: "ðŸ‘µ",
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    provider: "featherless",
    systemPrompt: "You are Grandma GPU, a sweet old lady judge. You love kindness and good manners, but you can be sassy if someone is rude. Output valid JSON only."
  },
  {
    id: "snoop",
    name: "Snoop Dawg",
    role: "Street Cred",
    avatar: "ðŸ¶",
    model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    provider: "featherless",
    systemPrompt: "You are Snoop Dawg, the coolest judge in the game. You judge based on style, swagger, and attitude. Speak in slang. Output valid JSON only."
  }
];

const fetchJudgeVerdict = async (
  judge: JudgeConfig,
  p1Transcript: string,
  p2Transcript: string,
  mode: GameMode
): Promise<JudgeFeedback> => {
  const prompt = `
    Mode: ${mode === GameMode.BATTLE ? "Rap Battle" : "Kindness Battle"}
    
    Player 1: "${p1Transcript || "(Silence)"}"
    Player 2: "${p2Transcript || "(Silence)"}"
    
    Evaluate both players.
    Return a JSON object with strictly this structure:
    {
      "scoreP1": number (0-100),
      "scoreP2": number (0-100),
      "comment": "string (max 15 words)",
      "advice": "string (max 10 words)"
    }
  `;

  const messages: ChatMessage[] = [
    { role: "system", content: judge.systemPrompt },
    { role: "user", content: prompt }
  ];

  try {
    const useK2 = judge.provider === "k2" && isK2Configured();
    const modelToUse = useK2 ? judge.model : (judge.fallbackModel || judge.model);
    const rawContent = useK2
      ? await callK2(messages, modelToUse)
      : await callFeatherless(messages, modelToUse);

    // Attempt to extract JSON from code blocks if present
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawContent;

    const parsed = JSON.parse(jsonStr);

    return {
      name: judge.name,
      role: judge.role,
      avatar: judge.avatar,
      scoreP1: Number(parsed.scoreP1) || 50,
      scoreP2: Number(parsed.scoreP2) || 50,
      comment: parsed.comment || "No comment.",
      advice: parsed.advice || "Keep practicing."
    };
  } catch (e) {
    console.error(`Judge ${judge.name} failed:`, e);
    // Fallback based on local analysis
    const baseScore = analyzeText(p1Transcript, []);
    return {
      name: judge.name,
      role: judge.role,
      avatar: judge.avatar,
      scoreP1: baseScore,
      scoreP2: baseScore,
      comment: "My circuits are fried (API Error).",
      advice: "Try again later."
    };
  }
};

export const generateGameResults = async (
  p1Transcript: string,
  p1Words: string[],
  p2Transcript: string,
  p2Words: string[],
  mode: GameMode
): Promise<GameResult> => {
  console.log("Starting Judge Panel Evaluation...");

  // Run all judges in parallel
  const judgePromises = JUDGES_CONFIG.map(judge =>
    fetchJudgeVerdict(judge, p1Transcript, p2Transcript, mode)
  );

  const judges = await Promise.all(judgePromises);

  // Aggregate Scores
  const p1TotalScore = Math.floor(judges.reduce((acc, j) => acc + j.scoreP1, 0) / judges.length);
  const p2TotalScore = Math.floor(judges.reduce((acc, j) => acc + j.scoreP2, 0) / judges.length);

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
  // Kept lightweight for realtime visual feedback
  const score = analyzeText(transcript, words);
  return {
    score,
    reasoning: "Calculating..."
  };
};
