import * as THREE from 'three';
import { getReturnZoneCrossing } from './hitDetection';

describe('hitDetection return-zone crossing', () => {
  test('detects fast crossing into the player return window with interpolation', () => {
    const previousBallPos = new THREE.Vector3(0, 1.2, -2);
    const currentBallPos = new THREE.Vector3(4, 3.2, 14);

    const result = getReturnZoneCrossing({ previousBallPos, currentBallPos, minZ: 3, maxZ: 11 });

    expect(result.crossed).toBe(true);
    expect(result.crossingPos?.z).toBeCloseTo(3);
    expect(result.crossingPos?.x).toBeCloseTo(1.25);
    expect(result.crossingPos?.y).toBeCloseTo(1.825);
  });

  test('detects fast crossing into the AI return window from player shot', () => {
    const previousBallPos = new THREE.Vector3(-3, 2.4, 2);
    const currentBallPos = new THREE.Vector3(3, 1.4, -12);

    const result = getReturnZoneCrossing({ previousBallPos, currentBallPos, minZ: -9.5, maxZ: -8 });

    expect(result.crossed).toBe(true);
    expect(result.crossingPos?.z).toBeCloseTo(-8);
    expect(result.crossingPos?.x).toBeCloseTo(1.2857, 3);
  });

  test('does not trigger when the segment misses the return window', () => {
    const previousBallPos = new THREE.Vector3(0, 1, 12);
    const currentBallPos = new THREE.Vector3(2, 2, 15);

    const result = getReturnZoneCrossing({ previousBallPos, currentBallPos, minZ: 3, maxZ: 11 });

    expect(result.crossed).toBe(false);
    expect(result.crossingPos).toBe(undefined);
  });
});
