import * as THREE from 'three';
import { calculateLegalShot, type CourtSide, type ServeSide } from './ShotPhysics';

const normalDifficulty = {
  gameDifficultyMultiplier: 1,
  pointDifficultyMultiplier: 1,
};

function withMockedRandom(value: number, callback: () => void) {
  const originalRandom = Math.random;
  Math.random = () => value;

  try {
    callback();
  } finally {
    Math.random = originalRandom;
  }
}

function serveVelocity(fromX: number, fromZ: number, serveSide: ServeSide, toSide: CourtSide) {
  return calculateLegalShot(
    new THREE.Vector3(fromX, 2, fromZ),
    true,
    serveSide,
    normalDifficulty,
    toSide,
    'hard'
  );
}

describe('ShotPhysics', () => {
  test('aims serves at the correct service-box side', () => {
    withMockedRandom(0.5, () => {
      const playerDeuceServe = serveVelocity(2, 12, 'DEUCE', 'AI');
      const playerAdServe = serveVelocity(-2, 12, 'AD', 'AI');
      const aiDeuceServe = serveVelocity(-2, -12, 'DEUCE', 'PLAYER');
      const aiAdServe = serveVelocity(2, -12, 'AD', 'PLAYER');

      expect(playerDeuceServe.x).toBeLessThan(0);
      expect(playerAdServe.x).toBeGreaterThan(0);
      expect(aiDeuceServe.x).toBeGreaterThan(0);
      expect(aiAdServe.x).toBeLessThan(0);
    });
  });

  test('sends returned shots to the opposite court', () => {
    withMockedRandom(0.5, () => {
      const playerReturn = calculateLegalShot(
        new THREE.Vector3(0, 1, 10),
        false,
        'DEUCE',
        normalDifficulty,
        'AI',
        'hard'
      );
      const aiReturn = calculateLegalShot(
        new THREE.Vector3(0, 1, -10),
        false,
        'DEUCE',
        normalDifficulty,
        'PLAYER',
        'hard'
      );

      expect(playerReturn.z).toBeLessThan(0);
      expect(aiReturn.z).toBeGreaterThan(0);
    });
  });

  test('changes output speed with the court surface multiplier', () => {
    withMockedRandom(0.5, () => {
      const fromPos = new THREE.Vector3(0, 1, 10);
      const clayShot = calculateLegalShot(fromPos, false, 'DEUCE', normalDifficulty, 'AI', 'clay');
      const hardShot = calculateLegalShot(fromPos, false, 'DEUCE', normalDifficulty, 'AI', 'hard');
      const iceShot = calculateLegalShot(fromPos, false, 'DEUCE', normalDifficulty, 'AI', 'ice');

      expect(clayShot.length()).toBeLessThan(hardShot.length());
      expect(iceShot.length()).toBeGreaterThan(hardShot.length());
    });
  });
});
