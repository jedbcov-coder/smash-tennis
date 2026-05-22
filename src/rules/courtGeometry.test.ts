import { getDiagonalServiceBoxTarget, isWithinDiagonalServiceBox, isWithinSinglesBounds } from './courtGeometry';

describe('courtGeometry', () => {
  test('player deuce serve legal target', () => {
    const target = getDiagonalServiceBoxTarget({ hitter: 'PLAYER', serveSide: 'DEUCE' });
    expect(isWithinDiagonalServiceBox(target.targetX, target.targetZ, 'PLAYER', 'DEUCE')).toBe(true);
  });

  test('player ad serve legal target', () => {
    const target = getDiagonalServiceBoxTarget({ hitter: 'PLAYER', serveSide: 'AD' });
    expect(isWithinDiagonalServiceBox(target.targetX, target.targetZ, 'PLAYER', 'AD')).toBe(true);
  });

  test('AI deuce serve legal target', () => {
    const target = getDiagonalServiceBoxTarget({ hitter: 'AI', serveSide: 'DEUCE' });
    expect(isWithinDiagonalServiceBox(target.targetX, target.targetZ, 'AI', 'DEUCE')).toBe(true);
  });

  test('AI ad serve legal target', () => {
    const target = getDiagonalServiceBoxTarget({ hitter: 'AI', serveSide: 'AD' });
    expect(isWithinDiagonalServiceBox(target.targetX, target.targetZ, 'AI', 'AD')).toBe(true);
  });

  test('line-contact counts as in', () => {
    const playerDeuceTarget = getDiagonalServiceBoxTarget({ hitter: 'PLAYER', serveSide: 'DEUCE' });
    expect(isWithinSinglesBounds(0, 0)).toBe(true);
    expect(isWithinDiagonalServiceBox(0, playerDeuceTarget.maxZ, 'PLAYER', 'DEUCE')).toBe(true);
  });
});
