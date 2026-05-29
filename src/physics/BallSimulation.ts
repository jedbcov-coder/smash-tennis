import * as THREE from 'three';
import type { CourtSurfaceTuning } from '../types';

const GRAVITY = -1.5;
const BALL_GROUND_HEIGHT = 0.1;
const SPIN_DECAY_PER_SECOND = 0.45;
const MAX_SPIN_DECAY_PER_STEP = 0.9;
const BOUNCE_SPIN_KEEP = 0.58;
const SMASH_BOUNCE_VERTICAL_SPEED_THRESHOLD = -9;
const SMASH_BOUNCE_SKID_MULTIPLIER = 0.82;


export interface PredictedGroundContact {
  timeToImpact: number;
  position: THREE.Vector3;
}

export function predictNextGroundContact(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  gravity = GRAVITY,
  groundHeight = BALL_GROUND_HEIGHT
): PredictedGroundContact | null {
  const yOffset = position.y - groundHeight;

  if (yOffset <= 0) {
    return {
      timeToImpact: 0,
      position: new THREE.Vector3(position.x, groundHeight, position.z)
    };
  }

  const a = 0.5 * gravity;
  const b = velocity.y;
  const c = yOffset;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return null;

  const root = Math.sqrt(discriminant);
  const denominator = 2 * a;
  const t1 = (-b - root) / denominator;
  const t2 = (-b + root) / denominator;
  const timeToImpact = [t1, t2].filter((time) => Number.isFinite(time) && time >= 0).sort((left, right) => left - right)[0];

  if (timeToImpact === undefined) return null;

  return {
    timeToImpact,
    position: new THREE.Vector3(
      position.x + velocity.x * timeToImpact,
      groundHeight,
      position.z + velocity.z * timeToImpact
    )
  };
}

export interface BallSimulationState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  spin: number;
}

interface BallSimulationStepOptions {
  delta: number;
  surfaceSettings: Pick<CourtSurfaceTuning, 'bounceHeightMultiplier' | 'slideAmount' | 'spinCurveMultiplier'>;
}

export function createBallSimulationState(
  position: [number, number, number] = [0, 5, 0],
  velocity: [number, number, number] = [0, 0, 0]
): BallSimulationState {
  return {
    position: new THREE.Vector3(...position),
    velocity: new THREE.Vector3(...velocity),
    spin: 0
  };
}

export function resetBallSimulation(
  simulation: BallSimulationState,
  position: [number, number, number],
  velocity: [number, number, number]
): void {
  simulation.position.set(...position);
  simulation.velocity.set(...velocity);
  simulation.spin = 0;
}

export function setBallVelocity(simulation: BallSimulationState, velocity: THREE.Vector3, spin = 0): void {
  simulation.velocity.copy(velocity);
  simulation.spin = spin;
}

export function setBallSpin(simulation: BallSimulationState, spin: number): void {
  simulation.spin = spin;
}

export function stepBallSimulation(simulation: BallSimulationState, { delta, surfaceSettings }: BallSimulationStepOptions): void {
  applySpinCurve(simulation.velocity, simulation.spin, surfaceSettings.spinCurveMultiplier, delta);
  simulation.spin = decaySpin(simulation.spin, delta);

  applyGravity(simulation.velocity, delta);
  integratePosition(simulation.position, simulation.velocity, delta);
  handleBounce(simulation, surfaceSettings);
}

function applyGravity(velocity: THREE.Vector3, delta: number): void {
  velocity.y += GRAVITY * delta;
}

function decaySpin(spin: number, delta: number): number {
  const decayAmount = Math.min(MAX_SPIN_DECAY_PER_STEP, delta * SPIN_DECAY_PER_SECOND);
  return spin * (1 - decayAmount);
}

function integratePosition(position: THREE.Vector3, velocity: THREE.Vector3, delta: number): void {
  position.addScaledVector(velocity, delta);
}

function handleBounce(
  simulation: BallSimulationState,
  surfaceSettings: Pick<CourtSurfaceTuning, 'bounceHeightMultiplier' | 'slideAmount'>
): void {
  if (simulation.position.y >= BALL_GROUND_HEIGHT) return;

  const incomingYVelocity = simulation.velocity.y;
  simulation.position.y = BALL_GROUND_HEIGHT;
  applySurfaceBounce(simulation.velocity, surfaceSettings, incomingYVelocity);
  simulation.spin *= BOUNCE_SPIN_KEEP;
}

function applySpinCurve(
  velocity: THREE.Vector3,
  spinStrength: number,
  spinCurveMultiplier: number,
  delta: number
): void {
  // Tiny sideways push: enough to feel fun, but simple enough to tune.
  velocity.x += spinStrength * spinCurveMultiplier * delta;
}

function applySurfaceBounce(
  velocity: THREE.Vector3,
  surfaceSettings: Pick<CourtSurfaceTuning, 'bounceHeightMultiplier' | 'slideAmount'>,
  incomingYVelocity: number
): void {
  velocity.y = Math.abs(velocity.y) * surfaceSettings.bounceHeightMultiplier;

  // slideAmount is easier to tune as "more slide = less slowdown".
  const skidMultiplier = THREE.MathUtils.clamp(1 - surfaceSettings.slideAmount, 0.65, 0.99);
  // Hard downward smashes get extra post-bounce damping so winners stay readable instead of instantly rocketing out of view.
  const smashDamping = incomingYVelocity <= SMASH_BOUNCE_VERTICAL_SPEED_THRESHOLD ? SMASH_BOUNCE_SKID_MULTIPLIER : 1;
  const finalSkidMultiplier = skidMultiplier * smashDamping;
  velocity.x *= finalSkidMultiplier;
  velocity.z *= finalSkidMultiplier;
}
