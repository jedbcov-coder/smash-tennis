import type { PlayerType } from '../types';

export type CourtSide = PlayerType;

export interface BounceState {
  playerSideBounces: number;
  aiSideBounces: number;
}

export const createInitialBounceState = (): BounceState => ({
  playerSideBounces: 0,
  aiSideBounces: 0
});

export function getBounceSide(z: number): CourtSide {
  return z >= 0 ? 'PLAYER' : 'AI';
}

export function recordBounce(state: BounceState, side: CourtSide): BounceState {
  if (side === 'PLAYER') {
    return { ...state, playerSideBounces: state.playerSideBounces + 1 };
  }

  return { ...state, aiSideBounces: state.aiSideBounces + 1 };
}

export function getSideBounceCount(state: BounceState, side: CourtSide): number {
  return side === 'PLAYER' ? state.playerSideBounces : state.aiSideBounces;
}

export function getDoubleBouncePointWinner(hitter: PlayerType, bounceSide: CourtSide, bounceCount: number): PlayerType | null {
  const receiver = hitter === 'PLAYER' ? 'AI' : 'PLAYER';
  if (bounceSide === receiver && bounceCount >= 2) {
    return hitter;
  }

  return null;
}
