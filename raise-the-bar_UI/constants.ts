import { GameMode } from "./types";

export const TOTAL_ROUNDS = 1;

// Rhyming Groups for "Street Battle"
export const BATTLE_RHYME_GROUPS = [
  ["Crash", "Trash", "Bash", "Flash"],
  ["Flow", "Show", "Glow", "Slow"],
  ["Night", "Fight", "Light", "Sight"],
  ["Beat", "Street", "Heat", "Feet"],
  ["Code", "Mode", "Load", "Road"],
  ["Hype", "Type", "Swipe", "Pipe"],
  ["Skill", "Kill", "Drill", "Chill"]
];

// Rhyming Groups for "Kill 'Em with Kindness"
export const KINDNESS_RHYME_GROUPS = [
  ["Heart", "Start", "Smart", "Art"],
  ["Care", "Share", "Fair", "There"],
  ["Love", "Dove", "Above", "Glove"],
  ["Friend", "Mend", "Tend", "Send"],
  ["Smile", "Style", "While", "Dial"],
  ["Kind", "Mind", "Find", "Bind"]
];

export const getRandomRhymeGroup = (mode: GameMode): string[] => {
  const source = mode === GameMode.BATTLE ? BATTLE_RHYME_GROUPS : KINDNESS_RHYME_GROUPS;
  return source[Math.floor(Math.random() * source.length)];
};

// Deprecated single word lists kept for safety, but unused now
export const BATTLE_WORDS = [];
export const KINDNESS_WORDS = [];
export const getRandomWords = (mode: GameMode, count: number = 4) => getRandomRhymeGroup(mode);