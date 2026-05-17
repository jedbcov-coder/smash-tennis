import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameState, type PlayerType } from '../types';
import { SERVE_POSITIONS, PLAYER_MOVEMENT_LIMITS } from '../gameplay/gameTuning';
import { calculateLegalShot, type ServeSide, type ShotDifficultyStats } from '../physics/ShotPhysics';
import { playAudioEvent } from '../audio/audioManager';
import type { BallHandle } from '../environment/Ball';

interface UseServeMechanicsOptions {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  servingPlayer: PlayerType;
  serveSide: ServeSide;
  difficultyStats: ShotDifficultyStats;
  ballRef: React.RefObject<BallHandle | null>;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  aiPos: React.MutableRefObject<THREE.Vector3>;
  isSwinging: boolean;
  clearSwingInput: () => void;
  setLastHitter: (hitter: PlayerType) => void;
  addFault: () => void; // New callback to trigger service faults
}

export function useServeMechanics({
  gameState,
  setGameState,
  servingPlayer,
  serveSide,
  difficultyStats,
  ballRef,
  playerPos,
  aiPos,
  isSwinging,
  clearSwingInput,
  setLastHitter,
  addFault
}: UseServeMechanicsOptions) {
  const aiServeReadyAt = useRef(0);

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

      if (isSwinging) {
        // Simple mock random fault logic for demonstration.
        // In a more complex game, player timing might dictate faults.
        const isFault = Math.random() < 0.15 * difficultyStats.gameDifficultyMultiplier; // 15% chance to fault
        
        if (isFault) {
          addFault();
          playAudioEvent('hit.normal'); // Still play hit sound
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
          'AI'
        );
        ballRef.current?.setVelocity(serveVel);
        setGameState(GameState.PLAYING);
        setLastHitter('PLAYER');
        playAudioEvent('hit.normal');
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
      }
      
      if (now >= aiServeReadyAt.current) {
        const isFault = Math.random() < 0.10; // AI has 10% chance to fault
        if (isFault) {
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
          'PLAYER'
        );
        ballRef.current?.setVelocity(serveVel);
        setGameState(GameState.PLAYING);
        setLastHitter('AI');
        playAudioEvent('hit.normal');
      }
    }
    return true; // We are in SERVING state, stop generic frame processing
  }

  // Effect to reset AI timer when gameState changes
  useEffect(() => {
    if (gameState === GameState.SERVING) {
      aiServeReadyAt.current = 0;
    }
  }, [gameState, servingPlayer]);

  return { processServeFrame };
}
