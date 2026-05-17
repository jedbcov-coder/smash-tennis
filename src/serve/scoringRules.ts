import { PlayerType, Score } from '../types';

export type ServeSide = 'DEUCE' | 'AD';

export interface GameStatus {
  score: Score;
  isTiebreak: boolean;
  servingPlayer: PlayerType;
  serveSide: ServeSide;
  winner: PlayerType | null;
  serverFaults: number; // 0, 1, or 2
}

export const INITIAL_SCORE: Score = {
  playerScore: 0,
  aiScore: 0,
  playerGames: 0,
  aiGames: 0,
  playerSets: 0,
  aiSets: 0,
};

export function getInitialGameState(): GameStatus {
  return {
    score: { ...INITIAL_SCORE },
    isTiebreak: false,
    servingPlayer: 'PLAYER',
    serveSide: 'DEUCE',
    winner: null,
    serverFaults: 0,
  };
}

export function updateScoreOnPoint(
  status: GameStatus,
  pointWinner: PlayerType
): GameStatus {
  if (status.winner) return status;

  const nextStatus = { ...status, score: { ...status.score } };
  const score = nextStatus.score;
  const pointLoser = pointWinner === 'PLAYER' ? 'AI' : 'PLAYER';

  const winnerScoreField = pointWinner === 'PLAYER' ? 'playerScore' : 'aiScore';
  const loserScoreField = pointLoser === 'PLAYER' ? 'playerScore' : 'aiScore';

  if (nextStatus.isTiebreak) {
    score[winnerScoreField] += 1;
    if (score[winnerScoreField] >= 7 && score[winnerScoreField] - score[loserScoreField] >= 2) {
      // Won Tiebreak -> Won Game -> Won Set
      winGame(nextStatus, pointWinner);
    } else {
      // Advance serve if total points is odd
      const totalPoints = score.playerScore + score.aiScore;
      if (totalPoints % 2 === 1) {
        nextStatus.servingPlayer = nextStatus.servingPlayer === 'PLAYER' ? 'AI' : 'PLAYER';
      }
      // Serve side switches every point in tiebreak (Deuce, Ad, Ad, Deuce, Deuce...)
      // The sides in tiebreak: 0: Deuce, 1: Ad, 2: Deuce, 3: Ad... based on total points
      nextStatus.serveSide = totalPoints % 2 === 0 ? 'DEUCE' : 'AD';
    }
  } else {
    // Normal scoring
    if (score[winnerScoreField] === 3 && score[loserScoreField] === 4) {
      // Loser had AD, goes back to Deuce
      score[loserScoreField] = 3;
    } else if (score[winnerScoreField] === 3 && score[loserScoreField] === 3) {
      // Deuce, winner gets AD
      score[winnerScoreField] = 4;
    } else if (score[winnerScoreField] === 4 || (score[winnerScoreField] === 3 && score[loserScoreField] < 3)) {
      // Won Game
      winGame(nextStatus, pointWinner);
    } else {
      score[winnerScoreField] += 1;
      const totalPoints = score.playerScore + score.aiScore;
      nextStatus.serveSide = totalPoints % 2 === 0 ? 'DEUCE' : 'AD';
    }
  }

  // Reset faults on new point
  nextStatus.serverFaults = 0;
  return nextStatus;
}

function winGame(status: GameStatus, pointWinner: PlayerType) {
  const score = status.score;
  const winnerGamesField = pointWinner === 'PLAYER' ? 'playerGames' : 'aiGames';
  const loserGamesField = pointWinner === 'PLAYER' ? 'aiGames' : 'playerGames';

  score[winnerGamesField] += 1;
  score.playerScore = 0;
  score.aiScore = 0;

  if (score[winnerGamesField] >= 6 && score[winnerGamesField] - score[loserGamesField] >= 2) {
    winSet(status, pointWinner);
  } else if (score[winnerGamesField] === 6 && score[loserGamesField] === 6) {
    status.isTiebreak = true;
    switchServer(status);
  } else if (score[winnerGamesField] === 7 && score[loserGamesField] === 6) {
    // Won a tiebreak
    winSet(status, pointWinner);
  } else {
    switchServer(status);
  }
}

function switchServer(status: GameStatus) {
  status.servingPlayer = status.servingPlayer === 'PLAYER' ? 'AI' : 'PLAYER';
  status.serveSide = 'DEUCE';
}

function winSet(status: GameStatus, pointWinner: PlayerType) {
  const score = status.score;
  const winnerSetsField = pointWinner === 'PLAYER' ? 'playerSets' : 'aiSets';
  score[winnerSetsField] += 1;
  score.playerGames = 0;
  score.aiGames = 0;
  status.isTiebreak = false;

  // Let's make it a 1 set match for now
  if (score[winnerSetsField] >= 1) {
    status.winner = pointWinner;
  } else {
    switchServer(status);
  }
}

export function formatTennisScore(scoreValue: number, isTiebreak: boolean): string {
  if (isTiebreak) return scoreValue.toString();
  const TENNIS_SCORES = ['0', '15', '30', '40', 'AD'];
  return TENNIS_SCORES[scoreValue] || '0';
}
