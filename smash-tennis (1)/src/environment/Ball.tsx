import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { COLOR_SCHEME } from '../design/colorScheme';
import { TEXTURE_RULES } from '../design/textures';
import { COURT_SURFACE_SETTINGS } from '../gameplay/gameTuning';
import { GRAVITY, applySpinCurve, applySurfaceBounce } from '../physics/WorldPhysics';
import type { CourtSurface } from '../types';

export interface BallHandle {
  reset: (pos: [number, number, number], vel: [number, number, number]) => void;
  getPosition: () => THREE.Vector3;
  getVelocity: () => THREE.Vector3;
  setVelocity: (vel: THREE.Vector3, spin?: number) => void;
  setSpin: (spin: number) => void;
}

interface BallProps {
  isActive?: boolean;
  timeScale?: number;
  isHighlighted?: boolean;
  courtSurface: CourtSurface;
}

type BallVisualMode = 'normal' | 'curve' | 'fast' | 'highlight';

const BALL_VISUALS: Record<BallVisualMode, { color: string; trail: string; emissive: string; trailWidth: number; trailLength: number }> = {
  normal: {
    color: COLOR_SCHEME.ball.normal,
    trail: COLOR_SCHEME.ball.trail,
    emissive: COLOR_SCHEME.neon.cyan,
    trailWidth: 0.24,
    trailLength: 7
  },
  curve: {
    color: COLOR_SCHEME.ball.curve,
    trail: COLOR_SCHEME.ball.curve,
    emissive: COLOR_SCHEME.ball.curve,
    trailWidth: 0.42,
    trailLength: 11
  },
  fast: {
    color: COLOR_SCHEME.ball.fast,
    trail: COLOR_SCHEME.ball.fast,
    emissive: COLOR_SCHEME.ball.fast,
    trailWidth: 0.58,
    trailLength: 16
  },
  highlight: {
    color: COLOR_SCHEME.ball.highlight,
    trail: COLOR_SCHEME.ball.glow,
    emissive: COLOR_SCHEME.ball.emissiveHighlight,
    trailWidth: 0.82,
    trailLength: 20
  }
};

export const Ball = forwardRef<BallHandle, BallProps>(({ isActive = true, timeScale = 1, isHighlighted = false, courtSurface }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const spin = useRef(0);
  const modeUpdateTimer = useRef(0);
  const [visualMode, setVisualMode] = useState<BallVisualMode>('normal');

  useImperativeHandle(ref, () => ({
    reset: (pos, vel) => {
      if (groupRef.current) {
        groupRef.current.position.set(...pos);
      }
      if (meshRef.current) {
        meshRef.current.position.set(0, 0, 0);
      }
      velocity.current.set(...vel);
      spin.current = 0;
      setVisualMode('normal');
    },
    getPosition: () => groupRef.current?.position.clone() || new THREE.Vector3(),
    getVelocity: () => velocity.current.clone(),
    setVelocity: (vel: THREE.Vector3, nextSpin = 0) => {
      velocity.current.copy(vel);
      spin.current = nextSpin;
    },
    setSpin: (nextSpin: number) => {
      spin.current = nextSpin;
    }
  }));

  useFrame((_, delta) => {
    if (!groupRef.current || !meshRef.current || !shadowRef.current) return;

    const surfaceSettings = COURT_SURFACE_SETTINGS[courtSurface];

    if (isActive) {
      const scaledDelta = delta * timeScale;

      // Spin bends the ball sideways while it flies. It is intentionally arcade-like, not a full simulation.
      applySpinCurve(velocity.current, spin.current, surfaceSettings.spinCurveMultiplier, scaledDelta);
      spin.current *= 1 - Math.min(0.9, scaledDelta * 0.45);

      velocity.current.y += GRAVITY * scaledDelta;
      groupRef.current.position.addScaledVector(velocity.current, scaledDelta);

      if (groupRef.current.position.y < 0.1) {
        groupRef.current.position.y = 0.1;
        applySurfaceBounce(velocity.current, surfaceSettings);
        spin.current *= 0.58;
      }
    }

    const speed = velocity.current.length();
    const nextMode: BallVisualMode = isHighlighted ? 'highlight' : speed > 15 ? 'fast' : Math.abs(spin.current) > 0.7 ? 'curve' : 'normal';
    modeUpdateTimer.current += delta;
    if (modeUpdateTimer.current > 0.08) {
      modeUpdateTimer.current = 0;
      setVisualMode((currentMode) => (currentMode === nextMode ? currentMode : nextMode));
    }

    const pulse = 1 + Math.sin(Date.now() * 0.018) * 0.14;
    const speedPulse = Math.min(0.38, speed * 0.012);
    meshRef.current.scale.setScalar((isHighlighted ? 1.35 : 1) + speedPulse);

    if (glowRef.current) {
      glowRef.current.visible = speed > 6 || isHighlighted;
      glowRef.current.position.set(0, 0, 0);
      glowRef.current.scale.setScalar((isHighlighted ? 1.25 : 0.82) * pulse + speedPulse);
    }

    shadowRef.current.position.y = -groupRef.current.position.y + 0.02;
    shadowRef.current.position.x = 0;
    shadowRef.current.position.z = 0;
    shadowRef.current.scale.setScalar(1 / (groupRef.current.position.y + 1));
  });

  const visuals = BALL_VISUALS[visualMode];

  return (
    <group ref={groupRef} position={[0, 5, 0]}>
      <Trail
        width={visuals.trailWidth}
        color={visuals.trail}
        length={visuals.trailLength}
        decay={1}
        local={false}
        stride={0}
        interval={1}
        target={meshRef}
      >
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.15, 24, 24]} />
          <meshStandardMaterial
            color={visuals.color}
            emissive={visuals.emissive}
            emissiveIntensity={visualMode === 'normal' ? 0.24 : visualMode === 'highlight' ? 1 : 0.72}
            roughness={TEXTURE_RULES.ball.roughness}
            metalness={TEXTURE_RULES.ball.metalness}
          />
        </mesh>
      </Trail>
      <mesh ref={glowRef} visible={false}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color={visuals.trail} transparent opacity={0.34} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -5 + 0.02, 0]}
      >
        <circleGeometry args={[0.22, 32]} />
        <meshBasicMaterial color={COLOR_SCHEME.neon.background} transparent opacity={0.42} />
      </mesh>
    </group>
  );
});
