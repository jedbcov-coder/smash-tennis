import * as THREE from 'three';
import type { CourtSurfaceTuning } from '../types';

export const BALL_GRAVITY = -1.5;
export const BALL_GROUND_Y = 0.1;
export const SPIN_DECAY_PER_SECOND = 0.45;
export const SPIN_DECAY_LIMIT = 0.9;
export const BOUNCE_SPIN_MULTIPLIER = 0.58;

export interface BallSimulationState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  spin: number;
}

export interface BallSimulationStepOptions {
  delta: number;
  timeScale?: number;
  surfaceSettings: Pick<CourtSurfaceTuning, 'bounceHeightMultiplier' | 'slideAmount' | 'spinCurveMultiplier'>;
}

export interface BallSimulationStepResult extends BallSimulationState {
  bounced: boolean;
}

export function applyBallSpinCurve(
  velocity: THREE.Vector3,
  spinStrength: number,
  spinCurveMultiplier: number,
  delta: number
): THREE.Vector3 {
  // Tiny sideways push: enough to feel fun, but simple enough to tune.
  return new THREE.Vector3(
    velocity.x + spinStrength * spinCurveMultiplier * delta,
    velocity.y,
    velocity.z
  );
}

export function decayBallSpin(spinStrength: number, delta: number): number {
  return spinStrength * (1 - Math.min(SPIN_DECAY_LIMIT, delta * SPIN_DECAY_PER_SECOND));
}

export function applyBallGravity(velocity: THREE.Vector3, delta: number): THREE.Vector3 {
  return new THREE.Vector3(velocity.x, velocity.y + BALL_GRAVITY * delta, velocity.z);
}

export function applyBallSurfaceBounce(
  velocity: THREE.Vector3,
  surfaceSettings: Pick<CourtSurfaceTuning, 'bounceHeightMultiplier' | 'slideAmount'>
): THREE.Vector3 {
  const skidMultiplier = THREE.MathUtils.clamp(1 - surfaceSettings.slideAmount, 0.65, 0.99);

  return new THREE.Vector3(
    velocity.x * skidMultiplier,
    Math.abs(velocity.y) * surfaceSettings.bounceHeightMultiplier,
    velocity.z * skidMultiplier
  );
}

export function applyBallBounceSpinLoss(spinStrength: number): number {
  return spinStrength * BOUNCE_SPIN_MULTIPLIER;
}

export function stepBallSimulation(
  state: BallSimulationState,
  { delta, timeScale = 1, surfaceSettings }: BallSimulationStepOptions
): BallSimulationStepResult {
  const scaledDelta = delta * timeScale;
  let nextVelocity = applyBallSpinCurve(
    state.velocity,
    state.spin,
    surfaceSettings.spinCurveMultiplier,
    scaledDelta
  );
  let nextSpin = decayBallSpin(state.spin, scaledDelta);

  nextVelocity = applyBallGravity(nextVelocity, scaledDelta);
  const nextPosition = state.position.clone().addScaledVector(nextVelocity, scaledDelta);
  let bounced = false;

  if (nextPosition.y < BALL_GROUND_Y) {
    nextPosition.y = BALL_GROUND_Y;
    nextVelocity = applyBallSurfaceBounce(nextVelocity, surfaceSettings);
    nextSpin = applyBallBounceSpinLoss(nextSpin);
    bounced = true;
  }

  return {
    position: nextPosition,
    velocity: nextVelocity,
    spin: nextSpin,
    bounced
  };
}
