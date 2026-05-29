import * as THREE from 'three';

interface CrossingInput {
  previousBallPos: THREE.Vector3;
  currentBallPos: THREE.Vector3;
  minZ: number;
  maxZ: number;
}

interface CrossingResult {
  crossed: boolean;
  crossingPos?: THREE.Vector3;
}

function getCrossingT(previousZ: number, currentZ: number, targetZ: number): number | null {
  const zDelta = currentZ - previousZ;
  if (Math.abs(zDelta) < 1e-6) return null;

  const t = (targetZ - previousZ) / zDelta;
  if (t < 0 || t > 1) return null;
  return t;
}

export function getReturnZoneCrossing(input: CrossingInput): CrossingResult {
  const { previousBallPos, currentBallPos, minZ, maxZ } = input;
  const previousInside = previousBallPos.z >= minZ && previousBallPos.z <= maxZ;
  const currentInside = currentBallPos.z >= minZ && currentBallPos.z <= maxZ;

  if (currentInside) {
    return { crossed: true, crossingPos: currentBallPos.clone() };
  }

  if (previousInside) {
    return { crossed: true, crossingPos: previousBallPos.clone() };
  }

  const zDelta = currentBallPos.z - previousBallPos.z;
  if (Math.abs(zDelta) < 1e-6) {
    return { crossed: false };
  }

  const nearBoundary = zDelta > 0 ? minZ : maxZ;
  const farBoundary = zDelta > 0 ? maxZ : minZ;

  const nearT = getCrossingT(previousBallPos.z, currentBallPos.z, nearBoundary);
  const farT = getCrossingT(previousBallPos.z, currentBallPos.z, farBoundary);

  if (nearT === null && farT === null) {
    return { crossed: false };
  }

  const t = nearT !== null ? nearT : farT;
  if (t === null) {
    return { crossed: false };
  }

  return {
    crossed: true,
    crossingPos: previousBallPos.clone().lerp(currentBallPos, t)
  };
}
