import * as THREE from 'three';
import { AI_BASELINE_POSITION, AI_MISS_DRAMA, OUT_OF_BOUNDS_LIMITS, PLAYER_MOVEMENT_LIMITS, COURT_SURFACE_SETTINGS } from './gameTuning';
import type { ShotDifficultyStats } from '../physics/ShotPhysics';
import type { PlayerType } from '../types';

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
}

export interface AiMovementResult {
  x: number;
  z: number;
  isMercyMiss: boolean;
}

export function calculateAiMovement(input: AiMovementInput): AiMovementResult {
  const isMercyMiss = input.consecutiveReturns >= input.targetRallyLength;
  const isBallOnAiSide = input.ballZ < 0;
  const aiBaseSpeed = 3.5;
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
}

export interface AiReturnResult {
  velocity: THREE.Vector3;
  spin: number;
}

export function calculateAiReturn(input: AiReturnInput): AiReturnResult {
  const tZ = 5 + input.random() * 4;
  const tX = (input.random() - 0.5) * 8;
  const vy = 1.8 * input.difficultyStats.pointDifficultyMultiplier;
  const t = (vy + Math.sqrt(vy * vy + 2 * 1.5 * (input.ballPos.y - 0.1))) / 1.5;
  const velocity = new THREE.Vector3((tX - input.ballPos.x) / t, vy, (tZ - input.ballPos.z) / t).multiplyScalar(
    input.difficultyStats.gameDifficultyMultiplier * input.surfaceSettings.ballSpeedMultiplier
  );
  const spin = THREE.MathUtils.clamp((input.aiX - input.ballPos.x) * 0.45, -1.3, 1.3);

  return { velocity, spin };
}
