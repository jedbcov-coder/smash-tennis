import { getDiagonalServiceBoxTarget, isFirstBounceLegalInSingles, isWithinDiagonalServiceBox, isWithinSinglesBounds } from './courtGeometry';

describe('courtGeometry', () => {
  test('serve targets land inside their expected diagonal service boxes', () => {
    const combos = [
      { hitter: 'PLAYER' as const, serveSide: 'DEUCE' as const },
      { hitter: 'PLAYER' as const, serveSide: 'AD' as const },
      { hitter: 'AI' as const, serveSide: 'DEUCE' as const },
      { hitter: 'AI' as const, serveSide: 'AD' as const }
    ];

    for (const combo of combos) {
      const target = getDiagonalServiceBoxTarget(combo);
      expect(isWithinDiagonalServiceBox(target.targetX, target.targetZ, combo.hitter, combo.serveSide)).toBe(true);
    }
  });

  test('line-contact counts as in for court bounds and service boxes', () => {
    const playerDeuceTarget = getDiagonalServiceBoxTarget({ hitter: 'PLAYER', serveSide: 'DEUCE' });

    expect(isWithinSinglesBounds(0, 0)).toBe(true);
    expect(isWithinDiagonalServiceBox(0, playerDeuceTarget.minZ, 'PLAYER', 'DEUCE')).toBe(true);
    expect(isWithinDiagonalServiceBox(0, playerDeuceTarget.maxZ, 'PLAYER', 'DEUCE')).toBe(true);
  });

  test('rejects bounces outside the expected service box and singles bounds', () => {
    const playerDeuceTarget = getDiagonalServiceBoxTarget({ hitter: 'PLAYER', serveSide: 'DEUCE' });

    expect(isWithinDiagonalServiceBox(playerDeuceTarget.targetX, playerDeuceTarget.targetZ, 'PLAYER', 'AD')).toBe(false);
    expect(isWithinDiagonalServiceBox(playerDeuceTarget.targetX, playerDeuceTarget.minZ - 0.2, 'PLAYER', 'DEUCE')).toBe(false);
    expect(isWithinSinglesBounds(100, 0)).toBe(false);
  });

  test('enforces legal first-bounce side for singles rallies', () => {
    expect(isFirstBounceLegalInSingles(0, -0.5, 'AI')).toBe(true);
    expect(isFirstBounceLegalInSingles(0, 2, 'AI')).toBe(false);

    expect(isFirstBounceLegalInSingles(0, 0.5, 'PLAYER')).toBe(true);
    expect(isFirstBounceLegalInSingles(0, -2, 'PLAYER')).toBe(false);
  });
});
