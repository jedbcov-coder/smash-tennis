import * as THREE from 'three';
import { COURT_SURFACE_SETTINGS, SHOT_TARGETS } from '../gameplay/gameTuning';
import { randomCentered, randomRange } from '../gameplay/random';
import type { CourtSurface } from '../types';

export type CourtSide = 'PLAYER' | 'AI';
export type ServeSide = 'DEUCE' | 'AD';

export interface ShotDifficultyStats {
  gameDifficultyMultiplier: number;
  pointDifficultyMultiplier: number;
}

export function calculateLegalShot(
  fromPos: THREE.Vector3,
  isServe: boolean,
  serveSide: ServeSide,
  difficultyStats: ShotDifficultyStats,
  toSide: CourtSide = 'AI',
  courtSurface: CourtSurface = 'hard'
) {
  // Target area depends on which side we are hitting to.
  let targetZ =
    toSide === 'AI'
      ? randomRange(SHOT_TARGETS.aiMinZ - SHOT_TARGETS.aiZRange, SHOT_TARGETS.aiMinZ)
      : randomRange(SHOT_TARGETS.playerMinZ, SHOT_TARGETS.playerMinZ + SHOT_TARGETS.playerZRange);
  let targetX = randomCentered(SHOT_TARGETS.rallyXRange);

  if (isServe) {
    // Enforce diagonal serve cross-court.
    if (toSide === 'AI') {
      targetZ = SHOT_TARGETS.aiServeZ; // In service box (approx -1 to -7 range)
      targetX = serveSide === 'DEUCE' ? SHOT_TARGETS.serveAdTargetX : SHOT_TARGETS.serveDeuceTargetX;
    } else {
      targetZ = SHOT_TARGETS.playerServeZ; // In service box (approx 1 to 7 range)
      targetX = serveSide === 'DEUCE' ? SHOT_TARGETS.serveDeuceTargetX : SHOT_TARGETS.serveAdTargetX;
    }
    // Add slight randomness to serve target.
    targetX += randomCentered(SHOT_TARGETS.serveRandomXRange);
  }

  const dy = fromPos.y - 0.1;
  // Scale vertical and horizontal velocity by point multipliers.
  const baseVy = isServe ? 2.0 : 1.5;
  const vy = baseVy * difficultyStats.pointDifficultyMultiplier;
  const g = 1.5;

  const t = (vy + Math.sqrt(vy * vy + 2 * g * dy)) / g;

  const finalVel = new THREE.Vector3(
    (targetX - fromPos.x) / t,
    vy,
    (targetZ - fromPos.z) / t
  );

  const surfaceSettings = COURT_SURFACE_SETTINGS[courtSurface];

  // Apply game-level speed and court-surface speed boost.
  return finalVel.multiplyScalar(difficultyStats.gameDifficultyMultiplier * surfaceSettings.ballSpeedMultiplier);
}
