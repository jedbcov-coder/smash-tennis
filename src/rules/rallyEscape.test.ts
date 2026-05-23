import { Vector3 } from 'three';
import { getEscapePointWinner, type LiveRallyShot } from './rallyEscape';

const legalShot = (overrides: Partial<LiveRallyShot> = {}): LiveRallyShot => ({
  hitter: 'PLAYER',
  receiver: 'AI',
  firstBounceResolved: true,
  firstBounceLegal: true,
  ...overrides
});

describe('getEscapePointWinner', () => {
  it('awards PLAYER after legal first bounce on AI side then crossing AI back boundary', () => {
    const winner = getEscapePointWinner(legalShot(), new Vector3(0, 0.2, -16));
    expect(winner).toBe('PLAYER');
  });

  it('awards AI after legal first bounce on PLAYER side then crossing PLAYER back boundary', () => {
    const winner = getEscapePointWinner(legalShot({ hitter: 'AI', receiver: 'PLAYER' }), new Vector3(0, 0.2, 16));
    expect(winner).toBe('AI');
  });

  it('does not award hitter when first bounce was illegal', () => {
    const winner = getEscapePointWinner(legalShot({ firstBounceLegal: false }), new Vector3(0, 0.2, -16));
    expect(winner).toBe(null);
  });

  it('keeps second-bounce flow available when still in play', () => {
    const winner = getEscapePointWinner(legalShot(), new Vector3(0, 0.2, -10));
    expect(winner).toBe(null);
  });

  it('awards hitter on generous world escape fallback after legal first bounce', () => {
    const winner = getEscapePointWinner(legalShot(), new Vector3(31, 0.2, -8));
    expect(winner).toBe('PLAYER');
  });
});
