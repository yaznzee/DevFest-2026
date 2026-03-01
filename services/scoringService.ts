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
    weight: 0.25,
    model: "OmniDimen/OmniDimen-V1.5-4B-Emotion",
    prompt: (p1Text, p2Text, p1Matched, p2Matched) => `
You are a rap battle judge evaluating two rappers' verses for **energy** and **delivery**.

P1 (${p1Text.split(/\s+/).length} words): "${p1Text}"
P2 (${p2Text.split(/\s+/).length} words): "${p2Text}"

If one or both transcripts are empty, still assign a score and comment (a silent rapper deserves feedback).
Consider crowd‑level hype, punch timing, vocal variety, and how hard the lyrics hit.
Longer verses with strong intensity should score higher, but don't reward rambling.

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
    weight: 0.5,
    model: "OmniDimen/OmniDimen-V1.5-4B-Emotion",
    prompt: (p1Text, p2Text, p1Matched, p2Matched) => `
You are a rap battle judge evaluating two rappers' verses for **flow**, **rhyme schemes**, and **rhythm**.

P1 (${p1Text.split(/\s+/).length} words, used ${p1Matched.length} target words): "${p1Text}"
P2 (${p2Text.split(/\s+/).length} words, used ${p2Matched.length} target words): "${p2Text}"

Give scores 0-100. Pay attention to multisyllabic rhymes, internal rhyme, sync with beat, and clever wordplay.
If a rapper says nothing, give them a low score but still comment.

Format: P1 Score: X, P2 Score: Y
Verdict: (brief analysis of their flow and rhyme scheme)
`
  },
  {
    id: "wordplay",
    name: "Punchline Panel",
    role: "Wordplay & Creativity",
    avatar: "💥",
    judgeType: "scorer",
    weight: 0.25,
    model: "OmniDimen/OmniDimen-V1.5-4B-Emotion",
    prompt: (p1Text, p2Text, p1Matched, p2Matched) => `
You are a rap battle judge focusing on **wordplay**, **punchlines**, and **originality**.

P1: "${p1Text}"
P2: "${p2Text}"

Score both 0-100. Look for clever metaphors, surprise twists, and bars that hit hard.
Even if the verse is blank, provide constructive commentary and give a fair score.

Format: P1 Score: X, P2 Score: Y
Verdict: (brief analysis of their creativity)
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

