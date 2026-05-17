import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameState, type CourtSurface, type PlayerType } from '../types';
import { SERVE_POSITIONS, PLAYER_MOVEMENT_LIMITS } from '../gameplay/gameTuning';
import { calculateLegalShot, type ServeSide, type ShotDifficultyStats } from '../physics/ShotPhysics';
import { playAudioEvent } from '../audio/audioManager';
import type { BallHandle } from '../environment/Ball';

export type ServeMeterQuality = 'Weak Serve' | 'Standard Serve' | 'Perfect Serve' | 'Power Serve' | 'Fault';

export interface ServeMeterState {
  phase: 'idle' | 'running' | 'locked' | 'served';
  position: number;
  qualityLabel: ServeMeterQuality | 'Ready';
  servingPlayer: PlayerType;
}

type ServeOutcome = {
  label: ServeMeterQuality;
  speedMultiplier: number;
  accuracyWobble: number;
  spinMultiplier: number;
  faultChance: number;
};

interface UseServeMechanicsOptions {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  servingPlayer: PlayerType;
  serveSide: ServeSide;
  difficultyStats: ShotDifficultyStats;
  courtSurface: CourtSurface;
  ballRef: React.RefObject<BallHandle | null>;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  aiPos: React.MutableRefObject<THREE.Vector3>;
  isSwinging: boolean;
  clearSwingInput: () => void;
  setLastHitter: (hitter: PlayerType) => void;
  addFault: () => void; // New callback to trigger service faults
  onServeLaunched?: (velocity: THREE.Vector3) => void;
  onServeMeterChange?: (state: ServeMeterState) => void;
}

const SERVE_METER_SPEED = 1.45;

function getServeMeterPosition(startedAt: number, now: number) {
  const wave = Math.sin((now - startedAt) * Math.PI * 2 * SERVE_METER_SPEED);
  return (wave + 1) / 2;
}

function getServeOutcome(position: number): ServeOutcome {
  const distanceFromSweetSpot = Math.abs(position - 0.5);

  if (distanceFromSweetSpot <= 0.055) {
    return { label: 'Perfect Serve', speedMultiplier: 1.18, accuracyWobble: 0.08, spinMultiplier: 1.25, faultChance: 0.01 };
  }

  if (distanceFromSweetSpot <= 0.16) {
    return { label: 'Power Serve', speedMultiplier: 1.28, accuracyWobble: 0.42, spinMultiplier: 1.45, faultChance: 0.08 };
  }

  if (distanceFromSweetSpot <= 0.31) {
    return { label: 'Standard Serve', speedMultiplier: 1, accuracyWobble: 0.68, spinMultiplier: 1, faultChance: 0.04 };
  }

  if (distanceFromSweetSpot <= 0.45) {
    return { label: 'Weak Serve', speedMultiplier: 0.82, accuracyWobble: 1.08, spinMultiplier: 0.65, faultChance: 0.08 };
  }

  return { label: 'Fault', speedMultiplier: 0.65, accuracyWobble: 1.8, spinMultiplier: 0.35, faultChance: 1 };
}

function applyServeOutcome(serveVel: THREE.Vector3, outcome: ServeOutcome, difficultyMultiplier: number) {
  const tunedVelocity = serveVel.clone().multiplyScalar(outcome.speedMultiplier);
  const wobbleAmount = outcome.accuracyWobble * difficultyMultiplier;

  tunedVelocity.x += (Math.random() - 0.5) * wobbleAmount;
  tunedVelocity.z += (Math.random() - 0.5) * wobbleAmount * 0.35;

  return tunedVelocity;
}

