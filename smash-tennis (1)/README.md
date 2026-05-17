# Smash Tennis

## Play the game

Live playable version: https://jedbcov-coder.github.io/Smash_Tennis/

Smash Tennis is a retro-styled 3D browser tennis game. You play as Blake against Hidalgo, an AI opponent, with selectable arcade court surfaces, curved spin shots, bigger overhead smashes, the Flame Smash special move, and tennis-style scoring.

## Controls

- Choose court: pick Grass, Clay, Hard Court, Neon Court, or Ice Court on the start screen.
- Move Blake: move your mouse around the game screen.
- Serve: click or press Space when it is your serve.
- Swing: click or press Space when the ball reaches your side.
- Overhead smash: move close to the net, wait for the yellow slow-motion smash chance, then click or press Space.
- Flame Smash special: fill the energy meter until POWER READY appears, move into a valid smash chance, then press E to spend the meter on a faster fiery smash.

## Main features

- Five selectable court surfaces: Grass, Clay, Hard Court, Neon Court, and Ice Court.
- Surface-based gameplay changes for ball speed, bounce height, floor friction, player movement, and spin curve.
- Curved spin shots on serves, player returns, AI returns, weak smash saves, and overhead smashes.
- Stronger overhead smash acceleration for more dramatic finishing shots.
- Neon arcade HUD with a serve/shot speedometer, energy meter, combo counter, rally counter, and animated PERFECT RETURN, MEGA SMASH, POWER READY, and FLAME SMASH callouts.
- Low-poly 3D tennis court, ball, rackets, players, net, and camera with surface-specific court colors.
- Player-vs-AI rallies with a gradually increasing rally target and speed.
- Tennis scoring with points, games, sets, serving turns, second serves, double faults, and tiebreak support.
- Net-front overhead smash chance with stronger ball acceleration, ball highlight, slow motion, assisted positioning, smash flash, screen shake, text feedback, and sound effects.
- Flame Smash special move that spends a full energy meter during a valid smash chance to briefly slow time, flash the screen, boost ball speed, add fiery VFX, and play a special audio event.
- Start screen, point-result banner, scoreboard, arcade HUD, server indicator, and replay button.
- Lightweight Vite build for local testing and GitHub Pages deployment.

## How to run locally

**Prerequisite:** install Node.js first.

1. Open a terminal in this `smash-tennis (1)` folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the game:

   ```bash
   npm run dev
   ```

4. Open the local link shown in the terminal, usually `http://localhost:3000/`.

## Useful checks

Run these commands from this `smash-tennis (1)` folder:

```bash
npm run lint
npm run build
```

`npm run lint` checks that TypeScript can understand the project. `npm run build` creates the production-ready files in `dist` and copies `dist/index.html` to `dist/404.html` for GitHub Pages refresh support.

Current check notes:

- `npm run lint` passes.
- `npm run build` passes.
- The build can show a Vite chunk-size warning because the 3D/game libraries bundle into one large JavaScript file. This is a warning, not a build failure.
- npm can show `Unknown env config "http-proxy"` in this environment. This is an environment warning, not a project error.

## Project structure

- `src/App.tsx` starts the main app screen.
- `src/components/Game.tsx` wires the 3D court, players, ball, menus, and HUD together.
- `src/components/GameHud.tsx` shows the in-game overlays and scoreboard.
- `src/components/VFXController.tsx` listens for smash events and shows visual effects.
- `src/components/GameMenus.tsx` shows the start and game-over screens.
- `src/audio/audioManager.ts` maps game events like hits, points, AI near misses, and start-button clicks to sound effects.
- `src/hooks/useGameplayLoop.ts` runs the frame-by-frame gameplay logic.
- `src/controls/usePlayerInput.ts` keeps keyboard, mouse, click, Space, and swing animation input handling in one place.
- `src/serve/useTennisGame.ts` manages tennis scoring and match state.
- `src/serve/scoringRules.ts` contains reusable tennis scoring rules.
- `src/physics/ShotPhysics.ts` calculates shot direction and speed.
- `src/gameplay/gameTuning.ts` keeps shared court, serve, boundary, movement, AI near-miss drama, and smash tuning numbers in one place.
- `scripts/copy-404.mjs` copies the built app shell to `dist/404.html` after production builds so GitHub Pages refreshes work.

## Deployment notes

This repository is set up to publish the latest game build with GitHub Pages at https://jedbcov-coder.github.io/Smash_Tennis/.

Important GitHub Pages settings:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Push or merge changes into `main`, or start the workflow manually from the GitHub Actions tab.
5. Open https://jedbcov-coder.github.io/Smash_Tennis/ after the deployment finishes.

The Vite base path stays set to `/Smash_Tennis/` during GitHub Actions builds because GitHub Pages serves this project from `https://jedbcov-coder.github.io/Smash_Tennis/`, not from the root of the domain.
