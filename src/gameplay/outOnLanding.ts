import type { PlayerType } from '../types';

interface HandleOutOnLandingOptions {
  hitter: PlayerType;
  pendingBounceIsServe: boolean;
  onFault: () => void;
  awardPoint: (winner: PlayerType, positiveForPlayer: boolean) => void;
}

export function handleOutOnLanding({
  hitter,
  pendingBounceIsServe,
  onFault,
  awardPoint
}: HandleOutOnLandingOptions) {
  if (pendingBounceIsServe) {
    onFault();
    return;
  }

  const winner = hitter === 'PLAYER' ? 'AI' : 'PLAYER';
  awardPoint(winner, winner === 'PLAYER');
}
