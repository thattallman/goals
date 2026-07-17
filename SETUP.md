# TogetherGoals — Setup Guide

The app runs in one of two modes, decided at runtime by whether `.env` has Supabase
credentials in it:

| Mode         | When                          | What you get                                              |
| ------------ | ----------------------------- | --------------------------------------------------------- |
| **Demo**     | No `.env` (the default)       | Seeded local data, a fake partner, 120 days of history     |
| **Live**     | `.env` has URL + anon key     | Real auth, real database, real partner, realtime sync      |

You can explore the whole product in demo mode first and connect Supabase later — no
code changes, just a reload.

---

## 1. Run it locally (demo mode, ~30 seconds)

```bash
npm install
npm run dev
```

Open http://localhost:5173, click **Fill demo credentials**, and sign in. You're now
"Rachit", paired with "Riya", with a year of history to click through.

To wipe the seeded data and start clean, use **Demo mode → Reset demo data** in the
sidebar.

---

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Give it a name, a strong database password, and a region near you.
3. Wait ~2 minutes for it to provision.

## 3. Enable email authentication

1. In your project: **Authentication → Providers → Email**.
2. Make sure **Enable email provider** is on.
3. **Confirm email** is on by default. Turn it *off* while developing if you don't want
   to click a confirmation link for every test account — turn it back on before launch.
4. **Authentication → URL Configuration**: set the Site URL to `http://localhost:5173`
   for now (you'll add your production URL in step 8).

## 4. Create the tables

Open the **SQL Editor** and run these three files from the `supabase/` folder, **in
this order**:

1. `schema.sql` — tables, indexes, triggers, and the `log_progress` function
2. `policies.sql` — Row Level Security
3. `seed.sql` — categories and the achievement catalogue

Each one is safe to re-run if you need to.

**What the RLS gives you:** you can write only your own rows, and read your own rows
plus your partner's. Somebody who guesses your user id still gets zero rows back. The
two-people-per-couple limit is enforced by a database trigger, not just the UI, so it
holds even if someone hits the API directly.

## 5. Get your keys

**Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`

The anon key is safe in the browser — it's what RLS is for. Never put the **service
role** key in this app.

## 6. Configure the app

```bash
cp .env.example .env
```

Fill in both values, then restart the dev server:

```bash
npm run dev
```

The demo badge in the sidebar disappears — you're live.

## 7. Try it with two people

1. Sign up as yourself. You'll land on **Connect** with a 6-character couple code.
2. Open an incognito window, sign up as your partner, and enter that code.
3. Both dashboards now show both of you. Complete a goal in one window and watch the
   other window's rings, feed and charts update **without a refresh** — that's the
   realtime subscription.

## 8. Deploy

### Vercel

```bash
npm i -g vercel
vercel
```

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under
  **Settings → Environment Variables**, then redeploy.

### Netlify

Build command `npm run build`, publish directory `dist`, same two environment
variables. A `netlify.toml` with the SPA redirect is already included — without it,
refreshing on `/insights` would 404.

### Then, in Supabase

**Authentication → URL Configuration**: set the **Site URL** to your deployed URL and
add it to **Redirect URLs**. Password-reset emails link back through here, so they'll
break if you skip it.

---

## Troubleshooting

**"Waiting for your partner" won't go away.** The second person has to *join with your
code*, not create their own couple. Check `couple_members` — you should see two rows
with the same `couple_id`.

**Realtime isn't updating.** Confirm the tables are in the publication:
`Database → Replication → supabase_realtime`. `schema.sql` adds them, but if you
created tables by hand you'll need to add them yourself.

**Signup succeeds but the app says no profile.** The `handle_new_user` trigger didn't
fire — re-run `schema.sql`.

**Reset emails 404.** Site URL / Redirect URLs in Supabase don't match where the app is
actually running (step 8).
