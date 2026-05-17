import * as THREE from 'three';
import { NET_HEIGHT, OUT_OF_BOUNDS_LIMITS } from '../gameplay/gameTuning';
import { BALL_GRAVITY, applyBallGravity, applyBallSpinCurve, applyBallSurfaceBounce } from './BallSimulation';
import type { CourtSurfaceTuning, PlayerType } from '../types';

export const GRAVITY = BALL_GRAVITY;

export function applyGravity(velocity: THREE.Vector3, delta: number): THREE.Vector3 {
  return applyBallGravity(velocity, delta);
}

export function applySpinCurve(
  velocity: THREE.Vector3,
  spinStrength: number,
  spinCurveMultiplier: number,
  delta: number
): void {
  velocity.copy(applyBallSpinCurve(velocity, spinStrength, spinCurveMultiplier, delta));
}

export function applySurfaceBounce(
  velocity: THREE.Vector3,
  surfaceSettings: Pick<CourtSurfaceTuning, 'bounceHeightMultiplier' | 'slideAmount'>
): void {
  velocity.copy(applyBallSurfaceBounce(velocity, surfaceSettings));
}

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
