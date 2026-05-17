# Smash Tennis

## Play the game

Live playable version: https://jedbcov-coder.github.io/Smash_Tennis/

Smash Tennis is a retro-styled 3D browser tennis game. You play as Blake against Hidalgo, an AI opponent, with arcade movement, tennis scoring, serves, rallies, and overhead smash moments.

## Controls

- Move Blake: move your mouse around the game screen.
- Serve: click or press Space when it is your serve.
- Swing: click or press Space when the ball reaches your side.
- Overhead smash: move close to the net, wait for the yellow slow-motion smash chance, then click or press Space.

## Main features

- 3D tennis court built with React, Vite, Three.js, and React Three Fiber.
- Player-vs-AI rallies against Hidalgo.
- Tennis-style points, games, sets, serving turns, second serves, and double faults.
- Overhead smash effects with slow motion, highlight rings, screen shake, and sound.
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