export function useServeMechanics({
  gameState,
  setGameState,
  servingPlayer,
  serveSide,
  difficultyStats,
  courtSurface,
  ballRef,
  playerPos,
  aiPos,
  isSwinging,
  clearSwingInput,
  setLastHitter,
  addFault,
  onServeLaunched,
  onServeMeterChange
}: UseServeMechanicsOptions) {
  const aiServeReadyAt = useRef(0);
  const playerMeterStartedAt = useRef(0);
  const playerMeterPosition = useRef(0);
  const lastMeterStateKey = useRef('');

  const publishServeMeterState = (state: ServeMeterState) => {
    const stateKey = `${state.phase}:${state.servingPlayer}:${state.qualityLabel}:${state.position.toFixed(2)}`;
    if (stateKey === lastMeterStateKey.current) return;
    lastMeterStateKey.current = stateKey;
    onServeMeterChange?.(state);
  };

  // Return a boolean indicating whether serve mechanics overtook the frame logic
  function processServeFrame(delta: number, now: number): boolean {
    if (gameState !== GameState.SERVING) return false;

    if (servingPlayer === 'PLAYER') {
      // Hard pin player behind baseline for service on correct side.
      playerPos.current.z = PLAYER_MOVEMENT_LIMITS.serveZ;
      playerPos.current.x = serveSide === 'DEUCE' ? PLAYER_MOVEMENT_LIMITS.deuceServeX : PLAYER_MOVEMENT_LIMITS.adServeX;

      ballRef.current?.reset(
        [playerPos.current.x + SERVE_POSITIONS.ballXOffset, SERVE_POSITIONS.ballHeight, playerPos.current.z - SERVE_POSITIONS.ballZOffset],
        [0, 0, 0]
      );

      if (playerMeterStartedAt.current > 0) {
        playerMeterPosition.current = getServeMeterPosition(playerMeterStartedAt.current, now);
        publishServeMeterState({
          phase: 'running',
          position: playerMeterPosition.current,
          qualityLabel: getServeOutcome(playerMeterPosition.current).label,
          servingPlayer: 'PLAYER'
        });
      } else {
        publishServeMeterState({ phase: 'idle', position: 0, qualityLabel: 'Ready', servingPlayer: 'PLAYER' });
      }

      if (isSwinging) {
        // First click/Space starts the meter. The next click/Space locks the result and serves.
        if (playerMeterStartedAt.current === 0) {
          playerMeterStartedAt.current = now;
          playerMeterPosition.current = getServeMeterPosition(playerMeterStartedAt.current, now);
          publishServeMeterState({
            phase: 'running',
            position: playerMeterPosition.current,
            qualityLabel: getServeOutcome(playerMeterPosition.current).label,
            servingPlayer: 'PLAYER'
          });
          clearSwingInput();
          return true;
        }

        const outcome = getServeOutcome(playerMeterPosition.current);
        publishServeMeterState({ phase: 'locked', position: playerMeterPosition.current, qualityLabel: outcome.label, servingPlayer: 'PLAYER' });

        const isFault = Math.random() < Math.min(1, outcome.faultChance * difficultyStats.gameDifficultyMultiplier);
        playerMeterStartedAt.current = 0;

        if (isFault) {
          addFault();
          playAudioEvent('hit.normal');
          clearSwingInput();
          return true; // Frame processed
        }

        const serveVel = calculateLegalShot(
          new THREE.Vector3(
            playerPos.current.x + SERVE_POSITIONS.ballXOffset,
            SERVE_POSITIONS.ballHeight,
            playerPos.current.z - SERVE_POSITIONS.ballZOffset
          ),
          true,
          serveSide,
          difficultyStats,
          'AI',
          courtSurface
        );
        const tunedServeVel = applyServeOutcome(serveVel, outcome, difficultyStats.gameDifficultyMultiplier);
        const serveSpin = (serveSide === 'DEUCE' ? -0.9 : 0.9) * outcome.spinMultiplier;
        ballRef.current?.setVelocity(tunedServeVel, serveSpin);
        publishServeMeterState({ phase: 'served', position: playerMeterPosition.current, qualityLabel: outcome.label, servingPlayer: 'PLAYER' });
        onServeLaunched?.(tunedServeVel);
        setGameState(GameState.PLAYING);
        setLastHitter('PLAYER');
        playAudioEvent(Math.abs(serveSpin) > 0.75 ? 'hit.curve' : 'hit.normal');
        clearSwingInput();
      }
    } else {
      // AI Serving logic
      aiPos.current.z = SERVE_POSITIONS.aiZ; // Behind baseline
      aiPos.current.x = serveSide === 'DEUCE' ? SERVE_POSITIONS.aiDeuceX : SERVE_POSITIONS.aiAdX; // AI's deuce side is server's left (negative X)

      ballRef.current?.reset(
        [aiPos.current.x - SERVE_POSITIONS.ballXOffset, SERVE_POSITIONS.ballHeight, aiPos.current.z + SERVE_POSITIONS.ballZOffset],
        [0, 0, 0]
      );
      
      // Wait briefly before AI serves so the player can read the next point.
      if (aiServeReadyAt.current === 0) {
        aiServeReadyAt.current = now + SERVE_POSITIONS.aiDelaySeconds;
        publishServeMeterState({ phase: 'idle', position: 0.5, qualityLabel: 'Ready', servingPlayer: 'AI' });
      }
      
      if (now >= aiServeReadyAt.current) {
        const isFault = Math.random() < 0.10; // AI has 10% chance to fault
        if (isFault) {
          publishServeMeterState({ phase: 'served', position: 0, qualityLabel: 'Fault', servingPlayer: 'AI' });
          addFault();
          aiServeReadyAt.current = 0; // Reset timer for second serve if double fault doesn't happen
          playAudioEvent('hit.normal');
          return true;
        }

        const serveVel = calculateLegalShot(
          new THREE.Vector3(
            aiPos.current.x - SERVE_POSITIONS.ballXOffset,
            SERVE_POSITIONS.ballHeight,
            aiPos.current.z + SERVE_POSITIONS.ballZOffset
          ),
          true,
          serveSide,
          difficultyStats,
          'PLAYER',
          courtSurface
        );
        const serveSpin = serveSide === 'DEUCE' ? 0.7 : -0.7;
        ballRef.current?.setVelocity(serveVel, serveSpin);
        publishServeMeterState({ phase: 'served', position: 0.5, qualityLabel: 'Standard Serve', servingPlayer: 'AI' });
        onServeLaunched?.(serveVel);
        setGameState(GameState.PLAYING);
        setLastHitter('AI');
        playAudioEvent(Math.abs(serveSpin) > 0.75 ? 'hit.curve' : 'hit.normal');
      }
    }
    return true; // We are in SERVING state, stop generic frame processing
  }

  // Effect to reset AI timer and player meter when gameState changes
  useEffect(() => {
    if (gameState === GameState.SERVING) {
      aiServeReadyAt.current = 0;
      playerMeterStartedAt.current = 0;
      playerMeterPosition.current = 0;
      lastMeterStateKey.current = '';
      publishServeMeterState({ phase: 'idle', position: servingPlayer === 'PLAYER' ? 0 : 0.5, qualityLabel: 'Ready', servingPlayer });
    } else {
      playerMeterStartedAt.current = 0;
    }
  }, [gameState, servingPlayer]);

  return { processServeFrame };
}
