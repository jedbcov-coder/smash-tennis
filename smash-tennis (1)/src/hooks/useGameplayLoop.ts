import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { BallHandle } from '../environment/Ball';
import { calculateLegalShot, type ServeSide, type ShotDifficultyStats } from '../physics/ShotPhysics';
import {
  AI_BASELINE_POSITION,
  AI_MISS_DRAMA,
  OVERHEAD_SMASH_CONFIG,
  PLAYER_MOVEMENT_LIMITS,
  SERVE_POSITIONS,
  OUT_OF_BOUNDS_LIMITS,
  NET_HEIGHT,
  COURT_SURFACE_SETTINGS
} from '../gameplay/gameTuning';
import { playAudioEvent } from '../audio/audioManager';
import { GameState, type CourtSurface, type PlayerType } from '../types';
import { usePlayerInput } from '../controls/usePlayerInput';
import { useServeMechanics } from '../serve/useServeMechanics';

export interface GameplayDifficultyStats extends ShotDifficultyStats {
  racketAccuracyRadius: number;
}

export type ArcadeCallout = 'PERFECT RETURN' | 'MEGA SMASH' | 'POWER READY' | 'FLAME SMASH' | `COMBO x${number}`;

export interface ArcadeHudStats {
  serveSpeedMph: number;
  energyPercent: number;
  comboCount: number;
  rallyCount: number;
  rallyIntensity: number;
  callout: ArcadeCallout | null;
}

const createEmptyArcadeHudStats = (): ArcadeHudStats => ({
  serveSpeedMph: 0,
  energyPercent: 0,
  comboCount: 0,
  rallyCount: 0,
  rallyIntensity: 0,
  callout: null
});

interface UseGameplayLoopOptions {
  onScore: (winner: PlayerType) => void;
  onFault: () => void;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  servingPlayer: PlayerType;
  serveSide: ServeSide;
  targetRallyLength: number;
  difficultyStats: GameplayDifficultyStats;
  courtSurface: CourtSurface;
  onArcadeHudStatsChange?: (stats: ArcadeHudStats) => void;
}

type SmashOpportunity = {
  active: boolean;
  startedAt: number;
  expiresAt: number;
  targetX: number;
  targetZ: number;
};

const createEmptySmashOpportunity = (): SmashOpportunity => ({
  active: false,
  startedAt: 0,
  expiresAt: 0,
  targetX: 0,
  targetZ: 0
});

type SpecialMoveName = 'FLAME_SMASH';

function triggerGameplayEvent(name: string) {
  window.dispatchEvent(new CustomEvent(name));
}

