import * as THREE from 'three';
import type { Camera } from 'three';
import type { PlayerType } from '../types';
import type { ServeSide } from '../physics/ShotPhysics';
import { OVERHEAD_SMASH_CONFIG } from './gameTuning';

interface ServeCameraInput {
  mode: 'serve';
  serverX: number;
  serverZ: number;
  servingPlayer: PlayerType;
  serveSide: ServeSide;
}

interface RallyCameraInput {
  mode: 'rally';
  playerX: number;
  playerZ: number;
  ballX: number;
  now: number;
  cameraShakeUntil: number;
  smashOpportunityActive: boolean;
  random: () => number;
}

type ArcadeCameraInput = ServeCameraInput | RallyCameraInput;

function updateServeCamera(camera: Camera, input: ServeCameraInput) {
  const serviceTargetX = input.serveSide === 'DEUCE' ? 2.6 : -2.6;
  const serviceTargetZ = input.servingPlayer === 'PLAYER' ? -4.8 : 4.8;
  const behindServerZ = input.serverZ + (input.servingPlayer === 'PLAYER' ? 7 : -7);

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, input.serverX * 0.45, 0.09);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.6, 0.08);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, behindServerZ, 0.08);
  camera.lookAt(serviceTargetX * 0.45, 1.0, serviceTargetZ);
}

function updateRallyCamera(camera: Camera, input: RallyCameraInput) {
  const cameraSpeed = 0.1;
  const shakeRemaining = Math.max(0, input.cameraShakeUntil - input.now);
  const shake = shakeRemaining > 0 ? OVERHEAD_SMASH_CONFIG.cameraShakeIntensity * 2.5 * (shakeRemaining / OVERHEAD_SMASH_CONFIG.cameraShakeDuration) : 0;
  const targetCameraY = input.smashOpportunityActive ? 5.0 : 7;
  const targetCameraZ = input.playerZ + (input.smashOpportunityActive ? 5.5 : 8);

  camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCameraY + (input.random() - 0.5) * shake, 0.05);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCameraZ + (input.random() - 0.5) * shake, 0.05);

  const ballXTarget = THREE.MathUtils.clamp(input.ballX * 0.2, -2.0, 2.0);
  const playerXTarget = input.playerX * 0.3;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerXTarget + ballXTarget + (input.random() - 0.5) * shake, cameraSpeed);
  camera.lookAt(ballXTarget * 0.5, 0, -3);
}

export function updateArcadeCamera(camera: Camera, input: ArcadeCameraInput) {
  if (input.mode === 'serve') {
    updateServeCamera(camera, input);
    return;
  }

  updateRallyCamera(camera, input);
}
