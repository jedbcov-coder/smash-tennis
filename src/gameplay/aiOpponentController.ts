import * as THREE from 'three';
import type { ShotDifficultyStats } from '../physics/ShotPhysics';
import type { PlayerType } from '../types';
import {
  AI_BASELINE_POSITION,
  AI_MISS_DRAMA,
  COURT_SURFACE_SETTINGS,
  OUT_OF_BOUNDS_LIMITS,
  PLAYER_MOVEMENT_LIMITS
} from './gameTuning';

type CourtSurfaceSettings = (typeof COURT_SURFACE_SETTINGS)[keyof typeof COURT_SURFACE_SETTINGS];

interface AiMovementInput {
  aiX: number;
  aiZ: number;
  ballX: number;
  ballZ: number;
  consecutiveReturns: number;
  targetRallyLength: number;
  difficultyStats: ShotDifficultyStats;
  surfaceSettings: CourtSurfaceSettings;
  elapsedTime: number;
  delta: number;
}

export interface AiMovementResult {
  x: number;
  z: number;
  isMercyMiss: boolean;
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

interface AiReturnInput {
  ballPos: THREE.Vector3;
  aiX: number;
  difficultyStats: ShotDifficultyStats;
  surfaceSettings: CourtSurfaceSettings;
  random: () => number;
}

export interface AiReturnResult {
  velocity: THREE.Vector3;
  spin: number;
}

export interface UpdateAiOpponentInput {
  aiX: number;
  aiZ: number;
  ballPos: THREE.Vector3;
  consecutiveReturns: number;
  targetRallyLength: number;
  difficultyStats: ShotDifficultyStats;
  surfaceSettings: CourtSurfaceSettings;
  elapsedTime: number;
  delta: number;
  alreadyTriggeredMissSwing: boolean;
  lastHitter: PlayerType | null;
  random: () => number;
}

export interface UpdateAiOpponentResult {
  nextAiPosition: {
    x: number;
    z: number;
  };
  swung: boolean;
  missed: boolean;
  isMercyMiss: boolean;
  swingDurationMs: number;
  returnShot?: AiReturnResult;
}

export function createInitialAiOpponentPosition(): THREE.Vector3 {
  return new THREE.Vector3(AI_BASELINE_POSITION.x, 0, AI_BASELINE_POSITION.z);
}

function calculateAiMovement(input: AiMovementInput): AiMovementResult {
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

function shouldShowAiNearMiss(input: AiNearMissInput): boolean {
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

function calculateAiReturn(input: AiReturnInput): AiReturnResult {
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

export function updateAiOpponent(input: UpdateAiOpponentInput): UpdateAiOpponentResult {
  const aiMovement = calculateAiMovement({
    aiX: input.aiX,
    aiZ: input.aiZ,
    ballX: input.ballPos.x,
    ballZ: input.ballPos.z,
    consecutiveReturns: input.consecutiveReturns,
    targetRallyLength: input.targetRallyLength,
    difficultyStats: input.difficultyStats,
    surfaceSettings: input.surfaceSettings,
    elapsedTime: input.elapsedTime,
    delta: input.delta
  });

  const missed = shouldShowAiNearMiss({
    isMercyMiss: aiMovement.isMercyMiss,
    alreadyTriggered: input.alreadyTriggeredMissSwing,
    lastHitter: input.lastHitter,
    ballX: input.ballPos.x,
    ballY: input.ballPos.y,
    ballZ: input.ballPos.z,
    aiX: aiMovement.x
  });

  let returnShot: AiReturnResult | undefined;

  if (
    input.ballPos.z < -8 &&
    input.ballPos.z > -9.5 &&
    input.lastHitter === 'PLAYER' &&
    input.ballPos.y < 3.5 &&
    !aiMovement.isMercyMiss &&
    Math.abs(input.ballPos.x - aiMovement.x) < 2.0
  ) {
    returnShot = calculateAiReturn({
      ballPos: input.ballPos,
      aiX: aiMovement.x,
      difficultyStats: input.difficultyStats,
      surfaceSettings: input.surfaceSettings,
      random: input.random
    });
  }

  return {
    nextAiPosition: {
      x: aiMovement.x,
      z: aiMovement.z
    },
    swung: missed || returnShot !== undefined,
    missed,
    isMercyMiss: aiMovement.isMercyMiss,
    swingDurationMs: missed ? AI_MISS_DRAMA.swingDurationMs : 260,
    returnShot
  };
}
