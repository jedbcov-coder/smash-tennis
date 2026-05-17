# Smash Tennis

## Play the game

Live playable version: https://jedbcov-coder.github.io/smash-tennis/

Smash Tennis is a retro-styled 3D browser tennis game. You play as Blake against a selectable AI rival, with selectable arcade court surfaces, saved settings, curved spin shots, easier tap-tap serving, bigger overhead smashes, the Flame Smash special move, tennis-style scoring, and saved player progress.

## Controls

- Choose court: pick Grass, Clay, Hard Court, Neon Court, or Ice Court on the start screen.
- Choose rival: pick Hidalgo, Nova, or Racketron on the start screen. Each rival has its own color, speed, accuracy, aggression, miss chance, preferred shot, and special move style.
- Move Blake: move your mouse around the game screen.
- Serve: wait for the quick serve countdown, then tap-tap with click or Space. Tap once to toss the ball, then tap again when the marker reaches the large blue center zone. The meter is slower, the safe area is bigger, and only the tiny red edges fault.
- Swing: click the game court or press Space when the ball reaches your side. Menu and button clicks are ignored so they do not accidentally start a swing.
- Overhead smash: move close to the net, wait for the yellow slow-motion smash chance, then click or press Space.
- Flame Smash special: fill the energy meter until POWER READY appears, move into a valid smash chance, then press E to spend the meter on a faster fiery smash that resets the energy meter.

## Main features

- Neon arcade visual identity with dark backgrounds, glowing court lines, bright UI borders, pulsing text, and colorful ball trails.
- Five selectable court surfaces: Grass, Clay, Hard Court, Neon Court, and Ice Court.
- Three selectable AI opponent profiles: Hidalgo, Nova, and Racketron, shown as start-screen rival cards with descriptions, play styles, and a clear selected state.
- Surface-based gameplay changes for ball speed, bounce height, slide amount, player movement, and spin curve.
- Opponent-based gameplay changes for AI movement speed, shot accuracy, aggression, miss chance, preferred shot type, and displayed theme color.
- Curved spin shots on serves, player returns, AI returns, weak smash saves, and overhead smashes.
- Expanded browser-friendly synthesized audio for normal hits, curve hits, smash hits, perfect returns, mega smashes, power ready, combo increases, match point, court selection, start/replay buttons, win, and defeat.
- Simple audio mixer settings for master, sound effects, UI sounds, a future music volume, mute, and safe browser saving. The settings menu keeps beginner-friendly 0% to 100% sliders, while audio playback converts those values to the 0 to 1 scale used by the sound engine.
- Saved game settings for reduced motion, screen shake, high contrast, and input help are applied to the HUD and gameplay effects.
- Stronger overhead smash acceleration for more dramatic finishing shots.
- Neon arcade HUD with a serve/shot speedometer, larger beginner-friendly serve meter, tap-tap serve prompts, serve quality badges, energy meter, combo counter, rally counter, optional input help, and animated PERFECT RETURN, MEGA SMASH, POWER READY, and FLAME SMASH callouts.
- Low-poly 3D tennis court, ball, rackets, players, net, and camera with surface-specific court colors.
- Player-vs-AI rallies with a gradually increasing rally target and speed.
- Tennis scoring with points, games, sets, serving turns, second serves, double faults, more forgiving timing-based player serve outcomes, and tiebreak support.
- Net-front overhead smash chance with stronger ball acceleration, ball highlight, slow motion, assisted positioning, smash flash, screen shake, text feedback, and sound effects.
- Flame Smash special move that spends a full energy meter during a valid smash chance to briefly slow time, flash the screen, boost ball speed, add fiery VFX, and play a special audio event.
- Start screen with selectable court cards, selectable rival cards, saved settings, saved player level, total XP, win-loss record, best rally, point-result banner, scoreboard, arcade HUD, server indicator, and replay button.
- Browser progress saving with localStorage for player level, total XP, unlocked courts, unlocked cosmetics, best rally, best combo, and match wins/losses.
- Lightweight Vite build for local testing and GitHub Pages deployment.
- Serve mini-game improvements: closer over-the-shoulder serve camera, glowing target rings in the service box, slower meter movement, wider perfect/power/safe zones, and fewer random faults.
- Seeded gameplay randomness for shot placement, AI return targeting, and serve fault checks, while visual effects can still stay visually varied.

## How to run locally

**Prerequisite:** install Node.js first.

1. Open a terminal in the repository root folder, `/workspace/smash-tennis`.
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

Run these commands from the repository root folder before saying the app is ready:

```bash
npm run test
npm run lint
npm run build
```

`npm run test` uses `scripts/run-tests.mjs` to run the lightweight Vite-powered helper tests for tennis scoring rules and shot physics. Keep using it for those focused checks, but do not treat it as the only safety check because it does not cover the full React app wiring.

After `npm run test`, always run `npm run lint`. The lint command runs TypeScript across the full app, so it catches broken imports, type mistakes, and wiring problems that helper tests may miss. Before marking the app ready, always run `npm run build`. The build command checks the production app bundle, creates the files in `dist`, and copies `dist/index.html` to `dist/404.html` for GitHub Pages refresh support.

