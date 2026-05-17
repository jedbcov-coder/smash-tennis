import { useEffect, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Court } from '../environment/Court';
import { Character } from '../character/Character';
import { Ball, type BallHandle } from '../environment/Ball';
import { GameHud } from './GameHud';
import { GameMenus } from './GameMenus';
import { useGameplayLoop, type ArcadeHudStats } from '../hooks/useGameplayLoop';
import { useTennisGame, type PointRewardInput } from '../serve/useTennisGame';
import { GameState, type CourtSurface, type PlayerType } from '../types';
import { VFXController } from './VFXController';
import { DEFAULT_COURT_SURFACE } from '../gameplay/gameTuning';
import { COLOR_SCHEME } from '../design/colorScheme';
import type { PresentationHudCallout } from '../presentation/presentationDirector';

const DEFAULT_ARCADE_HUD_SERVE_METER: ArcadeHudStats['serveMeter'] = {
  active: false,
  position: 0,
  phase: 'idle',
  qualityLabel: 'Ready',
  servingPlayer: null
};

function LandingMarker({ ballRef, visible }: { ballRef: RefObject<BallHandle | null>; visible: boolean }) {
  const markerRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!markerRef.current || !ballRef.current) return;
    const ballPos = ballRef.current.getPosition();
    const ballVel = ballRef.current.getVelocity();
    markerRef.current.visible = visible;
    markerRef.current.position.set(
      ballPos.x,
      0.05,
      Math.max(-10, Math.min(10, ballPos.z + ballVel.z * 0.5))
    );
  });

  return (
    <mesh ref={markerRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.3, 0.4, 32]} />
      <meshBasicMaterial color={COLOR_SCHEME.neon.cyanSoft} transparent opacity={0.38} />
    </mesh>
  );
}


function ServeTargetGuide({ visible, servingPlayer, serveSide }: { visible: boolean; servingPlayer: PlayerType; serveSide: 'DEUCE' | 'AD' }) {
  if (!visible) return null;

  const targetZ = servingPlayer === 'PLAYER' ? -4.8 : 4.8;
  const targetX = serveSide === 'DEUCE' ? 2.6 : -2.6;
  const glowColor = servingPlayer === 'PLAYER' ? COLOR_SCHEME.neon.cyan : COLOR_SCHEME.neon.magentaHot;

  return (
    <group position={[targetX, 0.07, targetZ]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[0.9, 1.08, 48]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.7} />
      </mesh>
      <mesh>
        <ringGeometry args={[1.25, 1.35, 48]} />
        <meshBasicMaterial color={COLOR_SCHEME.neon.goldSoft} transparent opacity={0.45} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.22, 32]} />
        <meshBasicMaterial color={COLOR_SCHEME.neon.white} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function GameScene({
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
}: {
  onScore: (winner: PlayerType, rewardInput?: PointRewardInput) => void;
  onFault: () => void;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  servingPlayer: PlayerType;
  serveSide: 'DEUCE' | 'AD';
  targetRallyLength: number;
  difficultyStats: {
    gameDifficultyMultiplier: number;
    pointDifficultyMultiplier: number;
    racketAccuracyRadius: number;
  };
  courtSurface: CourtSurface;
  onArcadeHudStatsChange: (stats: ArcadeHudStats) => void;
}) {
  const {
    ballRef,
    playerPos,
    aiPos,
    playerFacingY,
    isVisualSwinging,
    isVisualSmashing,
    isAiSwinging,
    isAiMissing,
    isSmashOpportunityVisible,
    ballTimeScale
  } = useGameplayLoop({
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
  });

  return (
    <>
      <color attach="background" args={[COLOR_SCHEME.neon.background]} />
      <fog attach="fog" args={[COLOR_SCHEME.neon.background, 24, 54]} />
      <ambientLight intensity={0.85} color={COLOR_SCHEME.neon.violetBlue} />
      <pointLight position={[-8, 8, 8]} intensity={3.2} color={COLOR_SCHEME.neon.cyan} />
      <pointLight position={[8, 7, -8]} intensity={2.4} color={COLOR_SCHEME.neon.magentaHot} />
      <directionalLight position={[10, 20, 10]} intensity={1.25} color={COLOR_SCHEME.neon.goldSoft} castShadow />

      <Court courtSurface={courtSurface} />
      <Character
        initialPosition={[0, 0, 9]}
        positionRef={playerPos}
        color={COLOR_SCHEME.characters.player}
        isSwinging={isVisualSwinging}
        isSmashing={isVisualSmashing}
        facingRotationYRef={playerFacingY}
      />
      <Character
        initialPosition={[0, 0, -9]}
        positionRef={aiPos}
        color={COLOR_SCHEME.characters.ai}
        isAI
        isSwinging={isAiSwinging}
        isMissing={isAiMissing}
      />
      <Ball
        ref={ballRef}
        isActive={gameState === GameState.PLAYING}
        timeScale={ballTimeScale}
        isHighlighted={isSmashOpportunityVisible}
        courtSurface={courtSurface}
      />

      <VFXController ballRef={ballRef} />

      {isSmashOpportunityVisible && (
        <mesh position={[playerPos.current.x, 0.08, playerPos.current.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.05, 40]} />
          <meshBasicMaterial color={COLOR_SCHEME.neon.gold} transparent opacity={0.7} />
        </mesh>
      )}

      <ServeTargetGuide visible={gameState === GameState.SERVING} servingPlayer={servingPlayer} serveSide={serveSide} />
      <LandingMarker ballRef={ballRef} visible={gameState === GameState.PLAYING} />
    </>
  );
}

