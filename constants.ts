import { BeatOption, GameMode } from "./types";

export const BEAT_OPTIONS: BeatOption[] = [
  {
    id: "newgen",
    label: "New Gen",
    sublabel: "Lil Baby, Yeat",
    src: new URL("./beats/newgen.mp3", import.meta.url).toString()
  },
  {
    id: "oldschool",
    label: "Old School",
    sublabel: "OG Legends",
    src: new URL("./beats/oldschool.mp3", import.meta.url).toString()
  },
  {
    id: "underground",
    label: "Underground",
    sublabel: "Xaviersobased, 2hollis",
    src: new URL("./beats/underground.mp3", import.meta.url).toString()
  }
];

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