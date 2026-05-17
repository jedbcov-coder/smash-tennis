import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { presentationDirector } from '../presentation/presentationDirector';
import { GameState, type PlayerType } from '../types';
import {
  loadPlayerProgress,
  recordMatchProgress,
  recordPointProgress,
  type PlayerProgress
} from '../progression/playerProgress';
import {
  getInitialGameState,
  updateScoreOnPoint,
  type GameStatus
} from './scoringRules';

const INTRO_DURATION_MS = 3200;
const SERVE_COUNTDOWN_MS = 1600;
const POINT_RESULT_PAUSE_MS = 2200;

export interface PointRewardInput {
  rallyCount: number;
  comboCount: number;
  energyPercent: number;
  serveSpeedMph: number;
}

export interface PointReward {
  winner: PlayerType;
  rallyLength: number;
  styleBonus: string;
  comboBonus: number;
  comboCount: number;
  xpGained: number;
}

export interface MatchStats {
  playerPointsWon: number;
  aiPointsWon: number;
  longestRally: number;
  bestCombo: number;
  totalXp: number;
}

const createInitialMatchStats = (): MatchStats => ({
  playerPointsWon: 0,
  aiPointsWon: 0,
  longestRally: 0,
  bestCombo: 0,
  totalXp: 0
});


function isPlayerOnePointFromWinningGame(status: GameStatus, player: PlayerType): boolean {
  const playerScore = player === 'PLAYER' ? status.score.playerScore : status.score.aiScore;
  const opponentScore = player === 'PLAYER' ? status.score.aiScore : status.score.playerScore;

  if (status.isTiebreak) {
    return playerScore >= 6 && playerScore >= opponentScore + 1;
  }

  return playerScore === 4 || (playerScore === 3 && opponentScore < 3);
}

function isMatchPoint(status: GameStatus): boolean {
  const playerHasSetChance = status.score.playerGames >= 5 && status.score.playerGames >= status.score.aiGames + 1;
  const aiHasSetChance = status.score.aiGames >= 5 && status.score.aiGames >= status.score.playerGames + 1;

  return (
    (playerHasSetChance && isPlayerOnePointFromWinningGame(status, 'PLAYER')) ||
    (aiHasSetChance && isPlayerOnePointFromWinningGame(status, 'AI'))
  );
}

function getReceiver(server: PlayerType): PlayerType {
  return server === 'PLAYER' ? 'AI' : 'PLAYER';
}

function getTotalGames(status: GameStatus): number {
  return status.score.playerGames + status.score.aiGames + status.score.playerSets + status.score.aiSets;
}

function getDifficultyStats(status: GameStatus) {
  const totalGames = getTotalGames(status);
  const gameDifficultyMultiplier = Math.min(1.35, 1 + totalGames * 0.06);
  const pointDifficultyMultiplier = Math.min(1.5, 1 + (status.score.playerScore + status.score.aiScore) * 0.05);

  return {
    gameDifficultyMultiplier,
    pointDifficultyMultiplier,
    racketAccuracyRadius: Math.max(0.75, 1.1 - totalGames * 0.04)
  };
}

function calculatePointReward(winner: PlayerType, input?: PointRewardInput): PointReward {
  const rallyLength = input?.rallyCount ?? 0;
  const comboCount = input?.comboCount ?? 0;
  const energyPercent = input?.energyPercent ?? 0;
  const serveSpeedMph = input?.serveSpeedMph ?? 0;

  let styleBonus = 'Clean Point';
  if (serveSpeedMph >= 100) styleBonus = 'Rocket Serve';
  if (rallyLength >= 8) styleBonus = 'Rally Hero';
  if (comboCount >= 4) styleBonus = 'Combo Artist';
  if (energyPercent >= 100) styleBonus = 'Power Finish';
  if (winner === 'AI') styleBonus = rallyLength >= 6 ? 'Brave Defense' : 'Reset and Rally';

  const comboBonus = Math.max(0, comboCount - 1) * 5;
  const rallyBonus = Math.min(30, rallyLength * 3);
  const winnerBonus = winner === 'PLAYER' ? 25 : 10;
  const styleXp = styleBonus === 'Clean Point' || styleBonus === 'Reset and Rally' ? 0 : 15;

  return {
    winner,
    rallyLength,
    styleBonus,
    comboBonus,
    comboCount,
    xpGained: winnerBonus + rallyBonus + comboBonus + styleXp
  };
}

