import * as THREE from 'three';
import { calculateLegalShot, type ServeSide } from '../physics/ShotPhysics';
import type { ShotDifficultyStats } from '../physics/ShotPhysics';
import type { CourtSurface, PlayerType } from '../types';
import { COURT_SURFACE_SETTINGS, OVERHEAD_SMASH_CONFIG, PLAYER_MOVEMENT_LIMITS } from './gameTuning';

export type SmashOpportunity = {
  active: boolean;
  startedAt: number;
  expiresAt: number;
  targetX: number;
  targetZ: number;
};

export const createEmptySmashOpportunity = (): SmashOpportunity => ({
  active: false,
  startedAt: 0,
  expiresAt: 0,
  targetX: 0,
  targetZ: 0
});

interface CanStartSmashInput {
  activeSmash: SmashOpportunity;
  now: number;
  smashCooldownUntil: number;
  playerX: number;
  playerZ: number;
  ballPos: THREE.Vector3;
  ballVel: THREE.Vector3;
  lastHitter: PlayerType | null;
}

export function canStartSmashOpportunity(input: CanStartSmashInput): boolean {
  const nearNet = input.playerZ <= OVERHEAD_SMASH_CONFIG.netDistanceThreshold;
  const ballIsHigh = input.ballPos.y >= OVERHEAD_SMASH_CONFIG.smashHeightThreshold && input.ballPos.y <= OVERHEAD_SMASH_CONFIG.maxSmashHeight;
  const ballIsIncoming = input.lastHitter === 'AI' && input.ballVel.z > 0.35;
  const ballIsInFront =
    input.ballPos.z >= input.playerZ - OVERHEAD_SMASH_CONFIG.playerBackWindow &&
    input.ballPos.z <= input.playerZ + OVERHEAD_SMASH_CONFIG.playerForwardWindow;
  const ballIsReachableSideways = Math.abs(input.ballPos.x - input.playerX) <= OVERHEAD_SMASH_CONFIG.lateralWindow;

  return !input.activeSmash.active && input.now >= input.smashCooldownUntil && nearNet && ballIsHigh && ballIsIncoming && ballIsInFront && ballIsReachableSideways;
}

export function createSmashOpportunity(now: number, ballPos: THREE.Vector3): SmashOpportunity {
  return {
    active: true,
    startedAt: now,
    expiresAt: now + OVERHEAD_SMASH_CONFIG.timingWindow,
    targetX: ballPos.x,
    targetZ: THREE.MathUtils.clamp(ballPos.z, PLAYER_MOVEMENT_LIMITS.minZ + 0.1, OVERHEAD_SMASH_CONFIG.netDistanceThreshold)
  };
}

interface OverheadSmashInput {
  ballPos: THREE.Vector3;
  playerX: number;
  difficultyStats: ShotDifficultyStats;
  surfaceSettings: (typeof COURT_SURFACE_SETTINGS)[keyof typeof COURT_SURFACE_SETTINGS];
  isFlameSmash: boolean;
  random: () => number;
}

export interface OverheadSmashResult {
  velocity: THREE.Vector3;
  spin: number;
}

export function calculateOverheadSmash(input: OverheadSmashInput): OverheadSmashResult {
  const targetX = THREE.MathUtils.clamp((input.random() - 0.5) * 7.5, -4.5, 4.5);
  const targetZ = -9.5;
  const travelTime = 0.58;
  const velocity = new THREE.Vector3(
    (targetX - input.ballPos.x) / travelTime,
    OVERHEAD_SMASH_CONFIG.smashDownwardVelocity,
    (targetZ - input.ballPos.z) / travelTime
  ).multiplyScalar(
    OVERHEAD_SMASH_CONFIG.smashSpeedMultiplier *
      (input.isFlameSmash ? 1.45 : 1) *
      input.difficultyStats.gameDifficultyMultiplier *
      input.surfaceSettings.ballSpeedMultiplier
  );

  const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
  if (horizontalSpeed > OVERHEAD_SMASH_CONFIG.maxHorizontalSpeed) {
    const scale = OVERHEAD_SMASH_CONFIG.maxHorizontalSpeed / horizontalSpeed;
    velocity.x *= scale;
    velocity.z *= scale;
  }

  const spin = THREE.MathUtils.clamp((input.playerX - input.ballPos.x) * 0.8, -2.4, 2.4);

  return { velocity, spin };
}

export function isCloseEnoughForWeakSmashReturn(ballPos: THREE.Vector3, playerX: number): boolean {
  return Math.abs(ballPos.x - playerX) <= OVERHEAD_SMASH_CONFIG.failWeakReturnRadius && ballPos.y < OVERHEAD_SMASH_CONFIG.maxSmashHeight;
}

interface WeakSmashReturnInput {
  ballPos: THREE.Vector3;
  serveSide: ServeSide;
  difficultyStats: ShotDifficultyStats;
  courtSurface: CourtSurface;
}

export function calculateWeakSmashReturn(input: WeakSmashReturnInput): THREE.Vector3 {
  return calculateLegalShot(input.ballPos, false, input.serveSide, input.difficultyStats, 'AI', input.courtSurface).multiplyScalar(
    OVERHEAD_SMASH_CONFIG.weakReturnSpeedMultiplier
  );
}
