import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import * as THREE from 'three';
import { GameState, type CourtSurface, type PlayerType } from '../types';
import { SERVE_POSITIONS, PLAYER_MOVEMENT_LIMITS } from '../gameplay/gameTuning';
import { calculateLegalShot, type ServeSide, type ShotDifficultyStats } from '../physics/ShotPhysics';
import { playAudioEvent } from '../audio/audioManager';
import type { BallHandle } from '../environment/Ball';

export type ServeQuality = 'Weak Serve' | 'Standard Serve' | 'Perfect Serve' | 'Power Serve' | 'Fault';

export interface ServeMeterState {
  value: number;
  isTiming: boolean;
  quality: ServeQuality | null;
}

interface QualityTuning {
  speedMultiplier: number;
  accuracyWobble: number;
  spinMultiplier: number;
  faultChance: number;
}

const INITIAL_SERVE_METER: ServeMeterState = {
  value: 0,
  isTiming: false,
  quality: null
};

const QUALITY_TUNING: Record<ServeQuality, QualityTuning> = {
  'Weak Serve': { speedMultiplier: 0.82, accuracyWobble: 0.55, spinMultiplier: 0.65, faultChance: 0.05 },
  'Standard Serve': { speedMultiplier: 1, accuracyWobble: 0.25, spinMultiplier: 1, faultChance: 0.02 },
  'Perfect Serve': { speedMultiplier: 1.18, accuracyWobble: 0, spinMultiplier: 1.25, faultChance: 0 },
  'Power Serve': { speedMultiplier: 1.32, accuracyWobble: 0.35, spinMultiplier: 1.45, faultChance: 0.08 },
  Fault: { speedMultiplier: 0, accuracyWobble: 0, spinMultiplier: 0, faultChance: 1 }
};

interface UseServeMechanicsOptions {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  servingPlayer: PlayerType;
  serveSide: ServeSide;
  difficultyStats: ShotDifficultyStats;
  courtSurface: CourtSurface;
  ballRef: RefObject<BallHandle | null>;
  playerPos: MutableRefObject<THREE.Vector3>;
  aiPos: MutableRefObject<THREE.Vector3>;
  isSwinging: boolean;
  clearSwingInput: () => void;
  setLastHitter: (hitter: PlayerType) => void;
  addFault: () => void;
  onServeMeterChange?: (meter: ServeMeterState) => void;
  onServeLaunched?: (velocity: THREE.Vector3) => void;
}

function getPlayerServeQuality(meterValue: number): ServeQuality {
  const timingFromPerfect = Math.abs(meterValue - 0.5);

  if (timingFromPerfect <= 0.035) return 'Perfect Serve';
  if (timingFromPerfect <= 0.14) return 'Power Serve';
  if (timingFromPerfect <= 0.27) return 'Standard Serve';
  if (timingFromPerfect <= 0.4) return 'Weak Serve';

  return 'Fault';
}

function applyServeQuality(serveVel: THREE.Vector3, quality: ServeQuality, server: PlayerType) {
  const tuning = QUALITY_TUNING[quality];
  const sideDirection = server === 'PLAYER' ? 1 : -1;

  return serveVel
    .clone()
    .multiplyScalar(tuning.speedMultiplier)
    .add(new THREE.Vector3((Math.random() - 0.5) * tuning.accuracyWobble * sideDirection, 0, 0));
}

