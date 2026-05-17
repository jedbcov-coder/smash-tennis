import { useRef, forwardRef, useImperativeHandle } from 'react';
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

export const Ball = forwardRef<BallHandle, BallProps>(({ isActive = true, timeScale = 1, isHighlighted = false, courtSurface }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const spin = useRef(0);

  useImperativeHandle(ref, () => ({
    reset: (pos, vel) => {
      if (groupRef.current) {
        groupRef.current.position.set(...pos);
      }
      if (meshRef.current) {
        meshRef.current.position.set(0, 0, 0); // Reset relative position in group if any
      }
      velocity.current.set(...vel);
      spin.current = 0;
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

    const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.12;
    meshRef.current.scale.setScalar(isHighlighted ? pulse * 1.35 : 1);
    if (glowRef.current) {
      glowRef.current.visible = isHighlighted;
      glowRef.current.position.set(0, 0, 0);
      glowRef.current.scale.setScalar(pulse);
    }

    shadowRef.current.position.y = -groupRef.current.position.y + 0.02;
    shadowRef.current.position.x = 0;
    shadowRef.current.position.z = 0;
    shadowRef.current.scale.setScalar(1 / (groupRef.current.position.y + 1));
  });

  const speed = velocity.current.length();
  const isFast = speed > 15;
  const isCurving = Math.abs(spin.current) > 0.7;
  const trailColor = isHighlighted ? COLOR_SCHEME.ball.highlight : (isFast ? '#ff4400' : isCurving ? '#e879f9' : '#44aaff');

  return (
    <group ref={groupRef} position={[0, 5, 0]}>
      <Trail
        width={isHighlighted ? 0.8 : (isFast ? 0.5 : isCurving ? 0.35 : 0.2)}
        color={trailColor}
        length={isFast || isHighlighted ? 15 : isCurving ? 9 : 5}
        decay={1}
        local={false}
        stride={0}
        interval={1}
        target={meshRef}
      >
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color={isHighlighted ? COLOR_SCHEME.ball.highlight : COLOR_SCHEME.ball.normal}
            emissive={isHighlighted ? COLOR_SCHEME.ball.emissiveHighlight : (isFast ? '#ff4400' : isCurving ? '#e879f9' : '#000000')}
            emissiveIntensity={isHighlighted ? 0.7 : (isFast ? 0.4 : isCurving ? 0.32 : 0)}
            roughness={TEXTURE_RULES.ball.roughness}
            metalness={TEXTURE_RULES.ball.metalness}
          />
        </mesh>
      </Trail>
      <mesh ref={glowRef} visible={false}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshBasicMaterial color={COLOR_SCHEME.ball.glow} transparent opacity={0.35} />
      </mesh>
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -5 + 0.02, 0]}
      >
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
});
