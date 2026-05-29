import { createInitialBounceState, getDoubleBouncePointWinner, recordBounce } from './bounceRules';

describe('bounceRules double-bounce scoring', () => {
  test('awards point to player when AI side bounces twice', () => {
    let bounceState = createInitialBounceState();
    bounceState = recordBounce(bounceState, 'AI');
    bounceState = recordBounce(bounceState, 'AI');

    const winner = getDoubleBouncePointWinner('PLAYER', 'AI', bounceState.aiSideBounces);
    expect(winner).toBe('PLAYER');
  });

  test('awards point to AI when player side bounces twice', () => {
    let bounceState = createInitialBounceState();
    bounceState = recordBounce(bounceState, 'PLAYER');
    bounceState = recordBounce(bounceState, 'PLAYER');

    const winner = getDoubleBouncePointWinner('AI', 'PLAYER', bounceState.playerSideBounces);
    expect(winner).toBe('AI');
  });
});
