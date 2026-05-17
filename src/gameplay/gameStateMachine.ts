import { GameState } from '../types';

type SetGameState = (nextState: GameState) => void;

function moveTo(setGameState: SetGameState, nextState: GameState) {
  setGameState(nextState);
}

export function startMatch(setGameState: SetGameState) {
  moveTo(setGameState, GameState.INTRO);
}

export function beginServeCountdown(setGameState: SetGameState) {
  moveTo(setGameState, GameState.SERVE_COUNTDOWN);
}

export function beginServing(setGameState: SetGameState) {
  moveTo(setGameState, GameState.SERVING);
}

export function beginRally(setGameState: SetGameState) {
  moveTo(setGameState, GameState.PLAYING);
}

export function finishPoint(setGameState: SetGameState) {
  moveTo(setGameState, GameState.SCORING);
}

export function finishMatch(setGameState: SetGameState) {
  moveTo(setGameState, GameState.GAME_OVER);
}