Even if a rapper didn't say anything, offer encouragement and suggestions.
Give 3 lines of personalized feedback for Player 1, then 3 lines for Player 2. Focus on specific improvements. Just write the feedback, nothing else.`
  }

];

export interface EnhancedJudgeFeedback extends JudgeFeedback {
  judgeType: "scorer" | "advisor";
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
  // K2 output varies; attempt multiple heuristics to keep player1 and
  // player2 feedback separate.
  let p1Feedback = "";
  let p2Feedback = "";
  const text = rawContent.trim();

  // 1. split on explicit "Player 2" label if present
  const player2Idx = text.search(/player\s*2[:\-]/i);
  if (player2Idx !== -1) {
    p1Feedback = text.substring(0, player2Idx).trim();
    p2Feedback = text.substring(player2Idx).replace(/player\s*2[:\-]?/i, '').trim();
  } else {
    // 2. split on blank line(s)
    const paragraphs = text.split(/\n\s*\n/);
    if (paragraphs.length >= 2) {
      p1Feedback = paragraphs[0].trim();
      p2Feedback = paragraphs.slice(1).join("\n\n").trim();
    } else {
      // 3. old fallback: first 3 lines / rest
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length > 3) {
        p1Feedback = lines.slice(0, 3).join('\n');
        p2Feedback = lines.slice(3).join('\n');
      } else {
        p1Feedback = text;
      }
    }
  }

  const emotionalP1 = countEmotionalWords(p1Transcript);
  const emotionalP2 = countEmotionalWords(p2Transcript);

  // remove any leading "Player 1:" / "Player 2:" labels that may
  // still be present in the extracted strings
  const clean = (text: string) => text.replace(/^(Player\s*1|P1)[:\s-]*/i, '')
                                  .replace(/^(Player\s*2|P2)[:\s-]*/i, '');

  return {
    judgeType: judge.judgeType,
    name: judge.name,
    role: judge.role,
    avatar: judge.avatar,
    scoreP1: 0,
    scoreP2: 0,
    comment: clean(p1Feedback) || "(no feedback)",
    advice: clean(p2Feedback) || "",
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
  
  let p1Score = scoreMatch ? Math.min(100, Math.max(0, Number(scoreMatch[1]))) : 0;
  let p2Score = scoreMatch ? Math.min(100, Math.max(0, Number(scoreMatch[2]))) : 0;

  // if transcripts were totally empty, we still want the judges to
  // provide something sensible rather than 0/0; leave scores but
  // comment appropriately
  if (!p1Transcript.trim() && !p2Transcript.trim()) {
    p1Score = 0;
    p2Score = 0;
  }
  
  console.log(`${judge.name}: P1=${p1Score}, P2=${p2Score}`);
  
  // Extract verdict/comment - everything after "Verdict:"
  const verdictMatch = rawContent.match(/Verdict:\s*(.+?)(?:\n\n|$)/s);
  const verdict = verdictMatch ? verdictMatch[1].trim() : rawContent.trim();
  
  const emotionalP1 = countEmotionalWords(p1Transcript);
  const emotionalP2 = countEmotionalWords(p2Transcript);
  
  return {
    judgeType: judge.judgeType,
    name: judge.name,
    role: judge.role,
    avatar: judge.avatar,
    scoreP1: p1Score,
    scoreP2: p2Score,
    comment: verdict || "(no comment)",
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
    // select the appropriate AI backend based on judgeType/model
    if (judge.judgeType === "advisor" && judge.model && judge.model.startsWith("k2")) {
      if (isK2Configured()) {
        console.log(`\n🎓 [${judge.name}] calling K2 model ${judge.model}`);
        const rawContent = await callK2(messages, judge.model);
        return await parseK2Response(rawContent, judge, p1Transcript, p2Transcript, p1Matched, p2Matched);
      } else {
        console.warn(`K2 model requested but configuration missing, falling back to Featherless`);
      }
    }

    // fallback branch (scorers or unconfigured advisors)
    const defaultModel = "OmniDimen/OmniDimen-V1.5-4B-Emotion";
    const modelName = judge.model && !judge.model.startsWith("k2") ? judge.model : defaultModel;
    const rawContent = await callFeatherless(messages, modelName, 0.5);
    return await parseFeatherlessResponse(rawContent, judge, p1Transcript, p2Transcript, p1Matched, p2Matched);
  } catch (e) {
    console.error(`Judge ${judge.name} call failed:`, e);

    const emotionalP1 = countEmotionalWords(p1Transcript);
    const emotionalP2 = countEmotionalWords(p2Transcript);

    // even on error, return a feedback object so UI doesn't hang
    return {
      judgeType: judge.judgeType,
      name: judge.name,
      role: judge.role,
      avatar: judge.avatar,
      scoreP1: 0,
      scoreP2: 0,
      comment: "(judge unavailable – defaulted)",
      advice: "",
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
  // only scorers contribute to the numeric result
  const scoringJudges = judges.filter(j => j.judgeType === "scorer");

  // normalize weights so they add up to 1 (handles dynamic config)
  const totalWeight = scoringJudges
    .map(j => JUDGES_CONFIG.find(c => c.name === j.name)?.weight || 0)
    .reduce((a, b) => a + b, 0) || 1;

  let p1TotalScore = 0;
  let p2TotalScore = 0;
  
  scoringJudges.forEach(judgeFeedback => {
    const judgeConfig = JUDGES_CONFIG.find(c => c.name === judgeFeedback.name);
    const rawWeight = judgeConfig?.weight || 0;
    const weight = rawWeight / totalWeight;
    const judgeScore1 = judgeFeedback.scoreP1 * weight;
    const judgeScore2 = judgeFeedback.scoreP2 * weight;

    if (logCallback) {
      logCallback(`  ${judgeFeedback.name}: P1=${judgeFeedback.scoreP1} (×${weight.toFixed(2)}=${judgeScore1.toFixed(1)}) P2=${judgeFeedback.scoreP2} (×${weight.toFixed(2)}=${judgeScore2.toFixed(1)})`);
    }

    p1TotalScore += judgeScore1;
    p2TotalScore += judgeScore2;
  });

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
  // determine which of the assigned target words actually appeared
  const matched = getMatchedWords(transcript, words);

  // the visual bar percentage should simply reflect how many of the
  // target words were hit. for example, using 2 of 4 words = 50%.
  // if no words were supplied we default to 0 to avoid division by zero.
  let percent = 0;
  if (words.length > 0) {
    percent = (matched.length / words.length) * 100;
  }

  return {
    score: Math.min(100, percent),
    reasoning: `Matched: ${matched.join(", ") || "none"}`
  };
};
