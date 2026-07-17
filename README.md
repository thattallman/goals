# TogetherGoals ❤️

A goal tracker built for two people. Track daily habits, health and career goals side
by side with your partner, compare progress in a way that never feels like a
scoreboard, and celebrate the days you both finish everything.

**Run it right now — no backend required:**

```bash
npm install && npm run dev
```

With no `.env` present the app boots into demo mode: seeded data, a partner ("Riya"),
120 days of history. Add Supabase credentials and the same code talks to a real
database instead. See **[SETUP.md](./SETUP.md)**.

---

## What's in it

- **Dashboard** — animated completion rings for you, your partner and the two of you
  combined; streak flame; 7-day chart; a full-year GitHub-style heatmap; live activity
  feed. Confetti when you *both* finish everything on the same day.
- **Daily Goals / Health / Career** — add, edit, duplicate, archive, delete, increment,
  reset. Health splits into food and workout; Career is a pending → in progress → done
  board with deadlines, priority and difficulty.
- **Weekly Report** — completion, consistency, missed slots, streaks, health/career/
  combined scores. Generated from your history, never stored stale.
- **Insights** — most consistent habit, the one that needs love, best and worst day,
  trend, partner radar, leaderboard, six-month trend, next-week projection.
- **Gamification** — XP weighted by difficulty, a square-root levelling curve, ten
  achievements, and a couple level driven by your *combined* XP.
- **Profile & Settings** — theme, notification and privacy preferences, partner
  management, account deletion.

Positive framing is a hard rule: the app never says you're losing. When you're behind,
it says *"Let's catch up together ❤️"*.

## Architecture

Everything talks to **one repository interface**, never to Supabase directly:

```
src/data/
  index.js        picks the repo at runtime — env vars present? supabase : demo
  supabaseRepo.js real queries + realtime channels
  mockRepo.js     localStorage, seeded, same async contract
```

Because both implementations satisfy the same contract, every hook, page and component
is identical in both modes. That's what makes "runs with zero config" and "production
ready" the same codebase rather than two.

- **Auth state** — React Context (`src/context/AuthContext.jsx`)
- **Server state** — TanStack Query, with optimistic updates on every counter tap
- **Realtime** — one Postgres channel per couple; `useRealtimeSync` invalidates the
  cache so your partner's changes land on your screen without a refresh
- **Scoring** — `src/lib/scoring.js` is the only place that decides what "78%" means,
  so the rings, the report and the insights can never disagree

```
src/
  app/         router, providers, error boundary
  layouts/     AppShell (sidebar + bottom nav), AuthLayout
  components/  ui/ · charts/ · goals/
  pages/       one per route, all lazy-loaded
  hooks/       useGoals · useProgress · useInsights · useRealtimeSync · useTheme
  lib/         scoring · streaks · gamification · confetti · format
  data/        the repository layer + catalogue
supabase/      schema.sql · policies.sql · seed.sql
```

## Stack

React 19 · Vite · Tailwind v4 · Framer Motion · TanStack Query · React Hook Form ·
Recharts · Lucide · Supabase (Auth + Postgres + Realtime + RLS)

## Notes on the details

- **Charts** use a validated palette — the three series colours pass lightness-band,
  chroma, colour-blind separation and contrast checks in both light and dark mode, and
  dark mode uses its own selected steps rather than a flipped light palette. Every chart
  has a legend, and the weekly chart has a "view as table" fallback, so identity is
  never carried by colour alone.
- **Motion** respects `prefers-reduced-motion` — including the confetti.
- **Accessibility** — keyboard-trapped dialogs, ARIA-labelled controls, visible focus
  rings, a skip link, and live regions on toasts.
- **Security** — RLS means a user can only ever read their own rows and their partner's.
  The two-person limit on a couple is a database trigger, not a UI check.

## Scripts

```bash
npm run dev       # dev server
npm run build     # production build → dist/
npm run preview   # serve the build locally
npm run lint      # oxlint
```
