import { decideFirstBounceOutcome } from './tennisRules';

describe('decideFirstBounceOutcome', () => {
  test('serve let returns let and does not become a fault', () => {
    const result = decideFirstBounceOutcome({
      hitter: 'PLAYER',
      isServe: true,
      landedInBounds: true,
      serveTouchedNet: true
    });

    expect(result.type).toBe('let');
  });

  test('illegal serve bounce returns fault', () => {
    const result = decideFirstBounceOutcome({
      hitter: 'PLAYER',
      isServe: true,
      landedInBounds: false,
      serveTouchedNet: false
    });

    expect(result.type).toBe('fault');
  });
});