export function Game() {
  const [courtSurface, setCourtSurface] = useState<CourtSurface>(DEFAULT_COURT_SURFACE);
  const [presentationCallout, setPresentationCallout] = useState<PresentationHudCallout | null>(null);
  const presentationCalloutTimeout = useRef<number | null>(null);
  const [arcadeHudStats, setArcadeHudStats] = useState<ArcadeHudStats>({
    serveSpeedMph: 0,
    energyPercent: 0,
    comboCount: 0,
    rallyCount: 0,
    rallyIntensity: 0,
    callout: null,
    serveMeter: { ...DEFAULT_ARCADE_HUD_SERVE_METER }
  });

  const {
    score,
    addPoint,
    addFault,
    gameState,
    setGameState,
    startGame,
    winner,
    lastPointWinner,
    pointReward,
    matchStats,
    servingPlayer,
    serveSide,
    serverFaults,
    isTiebreak,
    targetRallyLength,
    difficultyStats
  } = useTennisGame();

  useEffect(() => {
    const handlePresentationCallout = (event: Event) => {
      const callout = (event as CustomEvent<PresentationHudCallout>).detail;
      setPresentationCallout(callout);

      if (presentationCalloutTimeout.current !== null) {
        window.clearTimeout(presentationCalloutTimeout.current);
      }

      presentationCalloutTimeout.current = window.setTimeout(() => {
        setPresentationCallout(null);
        presentationCalloutTimeout.current = null;
      }, 1200);
    };

    window.addEventListener('presentation:hud-callout', handlePresentationCallout);

    return () => {
      window.removeEventListener('presentation:hud-callout', handlePresentationCallout);
      if (presentationCalloutTimeout.current !== null) {
        window.clearTimeout(presentationCalloutTimeout.current);
      }
    };
  }, []);

  const scorePoint = (winner: PlayerType) => {
    addPoint(winner, {
      rallyCount: arcadeHudStats.rallyCount,
      comboCount: arcadeHudStats.comboCount,
      energyPercent: arcadeHudStats.energyPercent,
      serveSpeedMph: arcadeHudStats.serveSpeedMph
    });
  };

  return (
    <div className="w-full h-full relative font-mono overflow-hidden bg-black select-none">
      <Canvas shadows={{ type: THREE.PCFShadowMap }}>
        <GameScene
          onScore={scorePoint}
          onFault={addFault}
          gameState={gameState}
          setGameState={setGameState}
          servingPlayer={servingPlayer}
          serveSide={serveSide}
          targetRallyLength={targetRallyLength}
          difficultyStats={difficultyStats}
          courtSurface={courtSurface}
          onArcadeHudStatsChange={setArcadeHudStats}
        />
      </Canvas>

      <GameHud
        score={score}
        gameState={gameState}
        servingPlayer={servingPlayer}
        isTiebreak={isTiebreak}
        targetRallyLength={targetRallyLength}
        difficultyStats={difficultyStats}
        lastPointWinner={lastPointWinner}
        serverFaults={serverFaults}
        courtSurface={courtSurface}
        arcadeHudStats={{ ...arcadeHudStats, callout: presentationCallout ?? arcadeHudStats.callout }}
        pointReward={pointReward}
      />

      <GameMenus
        gameState={gameState}
        winner={winner}
        startGame={startGame}
        courtSurface={courtSurface}
        setCourtSurface={setCourtSurface}
        score={score}
        pointReward={pointReward}
        matchStats={matchStats}
      />
    </div>
  );
}
