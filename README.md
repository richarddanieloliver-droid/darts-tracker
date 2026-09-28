# EBDO Darts

Tournament tracker for EBDO darts: keep a player list, pick who's playing, auto-draw a round robin
(singles or pairs), record best-of-N scores, and follow the live table. The top 4 go through to
the play-offs (1st v 4th, 2nd v 3rd, then the final).

**Table rules:** 2 points per win. Ranked on Points, then Leg Difference (Legs For − Legs Against),
then Legs For, then name.

## Running it

Requires [Node.js](https://nodejs.org) 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

Other commands: `npm test` (logic tests), `npm run build` (production build into `dist/`).

> The npm scripts call Node directly (e.g. `node node_modules/vite/bin/vite.js`) because the `&`
> in this folder's OneDrive path breaks npm's Windows command shims.

## Using it on a phone

The app is a static site — no server or database. Every push to `main` is tested, built and
published to GitHub Pages by `.github/workflows/deploy.yml`:

**https://richarddanieloliver-droid.github.io/darts-tracker/**

(One-off setup: repo *Settings → Pages → Source: GitHub Actions*.)

Open the site on your phone and use *Share → Add to Home Screen* (iOS) or *Install app* (Android).
It then works offline like a normal app.

## Your data

Data is saved in the browser on the device you use (localStorage). It is **not** shared between
devices. Use *Settings → Backup* regularly to download a backup file; *Restore* loads one on the
same or another device.

## Code map

- `src/lib/` — pure logic: `roundRobin.ts` (draw), `standings.ts` (table), `playoffs.ts`,
  `validateScore.ts`; tests in `logic.test.ts`
- `src/store.ts` — Zustand store persisted to localStorage
- `src/pages/` — Home, Players, New tournament, Tournament (Fixtures / Table / Play-offs), Settings
- `src/components/` — MatchCard, ScoreSheet, StandingsTable, etc.
