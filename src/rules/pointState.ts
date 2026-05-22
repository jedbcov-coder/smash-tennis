import type { PlayerType } from '../types';

export type PointPhase = 'awaitingServeHit' | 'awaitingServeBounce' | 'awaitingReturn' | 'rally' | 'pointOver';

export interface PointState {
  phase: PointPhase;
  server: PlayerType;
  striker: PlayerType | null;
  bounceCounts: Record<PlayerType, number>;
  winner: PlayerType | null;
}

export const createInitialPointState = (server: PlayerType): PointState => ({
  phase: 'awaitingServeHit',
  server,
  striker: null,
  bounceCounts: { PLAYER: 0, AI: 0 },
  winner: null
});

const getReceiver = (player: PlayerType): PlayerType => (player === 'PLAYER' ? 'AI' : 'PLAYER');

const resetBouncesForReceiver = (_hitter: PlayerType): Record<PlayerType, number> => ({
  PLAYER: 0,
  AI: 0
});

export const onServeHit = (state: PointState, server: PlayerType): PointState => ({
  ...state,
  phase: 'awaitingServeBounce',
  server,
  striker: server,
  bounceCounts: { PLAYER: 0, AI: 0 },
  winner: null
});

export const onLegalServeBounce = (state: PointState): PointState => ({
  ...state,
  phase: 'awaitingReturn'
});

export const onIllegalServeBounce = (state: PointState): PointState => ({
  ...state,
  phase: 'awaitingServeHit',
  striker: null,
  bounceCounts: { PLAYER: 0, AI: 0 }
});

export const onReceiverReturn = (state: PointState, receiver: PlayerType): PointState => ({
  ...state,
  phase: 'rally',
  striker: receiver,
  bounceCounts: resetBouncesForReceiver(receiver)
});

export const onRallyShot = (state: PointState, hitter: PlayerType): PointState => ({
  ...state,
  phase: 'rally',
  striker: hitter,
  bounceCounts: resetBouncesForReceiver(hitter)
});

export const onBounce = (state: PointState, bounceSide: PlayerType): PointState => {
  const nextBounceCounts = {
    ...state.bounceCounts,
    [bounceSide]: state.bounceCounts[bounceSide] + 1
  };

  const hitter = state.striker;
  const receiver = hitter ? getReceiver(hitter) : null;
  const winner = receiver === bounceSide && nextBounceCounts[bounceSide] >= 2 ? hitter : null;

  if (!winner) {
    return {
      ...state,
      bounceCounts: nextBounceCounts
    };
  }

  return {
    ...state,
    phase: 'pointOver',
    bounceCounts: nextBounceCounts,
    winner
  };
};
