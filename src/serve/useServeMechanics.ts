import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameState, type CourtSurface, type PlayerType } from '../types';
import { SERVE_POSITIONS, PLAYER_MOVEMENT_LIMITS } from '../gameplay/gameTuning';
import { calculateShotPhysics, type ServeSide, type ShotDifficultyStats } from '../physics/ShotPhysics';
import { playAudioEvent } from '../audio/audioManager';
import { chance, randomCentered } from '../gameplay/random';
import type { BallHandle } from '../environment/Ball';
import type { HitQuality, ShotType } from '../gameplay/shotTypes';

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

const SERVE_METER_SPEED = 0.82;

function getServeMeterPosition(startedAt: number, now: number) {
  // Start at the safe left edge and sweep slowly so serving feels readable instead of twitchy.
  const wave = -Math.cos((now - startedAt) * Math.PI * 2 * SERVE_METER_SPEED);
  return (wave + 1) / 2;
}

function getServeOutcome(position: number): ServeOutcome {
  const distanceFromSweetSpot = Math.abs(position - 0.5);

  if (position <= 0.03 || position >= 0.97) {
    return { label: 'Fault', speedMultiplier: 0.7, accuracyWobble: 1.35, spinMultiplier: 0.35, faultChance: 1 };
  }

  if (distanceFromSweetSpot <= 0.12) {
    return { label: 'Perfect Serve', speedMultiplier: 1.2, accuracyWobble: 0.04, spinMultiplier: 1.25, faultChance: 0 };
  }

  if (distanceFromSweetSpot <= 0.25) {
    return { label: 'Power Serve', speedMultiplier: 1.25, accuracyWobble: 0.24, spinMultiplier: 1.35, faultChance: 0 };
  }

  if (distanceFromSweetSpot <= 0.42) {
    return { label: 'Standard Serve', speedMultiplier: 1, accuracyWobble: 0.38, spinMultiplier: 1, faultChance: 0 };
  }

  return { label: 'Weak Serve', speedMultiplier: 0.86, accuracyWobble: 0.62, spinMultiplier: 0.7, faultChance: 0 };
}


function getServeShotStyle(outcome: ServeOutcome): { shotType: ShotType; quality: HitQuality } {
  switch (outcome.label) {
    case 'Perfect Serve':
      return { shotType: 'topspin', quality: 'perfect' };
    case 'Power Serve':
      return { shotType: 'flat', quality: 'good' };
    case 'Weak Serve':
      return { shotType: 'slice', quality: 'early' };
    case 'Fault':
      return { shotType: 'flat', quality: 'miss' };
    case 'Standard Serve':
    default:
      return { shotType: 'flat', quality: 'good' };
  }
}

function applyServeOutcome(serveVel: THREE.Vector3, outcome: ServeOutcome, difficultyMultiplier: number) {
  const tunedVelocity = serveVel.clone().multiplyScalar(outcome.speedMultiplier);
  const wobbleAmount = outcome.accuracyWobble * Math.min(difficultyMultiplier, 1.15);

  tunedVelocity.x += randomCentered(wobbleAmount);
  tunedVelocity.z += randomCentered(wobbleAmount * 0.35);

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

        const isFault = chance(outcome.faultChance * difficultyStats.gameDifficultyMultiplier);
        playerMeterStartedAt.current = 0;

        if (isFault) {
          addFault();
          playAudioEvent('hit.normal');
          clearSwingInput();
          return true; // Frame processed
        }

        const serveStyle = getServeShotStyle(outcome);
        const serveShot = calculateShotPhysics(
          new THREE.Vector3(
            playerPos.current.x + SERVE_POSITIONS.ballXOffset,
            SERVE_POSITIONS.ballHeight,
            playerPos.current.z - SERVE_POSITIONS.ballZOffset
          ),
          true,
          serveSide,
          difficultyStats,
          'AI',
          courtSurface,
          {
            ...serveStyle,
            spinDirection: serveSide === 'DEUCE' ? -1 : 1
          }
        );
        const tunedServeVel = applyServeOutcome(serveShot.velocity, outcome, difficultyStats.gameDifficultyMultiplier);
        const serveSpin = serveShot.spin * outcome.spinMultiplier;
        ballRef.current?.setVelocity(tunedServeVel, serveSpin);
        publishServeMeterState({ phase: 'served', position: playerMeterPosition.current, qualityLabel: outcome.label, servingPlayer: 'PLAYER' });
        onServeLaunched?.(tunedServeVel);
        beginRally(setGameState);
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
        const isFault = chance(0.10); // AI has 10% chance to fault
        if (isFault) {
          publishServeMeterState({ phase: 'served', position: 0, qualityLabel: 'Fault', servingPlayer: 'AI' });
          addFault();
          aiServeReadyAt.current = 0; // Reset timer for second serve if double fault doesn't happen
          playAudioEvent('hit.normal');
          return true;
        }

        const serveShot = calculateShotPhysics(
          new THREE.Vector3(
            aiPos.current.x - SERVE_POSITIONS.ballXOffset,
            SERVE_POSITIONS.ballHeight,
            aiPos.current.z + SERVE_POSITIONS.ballZOffset
          ),
          true,
          serveSide,
          difficultyStats,
          'PLAYER',
          courtSurface,
          {
            shotType: 'flat',
            quality: 'good',
            spinDirection: serveSide === 'DEUCE' ? 1 : -1
          }
        );
        const serveVel = serveShot.velocity;
        const serveSpin = serveShot.spin;
        ballRef.current?.setVelocity(serveVel, serveSpin);
        publishServeMeterState({ phase: 'served', position: 0.5, qualityLabel: 'Standard Serve', servingPlayer: 'AI' });
        onServeLaunched?.(serveVel);
        beginRally(setGameState);
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
