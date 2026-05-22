import * as THREE from 'three';
import { COURT_SURFACE_SETTINGS, SHOT_TARGETS } from '../gameplay/gameTuning';
import { HIT_QUALITY_TUNING, SHOT_TYPE_TUNING, type HitQuality, type ShotType } from '../gameplay/shotTypes';
import type { CourtSurface } from '../types';
import { getDiagonalServiceBoxTarget } from '../rules/courtGeometry';

export type CourtSide = 'PLAYER' | 'AI';
export type ServeSide = 'DEUCE' | 'AD';

export interface ShotDifficultyStats {
  gameDifficultyMultiplier: number;
  pointDifficultyMultiplier: number;
}

export interface ShotPhysicsOptions {
  shotType?: ShotType;
  quality?: HitQuality;
  // Positive values curve right, negative values curve left.
  spinDirection?: number;
  random?: () => number;
}

export interface ShotPhysicsResult {
  velocity: THREE.Vector3;
  spin: number;
  targetRisk: number;
}

function chooseTarget(
  fromPos: THREE.Vector3,
  isServe: boolean,
  serveSide: ServeSide,
  toSide: CourtSide,
  shotType: ShotType,
  quality: HitQuality,
  targetRisk: number,
  random: () => number
) {
  // Target area depends on which side we are hitting to.
  let targetZ =
    toSide === 'AI'
      ? SHOT_TARGETS.aiMinZ - random() * SHOT_TARGETS.aiZRange
      : SHOT_TARGETS.playerMinZ + random() * SHOT_TARGETS.playerZRange;
  let targetX = (random() - 0.5) * SHOT_TARGETS.rallyXRange;

  if (shotType === 'lob') {
    targetZ = toSide === 'AI' ? SHOT_TARGETS.aiMinZ - SHOT_TARGETS.aiZRange * 0.9 : SHOT_TARGETS.playerMinZ + SHOT_TARGETS.playerZRange * 0.9;
  }

  if (shotType === 'drop') {
    targetZ = toSide === 'AI' ? -2.2 - random() * 1.6 : 2.2 + random() * 1.6;
  }

  if (shotType === 'smash' || shotType === 'special') {
    targetZ = toSide === 'AI' ? -8.2 - random() * 1.6 : 8.2 + random() * 1.6;
    targetX = (random() - 0.5) * 7.5;
  }

  if (isServe) {
    const hitter = toSide === 'AI' ? 'PLAYER' : 'AI';
    const serveTarget = getDiagonalServiceBoxTarget({ hitter, serveSide });
    targetZ = serveTarget.targetZ;
    targetX = serveTarget.targetX;
    // Add slight randomness to serve target.
    targetX += (random() - 0.5) * SHOT_TARGETS.serveRandomXRange * targetRisk;
  }

  const earlyLateAimDrift = quality === 'early' ? -0.75 : quality === 'late' ? 0.75 : 0;
  const riskyWideAim = (random() - 0.5) * targetRisk * (isServe ? 0.18 : 0.55);
  targetX += earlyLateAimDrift + riskyWideAim;

  if (quality === 'miss') {
    // A miss still creates a readable ball path, but aims far enough away that it is risky.
    targetX += (fromPos.x >= 0 ? 1 : -1) * (1.25 + random() * 1.25);
    targetZ += toSide === 'AI' ? -1.4 : 1.4;
  }

  return { targetX, targetZ };
}

export function calculateShotPhysics(
  fromPos: THREE.Vector3,
  isServe: boolean,
  serveSide: ServeSide,
  difficultyStats: ShotDifficultyStats,
  toSide: CourtSide = 'AI',
  courtSurface: CourtSurface = 'hard',
  options: ShotPhysicsOptions = {}
): ShotPhysicsResult {
  const shotType = options.shotType ?? 'flat';
  const quality = options.quality ?? 'good';
  const random = options.random ?? (() => 0.5);
  const shotTuning = SHOT_TYPE_TUNING[shotType];
  const qualityTuning = HIT_QUALITY_TUNING[quality];
  const targetRisk = shotTuning.riskMultiplier * qualityTuning.riskMultiplier;
  const { targetX, targetZ } = chooseTarget(fromPos, isServe, serveSide, toSide, shotType, quality, targetRisk, random);

  const dy = fromPos.y - 0.1;
  // Scale vertical and horizontal velocity by point multipliers, shot arc, and hit quality.
  const baseVy = isServe ? 2.0 : 1.5;
  const vy = baseVy * difficultyStats.pointDifficultyMultiplier * shotTuning.arcMultiplier * qualityTuning.arcMultiplier;
  const g = 1.5;

  const t = (vy + Math.sqrt(vy * vy + 2 * g * dy)) / g;

  const finalVel = new THREE.Vector3(
    (targetX - fromPos.x) / t,
    vy,
    (targetZ - fromPos.z) / t
  );

  const surfaceSettings = COURT_SURFACE_SETTINGS[courtSurface];
  const speedMultiplier =
    difficultyStats.gameDifficultyMultiplier * surfaceSettings.ballSpeedMultiplier * shotTuning.speedMultiplier * qualityTuning.speedMultiplier;

  const spinDirection = options.spinDirection ?? (targetX >= fromPos.x ? 1 : -1);
  const spin = THREE.MathUtils.clamp(spinDirection * shotTuning.spinMultiplier * qualityTuning.spinMultiplier, -2.8, 2.8);

  // Apply game-level speed, court-surface speed boost, shot type, and hit-quality speed.
  return {
    velocity: finalVel.multiplyScalar(speedMultiplier),
    spin,
    targetRisk
  };
}

export function calculateLegalShot(
  fromPos: THREE.Vector3,
  isServe: boolean,
  serveSide: ServeSide,
  difficultyStats: ShotDifficultyStats,
  toSide: CourtSide = 'AI',
  courtSurface: CourtSurface = 'hard',
  options: ShotPhysicsOptions = {}
) {
  return calculateShotPhysics(fromPos, isServe, serveSide, difficultyStats, toSide, courtSurface, options).velocity;
}
