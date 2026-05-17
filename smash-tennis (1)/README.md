# Retro Tennis 3D

Retro Tennis 3D is a simple, retro-styled browser tennis game. You play as Blake against Hidalgo, an AI opponent, on a bright 3D court with arcade pacing and tennis-style scoring.

## Live demo / playable link

Live version: https://jedbcov-coder.github.io/Smash_Tennis/

## What this project does

This is a React + Vite browser game that uses Three.js through React Three Fiber. It builds into a static `dist` folder for GitHub Pages.

## Features

- Low-poly 3D tennis court, ball, rackets, players, net, and camera.
- Player-vs-AI rallies with a gradually increasing rally target, speed, quick Hidalgo return swings, and dramatic Hidalgo near-miss animation when the player is meant to win a rally.
- Net-front overhead smash opportunity with ball highlight, brief slow motion, assisted positioning, smash flash, screen-shake overlay, text burst feedback, and weak-return miss handling.
- Tennis scoring with points, games, sets, server indicators, brief point-result pause, and tiebreak support.
- Clear serve prompts, smash-ready/missed feedback, Hidalgo near-miss pose, brief point-result banner, scoreboard, sound effects routed through one small audio manager, and replay button.
- Lightweight Vite build for easy local testing and static deployment.

## Controls / How to use

- Move player: move your mouse around the screen.
- Serve: click or press Space when the prompt says it is your serve.
- Swing / smash: click or press Space when the ball reaches your side. If you are close to the net and a high ball comes overhead, click or press Space during the glowing slow-motion window to smash it.

## How to run locally

**Prerequisite:** install Node.js first.

1. Open a terminal in this `retro-tennis-3d` folder.
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

Run these commands from this `retro-tennis-3d` folder:

```bash
npm run lint
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

`npm run lint` checks that TypeScript can understand the project. `npm run build` creates the production-ready files in `dist`. `npm run preview` lets you test the built GitHub Pages version locally at `http://127.0.0.1:4173/Smash_Tennis/`.

Current check notes:

- `npm run lint` passes.
- `npm run build` passes and creates `dist/404.html` for GitHub Pages.
- The build can show a Vite chunk-size warning because the 3D/game libraries bundle into one large JavaScript file. This is a warning, not a build failure.
- npm can show `Unknown env config "http-proxy"` in this environment. This is an environment warning, not a project error.

## Project structure

- `src/App.tsx` starts the main app screen.
- `src/components/Game.tsx` wires the 3D court, players, ball, menus, and HUD together.
- `src/components/GameHud.tsx` shows the in-game overlays and scoreboard.
- `src/components/GameVfx.tsx` listens for smash events and shows simple visual effects.
- `src/components/GameMenus.tsx` shows the start and game-over screens.
- `src/audio/audioManager.ts` maps simple game events like hits, points, AI near misses, and start-button clicks to sound effects.
- `src/hooks/useGameplayLoop.ts` runs the frame-by-frame gameplay logic.
- `src/hooks/usePlayerInput.ts` keeps keyboard, mouse, click, Space, and swing animation input handling in one place.
- `src/hooks/useTennisGame.ts` manages tennis scoring and match state.
- `src/gameplay/shotPhysics.ts` calculates shot direction and speed.
- `src/gameplay/gameTuning.ts` keeps shared court, serve, boundary, movement, AI near-miss drama, and smash tuning numbers in one place.
- `scripts/copy-404.mjs` copies the built app shell to `dist/404.html` after production builds so GitHub Pages refreshes work.

## Known issues

- Production builds currently show a non-blocking Vite chunk-size warning because the game uses large 3D dependencies. The build still completes successfully.
- npm may show a non-blocking `http-proxy` environment warning on this machine. No app change is needed for that warning.

## Planned improvements

- Keep tuning rally feel, AI difficulty, Hidalgo swing/miss animation feel, near-miss drama, and smash timing.
- Consider code-splitting later if the production bundle size becomes a real loading problem.

## Notes

This repository is set up to publish the latest game build with GitHub Pages. The workflow in `../../.github/workflows/deploy.yml` builds this Vite app from `Smash_Tennis-main/retro-tennis-3d` and publishes the generated `dist` folder. The production build creates a `404.html` fallback, and the workflow adds a `.nojekyll` marker file so GitHub Pages serves the game correctly.

Important GitHub Pages settings:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Push or merge changes into `main`, or start the workflow manually from the GitHub Actions tab.
5. Open https://jedbcov-coder.github.io/Smash_Tennis/ after the deployment finishes.

The Vite base path stays set to `/Smash_Tennis/` in `vite.config.ts` because GitHub Pages serves this project from `https://jedbcov-coder.github.io/Smash_Tennis/`, not from the root of the domain.
