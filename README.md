# WordCard – Local‑First Vocabulary Flashcards (PWA)

WordCard is a modern, mobile‑first web app that helps you learn and retain vocabulary using a practical spaced repetition system (SRS) and smooth flashcard flipping. Built as a Progressive Web App (PWA), it delivers instant interactions offline and syncs seamlessly when you’re online.

## ✨ Highlights

- Local‑First Architecture: All daily reads/writes go to a fast client DB (IndexedDB via Dexie) for instant UX and full offline capability.
- Smart SRS Loop: A focused spaced repetition flow designed for consistency and long‑term retention.
- Personal Libraries: Create, edit, delete, search, and batch‑manage words; organize with tags and notes.
- Real‑Time Sync: Supabase Auth + RLS with real‑time updates across devices; changes propagate automatically.
- Mobile‑Ready UI: Shadcn UI + Tailwind v4 + Lucide icons, dark mode, toasts, and bottom navigation.
- Useful Stats: Progress overview and mastery distribution charts (Recharts).

## 🧰 Tech Stack

- Framework: Next.js 15 (App Router) + React 19  
- Styling & UI: Tailwind CSS v4, Shadcn UI, Sonner (toast), Lucide React  
- Charts: Recharts (via a Shadcn‑style chart wrapper)  
- Client DB: Dexie.js (IndexedDB), Local‑First data flow  
- State: Zustand  
- Backend/BaaS: Supabase (Auth via `@supabase/ssr`, PostgreSQL with RLS)  
- PWA: Web App Manifest + Service Worker for installability and caching

## 🚀 Quick Start

1) Install
```bash
pnpm install
```

2) Configure Environment  
Create `.env.local` and add your Supabase keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# Optional if you run privileged server actions locally:
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3) Run
```bash
pnpm dev
# Open http://localhost:3000
```

4) Build
```bash
pnpm build && pnpm start
```

The app can be installed as a PWA in modern browsers. A service worker is registered and a web app manifest is provided.


## 📌 Status

Core features (SRS study loop, CRUD with batch operations, stats, settings) and Supabase sync (auth, first‑time pull, incremental push, real‑time) are implemented. PWA caching and offline usage are functional for the app shell and local data; further tuning can be added as needed.

## 📄 License

MIT — Feel free to learn, fork, and build on top of this project.
