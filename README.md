<div align="center">
  <img width="1200" height="475" alt="Raise The Bar Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  # Raise The Bar
  **Columbia University DevFest 2026 Winner**

  A two-player AI rap battle game where each player performs over a selected beat,
  gets transcribed from live audio, and is scored by an AI judge panel.
</div>

## Overview
Raise The Bar is an interactive, street-style battle experience built with React + Vite.
Players choose a mode, perform timed verses, and get instant judge feedback with final scoring.

## Highlights
- Two-player battle loop with turn-based 20-second performance windows
- Two game modes: `Street Battle` and `Kill 'Em w/ Kindness`
- Beat selection system (`New Gen`, `Old School`, `Underground`)
- Live transcript capture with Web Speech API + ElevenLabs transcription fallback
- AI judging with weighted scoring and personalized coaching feedback
- Supabase persistence for transcripts, grades, and feedback summaries

## Demo
- AI Studio prototype: https://ai.studio/apps/drive/1ZPK_79HzRYE7oprpdNtk7Ghl6GhVJjTt

## Tech Stack
- Frontend: `React 19`, `TypeScript`, `Vite`, `Tailwind (CDN)`, `lucide-react`
- AI/ML Services: `ElevenLabs`, `Featherless`, `K2 (optional advisor model)`
- Data: `Supabase`

## How It Works
1. Pick a mode and beat.
2. Player 1 and Player 2 record one turn each.
3. Audio is transcribed and matched against target rhyme words.
4. AI judges score flow/energy and generate feedback.
5. Final result is displayed and stored in Supabase.

## Local Setup
### Prerequisites
- Node.js 18+
- npm
- Browser microphone permissions enabled

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` in the project root and add:
   ```bash
   VITE_ELEVEN_LABS_API_KEY=your_key
   VITE_FEATHERLESS_API_KEY=your_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Optional (used for Coach K2 advisor feedback)
   VITE_K2_API_KEY=your_key
   VITE_K2_BASE_URL=your_provider_base_url
   VITE_K2_MODEL=k2-think-v2
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

### Build for Production
```bash
npm run build
npm run preview
```

## Supabase Table
The app expects a `transcripts` table with fields similar to:
- `id` (primary key)
- `text` (text)
- `created_at` (timestamp)
- `grade` (text, nullable)
- `feedback` (text, nullable)

## Project Structure
```text
.
|- components/        # UI screens and visual components
|- services/          # API clients + scoring + storage logic
|- beats/             # Local beat tracks
|- App.tsx            # Main game state orchestration
|- constants.ts       # Beat options and rhyme groups
|- types.ts           # Shared enums and interfaces
|- BACKEND.md         # Backend/data flow notes
```

## Notes
- External API calls are currently made from the client.
- For production hardening, move AI/service calls behind a secure backend proxy.
