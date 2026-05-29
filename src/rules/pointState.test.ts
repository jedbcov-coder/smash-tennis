import {
  createInitialPointState,
  onBounce,
  onIllegalServeBounce,
  onLegalServeBounce,
  onRallyShot,
  onReceiverReturn,
  onServeHit
} from './pointState';
import { decideFirstBounceOutcome } from './tennisRules';

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

  it('rally first bounce out awards opponent', () => {
    const decision = decideFirstBounceOutcome({
      hitter: 'PLAYER',
      isServe: false,
      landedInBounds: false,
      serveTouchedNet: false
    });

    expect(decision).toEqual({ type: 'point', winner: 'AI' });
  });

  it('rally first bounce in then second bounce in awards hitter', () => {
    const rallyState = onRallyShot(createInitialPointState('PLAYER'), 'PLAYER');
    const firstBounce = onBounce(rallyState, 'AI');
    const secondBounce = onBounce(firstBounce, 'AI');

    expect(firstBounce.winner).toBe(null);
    expect(secondBounce.winner).toBe('PLAYER');
    expect(secondBounce.phase).toBe('pointOver');
  });

  it('rally first bounce in then second bounce out still awards hitter', () => {
    const rallyState = onRallyShot(createInitialPointState('AI'), 'AI');
    const firstBounce = onBounce(rallyState, 'PLAYER');
    const secondBounce = onBounce(firstBounce, 'PLAYER');

    expect(firstBounce.winner).toBe(null);
    expect(secondBounce.winner).toBe('AI');
    expect(secondBounce.phase).toBe('pointOver');
  });

  it('serve first bounce out follows fault flow', () => {
    const decision = decideFirstBounceOutcome({
      hitter: 'PLAYER',
      isServe: true,
      landedInBounds: false,
      serveTouchedNet: false
    });

    const afterServeHit = onServeHit(createInitialPointState('PLAYER'), 'PLAYER');
    const afterIllegal = onIllegalServeBounce(afterServeHit);

    expect(decision).toEqual({ type: 'fault' });
    expect(afterIllegal.phase).toBe('awaitingServeHit');
    expect(afterIllegal.striker).toBe(null);
  });
});
