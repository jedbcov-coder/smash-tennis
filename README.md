# Smash Tennis

## Play the game

Live playable version: https://jedbcov-coder.github.io/smash-tennis/

Smash Tennis is a retro-styled 3D browser tennis game. You play as Blake against Hidalgo, an AI opponent, with selectable arcade court surfaces, curved spin shots, tennis scoring, easier tap-tap serving, rallies, bigger overhead smash moments, and a Flame Smash special move.

## Controls

- Choose court: pick Grass, Clay, Hard Court, Neon Court, or Ice Court on the start screen.
- Move Blake: move your mouse around the game screen.
- Serve: tap-tap with click or Space. Tap once to toss the ball, then tap again when the marker reaches the large blue center zone. The meter is slower, the safe area is bigger, and only the tiny red edges fault.
- Swing: click the game court or press Space when the ball reaches your side. Menu and button clicks are ignored so they do not accidentally start a swing.
- Overhead smash: move close to the net, wait for the yellow slow-motion smash chance, then click or press Space.
- Flame Smash special: fill the energy meter until POWER READY appears, move into a valid smash chance, then press E to spend the meter on a faster fiery smash that resets the energy meter.

## Main features

- Neon arcade visual identity with dark backgrounds, glowing court lines, bright UI borders, pulsing text, and colorful ball trails.
- Five selectable court surfaces: Grass, Clay, Hard Court, Neon Court, and Ice Court.
- Surface-based gameplay changes for ball speed, bounce height, slide amount, player movement, and spin curve.
- Curved spin shots on serves, player returns, AI returns, weak smash saves, and overhead smashes.
- Expanded browser-friendly synthesized audio for normal hits, curve hits, smash hits, perfect returns, mega smashes, power ready, combo increases, match point, court selection, start/replay buttons, win, and defeat.
- Stronger overhead smash acceleration for more dramatic finishing shots.
- Neon arcade HUD with a serve/shot speedometer, larger beginner-friendly serve meter, tap-tap serve prompts, serve quality badges, energy meter, combo counter, rally counter, and animated PERFECT RETURN, MEGA SMASH, POWER READY, and FLAME SMASH callouts.
- 3D tennis court built with React, Vite, Three.js, and React Three Fiber.
- Player-vs-AI rallies against Hidalgo.
- Tennis-style points, games, sets, serving turns, second serves, double faults, and more forgiving timing-based player serve outcomes.
- Overhead smash effects with stronger acceleration, slow motion, highlight rings, screen shake, and sound.
- Flame Smash spends a full energy meter during a valid smash chance to briefly slow time, flash the screen, boost ball speed, add fiery VFX, and play a special audio event.
- GitHub Pages-friendly static build.
- Serve mini-game improvements: closer over-the-shoulder serve camera, glowing target rings in the service box, slower meter movement, wider perfect/power/safe zones, and fewer random faults.
- Shared physics rules keep net faults, wide shots, and baseline outs consistent during rallies.

## How to run locally

The app files are in the `smash-tennis (1)` folder.

1. Install Node.js.
2. Open a terminal in `smash-tennis (1)`.
3. Install the app packages:

   ```bash
   npm install
   ```

4. Start the local version:

   ```bash
   npm run dev
   ```

5. Open the local link shown in the terminal, usually `http://localhost:3000/`.

## Useful checks

Run these from the `smash-tennis (1)` folder:

```bash
npm run lint
npm run build
```

`npm run lint` checks the TypeScript code. `npm run build` creates the production-ready files for GitHub Pages.

## Deployment notes

This project is set up for GitHub Pages at https://jedbcov-coder.github.io/smash-tennis/. The deploy workflow lives at `.github/workflows/deploy.yml`, runs on pushes to `main`, installs the app from `smash-tennis (1)` with `npm ci`, builds it with `npm run build`, uploads `smash-tennis (1)/dist`, and publishes it with the official GitHub Pages actions. The Vite base path changes automatically during GitHub Actions builds so the game works under `/smash-tennis/` after deployment.
