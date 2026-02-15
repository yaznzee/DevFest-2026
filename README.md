<div align="center">

# RAISE THE BAR
### Columbia University DevFest 2026 Winner

Real-time, two-player AI rap battles. Pick a beat, spit your verse, and let an AI judge panel decide who really brought bars.
</div>

## What This Is
Raise The Bar is a competitive rap battle game built with React + Vite.
Two players take timed turns on the mic, then AI judges score performance quality, flow, and word usage with live feedback.

## Why It Feels Different
- Head-to-head battle loop with live momentum and round tension
- Two distinct modes: `Street Battle` and `Kill 'Em w/ Kindness`
- Beat switching with three styles: `New Gen`, `Old School`, `Underground`
- Voice capture plus transcription pipeline for instant scoring
- Multi-judge AI panel with weighted verdicts and coaching notes
- Battle data persisted to Supabase for history and analysis

## Battle Flow
1. Choose mode and beat.
2. Player 1 records a 20-second verse.
3. Player 2 records a 20-second verse.
4. Transcripts are analyzed against rhyme targets.
5. Judges return scores and feedback.
6. Winner screen shows final breakdown and transcripts.

## Demo
- AI Studio prototype: https://ai.studio/apps/drive/1ZPK_79HzRYE7oprpdNtk7Ghl6GhVJjTt

## Stack
- Frontend: `React 19`, `TypeScript`, `Vite`, `Tailwind (CDN)`, `lucide-react`
- Speech-to-Text: `ElevenLabs` (with browser speech fallback in live capture)
- LLM Judging: `Featherless`, optional `K2` advisor model
- Database: `Supabase`

## Quick Start
### Prerequisites
- Node.js 18+
- npm
- Microphone access in browser

### Install and Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` in the project root:
   ```bash
   VITE_ELEVEN_LABS_API_KEY=your_key
   VITE_FEATHERLESS_API_KEY=your_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Optional (Coach K2 feedback)
   VITE_K2_API_KEY=your_key
   VITE_K2_BASE_URL=your_provider_base_url
   VITE_K2_MODEL=k2-think-v2
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

### Production Build
```bash
npm run build
npm run preview
```

## Supabase Schema
The app expects a `transcripts` table with fields similar to:
- `id` (primary key)
- `text` (text)
- `created_at` (timestamp)
- `grade` (text, nullable)
- `feedback` (text, nullable)

## Project Map
```text
.
|- components/      # Screens and gameplay UI
|- services/        # AI, audio, scoring, and Supabase clients
|- beats/           # Beat audio files
|- App.tsx          # Top-level game state flow
|- constants.ts     # Mode config, rhyme groups, beat options
|- types.ts         # Shared types and enums
|- BACKEND.md       # Backend architecture notes
```

## Notes
- API calls are currently client-side for demo speed.
- For production hardening, move external service calls behind a secure backend proxy.
