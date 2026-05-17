import * as THREE from 'three';
import { SHOT_TARGETS } from '../gameplay/gameTuning';

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
  toSide: CourtSide = 'AI'
) {
  // Target area depends on which side we are hitting to.
  let targetZ =
    toSide === 'AI'
      ? SHOT_TARGETS.aiMinZ - Math.random() * SHOT_TARGETS.aiZRange
      : SHOT_TARGETS.playerMinZ + Math.random() * SHOT_TARGETS.playerZRange;
  let targetX = (Math.random() - 0.5) * SHOT_TARGETS.rallyXRange;

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
    targetX += (Math.random() - 0.5) * SHOT_TARGETS.serveRandomXRange;
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

  // Apply game-level speed boost.
  return finalVel.multiplyScalar(difficultyStats.gameDifficultyMultiplier);
}
