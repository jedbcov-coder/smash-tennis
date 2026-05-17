export enum GameState {
  MENU = 'MENU',
  SERVING = 'SERVING',
  PLAYING = 'PLAYING',
  SCORING = 'SCORING',
  GAME_OVER = 'GAME_OVER',
}

export type PlayerType = 'PLAYER' | 'AI';

export const TENNIS_SCORES = ['0', '15', '30', '40', 'AD'];

export interface Score {
  playerScore: number;
  aiScore: number;
  playerGames: number;
  aiGames: number;
  playerSets: number;
  aiSets: number;
}
