import * as THREE from 'three';
import { COURT_SURFACE_SETTINGS, SHOT_TARGETS } from '../gameplay/gameTuning';
import type { CourtSurface } from '../types';

export type CourtSide = 'PLAYER' | 'AI';
export type ServeSide = 'DEUCE' | 'AD';
export type ShotType = 'flat' | 'lob' | 'slice' | 'power' | 'crossCourt';
export type TimingGrade = 'early' | 'good' | 'perfect' | 'late';

interface ShotOutcomeOptions {
  shotType?: ShotType;
  timingGrade?: TimingGrade;
}

interface ShotProfile {
  speedMultiplier: number;
  heightMultiplier: number;
  spinBonus: number;
  targetAccuracy: number;
}

const TIMING_PROFILES: Record<TimingGrade, ShotProfile> = {
  early: { speedMultiplier: 0.9, heightMultiplier: 1.08, spinBonus: -0.3, targetAccuracy: 1.45 },
  good: { speedMultiplier: 1, heightMultiplier: 1, spinBonus: 0, targetAccuracy: 1 },
  perfect: { speedMultiplier: 1.18, heightMultiplier: 0.96, spinBonus: 0.2, targetAccuracy: 0.55 },
  late: { speedMultiplier: 0.86, heightMultiplier: 1.15, spinBonus: 0.35, targetAccuracy: 1.65 }
};

const SHOT_TYPE_PROFILES: Record<ShotType, ShotProfile> = {
  flat: { speedMultiplier: 1, heightMultiplier: 1, spinBonus: 0, targetAccuracy: 1 },
  lob: { speedMultiplier: 0.82, heightMultiplier: 1.75, spinBonus: 0.15, targetAccuracy: 1.15 },
  slice: { speedMultiplier: 0.9, heightMultiplier: 0.9, spinBonus: 0.85, targetAccuracy: 1.25 },
  power: { speedMultiplier: 1.24, heightMultiplier: 0.92, spinBonus: 0.1, targetAccuracy: 0.8 },
  crossCourt: { speedMultiplier: 1.04, heightMultiplier: 1.02, spinBonus: 0.45, targetAccuracy: 0.9 }
};

export interface ShotOutcome {
  velocity: THREE.Vector3;
  spinBonus: number;
}

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
  courtSurface: CourtSurface = 'hard',
  outcomeOptions: ShotOutcomeOptions = {}
): THREE.Vector3 {
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

  const shotType = outcomeOptions.shotType ?? 'flat';
  const timingGrade = outcomeOptions.timingGrade ?? 'good';
  const shotProfile = SHOT_TYPE_PROFILES[shotType];
  const timingProfile = TIMING_PROFILES[timingGrade];

  if (!isServe) {
    const accuracyWobble = (Math.random() - 0.5) * 1.4 * shotProfile.targetAccuracy * timingProfile.targetAccuracy;
    targetX += accuracyWobble;

    if (shotType === 'crossCourt') {
      targetX = THREE.MathUtils.clamp(fromPos.x > 0 ? -3.8 : 3.8, -4.2, 4.2);
    }

    if (shotType === 'slice') {
      targetX = THREE.MathUtils.clamp(targetX + (fromPos.x > 0 ? -1.2 : 1.2), -4.3, 4.3);
    }
  }

  const dy = fromPos.y - 0.1;
  // Scale vertical and horizontal velocity by point multipliers.
  const baseVy = isServe ? 2.0 : 1.5;
  const vy = baseVy * difficultyStats.pointDifficultyMultiplier * (isServe ? 1 : shotProfile.heightMultiplier * timingProfile.heightMultiplier);
  const g = 1.5;

  const t = (vy + Math.sqrt(vy * vy + 2 * g * dy)) / g;

  const finalVel = new THREE.Vector3(
    (targetX - fromPos.x) / t,
    vy,
    (targetZ - fromPos.z) / t
  );

  const surfaceSettings = COURT_SURFACE_SETTINGS[courtSurface];

  // Apply game-level speed and court-surface speed boost.
  return finalVel.multiplyScalar(
    difficultyStats.gameDifficultyMultiplier *
      surfaceSettings.ballSpeedMultiplier *
      (isServe ? 1 : shotProfile.speedMultiplier * timingProfile.speedMultiplier)
  );
}

export function calculateShotOutcome(
  fromPos: THREE.Vector3,
  isServe: boolean,
  serveSide: ServeSide,
  difficultyStats: ShotDifficultyStats,
  toSide: CourtSide = 'AI',
  courtSurface: CourtSurface = 'hard',
  outcomeOptions: ShotOutcomeOptions = {}
): ShotOutcome {
  const shotType = outcomeOptions.shotType ?? 'flat';
  const timingGrade = outcomeOptions.timingGrade ?? 'good';

  return {
    velocity: calculateLegalShot(fromPos, isServe, serveSide, difficultyStats, toSide, courtSurface, outcomeOptions),
    spinBonus: SHOT_TYPE_PROFILES[shotType].spinBonus + TIMING_PROFILES[timingGrade].spinBonus
  };
}
