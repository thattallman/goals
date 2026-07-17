# TogetherGoals — Setup Guide

The app runs in one of two modes, decided at runtime by whether `.env` has Firebase
credentials in it:

| Mode         | When                          | What you get                                              |
| ------------ | ----------------------------- | --------------------------------------------------------- |
| **Demo**     | No `.env` (the default)       | Seeded local data, a fake partner, 120 days of history     |
| **Live**     | `.env` has your web app config | Real auth, real database, real partner, realtime sync     |

You can explore the whole product in demo mode first and connect Firebase later — no
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

## 2. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add
   project**.
2. Give it a name, optionally disable Google Analytics, and create it.

## 3. Enable email authentication

1. In your project: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.

## 4. Create Firestore

1. **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** (the rules below replace the default deny-all).
3. Pick a region near you.

## 5. Apply the security rules and indexes

1. Open the **Rules** tab of Firestore, paste in the contents of `firestore.rules` from
   this repo, and **Publish**.
2. The composite indexes in `firestore.indexes.json` cover every query the app makes.
   Either create them ahead of time (**Indexes** tab → **Add index**, matching the
   fields/order in that file), or just use the app — Firestore prints a direct
   "create index" link in the browser console the first time an under-indexed query
   runs.
3. If you install the [Firebase CLI](https://firebase.google.com/docs/cli), both can be
   deployed at once: `firebase deploy --only firestore:rules,firestore:indexes`.

**What the rules give you:** you can write only your own rows, and read your own rows
plus your partner's. Somebody who guesses your user id still gets zero rows back. The
two-people-per-couple limit is checked when joining, same as the invite-code lookup —
there's no Cloud Functions layer in this app, so it's enforced in `firebaseRepo.js`
rather than the database itself (see the note at the top of `firestore.rules`).

## 6. Get your config

**Project settings (gear icon) → General → Your apps** → register a **Web app** (the
`</>` icon) if you haven't already. Copy the `firebaseConfig` object it shows you.

## 7. Configure the app

```bash
cp .env.example .env
```

Fill in all six `VITE_FIREBASE_*` values from that config object, then restart the dev
server:

```bash
npm run dev
```

The demo badge in the sidebar disappears — you're live.

## 8. Try it with two people

1. Sign up as yourself. You'll land on **Connect** with a 6-character couple code.
2. Open an incognito window, sign up as your partner, and enter that code.
3. Both dashboards now show both of you. Complete a goal in one window and watch the
   other window's rings, feed and charts update **without a refresh** — that's the
   Firestore realtime listeners.

## 9. Deploy

### Vercel

```bash
npm i -g vercel
vercel
```

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- Add all six `VITE_FIREBASE_*` variables under
  **Settings → Environment Variables**, then redeploy.

### Netlify

Build command `npm run build`, publish directory `dist`, same six environment
variables. A `netlify.toml` with the SPA redirect is already included — without it,
refreshing on `/insights` would 404.

### Then, in Firebase

**Authentication → Settings → Authorized domains**: add your deployed domain. Without
it, sign-in/sign-up will fail with an `auth/unauthorized-domain` error from that domain.
Password-reset emails link straight back to `/reset-password` on whatever domain sent
the request, so no separate "Redirect URLs" step is needed there.

---

## Troubleshooting

**"Waiting for your partner" won't go away.** The second person has to *join with your
code*, not create their own couple. Check the `couples/{id}/members` subcollection in
the Firestore console — you should see two documents under the same couple.

**Realtime isn't updating.** Open the browser console for an `auth/unauthorized-domain`
or a Firestore permission error — either blocks the `onSnapshot` listeners from ever
attaching. Also confirm `firestore.rules` was actually published (Rules tab shows a
timestamp).

**Signup succeeds but the app says no profile.** The `profiles/{uid}` document write in
`firebaseRepo.signUp` failed — check the Rules tab logs or the browser console for a
permission-denied error on that write.

**Auth link errors ("missing or insufficient permissions" on a query).** Almost always a
missing composite index — the browser console error includes a direct link to create it.

**Reset emails don't reach `/reset-password` with a code.** Confirm your deployed domain
is in **Authorized domains** (step 9) — Firebase silently falls back to its own hosted
action page otherwise.
