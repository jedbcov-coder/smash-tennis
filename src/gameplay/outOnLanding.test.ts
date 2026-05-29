import { handleOutOnLanding } from './outOnLanding';
import type { PlayerType } from '../types';

function createServeCallbacks(hitter: PlayerType, initialServerFaults = 0) {
  const points = { PLAYER: 0, AI: 0 };
  let serverFaults = initialServerFaults;

  const onFault = () => {
    if (serverFaults === 0) {
      serverFaults = 1;
      return;
    }

    const winner = hitter === 'PLAYER' ? 'AI' : 'PLAYER';
    points[winner] += 1;
  };

  return {
    points,
    onFault,
    getServerFaults: () => serverFaults
  };
}

describe('handleOutOnLanding', () => {
  test('first-serve out does not change score', () => {
    const scenario = createServeCallbacks('PLAYER', 0);

    handleOutOnLanding({
      hitter: 'PLAYER',
      pendingBounceIsServe: true,
      onFault: scenario.onFault,
      awardPoint: (winner) => {
        scenario.points[winner] += 1;
      }
    });

    expect(scenario.points.PLAYER).toBe(0);
    expect(scenario.points.AI).toBe(0);
  });

  test('first-serve out sets serverFaults = 1', () => {
    const scenario = createServeCallbacks('PLAYER', 0);

    handleOutOnLanding({
      hitter: 'PLAYER',
      pendingBounceIsServe: true,
      onFault: scenario.onFault,
      awardPoint: () => {}
    });

    expect(scenario.getServerFaults()).toBe(1);
  });

  test('second-serve out gives receiver the point', () => {
    const scenario = createServeCallbacks('PLAYER', 1);

    handleOutOnLanding({
      hitter: 'PLAYER',
      pendingBounceIsServe: true,
      onFault: scenario.onFault,
      awardPoint: (winner) => {
        scenario.points[winner] += 1;
      }
    });

    expect(scenario.points.AI).toBe(1);
    expect(scenario.points.PLAYER).toBe(0);
  });

  test('rally out still gives opponent the point', () => {
    const scenario = createServeCallbacks('PLAYER', 0);

    handleOutOnLanding({
      hitter: 'PLAYER',
      pendingBounceIsServe: false,
      onFault: scenario.onFault,
      awardPoint: (winner) => {
        scenario.points[winner] += 1;
      }
    });

    expect(scenario.points.AI).toBe(1);
    expect(scenario.points.PLAYER).toBe(0);
    expect(scenario.getServerFaults()).toBe(0);
  });
});
