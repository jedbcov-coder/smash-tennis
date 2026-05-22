import {
  createInitialPointState,
  onBounce,
  onIllegalServeBounce,
  onLegalServeBounce,
  onRallyShot,
  onReceiverReturn,
  onServeHit
} from './pointState';

describe('pointState', () => {
  it('starts a point with clean default state values', () => {
    const state = createInitialPointState('PLAYER');

    expect(state.phase).toBe('awaitingServeHit');
    expect(state.server).toBe('PLAYER');
    expect(state.striker).toBe(null);
    expect(state.bounceCounts.PLAYER).toBe(0);
    expect(state.bounceCounts.AI).toBe(0);
    expect(state.winner).toBe(null);
  });

  it('moves from serve hit to awaitingServeBounce to awaitingReturn', () => {
    const serveHit = onServeHit(createInitialPointState('PLAYER'), 'PLAYER');
    const legalBounce = onLegalServeBounce(serveHit);

    expect(serveHit.phase).toBe('awaitingServeBounce');
    expect(serveHit.striker).toBe('PLAYER');
    expect(legalBounce.phase).toBe('awaitingReturn');
  });

  it('resets to serve state on illegal serve bounce', () => {
    const afterIllegal = onIllegalServeBounce(onServeHit(createInitialPointState('PLAYER'), 'PLAYER'));

    expect(afterIllegal.phase).toBe('awaitingServeHit');
    expect(afterIllegal.striker).toBe(null);
    expect(afterIllegal.bounceCounts.PLAYER).toBe(0);
    expect(afterIllegal.bounceCounts.AI).toBe(0);
  });

  it('enters rally after receiver returns and resets receiving-side bounce counts for each new shot', () => {
    const afterReturn = onReceiverReturn(onLegalServeBounce(onServeHit(createInitialPointState('PLAYER'), 'PLAYER')), 'AI');
    const afterRallyShot = onRallyShot(afterReturn, 'PLAYER');

    expect(afterReturn.phase).toBe('rally');
    expect(afterReturn.striker).toBe('AI');
    expect(afterReturn.bounceCounts.PLAYER).toBe(0);
    expect(afterReturn.bounceCounts.AI).toBe(0);

    expect(afterRallyShot.striker).toBe('PLAYER');
    expect(afterRallyShot.bounceCounts.PLAYER).toBe(0);
    expect(afterRallyShot.bounceCounts.AI).toBe(0);
  });

  it('awards point to hitter when receiver side gets a second bounce', () => {
    const rallyState = onRallyShot(createInitialPointState('PLAYER'), 'PLAYER');
    const oneBounce = onBounce(rallyState, 'AI');
    const twoBounces = onBounce(oneBounce, 'AI');

    expect(oneBounce.winner).toBe(null);
    expect(twoBounces.winner).toBe('PLAYER');
    expect(twoBounces.phase).toBe('pointOver');
  });
});
