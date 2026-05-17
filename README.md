# Smash Tennis

## Play the game

Live playable version: https://jedbcov-coder.github.io/Smash_Tennis/

Smash Tennis is a retro-styled 3D browser tennis game. You play as Blake against Hidalgo, an AI opponent, with selectable arcade court surfaces, curved spin shots, tennis scoring, timing-based serves, rallies, and bigger overhead smash moments.

## Controls

- Choose court: pick Grass, Clay, Hard Court, Neon Court, or Ice Court on the start screen.
- Move Blake: move your mouse around the game screen.
- Serve: click or press Space once to start the serve meter, then click or press Space again to hit the serve. Try to stop the meter near the green center for a Perfect Serve; stopping too early or too late can cause a Fault.
- Swing: click or press Space when the ball reaches your side.
- Overhead smash: move close to the net, wait for the yellow slow-motion smash chance, then click or press Space.

## Main features

- Five selectable court surfaces: Grass, Clay, Hard Court, Neon Court, and Ice Court.
- Surface-based gameplay changes for ball speed, bounce height, slide amount, player movement, and spin curve.
- Curved spin shots on serves, player returns, AI returns, weak smash saves, and overhead smashes.
- Stronger overhead smash acceleration for more dramatic finishing shots.
- Neon arcade HUD with a serve/shot speedometer, energy meter, combo counter, rally counter, and animated PERFECT RETURN, MEGA SMASH, and POWER READY callouts.
- 3D tennis court built with React, Vite, Three.js, and React Three Fiber.
- Player-vs-AI rallies against Hidalgo.
- Tennis-style points, games, sets, serving turns, second serves, and double faults.
- Overhead smash effects with stronger acceleration, slow motion, highlight rings, screen shake, and sound.
- GitHub Pages-friendly static build.

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

This project is set up for GitHub Pages at https://jedbcov-coder.github.io/Smash_Tennis/. The Vite base path changes automatically during GitHub Actions builds so the game works under `/Smash_Tennis/` after deployment.
