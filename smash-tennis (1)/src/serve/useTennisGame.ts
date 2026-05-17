import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playAudioEvent } from '../audio/audioManager';
import { GameState, type PlayerType } from '../types';
import {
  getInitialGameState,
  updateScoreOnPoint,
  type GameStatus
} from './scoringRules';

const POINT_RESULT_PAUSE_MS = 1400;


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

export function useTennisGame() {
  const [status, setStatus] = useState<GameStatus>(() => getInitialGameState());
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [lastPointWinner, setLastPointWinner] = useState<PlayerType | null>(null);
  const nextPointTimerRef = useRef<number | null>(null);
  const matchPointSoundKeyRef = useRef<string | null>(null);

  const clearNextPointTimer = useCallback(() => {
    if (nextPointTimerRef.current !== null) {
      window.clearTimeout(nextPointTimerRef.current);
      nextPointTimerRef.current = null;
    }
  }, []);

  const queueNextPoint = useCallback((nextStatus: GameStatus) => {
    clearNextPointTimer();
    setGameState(GameState.SCORING);

    nextPointTimerRef.current = window.setTimeout(() => {
      nextPointTimerRef.current = null;
      setGameState(nextStatus.winner ? GameState.GAME_OVER : GameState.SERVING);
    }, POINT_RESULT_PAUSE_MS);
  }, [clearNextPointTimer]);

  const startGame = useCallback(() => {
    clearNextPointTimer();
    setStatus(getInitialGameState());
    matchPointSoundKeyRef.current = null;
    setLastPointWinner(null);
    setGameState(GameState.SERVING);
  }, [clearNextPointTimer]);

  const addPoint = useCallback((winner: PlayerType) => {
    setLastPointWinner(winner);
    setStatus((currentStatus) => {
      const nextStatus = updateScoreOnPoint(currentStatus, winner);
      queueNextPoint(nextStatus);
      return nextStatus;
    });
  }, [queueNextPoint]);

  const addFault = useCallback(() => {
    setStatus((currentStatus) => {
      if (currentStatus.serverFaults === 0) {
        return { ...currentStatus, serverFaults: 1 };
      }

      const pointWinner = getReceiver(currentStatus.servingPlayer);
      setLastPointWinner(pointWinner);
      const nextStatus = updateScoreOnPoint(currentStatus, pointWinner);
      queueNextPoint(nextStatus);
      return nextStatus;
    });
  }, [queueNextPoint]);

  useEffect(() => clearNextPointTimer, [clearNextPointTimer]);

  useEffect(() => {
    if (gameState !== GameState.SERVING || !isMatchPoint(status)) {
      return;
    }

    const soundKey = `${status.score.playerGames}-${status.score.aiGames}-${status.score.playerScore}-${status.score.aiScore}-${status.isTiebreak}`;
    if (matchPointSoundKeyRef.current === soundKey) {
      return;
    }

    matchPointSoundKeyRef.current = soundKey;
    playAudioEvent('match.point');
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
    servingPlayer: status.servingPlayer,
    serveSide: status.serveSide,
    serverFaults: status.serverFaults,
    isTiebreak: status.isTiebreak,
    targetRallyLength,
    difficultyStats
  };
}
