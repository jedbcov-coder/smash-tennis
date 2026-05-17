import * as THREE from 'three';
import { AI_BASELINE_POSITION, AI_MISS_DRAMA, OUT_OF_BOUNDS_LIMITS, PLAYER_MOVEMENT_LIMITS, COURT_SURFACE_SETTINGS } from './gameTuning';
import type { ShotDifficultyStats } from '../physics/ShotPhysics';
import type { PlayerType } from '../types';
import type { OpponentProfile } from './opponents';

interface AiMovementInput {
  aiX: number;
  aiZ: number;
  ballX: number;
  ballZ: number;
  consecutiveReturns: number;
  targetRallyLength: number;
  difficultyStats: ShotDifficultyStats;
  surfaceSettings: (typeof COURT_SURFACE_SETTINGS)[keyof typeof COURT_SURFACE_SETTINGS];
  elapsedTime: number;
  delta: number;
  opponentProfile: OpponentProfile;
  forceMiss: boolean;
}

export interface AiMovementResult {
  x: number;
  z: number;
  isMercyMiss: boolean;
}

export function calculateAiMovement(input: AiMovementInput): AiMovementResult {
  const isMercyMiss = input.forceMiss || input.consecutiveReturns >= input.targetRallyLength;
  const isBallOnAiSide = input.ballZ < 0;
  const aiBaseSpeed = input.opponentProfile.movementSpeed;
  const aiSpeed =
    aiBaseSpeed *
    (isMercyMiss ? AI_MISS_DRAMA.lungeSpeedMultiplier : 1) *
    input.difficultyStats.gameDifficultyMultiplier *
    input.surfaceSettings.playerMovementMultiplier *
    input.delta;
  const aiTargetX = isBallOnAiSide
    ? isMercyMiss
      ? THREE.MathUtils.clamp(
          input.ballX - (Math.sign(input.ballX - input.aiX) || 1) * AI_MISS_DRAMA.nearMissDistance,
          PLAYER_MOVEMENT_LIMITS.minX,
          PLAYER_MOVEMENT_LIMITS.maxX
        )
      : input.ballX
    : 0;
  const aiTargetZ = AI_BASELINE_POSITION.z + Math.sin(input.elapsedTime) * AI_BASELINE_POSITION.wobbleAmount;

  return {
    x: input.aiX + Math.sign(aiTargetX - input.aiX) * Math.min(Math.abs(aiTargetX - input.aiX), aiSpeed),
    z: input.aiZ + Math.sign(aiTargetZ - input.aiZ) * Math.min(Math.abs(aiTargetZ - input.aiZ), aiSpeed),
    isMercyMiss
  };
}

interface AiNearMissInput {
  isMercyMiss: boolean;
  alreadyTriggered: boolean;
  lastHitter: PlayerType | null;
  ballX: number;
  ballY: number;
  ballZ: number;
  aiX: number;
}

export function shouldShowAiNearMiss(input: AiNearMissInput): boolean {
  return (
    input.isMercyMiss &&
    !input.alreadyTriggered &&
    input.lastHitter === 'PLAYER' &&
    input.ballZ <= AI_MISS_DRAMA.desperationZoneZ &&
    input.ballZ > OUT_OF_BOUNDS_LIMITS.aiBackZ &&
    input.ballY < 3.5 &&
    Math.abs(input.ballX - input.aiX) <= AI_MISS_DRAMA.lateSwingDistance
  );
}

interface AiReturnInput {
  ballPos: THREE.Vector3;
  aiX: number;
  difficultyStats: ShotDifficultyStats;
  surfaceSettings: (typeof COURT_SURFACE_SETTINGS)[keyof typeof COURT_SURFACE_SETTINGS];
  random: () => number;
  opponentProfile: OpponentProfile;
}

export interface AiReturnResult {
  velocity: THREE.Vector3;
  spin: number;
}

export function calculateAiReturn(input: AiReturnInput): AiReturnResult {
  const { opponentProfile } = input;
  const safeAccuracy = THREE.MathUtils.clamp(opponentProfile.accuracy, 0, 1);
  const safeAggression = THREE.MathUtils.clamp(opponentProfile.aggression, 0, 1);
  const targetError = (1 - safeAccuracy) * 2.8;
  const targetDepth = 5.2 + safeAggression * 3.6;
  const tZ = targetDepth + (input.random() - 0.5) * (1.4 + targetError);
  const tX = (input.random() - 0.5) * (5.5 + safeAggression * 3.5) + (input.random() - 0.5) * targetError;
  const shotLift = opponentProfile.preferredShotType === 'slice angle' ? 1.65 : opponentProfile.preferredShotType === 'flat drive' ? 1.55 : 1.9;
  const vy = shotLift * input.difficultyStats.pointDifficultyMultiplier;
  const t = (vy + Math.sqrt(vy * vy + 2 * 1.5 * (input.ballPos.y - 0.1))) / 1.5;
  const specialSpeedBoost = opponentProfile.specialMoveStyle === 'baseline blast' ? 1.08 : opponentProfile.specialMoveStyle === 'neon rush' ? 1.04 : 0.98;
  const speedBoost = (0.94 + safeAggression * 0.18) * specialSpeedBoost;
  const velocity = new THREE.Vector3((tX - input.ballPos.x) / t, vy, (tZ - input.ballPos.z) / t).multiplyScalar(
    input.difficultyStats.gameDifficultyMultiplier * input.surfaceSettings.ballSpeedMultiplier * speedBoost
  );
  const specialSpinBoost = opponentProfile.specialMoveStyle === 'glitch slice' ? 1.25 : 1;
  const spinMultiplier = (opponentProfile.preferredShotType === 'slice angle' ? 0.75 : opponentProfile.preferredShotType === 'topspin curve' ? 1.25 : 0.45) * specialSpinBoost;
  const spin = THREE.MathUtils.clamp((input.aiX - input.ballPos.x) * spinMultiplier, -1.5, 1.5);

  return { velocity, spin };
}
