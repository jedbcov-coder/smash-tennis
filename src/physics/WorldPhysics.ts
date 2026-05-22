import * as THREE from 'three';
import { ARCADE_LANDING_FORGIVENESS, COURT_LENGTH, COURT_RENDERING, COURT_WIDTH, ERROR_MARGINS, NET_HEIGHT, OUT_OF_BOUNDS_LIMITS } from '../gameplay/gameTuning';
import type { ServeSide } from './ShotPhysics';
import type { PlayerType } from '../types';

export type LandingSide = 'PLAYER' | 'AI';
export type ServeLandingContext = {
  isServe: boolean;
  serveSide: ServeSide;
  hitter: PlayerType;
};

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

function isServeBounceOut(ballPos: THREE.Vector3, serveSide: ServeSide, hitter: PlayerType): boolean {
  const maxX = COURT_WIDTH / 2 + ERROR_MARGINS.width + ARCADE_LANDING_FORGIVENESS;
  const serviceLineZ = COURT_RENDERING.serviceLineZ + ERROR_MARGINS.length + ARCADE_LANDING_FORGIVENESS;
  const centerLineMargin = ERROR_MARGINS.length + ARCADE_LANDING_FORGIVENESS;

  if (Math.abs(ballPos.x) > maxX) return true;

  const onAiHalf = hitter === 'PLAYER';
  if (onAiHalf) {
    if (ballPos.z > -centerLineMargin || ballPos.z < -serviceLineZ) return true;
  } else if (ballPos.z < centerLineMargin || ballPos.z > serviceLineZ) {
    return true;
  }

  const shouldLandPositiveX = hitter === 'PLAYER' ? serveSide === 'DEUCE' : serveSide === 'AD';
  if (shouldLandPositiveX) return ballPos.x < -centerLineMargin;
  return ballPos.x > centerLineMargin;
}

export function isFirstBounceOut(ballPos: THREE.Vector3, landingSide: LandingSide, serveContext?: ServeLandingContext): boolean {
  if (serveContext?.isServe) {
    return isServeBounceOut(ballPos, serveContext.serveSide, serveContext.hitter);
  }

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
