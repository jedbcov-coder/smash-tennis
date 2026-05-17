export enum GameState {
  MENU = 'MENU',
  INTRO = 'INTRO',
  SERVE_COUNTDOWN = 'SERVE_COUNTDOWN',
  SERVING = 'SERVING',
  PLAYING = 'PLAYING',
  SCORING = 'SCORING',
  GAME_OVER = 'GAME_OVER',
}

export type PlayerType = 'PLAYER' | 'AI';

export type CourtSurface = 'GRASS' | 'CLAY' | 'HARD' | 'NEON' | 'ICE';

export const TENNIS_SCORES = ['0', '15', '30', '40', 'AD'];

export interface Score {
  playerScore: number;
  aiScore: number;
  playerGames: number;
  aiGames: number;
  playerSets: number;
  aiSets: number;
}