export function useGameplayLoop({
  onScore,
  onFault,
  gameState,
  setGameState,
  servingPlayer,
  serveSide,
  targetRallyLength,
  difficultyStats,
  courtSurface,
  onArcadeHudStatsChange
}: UseGameplayLoopOptions) {
  const ballRef = useRef<BallHandle>(null);
  const playerPos = useRef(new THREE.Vector3(0, 0, 9));
  const aiPos = useRef(new THREE.Vector3(AI_BASELINE_POSITION.x, 0, AI_BASELINE_POSITION.z));
  const playerFacingY = useRef(Math.PI);
  const { camera } = useThree();
  const {
    isSwinging,
    isVisualSwinging,
    isSpecialMovePressed,
    mouseX,
    mouseY,
    clearSwingInput,
    clearSpecialMoveInput
  } = usePlayerInput();
  const surfaceSettings = COURT_SURFACE_SETTINGS[courtSurface];

  const smashOpportunity = useRef<SmashOpportunity>(createEmptySmashOpportunity());
  const smashCooldownUntil = useRef(0);
  const cameraShakeUntil = useRef(0);
  const consecutiveReturns = useRef(0);
  const previousBallZ = useRef(0);
  const pointEndedRef = useRef(false);
  const aiServeReadyAt = useRef(0);
  const aiMissSwingTriggered = useRef(false);
  const aiSwingTimeout = useRef<number | null>(null);
  const calloutTimeout = useRef<number | null>(null);
  const specialMoveTimeout = useRef<number | null>(null);

  const [lastHitter, setLastHitter] = useState<PlayerType | null>(null);
  const [isVisualSmashing, setIsVisualSmashing] = useState(false);
  const [isAiSwinging, setIsAiSwinging] = useState(false);
  const [isAiMissing, setIsAiMissing] = useState(false);
  const [isSmashOpportunityVisible, setIsSmashOpportunityVisible] = useState(false);
  const [currentSpecialMove, setCurrentSpecialMove] = useState<SpecialMoveName | null>(null);
  const [arcadeHudStats, setArcadeHudStats] = useState<ArcadeHudStats>(createEmptyArcadeHudStats);
  const arcadeHudStatsRef = useRef<ArcadeHudStats>(createEmptyArcadeHudStats());

  const updateArcadeHudStats = useCallback((updater: (current: ArcadeHudStats) => ArcadeHudStats) => {
    const nextStats = updater(arcadeHudStatsRef.current);
    arcadeHudStatsRef.current = nextStats;
    setArcadeHudStats(nextStats);
  }, []);

  const showCallout = useCallback((callout: ArcadeCallout) => {
    if (calloutTimeout.current !== null) {
      window.clearTimeout(calloutTimeout.current);
    }

    updateArcadeHudStats((current) => ({ ...current, callout }));
    calloutTimeout.current = window.setTimeout(() => {
      updateArcadeHudStats((current) => ({ ...current, callout: null }));
      calloutTimeout.current = null;
    }, 1200);
  }, [updateArcadeHudStats]);

  const addEnergy = useCallback((amount: number) => {
    const currentEnergy = arcadeHudStatsRef.current.energyPercent;
    const nextEnergy = Math.min(100, currentEnergy + amount);

    updateArcadeHudStats((current) => ({ ...current, energyPercent: nextEnergy }));

    if (currentEnergy < 100 && nextEnergy >= 100) {
      window.setTimeout(() => showCallout('POWER READY'), 0);
    }
  }, [showCallout, updateArcadeHudStats]);

  const resetEnergy = useCallback(() => {
    updateArcadeHudStats((current) => ({ ...current, energyPercent: 0 }));
  }, [updateArcadeHudStats]);

  const recordShot = useCallback((velocity: THREE.Vector3, options: { combo?: boolean; rally?: boolean; energy?: number; callout?: ArcadeCallout } = {}) => {
    const currentStats = arcadeHudStatsRef.current;
    const nextCombo = options.combo ? currentStats.comboCount + 1 : currentStats.comboCount;
    const nextRally = options.rally ? currentStats.rallyCount + 1 : currentStats.rallyCount;

    updateArcadeHudStats((current) => ({
      ...current,
      serveSpeedMph: Math.round(velocity.length() * 14),
      comboCount: nextCombo,
      rallyCount: nextRally
    }));

    if (options.energy) {
      addEnergy(options.energy);
    }

    if (options.rally && nextRally > 0 && nextRally % 6 === 0) {
      addEnergy(8);
    }

    if (options.callout) {
      showCallout(options.callout);
    } else if (options.combo && nextCombo > 1 && nextCombo % 3 === 0) {
      showCallout(`COMBO x${nextCombo}`);
    }
  }, [addEnergy, showCallout, updateArcadeHudStats]);

  useEffect(() => {
    onArcadeHudStatsChange?.(arcadeHudStats);
  }, [arcadeHudStats, onArcadeHudStatsChange]);

  const triggerAiSwing = useCallback((missing = false) => {
    if (aiSwingTimeout.current !== null) {
      window.clearTimeout(aiSwingTimeout.current);
    }

    setIsAiSwinging(true);
    setIsAiMissing(missing);
    aiSwingTimeout.current = window.setTimeout(() => {
      setIsAiSwinging(false);
      setIsAiMissing(false);
      aiSwingTimeout.current = null;
    }, missing ? AI_MISS_DRAMA.swingDurationMs : 260);
  }, []);

  const resetBall = useCallback((server: PlayerType) => {
    if (!ballRef.current) return;
    if (server === 'PLAYER') {
      ballRef.current.reset([playerPos.current.x + SERVE_POSITIONS.ballXOffset, SERVE_POSITIONS.ballHeight, playerPos.current.z - SERVE_POSITIONS.ballZOffset], [0, 0, 0]);
    } else {
      ballRef.current.reset([aiPos.current.x - SERVE_POSITIONS.ballXOffset, SERVE_POSITIONS.ballHeight, aiPos.current.z + SERVE_POSITIONS.ballZOffset], [0, 0, 0]);
    }
    setLastHitter(null);
    previousBallZ.current = server === 'PLAYER' ? playerPos.current.z - SERVE_POSITIONS.ballZOffset : aiPos.current.z + SERVE_POSITIONS.ballZOffset;
    pointEndedRef.current = false;
    aiServeReadyAt.current = 0;
    aiMissSwingTriggered.current = false;
    consecutiveReturns.current = 0;
    updateArcadeHudStats((current) => ({ ...current, comboCount: 0, rallyCount: 0, callout: null }));
    smashOpportunity.current = createEmptySmashOpportunity();
    setIsSmashOpportunityVisible(false);
    setIsVisualSmashing(false);
    setIsAiSwinging(false);
    setIsAiMissing(false);
    setCurrentSpecialMove(null);
    clearSpecialMoveInput();
    if (specialMoveTimeout.current !== null) {
      window.clearTimeout(specialMoveTimeout.current);
      specialMoveTimeout.current = null;
    }
    if (aiSwingTimeout.current !== null) {
      window.clearTimeout(aiSwingTimeout.current);
      aiSwingTimeout.current = null;
    }
    playerFacingY.current = Math.PI;
  }, [updateArcadeHudStats]);

  useEffect(() => {
    return () => {
      if (calloutTimeout.current !== null) {
        window.clearTimeout(calloutTimeout.current);
      }
      if (specialMoveTimeout.current !== null) {
        window.clearTimeout(specialMoveTimeout.current);
      }
    };
  }, []);

  const endSmashOpportunity = () => {
    smashOpportunity.current = createEmptySmashOpportunity();
    setIsSmashOpportunityVisible(false);
  };

  const startSmashOpportunity = (now: number, ballPos: THREE.Vector3) => {
    smashOpportunity.current = {
      active: true,
      startedAt: now,
      expiresAt: now + OVERHEAD_SMASH_CONFIG.timingWindow,
      targetX: ballPos.x,
      targetZ: THREE.MathUtils.clamp(ballPos.z, PLAYER_MOVEMENT_LIMITS.minZ + 0.1, OVERHEAD_SMASH_CONFIG.netDistanceThreshold)
    };
    setIsSmashOpportunityVisible(true);
    triggerGameplayEvent('smash:opportunity');
  };

  const performOverheadSmash = (ballPos: THREE.Vector3, now: number, isFlameSmash = false) => {
    const targetX = THREE.MathUtils.clamp((Math.random() - 0.5) * 7.5, -4.5, 4.5);
    const targetZ = -9.5;
    const travelTime = 0.58;
    const smashVelocity = new THREE.Vector3(
      (targetX - ballPos.x) / travelTime,
      OVERHEAD_SMASH_CONFIG.smashDownwardVelocity,
      (targetZ - ballPos.z) / travelTime
    ).multiplyScalar(
      OVERHEAD_SMASH_CONFIG.smashSpeedMultiplier *
        (isFlameSmash ? 1.45 : 1) *
        difficultyStats.gameDifficultyMultiplier *
        surfaceSettings.ballSpeedMultiplier
    );

    const smashSpin = THREE.MathUtils.clamp((playerPos.current.x - ballPos.x) * 0.8, -2.4, 2.4);
    ballRef.current?.setVelocity(smashVelocity, smashSpin);
    recordShot(smashVelocity, { combo: true, rally: true, energy: isFlameSmash ? 0 : 28, callout: isFlameSmash ? 'FLAME SMASH' : 'MEGA SMASH' });
    if (isFlameSmash) {
      resetEnergy();
      setCurrentSpecialMove('FLAME_SMASH');
      if (specialMoveTimeout.current !== null) {
        window.clearTimeout(specialMoveTimeout.current);
      }
      specialMoveTimeout.current = window.setTimeout(() => {
        setCurrentSpecialMove(null);
        specialMoveTimeout.current = null;
      }, 550);
    }
    setLastHitter('PLAYER');
    consecutiveReturns.current++;
    cameraShakeUntil.current = now + OVERHEAD_SMASH_CONFIG.cameraShakeDuration * (isFlameSmash ? 1.45 : 1);
    smashCooldownUntil.current = now + OVERHEAD_SMASH_CONFIG.retriggerCooldown;
    setIsVisualSmashing(true);
    setTimeout(() => setIsVisualSmashing(false), isFlameSmash ? 460 : 320);
    endSmashOpportunity();
    triggerGameplayEvent('smash:activated');
    triggerGameplayEvent(isFlameSmash ? 'vfx:flame-smash' : 'vfx:overhead-smash');
    playAudioEvent(isFlameSmash ? 'special.flameSmash' : 'hit.smash');
    clearSwingInput();
    clearSpecialMoveInput();
  };

  const performWeakSmashFailReturn = (ballPos: THREE.Vector3) => {
    const weakReturnVel = calculateLegalShot(ballPos, false, serveSide, difficultyStats, 'AI', courtSurface).multiplyScalar(
      OVERHEAD_SMASH_CONFIG.weakReturnSpeedMultiplier
    );
    ballRef.current?.setVelocity(weakReturnVel, 0.45);
    recordShot(weakReturnVel, { combo: true, rally: true, energy: 6 });
    setLastHitter('PLAYER');
    consecutiveReturns.current++;
    triggerGameplayEvent('smash:weak-return');
    playAudioEvent('hit.normal');
  };

  useEffect(() => {
    if (gameState === GameState.SERVING || gameState === GameState.SERVE_COUNTDOWN) {
      resetBall(servingPlayer);
    }
  }, [gameState, resetBall, servingPlayer]);

  const { processServeFrame } = useServeMechanics({
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
    addFault: onFault,
    onServeLaunched: (serveVelocity) => {
      recordShot(serveVelocity, { rally: true, energy: servingPlayer === 'PLAYER' ? 4 : 0 });
    }
  });

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.SERVING) return;

    const ballPos = ballRef.current?.getPosition() || new THREE.Vector3();
    const ballVel = ballRef.current?.getVelocity() || new THREE.Vector3();
    const now = state.clock.getElapsedTime();

    if (processServeFrame(delta, now)) return;

    // Player Movement (High-response Mouse follow)
    let targetX = mouseX.current * 12.0;
    let targetZ = 6.0 + -mouseY.current * 10.0;

    if (gameState === GameState.SERVING && servingPlayer === 'PLAYER') {
      // Hard pin player behind baseline for service on correct side.
      targetZ = PLAYER_MOVEMENT_LIMITS.serveZ;
      targetX = serveSide === 'DEUCE' ? PLAYER_MOVEMENT_LIMITS.deuceServeX : PLAYER_MOVEMENT_LIMITS.adServeX;
    }

    const playerMovementResponse = THREE.MathUtils.clamp(0.95 * surfaceSettings.playerMovementMultiplier, 0.68, 0.98);
    playerPos.current.x = THREE.MathUtils.lerp(playerPos.current.x, targetX, playerMovementResponse);
    playerPos.current.z = THREE.MathUtils.lerp(playerPos.current.z, targetZ, playerMovementResponse);

    playerPos.current.x = THREE.MathUtils.clamp(playerPos.current.x, PLAYER_MOVEMENT_LIMITS.minX, PLAYER_MOVEMENT_LIMITS.maxX);
    playerPos.current.z = THREE.MathUtils.clamp(playerPos.current.z, PLAYER_MOVEMENT_LIMITS.minZ, PLAYER_MOVEMENT_LIMITS.maxZ);

    if (gameState === GameState.PLAYING) {
      const activeSmash = smashOpportunity.current;
      const nearNet = playerPos.current.z <= OVERHEAD_SMASH_CONFIG.netDistanceThreshold;
      const ballIsHigh = ballPos.y >= OVERHEAD_SMASH_CONFIG.smashHeightThreshold && ballPos.y <= OVERHEAD_SMASH_CONFIG.maxSmashHeight;
      const ballIsIncoming = lastHitter === 'AI' && ballVel.z > 0.35;
      const ballIsInFront = ballPos.z >= playerPos.current.z - OVERHEAD_SMASH_CONFIG.playerBackWindow && ballPos.z <= playerPos.current.z + OVERHEAD_SMASH_CONFIG.playerForwardWindow;
      const ballIsReachableSideways = Math.abs(ballPos.x - playerPos.current.x) <= OVERHEAD_SMASH_CONFIG.lateralWindow;
      const canStartSmash = !activeSmash.active && now >= smashCooldownUntil.current && nearNet && ballIsHigh && ballIsIncoming && ballIsInFront && ballIsReachableSideways;

      if (canStartSmash) {
        startSmashOpportunity(now, ballPos);
      }

      if (smashOpportunity.current.active) {
        const smashTarget = smashOpportunity.current;
        const assistedX = THREE.MathUtils.clamp(
          smashTarget.targetX,
          PLAYER_MOVEMENT_LIMITS.smashAssistMinX,
          PLAYER_MOVEMENT_LIMITS.smashAssistMaxX
        );
        const assistedZ = THREE.MathUtils.clamp(
          smashTarget.targetZ + 0.25,
          PLAYER_MOVEMENT_LIMITS.minZ,
          OVERHEAD_SMASH_CONFIG.netDistanceThreshold
        );
        const nextAssistX = THREE.MathUtils.lerp(playerPos.current.x, assistedX, OVERHEAD_SMASH_CONFIG.assistedPositionStrength);
        const nextAssistZ = THREE.MathUtils.lerp(playerPos.current.z, assistedZ, OVERHEAD_SMASH_CONFIG.assistedPositionStrength);
        playerPos.current.x += THREE.MathUtils.clamp(nextAssistX - playerPos.current.x, -OVERHEAD_SMASH_CONFIG.assistedMaxStep, OVERHEAD_SMASH_CONFIG.assistedMaxStep);
        playerPos.current.z += THREE.MathUtils.clamp(nextAssistZ - playerPos.current.z, -OVERHEAD_SMASH_CONFIG.assistedMaxStep, OVERHEAD_SMASH_CONFIG.assistedMaxStep);

        const targetFacing = Math.PI + THREE.MathUtils.clamp((playerPos.current.x - ballPos.x) * 0.14, -0.35, 0.35);
        playerFacingY.current = THREE.MathUtils.lerp(playerFacingY.current, targetFacing, OVERHEAD_SMASH_CONFIG.autoAlignmentStrength);

        const canUseFlameSmash = arcadeHudStatsRef.current.energyPercent >= 100 && isSpecialMovePressed && now <= smashTarget.expiresAt;

        if (canUseFlameSmash) {
          performOverheadSmash(ballPos, now, true);
          return;
        }

        if (isSpecialMovePressed) {
          clearSpecialMoveInput();
        }

        if (isSwinging && now <= smashTarget.expiresAt) {
          performOverheadSmash(ballPos, now);
          return;
        }

        if (now > smashTarget.expiresAt || ballPos.z > playerPos.current.z + OVERHEAD_SMASH_CONFIG.playerForwardWindow) {
          const closeEnoughForWeakReturn = Math.abs(ballPos.x - playerPos.current.x) <= OVERHEAD_SMASH_CONFIG.failWeakReturnRadius && ballPos.y < OVERHEAD_SMASH_CONFIG.maxSmashHeight;
          endSmashOpportunity();
          smashCooldownUntil.current = now + OVERHEAD_SMASH_CONFIG.retriggerCooldown;
          triggerGameplayEvent('smash:missed');
          if (closeEnoughForWeakReturn) {
            performWeakSmashFailReturn(ballPos);
          }
        }
      } else {
        if (isSpecialMovePressed) {
          clearSpecialMoveInput();
        }
        playerFacingY.current = THREE.MathUtils.lerp(playerFacingY.current, Math.PI, 0.12);
      }
    }

    // AI movement (Slower and more arcade-like)
    const isMercyMiss = consecutiveReturns.current >= targetRallyLength;
    const isBallOnAiSide = ballPos.z < 0;
    const aiBaseSpeed = 3.5;
    const aiSpeed =
      aiBaseSpeed *
      (isMercyMiss ? AI_MISS_DRAMA.lungeSpeedMultiplier : 1) *
      difficultyStats.gameDifficultyMultiplier *
      surfaceSettings.playerMovementMultiplier *
      delta;
    const aiTargetX = isBallOnAiSide
      ? isMercyMiss
        ? THREE.MathUtils.clamp(
            ballPos.x - (Math.sign(ballPos.x - aiPos.current.x) || 1) * AI_MISS_DRAMA.nearMissDistance,
            PLAYER_MOVEMENT_LIMITS.minX,
            PLAYER_MOVEMENT_LIMITS.maxX
          )
        : ballPos.x
      : 0;
    const aiTargetZ = AI_BASELINE_POSITION.z + Math.sin(state.clock.getElapsedTime()) * AI_BASELINE_POSITION.wobbleAmount;

    aiPos.current.x += Math.sign(aiTargetX - aiPos.current.x) * Math.min(Math.abs(aiTargetX - aiPos.current.x), aiSpeed);
    aiPos.current.z += Math.sign(aiTargetZ - aiPos.current.z) * Math.min(Math.abs(aiTargetZ - aiPos.current.z), aiSpeed);

    const shouldShowAiMissSwing =
      isMercyMiss &&
      !aiMissSwingTriggered.current &&
      lastHitter === 'PLAYER' &&
      ballPos.z <= AI_MISS_DRAMA.desperationZoneZ &&
      ballPos.z > OUT_OF_BOUNDS_LIMITS.aiBackZ &&
      ballPos.y < 3.5 &&
      Math.abs(ballPos.x - aiPos.current.x) <= AI_MISS_DRAMA.lateSwingDistance;

    if (shouldShowAiMissSwing) {
      aiMissSwingTriggered.current = true;
      triggerAiSwing(true);
      playAudioEvent('ai.nearMiss');
    }

    // AI Hit Detection
    if (ballPos.z < -8 && ballPos.z > -9.5 && lastHitter === 'PLAYER' && ballPos.y < 3.5 && !isMercyMiss) {
      if (Math.abs(ballPos.x - aiPos.current.x) < 2.0) {
        const tZ = 5 + Math.random() * 4;
        const tX = (Math.random() - 0.5) * 8;
        const vy = 1.8 * difficultyStats.pointDifficultyMultiplier;
        const t = (vy + Math.sqrt(vy * vy + 2 * 1.5 * (ballPos.y - 0.1))) / 1.5;

        const aiReturnVel = new THREE.Vector3((tX - ballPos.x) / t, vy, (tZ - ballPos.z) / t);
        const aiSpin = THREE.MathUtils.clamp((aiPos.current.x - ballPos.x) * 0.45, -1.3, 1.3);
        const finalAiReturnVel = aiReturnVel.multiplyScalar(difficultyStats.gameDifficultyMultiplier * surfaceSettings.ballSpeedMultiplier);
        ballRef.current?.setVelocity(finalAiReturnVel, aiSpin);
        recordShot(finalAiReturnVel, { rally: true });
        setLastHitter('AI');
        triggerAiSwing();
        playAudioEvent(Math.abs(aiSpin) > 0.6 ? 'hit.curve' : 'hit.normal');
        triggerGameplayEvent('vfx:hit.normal');
      }
    }

    // Player Hit Detection (Guaranteed legal shot)
    if (!smashOpportunity.current.active && isSwinging && ballPos.z > 3.0 && ballPos.z < 11.0 && lastHitter !== 'PLAYER' && ballPos.y < 4.0) {
      // Hit radius shrinks as games progress.
      if (Math.abs(ballPos.x - playerPos.current.x) < difficultyStats.racketAccuracyRadius * 2.8) {
        const playerReturnVel = calculateLegalShot(ballPos, false, serveSide, difficultyStats, 'AI', courtSurface);
        const playerSpin = THREE.MathUtils.clamp((playerPos.current.x - ballPos.x) * 0.55, -1.6, 1.6);
        ballRef.current?.setVelocity(playerReturnVel, playerSpin);
        const hitDistance = Math.abs(ballPos.x - playerPos.current.x);
        const isPerfectReturn = hitDistance < difficultyStats.racketAccuracyRadius * 0.45;
        recordShot(playerReturnVel, {
          combo: true,
          rally: true,
          energy: isPerfectReturn ? 16 : 10,
          callout: isPerfectReturn ? 'PERFECT RETURN' : undefined
        });
        setLastHitter('PLAYER');
        consecutiveReturns.current++;
        playAudioEvent(isPerfectReturn ? 'return.perfect' : Math.abs(playerSpin) > 0.75 ? 'hit.curve' : 'hit.normal');
        triggerGameplayEvent('vfx:hit.normal');

        clearSwingInput();
      }
    }

    const awardPoint = (winner: PlayerType, positiveForPlayer: boolean) => {
      if (pointEndedRef.current) return;
      pointEndedRef.current = true;
      onScore(winner);
      playAudioEvent(positiveForPlayer ? 'point.player' : 'point.ai');
    };

    // Net collision: if the ball crosses the net too low, the hitter loses the point.
    const crossedNet = (previousBallZ.current <= 0 && ballPos.z > 0) || (previousBallZ.current >= 0 && ballPos.z < 0);
    if (crossedNet && ballPos.y < NET_HEIGHT && lastHitter) {
      awardPoint(lastHitter === 'PLAYER' ? 'AI' : 'PLAYER', lastHitter === 'AI');
    } else if (ballPos.z > OUT_OF_BOUNDS_LIMITS.playerBackZ) {
      awardPoint('AI', false);
    } else if (ballPos.z < OUT_OF_BOUNDS_LIMITS.aiBackZ) {
      awardPoint('PLAYER', true);
    } else if (Math.abs(ballPos.x) > OUT_OF_BOUNDS_LIMITS.x) {
      // Out of bounds
      awardPoint(lastHitter === 'PLAYER' ? 'AI' : 'PLAYER', lastHitter !== 'PLAYER');
    }
    previousBallZ.current = ballPos.z;

    // Camera follow (Fixed-Height Arcade perspective)
    const cameraSpeed = 0.1;
    const shakeRemaining = Math.max(0, cameraShakeUntil.current - now);
    const shake = shakeRemaining > 0 ? OVERHEAD_SMASH_CONFIG.cameraShakeIntensity * 2.5 * (shakeRemaining / OVERHEAD_SMASH_CONFIG.cameraShakeDuration) : 0;
    
    // Dynamic Camera Track and Zoom
    let targetCameraY = 7;
    let targetCameraZ = playerPos.current.z + 8;
    
    if (smashOpportunity.current.active) {
      targetCameraY = 5.0; // Dynamic zoom in
      targetCameraZ = playerPos.current.z + 5.5;
    }

    // Apply shake to Y and Z
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCameraY + (Math.random() - 0.5) * shake, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCameraZ + (Math.random() - 0.5) * shake, 0.05);

    // Track ball's X position slightly alongside player X
    const ballXTarget = THREE.MathUtils.clamp(ballPos.x * 0.2, -2.0, 2.0);
    const playerXTarget = playerPos.current.x * 0.3;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerXTarget + ballXTarget + ((Math.random() - 0.5) * shake), cameraSpeed);

    // Look at target
    camera.lookAt(ballXTarget * 0.5, 0, -3);
  });

  return {
    ballRef,
    playerPos,
    aiPos,
    playerFacingY,
    isVisualSwinging,
    isVisualSmashing,
    isAiSwinging,
    isAiMissing,
    isSmashOpportunityVisible,
    ballTimeScale: currentSpecialMove ? 0.35 : isSmashOpportunityVisible ? OVERHEAD_SMASH_CONFIG.slowdownAmount : 1,
    arcadeHudStats
  };
}
