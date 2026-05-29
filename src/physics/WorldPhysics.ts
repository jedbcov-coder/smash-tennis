import * as THREE from 'three';
import { NET_HEIGHT, OUT_OF_BOUNDS_LIMITS } from '../gameplay/gameTuning';
import type { ServeSide } from './ShotPhysics';
import type { PlayerType } from '../types';
import { isFirstBounceLegalInSingles, isWithinDiagonalServiceBox } from '../rules/courtGeometry';

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
  return !isWithinDiagonalServiceBox(ballPos.x, ballPos.z, hitter, serveSide);
}

export function isFirstBounceOut(ballPos: THREE.Vector3, landingSide: LandingSide, serveContext?: ServeLandingContext): boolean {
  if (serveContext?.isServe) {
    return isServeBounceOut(ballPos, serveContext.serveSide, serveContext.hitter);
  }

  return !isFirstBounceLegalInSingles(ballPos.x, ballPos.z, landingSide);
}
