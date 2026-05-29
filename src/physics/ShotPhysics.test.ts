import * as THREE from 'three';
import { calculateLegalShot, type CourtSide, type ServeSide } from './ShotPhysics';
import { predictNextGroundContact } from './BallSimulation';
import { isFirstBounceLegalInSingles, isWithinDiagonalServiceBox } from '../rules/courtGeometry';

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

    expect(playerDeuceServe.x).toBeGreaterThan(0);
    expect(playerAdServe.x).toBeLessThan(0);
    expect(aiDeuceServe.x).toBeLessThan(0);
    expect(aiAdServe.x).toBeGreaterThan(0);
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

  test('keeps perfect serves legal on deuce/ad and both hitters', () => {
    const cases = [
      { from: new THREE.Vector3(2, 2, 12), serveSide: 'DEUCE' as const, toSide: 'AI' as const, hitter: 'PLAYER' as const },
      { from: new THREE.Vector3(-2, 2, 12), serveSide: 'AD' as const, toSide: 'AI' as const, hitter: 'PLAYER' as const },
      { from: new THREE.Vector3(-2, 2, -12), serveSide: 'DEUCE' as const, toSide: 'PLAYER' as const, hitter: 'AI' as const }
    ];

    for (const shotCase of cases) {
      const shot = calculateLegalShot(shotCase.from, true, shotCase.serveSide, normalDifficulty, shotCase.toSide, 'hard', {
        quality: 'perfect',
        random: () => 0.98
      });
      const bounce = predictNextGroundContact(shotCase.from, shot);
      expect(bounce !== null).toBe(true);
      expect(isWithinDiagonalServiceBox(bounce!.position.x, bounce!.position.z, shotCase.hitter, shotCase.serveSide)).toBe(true);
    }
  });

  test('keeps perfect returns legal on all supported fast surfaces', () => {
    const surfaces = ['grass', 'hard', 'neon', 'ice'] as const;

    for (const surface of surfaces) {
      const playerReturn = calculateLegalShot(new THREE.Vector3(1.2, 1.2, 9.5), false, 'DEUCE', normalDifficulty, 'AI', surface, {
        quality: 'perfect',
        random: () => 0.99
      });
      const aiReturn = calculateLegalShot(new THREE.Vector3(-1.4, 1.2, -9.5), false, 'DEUCE', normalDifficulty, 'PLAYER', surface, {
        quality: 'perfect',
        random: () => 0.01
      });

      const playerBounce = predictNextGroundContact(new THREE.Vector3(1.2, 1.2, 9.5), playerReturn);
      const aiBounce = predictNextGroundContact(new THREE.Vector3(-1.4, 1.2, -9.5), aiReturn);

      expect(playerBounce !== null).toBe(true);
      expect(aiBounce !== null).toBe(true);
      expect(isFirstBounceLegalInSingles(playerBounce!.position.x, playerBounce!.position.z, 'AI')).toBe(true);
      expect(isFirstBounceLegalInSingles(aiBounce!.position.x, aiBounce!.position.z, 'PLAYER')).toBe(true);
    }
  });

  test('keeps power serves faster than perfect serves', () => {
    const from = new THREE.Vector3(2, 2, 12);
    const perfect = calculateLegalShot(from, true, 'DEUCE', normalDifficulty, 'AI', 'hard', { quality: 'perfect', random: () => 0.5 });
    const power = calculateLegalShot(from, true, 'DEUCE', normalDifficulty, 'AI', 'hard', { quality: 'good', shotType: 'flat', random: () => 0.5 });

    expect(power.length()).toBeGreaterThan(perfect.length());
  });

  test('early and late returns can still produce out first bounces', () => {
    const from = new THREE.Vector3(4.2, 1.1, 10.2);
    const early = calculateLegalShot(from, false, 'DEUCE', { gameDifficultyMultiplier: 1.2, pointDifficultyMultiplier: 1.35 }, 'AI', 'ice', {
      quality: 'early',
      random: () => 0
    });
    const late = calculateLegalShot(from, false, 'DEUCE', { gameDifficultyMultiplier: 1.2, pointDifficultyMultiplier: 1.35 }, 'AI', 'ice', {
      quality: 'late',
      random: () => 1
    });

    const earlyBounce = predictNextGroundContact(from, early);
    const lateBounce = predictNextGroundContact(from, late);

    expect(earlyBounce !== null).toBe(true);
    expect(lateBounce !== null).toBe(true);
    expect(
      !isFirstBounceLegalInSingles(earlyBounce!.position.x, earlyBounce!.position.z, 'AI') ||
      !isFirstBounceLegalInSingles(lateBounce!.position.x, lateBounce!.position.z, 'AI')
    ).toBe(true);
  });
});