Optional while editing:

```bash
npm run test:watch
```

`npm run test:watch` keeps the scoring and shot helper tests running while you edit files. It is useful during development, but the final readiness check is still `npm run test`, then `npm run lint`, then `npm run build`.

Current check notes verified on May 17, 2026:

- `npm install` passes from the repository root.
- `npm run dev` starts successfully from the repository root.
- `npm run test` passes from the repository root for scoring and shot helper logic.
- `npm run lint` passes from the repository root and checks the full TypeScript app.
- `npm run build` passes from the repository root and copies `dist/index.html` to `dist/404.html`.
- The build may show a Vite chunk-size warning because the 3D/game libraries bundle into one large JavaScript file. This is a warning, not a build failure.

## Project structure

- `src/App.tsx` starts the main app screen.
- `src/design/colorScheme.ts` keeps the shared neon palette in one place.
- `src/design/gradients.ts` keeps reusable neon gradients in one place.
- `src/components/Game.tsx` wires the 3D court, players, ball, menus, HUD, and initial arcade HUD defaults together.
- `src/components/GameHud.tsx` shows the in-game overlays, neon scoreboard, energy meter, optional input help, and arcade callouts.
- `src/components/SettingsMenu.tsx` shows the saved settings controls for volume, motion, screen shake, contrast, and input help.
- `src/settings/useGameSettings.ts` loads and saves game settings in browser localStorage.
- `src/components/VFXController.tsx` listens for smash events and shows visual effects.
- `src/components/GameMenus.tsx` shows the Neon Smash Tennis start screen, court selection, rival selection, settings menu, intro matchup, and game-over screens, including saved player progress.
- `src/environment/Court.tsx` renders the dark court, glowing lines, neon border accents, net, and posts.
- `src/environment/Ball.tsx` renders the ball, glow shell, shadow, and colorful speed/spin trails.
- `src/physics/BallSimulation.ts` keeps the ball movement, gravity, spin decay, and surface bounce math separate from the ball visuals.
- `src/audio/audioManager.ts` maps game events like hits, points, AI near misses, and start-button clicks to sound effects.
- `src/audio/audioSettings.ts` stores the shared audio volume settings and converts combined volume to decibels for playback.
- `src/audio/sounds.ts` plays the Tone.js sound effects using only the decibel adjustment it receives from the audio manager.
- `src/hooks/useGameplayLoop.ts` coordinates the frame-by-frame gameplay loop and calls smaller gameplay systems, including the shared arcade camera controller.
- `src/gameplay/playerMovement.ts` handles mouse-to-court movement, movement limits, serve positioning, and smash assist.
- `src/gameplay/aiOpponentController.ts` handles AI movement targets, near-miss checks, hit detection, and AI return shots using the selected opponent profile.
- `src/gameplay/opponents.ts` defines the selectable AI opponent profiles, including display name, theme color, movement speed, accuracy, aggression, miss chance, preferred shot type, and special move style.
- `src/gameplay/cameraController.ts` handles serve camera positioning, rally camera follow, zoom, and shake.
- `src/gameplay/gameEvents.ts` keeps shared typed browser event names and helper functions for gameplay visual effects.
- `src/gameplay/smashSystem.ts` handles smash opportunities, Flame Smash shot math, weak smash-save returns, and smash timing helpers.
- `src/gameplay/gameStateMachine.ts` keeps named match-flow transitions like starting a match, serving, rallies, point results, and match over in one place.
- `src/controls/usePlayerInput.ts` keeps keyboard, mouse, click, Space, and swing animation input handling in one place.
- `src/serve/useTennisGame.ts` manages tennis scoring, match presentation timing, local match XP, reward stats, and sends point/match rewards to saved progression.
- `src/progression/playerProgress.ts` saves player level, XP, unlocks, best rally, best combo, and match record in browser localStorage.
- `src/serve/scoringRules.ts` contains reusable tennis scoring rules.
- `src/physics/ShotPhysics.ts` calculates shot direction, speed, arc, spin, and target risk.
- `src/gameplay/gameTuning.ts` keeps shared court, serve, boundary, movement, AI near-miss drama, and smash tuning numbers in one place.
- `scripts/copy-404.mjs` copies the built app shell to `dist/404.html` after production builds so GitHub Pages refreshes work.

## Deployment notes

This repository is set up to publish the latest game build with GitHub Pages at https://jedbcov-coder.github.io/smash-tennis/.

Important GitHub Pages settings:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Push or merge changes into `main`.
5. The workflow at `.github/workflows/deploy.yml` installs dependencies with `npm ci`, builds the app with `npm run build`, uploads `dist`, and deploys it with the official GitHub Pages actions.
6. Open https://jedbcov-coder.github.io/smash-tennis/ after the deployment finishes.

The app now lives directly at the repository root, so `package.json`, `index.html`, `vite.config.ts`, `src/`, and `scripts/` are no longer inside a nested folder. The Vite base path stays set to `/smash-tennis/` during GitHub Actions builds because GitHub Pages serves this project from `https://jedbcov-coder.github.io/smash-tennis/`, not from the root of the domain.
