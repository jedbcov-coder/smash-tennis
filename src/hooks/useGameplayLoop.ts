import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { BallHandle } from '../environment/Ball';
import { calculateShotPhysics, type ServeSide, type ShotDifficultyStats } from '../physics/ShotPhysics';
import {
  OVERHEAD_SMASH_CONFIG,
  SERVE_POSITIONS,
  NET_HEIGHT,
  COURT_SURFACE_SETTINGS
} from '../gameplay/gameTuning';
import { playAudioEvent } from '../audio/audioManager';
import { createPresentationDirector, type PresentationCameraInstruction, type PresentationHudCallout } from '../presentation/presentationDirector';
import { GameState, type CourtSurface, type PlayerType } from '../types';
import { usePlayerInput, type PlayerInputSource } from '../controls/usePlayerInput';
import { useServeMechanics, type ServeMeterQuality, type ServeMeterState } from '../serve/useServeMechanics';
import { calculatePlayerMovement, applySmashAssist } from '../gameplay/playerMovement';
import { AI_MISS_SWING_DURATION_MS, AI_START_POSITION, updateAiOpponent } from '../gameplay/aiOpponentController';
import type { OpponentProfile } from '../gameplay/opponents';
import { updateArcadeCamera } from '../gameplay/cameraController';
import type { GameSettings } from '../settings/useGameSettings';
import { dispatchGameEvent } from '../gameplay/gameEvents';
import { random as gameplayRandom, setRandomSeed } from '../gameplay/random';
import {
  calculateOverheadSmash,
  calculateWeakSmashReturn,
  canStartSmashOpportunity,
  createEmptySmashOpportunity,
  createSmashOpportunity,
  isCloseEnoughForWeakSmashReturn,
  type SmashOpportunity
} from '../gameplay/smashSystem';
import { isFirstBounceOut } from '../physics/WorldPhysics';
import { createInitialBounceState, getBounceSide, getDoubleBouncePointWinner, getSideBounceCount, recordBounce } from '../gameplay/bounceRules';

export interface GameplayDifficultyStats extends ShotDifficultyStats {
  racketAccuracyRadius: number;
}

export type ArcadeCallout = PresentationHudCallout;

export type ArcadeHudServeMeterPhase = 'idle' | 'charging' | 'confirmed';

export interface ArcadeHudServeMeter {
  active: boolean;
  position: number;
  phase: ArcadeHudServeMeterPhase;
  qualityLabel: ServeMeterQuality | 'Ready';
  servingPlayer: PlayerType | null;
}

export interface ArcadeHudStats {
  serveSpeedMph: number;
  energyPercent: number;
  comboCount: number;
  rallyCount: number;
  rallyIntensity: number;
  callout: ArcadeCallout | null;
  serveMeter: ArcadeHudServeMeter;
  inputSource: PlayerInputSource;
}

const createEmptyArcadeHudServeMeter = (): ArcadeHudServeMeter => ({
  active: false,
  position: 0,
  phase: 'idle',
  qualityLabel: 'Ready',
  servingPlayer: null
});

const createEmptyArcadeHudStats = (): ArcadeHudStats => ({
  serveSpeedMph: 0,
  energyPercent: 0,
  comboCount: 0,
  rallyCount: 0,
  rallyIntensity: 0,
  callout: null,
  serveMeter: createEmptyArcadeHudServeMeter(),
  inputSource: 'mouse'
});

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

interface UseGameplayLoopOptions {
  matchSeed: number;
  onScore: (winner: PlayerType) => void;
  onFault: () => void;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  servingPlayer: PlayerType;
  serveSide: ServeSide;
  targetRallyLength: number;
  difficultyStats: GameplayDifficultyStats;
  courtSurface: CourtSurface;
  opponentProfile: OpponentProfile;
  onArcadeHudStatsChange?: (stats: ArcadeHudStats) => void;
  onServeMeterChange?: (state: ServeMeterState) => void;
  settings: GameSettings;
}