function shouldFault(quality: ServeQuality) {
  const tuning = QUALITY_TUNING[quality];
  return Math.random() < tuning.faultChance;
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
  onServeMeterChange,
  onServeLaunched
}: UseServeMechanicsOptions) {
  const aiServeReadyAt = useRef(0);
  const meterValue = useRef(0);
  const meterDirection = useRef(1);
  const playerIsTimingServe = useRef(false);
  const serveMeterStartedAt = useRef(0);
  const lastMeterUpdate = useRef<ServeMeterState>(INITIAL_SERVE_METER);

  function updateServeMeter(nextMeter: ServeMeterState) {
    lastMeterUpdate.current = nextMeter;
    onServeMeterChange?.(nextMeter);
  }

  function launchServe(server: PlayerType, quality: ServeQuality, fromPos: THREE.Vector3) {
    if (shouldFault(quality)) {
      updateServeMeter({ value: meterValue.current, isTiming: false, quality: 'Fault' });
      addFault();
      playAudioEvent('hit.normal');
      return;
    }

    const targetSide: PlayerType = server === 'PLAYER' ? 'AI' : 'PLAYER';
    const baseServeVel = calculateLegalShot(fromPos, true, serveSide, difficultyStats, targetSide, courtSurface);
    const serveVel = applyServeQuality(baseServeVel, quality, server);
    const baseSpin =
      server === 'PLAYER'
        ? serveSide === 'DEUCE'
          ? -0.9
          : 0.9
        : serveSide === 'DEUCE'
          ? 0.7
          : -0.7;
    const serveSpin = baseSpin * QUALITY_TUNING[quality].spinMultiplier;

    ballRef.current?.setVelocity(serveVel, serveSpin);
    onServeLaunched?.(serveVel);
    setGameState(GameState.PLAYING);
    setLastHitter(server);
    updateServeMeter({ value: meterValue.current, isTiming: false, quality });
    playAudioEvent('hit.normal');
  }

  // Return a boolean indicating whether serve mechanics overtook the frame logic.
  function processServeFrame(delta: number, now: number): boolean {
    if (gameState !== GameState.SERVING) return false;

    if (servingPlayer === 'PLAYER') {
      // Hard pin player behind baseline for service on correct side.
      playerPos.current.z = PLAYER_MOVEMENT_LIMITS.serveZ;
      playerPos.current.x = serveSide === 'DEUCE' ? PLAYER_MOVEMENT_LIMITS.deuceServeX : PLAYER_MOVEMENT_LIMITS.adServeX;

      const serveStart = new THREE.Vector3(
        playerPos.current.x + SERVE_POSITIONS.ballXOffset,
        SERVE_POSITIONS.ballHeight,
        playerPos.current.z - SERVE_POSITIONS.ballZOffset
      );

      ballRef.current?.reset([serveStart.x, serveStart.y, serveStart.z], [0, 0, 0]);

      if (playerIsTimingServe.current) {
        meterValue.current += meterDirection.current * delta * 1.35;
        if (meterValue.current >= 1) {
          meterValue.current = 1;
          meterDirection.current = -1;
        } else if (meterValue.current <= 0) {
          meterValue.current = 0;
          meterDirection.current = 1;
        }
        updateServeMeter({ value: meterValue.current, isTiming: true, quality: null });
      }

      if (isSwinging) {
        if (!playerIsTimingServe.current) {
          playerIsTimingServe.current = true;
          serveMeterStartedAt.current = now;
          meterValue.current = 0;
          meterDirection.current = 1;
          updateServeMeter({ value: meterValue.current, isTiming: true, quality: null });
          clearSwingInput();
          return true;
        }

        // Ignore accidental double input in the same instant the meter starts.
        if (now - serveMeterStartedAt.current < 0.12) {
          clearSwingInput();
          return true;
        }

        const quality = getPlayerServeQuality(meterValue.current);
        playerIsTimingServe.current = false;
        launchServe('PLAYER', quality, serveStart);
        clearSwingInput();
      }
    } else {
      // AI serving stays simple: wait briefly, show a readable quality, then serve.
      aiPos.current.z = SERVE_POSITIONS.aiZ;
      aiPos.current.x = serveSide === 'DEUCE' ? SERVE_POSITIONS.aiDeuceX : SERVE_POSITIONS.aiAdX;

      const serveStart = new THREE.Vector3(
        aiPos.current.x - SERVE_POSITIONS.ballXOffset,
        SERVE_POSITIONS.ballHeight,
        aiPos.current.z + SERVE_POSITIONS.ballZOffset
      );

      ballRef.current?.reset([serveStart.x, serveStart.y, serveStart.z], [0, 0, 0]);

      if (aiServeReadyAt.current === 0) {
        aiServeReadyAt.current = now + SERVE_POSITIONS.aiDelaySeconds;
        meterValue.current = 0.5;
        updateServeMeter({ value: meterValue.current, isTiming: false, quality: 'Standard Serve' });
      }

      if (now >= aiServeReadyAt.current) {
        const quality: ServeQuality = Math.random() < 0.28 ? 'Power Serve' : 'Standard Serve';
        meterValue.current = quality === 'Power Serve' ? 0.62 : 0.5;
        launchServe('AI', quality, serveStart);
        aiServeReadyAt.current = 0;
      }
    }
    return true; // We are in SERVING state, stop generic frame processing.
  }

  useEffect(() => {
    if (gameState === GameState.SERVING) {
      aiServeReadyAt.current = 0;
      meterValue.current = 0;
      meterDirection.current = 1;
      playerIsTimingServe.current = false;
      serveMeterStartedAt.current = 0;
      updateServeMeter(INITIAL_SERVE_METER);
    } else if (lastMeterUpdate.current.isTiming) {
      updateServeMeter({ ...lastMeterUpdate.current, isTiming: false });
    }
  }, [gameState, servingPlayer]);

  return { processServeFrame };
}
