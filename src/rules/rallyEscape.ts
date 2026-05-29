import type * as THREE from 'three';
import { BALL_ESCAPE_LIMITS, OUT_OF_BOUNDS_LIMITS } from '../gameplay/gameTuning';
import type { PlayerType } from '../types';

export interface LiveRallyShot {
  hitter: PlayerType;
  receiver: PlayerType;
  firstBounceResolved: boolean;
  firstBounceLegal: boolean;
}

export const getEscapePointWinner = (shot: LiveRallyShot | null, ballPos: THREE.Vector3): PlayerType | null => {
  if (!shot || !shot.firstBounceResolved || !shot.firstBounceLegal) {
    return null;
  }

  if (shot.receiver === 'AI' && ballPos.z < OUT_OF_BOUNDS_LIMITS.aiBackZ) {
    return shot.hitter;
  }

  if (shot.receiver === 'PLAYER' && ballPos.z > OUT_OF_BOUNDS_LIMITS.playerBackZ) {
    return shot.hitter;
  }

  const escapedWorld =
    Math.abs(ballPos.x) > BALL_ESCAPE_LIMITS.x ||
    ballPos.y > BALL_ESCAPE_LIMITS.y ||
    Math.abs(ballPos.z) > BALL_ESCAPE_LIMITS.z;

  return escapedWorld ? shot.hitter : null;
};