type SpecialMoveName = 'FLAME_SMASH';

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
  opponentProfile,
  onArcadeHudStatsChange,
  onServeMeterChange,
  settings,
  matchSeed
}: UseGameplayLoopOptions) {
  const ballRef = useRef<BallHandle>(null);
  const playerPos = useRef(new THREE.Vector3(0, 0, 9));
  const aiPos = useRef(AI_START_POSITION.clone());
  const playerFacingY = useRef(Math.PI);
  const { camera } = useThree();
  const {
    isSwinging,
    isVisualSwinging,
    isSpecialMovePressed,
    inputSource,
    mouseX,
    mouseY,
    clearSwingInput,
    clearSpecialMoveInput
  } = usePlayerInput();
  const surfaceSettings = COURT_SURFACE_SETTINGS[courtSurface];

  const smashOpportunity = useRef<SmashOpportunity>(createEmptySmashOpportunity());
  const smashCooldownUntil = useRef(0);
  const cameraShakeUntil = useRef(0);
  const elapsedTimeRef = useRef(0);
  const consecutiveReturns = useRef(0);
  const previousBallZ = useRef(0);
  const previousBallY = useRef(5);
  const pendingBounceHitter = useRef<PlayerType | null>(null);
  const pendingBounceIsServe = useRef(false);
  const bounceStateRef = useRef(createInitialBounceState());
  const pointEndedRef = useRef(false);
  const aiServeReadyAt = useRef(0);
  const aiMissSwingTriggered = useRef(false);
  const aiWillMissReturn = useRef(false);
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

  const handleCameraInstruction = useCallback((instruction: PresentationCameraInstruction) => {
    const shakeSeconds = 'shakeSeconds' in instruction ? instruction.shakeSeconds : 0;
    if (shakeSeconds <= 0) return;

    cameraShakeUntil.current = Math.max(cameraShakeUntil.current, elapsedTimeRef.current + shakeSeconds);
  }, []);

  const presentationDirector = useMemo(() => createPresentationDirector({
    onCameraInstruction: handleCameraInstruction,
    onHudCallout: showCallout
  }), [handleCameraInstruction, showCallout]);

  const addEnergy = useCallback((amount: number) => {
    const currentEnergy = arcadeHudStatsRef.current.energyPercent;
    const nextEnergy = Math.min(100, currentEnergy + amount);

    updateArcadeHudStats((current) => ({ ...current, energyPercent: nextEnergy }));

    if (currentEnergy < 100 && nextEnergy >= 100) {
      window.setTimeout(() => presentationDirector.triggerHudCallout('POWER READY'), 0);
    }
  }, [presentationDirector, updateArcadeHudStats]);

  const resetEnergy = useCallback(() => {
    updateArcadeHudStats((current) => ({ ...current, energyPercent: 0 }));
  }, [updateArcadeHudStats]);

  const recordShot = useCallback((velocity: THREE.Vector3, options: { combo?: boolean; rally?: boolean; energy?: number; callout?: ArcadeCallout } = {}) => {
    const currentStats = arcadeHudStatsRef.current;
    const nextCombo = options.combo ? currentStats.comboCount + 1 : currentStats.comboCount;
    const nextRally = options.rally ? currentStats.rallyCount + 1 : currentStats.rallyCount;
    const shotSpeedMph = Math.round(velocity.length() * 14);
    const rallyProgress = clamp01(nextRally / Math.max(1, targetRallyLength));
    const speedProgress = clamp01((shotSpeedMph - 35) / 70);
    const targetBalance = clamp01(1 - Math.abs(nextRally - targetRallyLength) / Math.max(1, targetRallyLength));
    const computedIntensity = clamp01((rallyProgress * 0.45) + (speedProgress * 0.35) + (targetBalance * 0.2));
    const nextIntensity = options.rally
      ? clamp01((currentStats.rallyIntensity * 0.45) + (computedIntensity * 0.55))
      : clamp01(currentStats.rallyIntensity * 0.92);

    updateArcadeHudStats((current) => ({
      ...current,
      serveSpeedMph: shotSpeedMph,
      comboCount: nextCombo,
      rallyCount: nextRally,
      rallyIntensity: nextIntensity
    }));

    if (options.energy) {
      addEnergy(options.energy);
    }

    if (options.rally && nextRally > 0 && nextRally % 6 === 0) {
      addEnergy(8);
      presentationDirector.presentMoment('rally.long', { rallyCount: nextRally });
    }

    if (options.callout) {
      presentationDirector.triggerHudCallout(options.callout);
    } else if (options.combo && nextCombo > 1 && nextCombo % 3 === 0) {
      presentationDirector.triggerHudCallout(`COMBO x${nextCombo}`);
    }
  }, [addEnergy, presentationDirector, targetRallyLength, updateArcadeHudStats]);

  useEffect(() => {
    onArcadeHudStatsChange?.(arcadeHudStats);
  }, [arcadeHudStats, onArcadeHudStatsChange]);

  useEffect(() => {
    updateArcadeHudStats((current) => {
      if (current.inputSource === inputSource) {
        return current;
      }

      return { ...current, inputSource };
    });
  }, [inputSource, updateArcadeHudStats]);

  const handleServeMeterChange = useCallback((state: ServeMeterState) => {
    const phase: ArcadeHudServeMeterPhase = state.phase === 'running' ? 'charging' : state.phase === 'locked' || state.phase === 'served' ? 'confirmed' : 'idle';

    updateArcadeHudStats((current) => ({
      ...current,
      serveMeter: {
        active: gameState === GameState.SERVING,
        position: state.position,
        phase,
        qualityLabel: state.qualityLabel,
        servingPlayer: state.servingPlayer
      }
    }));
    onServeMeterChange?.(state);
  }, [gameState, onServeMeterChange, updateArcadeHudStats]);

  useEffect(() => {
    if (gameState === GameState.SERVING) return;

    updateArcadeHudStats((current) => {
      if (!current.serveMeter.active && current.serveMeter.phase === 'idle' && current.serveMeter.position === 0) {
        return current;
      }

      return {
        ...current,
        serveMeter: createEmptyArcadeHudServeMeter()
      };
    });
    onServeMeterChange?.({ phase: 'idle', position: 0, qualityLabel: 'Ready', servingPlayer });
  }, [gameState, onServeMeterChange, servingPlayer, updateArcadeHudStats]);

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
    }, missing ? AI_MISS_SWING_DURATION_MS : 260);
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
    aiWillMissReturn.current = false;
    consecutiveReturns.current = 0;
    bounceStateRef.current = createInitialBounceState();
    updateArcadeHudStats((current) => ({
      ...current,
      comboCount: 0,
      rallyCount: 0,
      rallyIntensity: current.rallyIntensity * 0.2,
      callout: null
    }));
    smashOpportunity.current = createEmptySmashOpportunity();
    setIsSmashOpportunityVisible(false);
    setIsVisualSmashing(false);
    setIsAiSwinging(false);
    setIsAiMissing(false);
    setCurrentSpecialMove(null);
    clearSwingInput();
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
  }, [clearSpecialMoveInput, clearSwingInput, updateArcadeHudStats]);

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
    smashOpportunity.current = createSmashOpportunity(now, ballPos);
    setIsSmashOpportunityVisible(true);
    presentationDirector.presentMoment('smash.opportunity');
  };

  const performOverheadSmash = (ballPos: THREE.Vector3, now: number, isFlameSmash = false) => {
    const { velocity: smashVelocity, spin: smashSpin } = calculateOverheadSmash({
      ballPos,
      playerX: playerPos.current.x,
      difficultyStats,
      surfaceSettings,
      isFlameSmash,
      random: gameplayRandom
    });
    ballRef.current?.setVelocity(smashVelocity, smashSpin);
    recordShot(smashVelocity, { combo: true, rally: true, energy: isFlameSmash ? 0 : 28, callout: isFlameSmash ? undefined : 'MEGA SMASH' });
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
    aiWillMissReturn.current = gameplayRandom() < opponentProfile.missChance;
    consecutiveReturns.current++;
    cameraShakeUntil.current = settings.reducedMotion ? now : now + OVERHEAD_SMASH_CONFIG.cameraShakeDuration * (isFlameSmash ? 1.45 : 1);
    smashCooldownUntil.current = now + OVERHEAD_SMASH_CONFIG.retriggerCooldown;
    setIsVisualSmashing(true);
    setTimeout(() => setIsVisualSmashing(false), isFlameSmash ? 460 : 320);
    endSmashOpportunity();
    dispatchGameEvent('vfx:overhead-smash');
    if (isFlameSmash) {
      presentationDirector.presentMoment('smash.flame');
    } else {
      presentationDirector.triggerVfxEvent('vfx:overhead-smash');
      presentationDirector.triggerAudioEvent('hit.smash');
    }
    clearSwingInput();
    clearSpecialMoveInput();
  };

  const performWeakSmashFailReturn = (ballPos: THREE.Vector3) => {
    const weakReturnVel = calculateWeakSmashReturn({ ballPos, serveSide, difficultyStats, courtSurface });
    ballRef.current?.setVelocity(weakReturnVel, 0.45);
    recordShot(weakReturnVel, { combo: true, rally: true, energy: 6 });
    setLastHitter('PLAYER');
    aiWillMissReturn.current = gameplayRandom() < opponentProfile.missChance;
    consecutiveReturns.current++;
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
      pendingBounceHitter.current = servingPlayer;
      pendingBounceIsServe.current = true;
      bounceStateRef.current = createInitialBounceState();
      if (servingPlayer === 'PLAYER') {
        aiWillMissReturn.current = gameplayRandom() < opponentProfile.missChance;
      }
    },
    onServeMeterChange: handleServeMeterChange
  });

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.SERVING) return;

    const ballPos = ballRef.current?.getPosition() || new THREE.Vector3();
    const ballVel = ballRef.current?.getVelocity() || new THREE.Vector3();
    const now = state.clock.getElapsedTime();
    elapsedTimeRef.current = now;

    if (gameState === GameState.SERVING) {
      const serverPos = servingPlayer === 'PLAYER' ? playerPos.current : aiPos.current;
      updateArcadeCamera(camera, {
        mode: 'serve',
        serverX: serverPos.x,
        serverZ: serverPos.z,
        servingPlayer,
        serveSide
      });
    }

    if (processServeFrame(delta, now)) return;

    // Player Movement (High-response Mouse follow)
    const nextPlayerPos = calculatePlayerMovement({
      currentX: playerPos.current.x,
      currentZ: playerPos.current.z,
      mouseX: mouseX.current,
      mouseY: mouseY.current,
      gameState,
      servingPlayer,
      serveSide,
      surfaceSettings
    });
    playerPos.current.x = nextPlayerPos.x;
    playerPos.current.z = nextPlayerPos.z;

    if (gameState === GameState.PLAYING) {
      const canStartSmash = canStartSmashOpportunity({
        activeSmash: smashOpportunity.current,
        now,
        smashCooldownUntil: smashCooldownUntil.current,
        playerX: playerPos.current.x,
        playerZ: playerPos.current.z,
        ballPos,
        ballVel,
        lastHitter
      });

      if (canStartSmash) {
        startSmashOpportunity(now, ballPos);
      }

      if (smashOpportunity.current.active) {
        const smashTarget = smashOpportunity.current;
        const assistedPlayer = applySmashAssist({
          playerX: playerPos.current.x,
          playerZ: playerPos.current.z,
          ballX: ballPos.x,
          smashTargetX: smashTarget.targetX,
          smashTargetZ: smashTarget.targetZ,
          currentFacingY: playerFacingY.current
        });
        playerPos.current.x = assistedPlayer.x;
        playerPos.current.z = assistedPlayer.z;
        playerFacingY.current = assistedPlayer.facingY;

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
          const closeEnoughForWeakReturn = isCloseEnoughForWeakSmashReturn(ballPos, playerPos.current.x);
          endSmashOpportunity();
          smashCooldownUntil.current = now + OVERHEAD_SMASH_CONFIG.retriggerCooldown;
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

    const aiUpdate = updateAiOpponent({
      aiPosition: aiPos.current,
      ballPosition: ballPos,
      consecutiveReturns: consecutiveReturns.current,
      targetRallyLength,
      difficultyStats,
      surfaceSettings,
      elapsedTime: state.clock.getElapsedTime(),
      delta,
      opponentProfile,
      forceMiss: aiWillMissReturn.current,
      missSwingAlreadyTriggered: aiMissSwingTriggered.current,
      lastHitter,
      random: gameplayRandom
    });
    aiPos.current.copy(aiUpdate.nextPosition);

    if (aiUpdate.missed) {
      aiMissSwingTriggered.current = true;
      triggerAiSwing(true);
      playAudioEvent('ai.nearMiss');
    }

    if (aiUpdate.returnShot) {
      const { velocity: finalAiReturnVel, spin: aiSpin } = aiUpdate.returnShot;
      ballRef.current?.setVelocity(finalAiReturnVel, aiSpin);
      recordShot(finalAiReturnVel, { rally: true });
      setLastHitter('AI');
      pendingBounceHitter.current = 'AI';
      pendingBounceIsServe.current = false;
      bounceStateRef.current = createInitialBounceState();
      aiWillMissReturn.current = false;
      triggerAiSwing();
      playAudioEvent(Math.abs(aiSpin) > 0.6 ? 'hit.curve' : 'hit.normal');
      dispatchGameEvent('vfx:hit.normal');
    }

    // Player Hit Detection (Guaranteed legal shot)
    if (!smashOpportunity.current.active && isSwinging && ballPos.z > 3.0 && ballPos.z < 11.0 && lastHitter !== 'PLAYER' && ballPos.y < 4.0) {
      // Hit radius shrinks as games progress.
      if (Math.abs(ballPos.x - playerPos.current.x) < difficultyStats.racketAccuracyRadius * 2.8) {
        const hitDistance = Math.abs(ballPos.x - playerPos.current.x);
        const isPerfectReturn = hitDistance < difficultyStats.racketAccuracyRadius * 0.45;
        const hitQuality = isPerfectReturn ? 'perfect' : hitDistance < difficultyStats.racketAccuracyRadius * 1.35 ? 'good' : ballPos.x < playerPos.current.x ? 'early' : 'late';
        const shotType = isPerfectReturn ? 'topspin' : hitDistance > difficultyStats.racketAccuracyRadius * 1.8 ? 'slice' : 'flat';
        const playerShot = calculateShotPhysics(ballPos, false, serveSide, difficultyStats, 'AI', courtSurface, {
          shotType,
          quality: hitQuality,
          spinDirection: Math.sign(playerPos.current.x - ballPos.x) || 1
        });
        const playerReturnVel = playerShot.velocity;
        const playerSpin = THREE.MathUtils.clamp(playerShot.spin + (playerPos.current.x - ballPos.x) * 0.35, -2.4, 2.4);
        ballRef.current?.setVelocity(playerReturnVel, playerSpin);
        recordShot(playerReturnVel, {
          combo: true,
          rally: true,
          energy: isPerfectReturn ? 16 : 10,
          callout: undefined
        });
        setLastHitter('PLAYER');
        pendingBounceHitter.current = 'PLAYER';
        pendingBounceIsServe.current = false;
        bounceStateRef.current = createInitialBounceState();
        aiWillMissReturn.current = gameplayRandom() < opponentProfile.missChance;
        consecutiveReturns.current++;
        if (isPerfectReturn) {
          presentationDirector.presentMoment('return.perfect');
        } else {
          presentationDirector.triggerAudioEvent(Math.abs(playerSpin) > 0.75 ? 'hit.curve' : 'hit.normal');
          presentationDirector.triggerVfxEvent('vfx:hit.normal');
        }

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
    } else {
      const justBounced = previousBallY.current > 0.1 && ballPos.y <= 0.1;
      if (justBounced && pendingBounceHitter.current) {
        const hitter = pendingBounceHitter.current;
        const receiver = hitter === 'PLAYER' ? 'AI' : 'PLAYER';
        const outOnLanding = isFirstBounceOut(ballPos, receiver, {
          isServe: pendingBounceIsServe.current,
          serveSide,
          hitter
        });

        if (outOnLanding) {
          const winner = hitter === 'PLAYER' ? 'AI' : 'PLAYER';
          awardPoint(winner, winner === 'PLAYER');
        } else {
          const bounceSide = getBounceSide(ballPos.z);
          bounceStateRef.current = recordBounce(bounceStateRef.current, bounceSide);

          const bounceCount = getSideBounceCount(bounceStateRef.current, bounceSide);
          const doubleBounceWinner = getDoubleBouncePointWinner(hitter, bounceSide, bounceCount);
          if (doubleBounceWinner) {
            presentationDirector.triggerHudCallout('TOO LATE');
            presentationDirector.triggerHudCallout('SECOND BOUNCE');
            awardPoint(doubleBounceWinner, doubleBounceWinner === 'PLAYER');
          }
        }

        pendingBounceIsServe.current = false;
      }
    }
    previousBallZ.current = ballPos.z;
    previousBallY.current = ballPos.y;

    // Camera follow (Fixed-Height Arcade perspective)
    updateArcadeCamera(camera, {
      mode: 'rally',
      playerX: playerPos.current.x,
      playerZ: playerPos.current.z,
      ballX: ballPos.x,
      now,
      cameraShakeUntil: cameraShakeUntil.current,
      smashOpportunityActive: smashOpportunity.current.active,
      random: gameplayRandom,
      screenShakeAmount: settings.reducedMotion ? 0 : settings.screenShakeAmount
    });
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
    ballTimeScale: settings.reducedMotion ? 1 : currentSpecialMove ? 0.35 : isSmashOpportunityVisible ? OVERHEAD_SMASH_CONFIG.slowdownAmount : 1,
    arcadeHudStats
  };
}
