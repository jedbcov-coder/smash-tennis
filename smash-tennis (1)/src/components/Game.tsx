import { useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Court } from '../environment/Court';
import { Character } from '../character/Character';
import { Ball, type BallHandle } from '../environment/Ball';
import { GameHud } from './GameHud';
import { GameMenus } from './GameMenus';
import { useGameplayLoop } from '../hooks/useGameplayLoop';
import { useTennisGame } from '../serve/useTennisGame';
import { GameState, type PlayerType } from '../types';
import { VFXController } from './VFXController';

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
      <meshBasicMaterial color="white" transparent opacity={0.3} />
    </mesh>
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
  difficultyStats
}: {
  onScore: (winner: PlayerType) => void;
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
    difficultyStats
  });

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
      <Sky sunPosition={[100, 20, 100]} />

      <Court />
      <Character
        initialPosition={[0, 0, 9]}
        positionRef={playerPos}
        color="#3b82f6"
        isSwinging={isVisualSwinging}
        isSmashing={isVisualSmashing}
        facingRotationYRef={playerFacingY}
      />
      <Character
        initialPosition={[0, 0, -9]}
        positionRef={aiPos}
        color="#ef4444"
        isAI
        isSwinging={isAiSwinging}
        isMissing={isAiMissing}
      />
      <Ball
        ref={ballRef}
        isActive={gameState === GameState.PLAYING}
        timeScale={ballTimeScale}
        isHighlighted={isSmashOpportunityVisible}
      />

      <VFXController ballRef={ballRef} />

      {isSmashOpportunityVisible && (
        <mesh position={[playerPos.current.x, 0.08, playerPos.current.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.05, 40]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.55} />
        </mesh>
      )}

      <LandingMarker ballRef={ballRef} visible={gameState === GameState.PLAYING} />
    </>
  );
}

export function Game() {
  const {
    score,
    addPoint,
    addFault,
    gameState,
    setGameState,
    startGame,
    winner,
    lastPointWinner,
    servingPlayer,
    serveSide,
    serverFaults,
    isTiebreak,
    targetRallyLength,
    difficultyStats
  } = useTennisGame();

  return (
    <div className="w-full h-full relative font-mono overflow-hidden bg-black select-none">
      <Canvas shadows={{ type: THREE.PCFShadowMap }}>
        <GameScene
          onScore={addPoint}
          onFault={addFault}
          gameState={gameState}
          setGameState={setGameState}
          servingPlayer={servingPlayer}
          serveSide={serveSide}
          targetRallyLength={targetRallyLength}
          difficultyStats={difficultyStats}
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
      />

      <GameMenus gameState={gameState} winner={winner} startGame={startGame} />
    </div>
  );
}
