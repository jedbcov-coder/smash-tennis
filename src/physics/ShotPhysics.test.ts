import * as THREE from 'three';
import { calculateLegalShot, type CourtSide, type ServeSide } from './ShotPhysics';

const normalDifficulty = {
  gameDifficultyMultiplier: 1,
  pointDifficultyMultiplier: 1,
};

function serveVelocity(fromX: number, fromZ: number, serveSide: ServeSide, toSide: CourtSide) {
  return calculateLegalShot(
    new THREE.Vector3(fromX, 2, fromZ),
    true,
    serveSide,
    normalDifficulty,
    toSide,
    'hard',
    { random: () => 0.5 }
  );
}

describe('ShotPhysics', () => {
  test('aims serves at the correct service-box side', () => {
    const playerDeuceServe = serveVelocity(2, 12, 'DEUCE', 'AI');
    const playerAdServe = serveVelocity(-2, 12, 'AD', 'AI');
    const aiDeuceServe = serveVelocity(-2, -12, 'DEUCE', 'PLAYER');
    const aiAdServe = serveVelocity(2, -12, 'AD', 'PLAYER');

    expect(playerDeuceServe.x).toBeLessThan(0);
    expect(playerAdServe.x).toBeGreaterThan(0);
    expect(aiDeuceServe.x).toBeGreaterThan(0);
    expect(aiAdServe.x).toBeLessThan(0);
  });

  test('sends returned shots to the opposite court', () => {
    const playerReturn = calculateLegalShot(
      new THREE.Vector3(0, 1, 10),
      false,
      'DEUCE',
      normalDifficulty,
      'AI',
      'hard',
      { random: () => 0.5 }
    );
    const aiReturn = calculateLegalShot(
      new THREE.Vector3(0, 1, -10),
      false,
      'DEUCE',
      normalDifficulty,
      'PLAYER',
      'hard',
      { random: () => 0.5 }
    );

    expect(playerReturn.z).toBeLessThan(0);
    expect(aiReturn.z).toBeGreaterThan(0);
  });

  test('changes output speed with the court surface multiplier', () => {
    const fromPos = new THREE.Vector3(0, 1, 10);
    const opts = { random: () => 0.5 };
    const clayShot = calculateLegalShot(fromPos, false, 'DEUCE', normalDifficulty, 'AI', 'clay', opts);
    const hardShot = calculateLegalShot(fromPos, false, 'DEUCE', normalDifficulty, 'AI', 'hard', opts);
    const iceShot = calculateLegalShot(fromPos, false, 'DEUCE', normalDifficulty, 'AI', 'ice', opts);

    expect(clayShot.length()).toBeLessThan(hardShot.length());
    expect(iceShot.length()).toBeGreaterThan(hardShot.length());
  });
});
