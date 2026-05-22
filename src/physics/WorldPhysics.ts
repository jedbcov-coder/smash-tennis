import * as THREE from 'three';
import { ARCADE_LANDING_FORGIVENESS, COURT_LENGTH, COURT_WIDTH, ERROR_MARGINS, NET_HEIGHT, OUT_OF_BOUNDS_LIMITS } from '../gameplay/gameTuning';
import type { PlayerType } from '../types';

export type LandingSide = 'PLAYER' | 'AI';

export function checkOutOfBounds(ballPos: THREE.Vector3): boolean {
  return Math.abs(ballPos.x) > OUT_OF_BOUNDS_LIMITS.x;
}

export function checkNetCollision(
  ballPos: THREE.Vector3,
  previousBallZ: number,
  lastHitter: PlayerType | null
): boolean {
  const crossedNet = (previousBallZ <= 0 && ballPos.z > 0) || (previousBallZ >= 0 && ballPos.z < 0);
  return crossedNet && ballPos.y < NET_HEIGHT && lastHitter !== null;
}

export function checkBaselineOut(ballPos: THREE.Vector3): 'PLAYER_OUT' | 'AI_OUT' | 'IN' {
  if (ballPos.z > OUT_OF_BOUNDS_LIMITS.playerBackZ) return 'PLAYER_OUT'; // bounced past player back
  if (ballPos.z < OUT_OF_BOUNDS_LIMITS.aiBackZ) return 'AI_OUT'; // bounced past ai back
  return 'IN';
}

export function isFirstBounceOut(ballPos: THREE.Vector3, landingSide: LandingSide): boolean {
  const halfCourtWidth = COURT_WIDTH / 2;
  const halfCourtLength = COURT_LENGTH / 2;
  const maxX = halfCourtWidth + ERROR_MARGINS.width + ARCADE_LANDING_FORGIVENESS;
  const maxPlayerZ = halfCourtLength + ERROR_MARGINS.length + ARCADE_LANDING_FORGIVENESS;
  const minAiZ = -halfCourtLength - ERROR_MARGINS.length - ARCADE_LANDING_FORGIVENESS;
  const centerLineMargin = ERROR_MARGINS.length + ARCADE_LANDING_FORGIVENESS;

  if (Math.abs(ballPos.x) > maxX) return true;

  if (landingSide === 'AI') {
    return ballPos.z > centerLineMargin || ballPos.z < minAiZ;
  }

  return ballPos.z < -centerLineMargin || ballPos.z > maxPlayerZ;
}
