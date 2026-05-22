import type { PlayerType } from '../types';

export interface FaultResolution {
  nextServerFaults: number;
  pointWinner: PlayerType | null;
}

function getReceiver(server: PlayerType): PlayerType {
  return server === 'PLAYER' ? 'AI' : 'PLAYER';
}

export function resolveServeFault(serverFaults: number, servingPlayer: PlayerType): FaultResolution {
  if (serverFaults === 0) {
    return {
      nextServerFaults: 1,
      pointWinner: null
    };
  }

  return {
    nextServerFaults: serverFaults,
    pointWinner: getReceiver(servingPlayer)
  };
}
