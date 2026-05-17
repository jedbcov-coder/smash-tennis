import * as THREE from 'three';
import { GameState, type PlayerType } from '../types';
import type { ServeSide } from '../physics/ShotPhysics';
import { OVERHEAD_SMASH_CONFIG, PLAYER_MOVEMENT_LIMITS, COURT_SURFACE_SETTINGS } from './gameTuning';

interface PlayerMovementInput {
  currentX: number;
  currentZ: number;
  mouseX: number;
  mouseY: number;
  gameState: GameState;
  servingPlayer: PlayerType;
  serveSide: ServeSide;
  surfaceSettings: (typeof COURT_SURFACE_SETTINGS)[keyof typeof COURT_SURFACE_SETTINGS];
}

export interface PlayerMovementResult {
  x: number;
  z: number;
}

export function calculatePlayerMovement(input: PlayerMovementInput): PlayerMovementResult {
  let targetX = input.mouseX * 12.0;
  let targetZ = 6.0 + -input.mouseY * 10.0;

  if (input.gameState === GameState.SERVING && input.servingPlayer === 'PLAYER') {
    targetZ = PLAYER_MOVEMENT_LIMITS.serveZ;
    targetX = input.serveSide === 'DEUCE' ? PLAYER_MOVEMENT_LIMITS.deuceServeX : PLAYER_MOVEMENT_LIMITS.adServeX;
  }

  const playerMovementResponse = THREE.MathUtils.clamp(0.95 * input.surfaceSettings.playerMovementMultiplier, 0.68, 0.98);
  const nextX = THREE.MathUtils.lerp(input.currentX, targetX, playerMovementResponse);
  const nextZ = THREE.MathUtils.lerp(input.currentZ, targetZ, playerMovementResponse);

  return {
    x: THREE.MathUtils.clamp(nextX, PLAYER_MOVEMENT_LIMITS.minX, PLAYER_MOVEMENT_LIMITS.maxX),
    z: THREE.MathUtils.clamp(nextZ, PLAYER_MOVEMENT_LIMITS.minZ, PLAYER_MOVEMENT_LIMITS.maxZ)
  };
}

interface SmashAssistInput {
  playerX: number;
  playerZ: number;
  ballX: number;
  smashTargetX: number;
  smashTargetZ: number;
  currentFacingY: number;
}

export interface SmashAssistResult extends PlayerMovementResult {
  facingY: number;
}

export function applySmashAssist(input: SmashAssistInput): SmashAssistResult {
  const assistedX = THREE.MathUtils.clamp(
    input.smashTargetX,
    PLAYER_MOVEMENT_LIMITS.smashAssistMinX,
    PLAYER_MOVEMENT_LIMITS.smashAssistMaxX
  );
  const assistedZ = THREE.MathUtils.clamp(
    input.smashTargetZ + 0.25,
    PLAYER_MOVEMENT_LIMITS.minZ,
    OVERHEAD_SMASH_CONFIG.netDistanceThreshold
  );
  const nextAssistX = THREE.MathUtils.lerp(input.playerX, assistedX, OVERHEAD_SMASH_CONFIG.assistedPositionStrength);
  const nextAssistZ = THREE.MathUtils.lerp(input.playerZ, assistedZ, OVERHEAD_SMASH_CONFIG.assistedPositionStrength);
  const nextPlayerX = input.playerX + THREE.MathUtils.clamp(nextAssistX - input.playerX, -OVERHEAD_SMASH_CONFIG.assistedMaxStep, OVERHEAD_SMASH_CONFIG.assistedMaxStep);
  const nextPlayerZ = input.playerZ + THREE.MathUtils.clamp(nextAssistZ - input.playerZ, -OVERHEAD_SMASH_CONFIG.assistedMaxStep, OVERHEAD_SMASH_CONFIG.assistedMaxStep);
  const targetFacing = Math.PI + THREE.MathUtils.clamp((nextPlayerX - input.ballX) * 0.14, -0.35, 0.35);

  return {
    x: nextPlayerX,
    z: nextPlayerZ,
    facingY: THREE.MathUtils.lerp(input.currentFacingY, targetFacing, OVERHEAD_SMASH_CONFIG.autoAlignmentStrength)
  };
}
