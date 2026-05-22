import { resolveServeFault } from './faultRules';

describe('resolveServeFault', () => {
  test('first serve fault adds first fault and does not award a point', () => {
    const result = resolveServeFault(0, 'PLAYER');

    expect(result.nextServerFaults).toBe(1);
    expect(result.pointWinner).toBe(null);
  });

  test('second serve fault awards receiver point (double fault)', () => {
    const result = resolveServeFault(1, 'PLAYER');

    expect(result.nextServerFaults).toBe(1);
    expect(result.pointWinner).toBe('AI');
  });
});
