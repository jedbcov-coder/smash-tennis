import { decideFirstBounceOutcome } from './tennisRules';
import { formatTennisScore, getInitialGameState, type GameStatus, updateScoreOnPoint } from '../serve/scoringRules';
import type { PlayerType } from '../types';

function winPoints(status: GameStatus, winner: PlayerType, points: number) {
  let nextStatus = status;

  for (let point = 0; point < points; point += 1) {
    nextStatus = updateScoreOnPoint(nextStatus, winner);
  }

  return nextStatus;
}

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

describe('tennis scoring rules', () => {
  test('progresses through 0, 15, 30, and 40', () => {
    let status = getInitialGameState();

    expect(formatTennisScore(status.score.playerScore, status.isTiebreak)).toBe('0');

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(formatTennisScore(status.score.playerScore, status.isTiebreak)).toBe('15');

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(formatTennisScore(status.score.playerScore, status.isTiebreak)).toBe('30');

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(formatTennisScore(status.score.playerScore, status.isTiebreak)).toBe('40');
  });

  test('handles deuce, advantage, and game win', () => {
    let status = getInitialGameState();
    status = winPoints(status, 'PLAYER', 3);
    status = winPoints(status, 'AI', 3);

    expect(status.score.playerScore).toBe(3);
    expect(status.score.aiScore).toBe(3);

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.score.playerScore).toBe(4);
    expect(status.score.aiScore).toBe(3);

    status = updateScoreOnPoint(status, 'AI');
    expect(status.score.playerScore).toBe(3);
    expect(status.score.aiScore).toBe(3);

    status = updateScoreOnPoint(status, 'PLAYER');
    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.score.playerGames).toBe(1);
  });

  test('awards set win and match winner in one-set format', () => {
    let status = getInitialGameState();
    status.score.playerGames = 5;

    status = winPoints(status, 'PLAYER', 4);

    expect(status.score.playerSets).toBe(1);
    expect(status.winner).toBe('PLAYER');
    expect(status.score.playerGames).toBe(0);
    expect(status.score.aiGames).toBe(0);
  });

  test('enters tiebreak at 6-6 and requires win by two', () => {
    let status = getInitialGameState();
    status.score.playerGames = 5;
    status.score.aiGames = 6;

    status = winPoints(status, 'PLAYER', 4);
    expect(status.score.playerGames).toBe(6);
    expect(status.score.aiGames).toBe(6);
    expect(status.isTiebreak).toBe(true);

    status = winPoints(status, 'PLAYER', 6);
    status = winPoints(status, 'AI', 6);
    expect(status.score.playerScore).toBe(6);
    expect(status.score.aiScore).toBe(6);
    expect(status.winner).toBe(null);

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.winner).toBe(null);
    status = updateScoreOnPoint(status, 'PLAYER');

    expect(status.winner).toBe('PLAYER');
    expect(status.isTiebreak).toBe(false);
  });

  test('rotates server and serve side correctly in regular and tiebreak points', () => {
    let status = getInitialGameState();
    expect(status.servingPlayer).toBe('PLAYER');
    expect(status.serveSide).toBe('DEUCE');

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.serveSide).toBe('AD');

    status = updateScoreOnPoint(status, 'AI');
    expect(status.serveSide).toBe('DEUCE');

    status = winPoints(status, 'PLAYER', 3);
    expect(status.score.playerGames).toBe(1);
    expect(status.servingPlayer).toBe('AI');
    expect(status.serveSide).toBe('DEUCE');

    status.score.playerGames = 5;
    status.score.aiGames = 6;
    status = winPoints(status, 'PLAYER', 4);
    expect(status.isTiebreak).toBe(true);

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.servingPlayer).toBe('AI');
    expect(status.serveSide).toBe('AD');

    status = updateScoreOnPoint(status, 'AI');
    expect(status.servingPlayer).toBe('AI');
    expect(status.serveSide).toBe('DEUCE');

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.servingPlayer).toBe('PLAYER');
    expect(status.serveSide).toBe('AD');
  });
});