export function useTennisGame() {
  const [status, setStatus] = useState<GameStatus>(() => getInitialGameState());
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [lastPointWinner, setLastPointWinner] = useState<PlayerType | null>(null);
  const [pointReward, setPointReward] = useState<PointReward | null>(null);
  const [matchStats, setMatchStats] = useState<MatchStats>(() => createInitialMatchStats());
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(() => loadPlayerProgress());
  const introTimerRef = useRef<number | null>(null);
  const serveCountdownTimerRef = useRef<number | null>(null);
  const nextPointTimerRef = useRef<number | null>(null);
  const matchPointSoundKeyRef = useRef<string | null>(null);

  const clearTimer = useCallback((timerRef: React.MutableRefObject<number | null>) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    clearTimer(introTimerRef);
    clearTimer(serveCountdownTimerRef);
    clearTimer(nextPointTimerRef);
  }, [clearTimer]);

  const queueServeCountdown = useCallback(() => {
    clearTimer(serveCountdownTimerRef);
    beginServeCountdown(setGameState);
    serveCountdownTimerRef.current = window.setTimeout(() => {
      serveCountdownTimerRef.current = null;
      beginServing(setGameState);
    }, SERVE_COUNTDOWN_MS);
  }, [clearTimer]);

  const queueNextPoint = useCallback((nextStatus: GameStatus) => {
    clearTimer(nextPointTimerRef);
    finishPoint(setGameState);

    nextPointTimerRef.current = window.setTimeout(() => {
      nextPointTimerRef.current = null;
      if (nextStatus.winner) {
        finishMatch(setGameState);
      } else {
        queueServeCountdown();
      }
    }, POINT_RESULT_PAUSE_MS);
  }, [clearTimer, queueServeCountdown]);

  const startGame = useCallback(() => {
    clearTimers();
    setStatus(getInitialGameState());
    matchPointSoundKeyRef.current = null;
    setLastPointWinner(null);
    setPointReward(null);
    setMatchStats(createInitialMatchStats());
    setGameState(GameState.INTRO);
    presentationDirector.presentMoment('match.intro');

    introTimerRef.current = window.setTimeout(() => {
      introTimerRef.current = null;
      queueServeCountdown();
    }, INTRO_DURATION_MS);
  }, [clearTimers, queueServeCountdown]);

  const recordPointPresentation = useCallback((winner: PlayerType, rewardInput?: PointRewardInput) => {
    const reward = calculatePointReward(winner, rewardInput);
    setPointReward(reward);
    setMatchStats((current) => ({
      playerPointsWon: current.playerPointsWon + (winner === 'PLAYER' ? 1 : 0),
      aiPointsWon: current.aiPointsWon + (winner === 'AI' ? 1 : 0),
      longestRally: Math.max(current.longestRally, reward.rallyLength),
      bestCombo: Math.max(current.bestCombo, rewardInput?.comboCount ?? 0),
      totalXp: current.totalXp + reward.xpGained
    }));
    setPlayerProgress((current) => recordPointProgress(current, reward));
    return reward;
  }, []);

  const addPoint = useCallback((winner: PlayerType, rewardInput?: PointRewardInput) => {
    setLastPointWinner(winner);
    recordPointPresentation(winner, rewardInput);
    setStatus((currentStatus) => {
      const nextStatus = updateScoreOnPoint(currentStatus, winner);
      const matchWinner = nextStatus.winner;
      if (matchWinner) {
        setPlayerProgress((current) => recordMatchProgress(current, matchWinner));
      }
      queueNextPoint(nextStatus);
      return nextStatus;
    });
  }, [queueNextPoint, recordPointPresentation]);

  const addFault = useCallback(() => {
    setStatus((currentStatus) => {
      if (currentStatus.serverFaults === 0) {
        return { ...currentStatus, serverFaults: 1 };
      }

      const pointWinner = getReceiver(currentStatus.servingPlayer);
      setLastPointWinner(pointWinner);
      recordPointPresentation(pointWinner, {
        rallyCount: 0,
        comboCount: 0,
        energyPercent: 0,
        serveSpeedMph: 0
      });
      const nextStatus = updateScoreOnPoint(currentStatus, pointWinner);
      const matchWinner = nextStatus.winner;
      if (matchWinner) {
        setPlayerProgress((current) => recordMatchProgress(current, matchWinner));
      }
      queueNextPoint(nextStatus);
      return nextStatus;
    });
  }, [queueNextPoint, recordPointPresentation]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (gameState === GameState.SERVING) {
      presentationDirector.presentMoment('serve.start', { servingPlayer: status.servingPlayer });
    }
  }, [gameState, status.servingPlayer]);

  useEffect(() => {
    if (gameState !== GameState.SERVING || !isMatchPoint(status)) {
      return;
    }

    const soundKey = `${status.score.playerGames}-${status.score.aiGames}-${status.score.playerScore}-${status.score.aiScore}-${status.isTiebreak}`;
    if (matchPointSoundKeyRef.current === soundKey) {
      return;
    }

    matchPointSoundKeyRef.current = soundKey;
    presentationDirector.presentMoment('match.point');
  }, [gameState, status]);

  const difficultyStats = useMemo(() => getDifficultyStats(status), [status]);
  const targetRallyLength = Math.min(8, 3 + getTotalGames(status));

  return {
    score: status.score,
    addPoint,
    addFault,
    gameState,
    setGameState,
    startGame,
    winner: status.winner,
    lastPointWinner,
    pointReward,
    matchStats,
    playerProgress,
    servingPlayer: status.servingPlayer,
    serveSide: status.serveSide,
    serverFaults: status.serverFaults,
    isTiebreak: status.isTiebreak,
    targetRallyLength,
    difficultyStats
  };
}
