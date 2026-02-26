<div align="center">

# 🎤 RAISE THE BAR
### Winner – Columbia University DevFest 2026

Real‑time, two‑player AI rap battles where you choose a beat, spit a verse, and let an intelligent panel of AI judges decide who really brought the bars. Think of it as *versus mode* for the future of hip‑hop.

**🏆 The Team:** Tawhid Zaman ([GitHub](https://github.com/TawhidZGit) / [LinkedIn](https://linkedin.com/in/tawhid-zaman)) • 
Yazn Alzeghaibi ([GitHub](https://github.com/yaznzee) / [LinkedIn](https://linkedin.com/in/yazn-alzeghaibi)) • 
Maheen Rassell ([GitHub](https://github.com/mrassell) / [LinkedIn](https://linkedin.com/in/mrassell)) • 
Mohammed Miyajan ([GitHub](https://github.com) / [LinkedIn](https://linkedin.com/in/mohammed-miyajan-509482296))

</div>

---

## Overview
Raise The Bar is an experimental web game built with **React**, **TypeScript**, and **Vite**. Two players compete in short, timed rap rounds; their audio is transcribed and scored by multiple AI judges that evaluate flow, wordplay, and delivery. Results are stored for replay and analytics.

This project took home the top prize at DevFest 2026 and is designed to be both a showcase of real‑time audio processing and a fun proof‑of‑concept for AI judging.

---

## Key Features

- **Live, turn‑based battle loop** with momentum and instant scoring
- Two game modes: *Street Battle* (aggressive) and *Kill ’Em with Kindness* (positive vibes)
- Three beat styles: *New Gen*, *Old School*, and *Underground*
- Browser microphone capture + speech‑to‑text pipeline
- Multi‑judge AI panel with weighted verdicts and coaching feedback
- Optional coaching model powered by K2
- Persistent battle history via Supabase
- Modular architecture for easy extension

---

## Gameplay Flow
1. Select a game mode and beat.
2. Player 1 records a verse and has to say the words on the screen.
3. Player 2 records a verse and has to say the words on the screen.
4. Verses are transcribed and analyzed for rhymes, cadence, and word choice.
5. AI judges return scores, breakdowns, and advice.
6. Winner screen displays results, transcripts, and judge comments.

---

## Technology Stack

| Area | Tools / Services |
|------|------------------|
| Frontend | React 19, TypeScript, Vite, Tailwind (CDN), lucide‑react |
| Speech‑to‑Text | ElevenLabs (with browser fallback) |
| AI Judging | Featherless (primary), K2 (coach/advisor) |
| Database | Supabase (PostgreSQL) |
| Hosting | Any static host (Vercel, Netlify, etc.) |

---

## Getting Started

### Prerequisites

- Node.js **18+**
- npm (or yarn)
- A working microphone and browser permission

### Installation

```bash
git clone <repo-url>
cd DevFest-2026
npm install
```

### Configuration
Create a `.env.local` file in the project root with the following variables:

```bash
VITE_ELEVEN_LABS_API_KEY=your_elevenlabs_key
VITE_FEATHERLESS_API_KEY=your_featherless_key
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# Optional: K2 coaching model
VITE_K2_API_KEY=your_key
VITE_K2_BASE_URL=https://api.yourprovider.com
VITE_K2_MODEL=k2-think-v2
```

> 🔒 **Security note:** In production, move all external API calls to a secure backend proxy. The current setup is for rapid prototyping.

### Run Locally

```bash
npm run dev
```

Open http://localhost:5173 (or port printed by Vite) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

Deploy the contents of the `dist/` directory to your preferred static hosting provider.

---

## Supabase Schema

```sql
create table transcripts (
  id serial primary key,
  text text not null,
  created_at timestamp with time zone default now(),
  grade text,
  feedback text
);
```

Additional tables (users, battles, etc.) can be added for extended features.

---

## Project Structure

```
.
├─ beats/               # Audio files for beats
├─ components/          # React screens & UI components
├─ services/            # API clients and business logic
├─ App.tsx              # Top‑level state and routing
├─ constants.ts         # Mode/beat configuration, rhyme groups
├─ types.ts             # Shared TypeScript types
├─ BACKEND.md           # Notes on backend architecture
├─ README.md            # ← you are here
```

---

## Development Tips

- **AI keys:** Keep them private and do not commit `.env.local`.
- **Adding beats:** Drop new `.mp3` files into `beats/` and update `constants.ts`.
- **Judges:** Modify `services/scoringService.ts` to adjust scoring logic.

---

## Dependencies

See `package.json` for the full list. Notable packages:

- `vite` / `react` / `typescript`
- `@supabase/supabase-js`
- `lucide-react` (icons)

---

## Contributing

Contributions are welcome! Fork the repo and open a pull request. Please:

1. Create a feature branch from `main`.
2. Commit with clear messages.
3. Run `npm run lint` and `npm run build` before submitting.
4. Describe your changes in the PR.

---

## Acknowledgements

Thanks to Columbia University DevFest organizers for the platform and encouragement.

---

> **Raise The Bar**: where every verse is judged, every rhyme counts, and every coder can spit bars.
