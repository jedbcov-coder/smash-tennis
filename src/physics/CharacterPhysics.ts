import * as THREE from 'three';
import { PLAYER_MOVEMENT_LIMITS, OVERHEAD_SMASH_CONFIG } from '../gameplay/gameTuning';

export function calculatePlayerTarget(
  mouseX: number, 
  mouseY: number, 
  isServing: boolean, 
  serveSide: 'DEUCE' | 'AD'
): THREE.Vector3 {
  let targetX = mouseX * 12.0;
  let targetZ = 6.0 + -mouseY * 10.0;

  if (isServing) {
    targetZ = PLAYER_MOVEMENT_LIMITS.serveZ;
    targetX = serveSide === 'DEUCE' ? PLAYER_MOVEMENT_LIMITS.deuceServeX : PLAYER_MOVEMENT_LIMITS.adServeX;
  }

  return new THREE.Vector3(targetX, 0, targetZ);
}

export function clampPlayerPosition(pos: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    THREE.MathUtils.clamp(pos.x, PLAYER_MOVEMENT_LIMITS.minX, PLAYER_MOVEMENT_LIMITS.maxX),
    pos.y,
    THREE.MathUtils.clamp(pos.z, PLAYER_MOVEMENT_LIMITS.minZ, PLAYER_MOVEMENT_LIMITS.maxZ)
  );
}

export function calculateAssistedPosition(
  currentPos: THREE.Vector3,
  smashTargetX: number,
  smashTargetZ: number
): THREE.Vector3 {
  const assistedX = THREE.MathUtils.clamp(
    smashTargetX,
    PLAYER_MOVEMENT_LIMITS.smashAssistMinX,
    PLAYER_MOVEMENT_LIMITS.smashAssistMaxX
  );
  const assistedZ = THREE.MathUtils.clamp(
    smashTargetZ + 0.25,
    PLAYER_MOVEMENT_LIMITS.minZ,
    OVERHEAD_SMASH_CONFIG.netDistanceThreshold
  );

  const nextAssistX = THREE.MathUtils.lerp(currentPos.x, assistedX, OVERHEAD_SMASH_CONFIG.assistedPositionStrength);
  const nextAssistZ = THREE.MathUtils.lerp(currentPos.z, assistedZ, OVERHEAD_SMASH_CONFIG.assistedPositionStrength);

  return new THREE.Vector3(
    currentPos.x + THREE.MathUtils.clamp(nextAssistX - currentPos.x, -OVERHEAD_SMASH_CONFIG.assistedMaxStep, OVERHEAD_SMASH_CONFIG.assistedMaxStep),
    currentPos.y,
    currentPos.z + THREE.MathUtils.clamp(nextAssistZ - currentPos.z, -OVERHEAD_SMASH_CONFIG.assistedMaxStep, OVERHEAD_SMASH_CONFIG.assistedMaxStep)
  );
}
