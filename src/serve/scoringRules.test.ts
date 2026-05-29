import { getInitialGameState, updateScoreOnPoint, type GameStatus } from './scoringRules';
import type { PlayerType } from '../types';

function winPoints(status: GameStatus, winner: PlayerType, points: number) {
  let nextStatus = status;

  for (let point = 0; point < points; point += 1) {
    nextStatus = updateScoreOnPoint(nextStatus, winner);
  }

  return nextStatus;
}

describe('scoringRules', () => {
  test('moves through normal point progression', () => {
    let status = getInitialGameState();

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.score.playerScore).toBe(1);
    expect(status.serveSide).toBe('AD');

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.score.playerScore).toBe(2);
    expect(status.serveSide).toBe('DEUCE');

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.score.playerScore).toBe(3);
    expect(status.serveSide).toBe('AD');
  });

  test('keeps the game at deuce when both players reach 40', () => {
    let status = getInitialGameState();
    status = winPoints(status, 'PLAYER', 3);
    status = winPoints(status, 'AI', 3);

    expect(status.score.playerScore).toBe(3);
    expect(status.score.aiScore).toBe(3);
    expect(status.score.playerGames).toBe(0);
    expect(status.score.aiGames).toBe(0);
  });

  test('moves from deuce to advantage and back to deuce', () => {
    let status = getInitialGameState();
    status = winPoints(status, 'PLAYER', 3);
    status = winPoints(status, 'AI', 3);

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.score.playerScore).toBe(4);
    expect(status.score.aiScore).toBe(3);

    status = updateScoreOnPoint(status, 'AI');
    expect(status.score.playerScore).toBe(3);
    expect(status.score.aiScore).toBe(3);
  });

  test('awards a game win and switches server', () => {
    let status = getInitialGameState();
    status = winPoints(status, 'PLAYER', 4);

    expect(status.score.playerGames).toBe(1);
    expect(status.score.playerScore).toBe(0);
    expect(status.score.aiScore).toBe(0);
    expect(status.servingPlayer).toBe('AI');
    expect(status.serveSide).toBe('DEUCE');
  });

  test('awards a set and match win', () => {
    let status = getInitialGameState();
    status.score.playerGames = 5;

    status = winPoints(status, 'PLAYER', 4);

    expect(status.score.playerSets).toBe(1);
    expect(status.score.playerGames).toBe(0);
    expect(status.score.aiGames).toBe(0);
    expect(status.winner).toBe('PLAYER');
  });

  test('starts and resolves a tiebreak at 6 games all', () => {
    let status = getInitialGameState();
    status.score.playerGames = 5;
    status.score.aiGames = 6;

    status = winPoints(status, 'PLAYER', 4);
    expect(status.isTiebreak).toBe(true);
    expect(status.score.playerGames).toBe(6);
    expect(status.score.aiGames).toBe(6);

    status = winPoints(status, 'PLAYER', 7);
    expect(status.score.playerSets).toBe(1);
    expect(status.isTiebreak).toBe(false);
    expect(status.winner).toBe('PLAYER');
  });

  test('switches server after normal games and during tiebreak points', () => {
    let status = getInitialGameState();
    status = winPoints(status, 'PLAYER', 4);
    expect(status.servingPlayer).toBe('AI');

    status.score.playerGames = 5;
    status.score.aiGames = 6;
    status = winPoints(status, 'PLAYER', 4);
    expect(status.isTiebreak).toBe(true);
    expect(status.servingPlayer).toBe('PLAYER');

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.servingPlayer).toBe('AI');
    expect(status.serveSide).toBe('AD');

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.servingPlayer).toBe('AI');
    expect(status.serveSide).toBe('DEUCE');

    status = updateScoreOnPoint(status, 'PLAYER');
    expect(status.servingPlayer).toBe('PLAYER');
    expect(status.serveSide).toBe('AD');
  });
});
