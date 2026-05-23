# Smash Tennis — AI Agent Instructions

## Project overview

- Retro arcade 3D browser tennis game.
- Built with React, TypeScript, Vite, and Three.js / React Three Fiber.

## Setup

- `npm install`

## Development

- `npm run dev`

## Required checks before finishing any task

- `npm run test`
- `npm run lint`
- `npm run build`

## Gameplay rule priority

- Point flow must never leave the game in `PLAYING` with no ball.
- Perfect Serve must land in the correct service box.
- Perfect Return must land in the singles court.
- Legal first bounce followed by missed return must award the striker.
- First-bounce out must award the receiver.

## Coding rules

- Prefer small focused changes.
- Add tests for rule or scoring changes.
- Avoid changing visual style unless requested.
- Keep arcade feel, but never at the cost of broken tennis logic.
