import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLOR_SCHEME } from '../design/colorScheme';
import { TEXTURE_RULES } from '../design/textures';

interface CharacterProps {
  initialPosition: [number, number, number];
  positionRef?: React.MutableRefObject<THREE.Vector3>;
  color: string;
  isAI?: boolean;
  isSwinging?: boolean;
  isSmashing?: boolean;
  isMissing?: boolean;
  facingRotationYRef?: React.MutableRefObject<number>;
}

export function Character({
  initialPosition,
  positionRef,
  color,
  isAI = false,
  isSwinging = false,
  isSmashing = false,
  isMissing = false,
  facingRotationYRef
}: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const racketRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Imperatively update position from ref for performance and to bypass React render cycle
    if (positionRef) {
        groupRef.current.position.copy(positionRef.current);
    }

    if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(time * 5) * 0.05 + 0.75;
        bodyRef.current.rotation.z = isMissing ? -0.28 : 0;
    }

    // Swing animation (cleaner swipe)
    if (isMissing && racketRef.current) {
        racketRef.current.rotation.x = -Math.PI * 0.65;
        racketRef.current.rotation.y = -0.9 + Math.sin(time * 34) * 0.3;
        racketRef.current.rotation.z = -0.45;
        racketRef.current.position.set(0.65, 0.95, 0.35);
    } else if (isSmashing && racketRef.current) {
        racketRef.current.rotation.x = -Math.PI * 0.85;
        racketRef.current.rotation.y = Math.sin(time * 40) * 0.25;
        racketRef.current.rotation.z = 0;
        racketRef.current.position.set(0.4, 1.0, 0.2);
    } else if (isSwinging && racketRef.current) {
        racketRef.current.rotation.x = -Math.PI / 2;
        racketRef.current.rotation.y = Math.sin(time * 30) * 0.5;
        racketRef.current.rotation.z = 0;
        racketRef.current.position.set(0.4, 0.7, 0.2);
    } else if (racketRef.current) {
        racketRef.current.rotation.x = Math.PI / 4;
        racketRef.current.rotation.y = 0;
        racketRef.current.rotation.z = 0;
        racketRef.current.position.set(0.4, 0.7, 0.2);
    }

    groupRef.current.rotation.y = (facingRotationYRef?.current ?? (isAI ? 0 : Math.PI)) + (isMissing ? -0.18 : 0);
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.75, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.3]} />
        <meshStandardMaterial color={color} roughness={TEXTURE_RULES.character.roughness} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color={COLOR_SCHEME.characters.skin} roughness={TEXTURE_RULES.character.roughness} />
      </mesh>

      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.35, 0.8, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={color} roughness={TEXTURE_RULES.character.roughness} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.35, 0.8, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={color} roughness={TEXTURE_RULES.character.roughness} />
      </mesh>

      {/* Racket */}
      <group ref={racketRef} position={[0.4, 0.7, 0.2]} rotation={[Math.PI / 4, 0, 0]}>
         <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.7]} />
            <meshStandardMaterial color={COLOR_SCHEME.characters.racket.handle} />
         </mesh>
         <mesh position={[0, 0.7, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.35, 0.04, 16, 32]} />
            <meshStandardMaterial color={COLOR_SCHEME.characters.racket.frame} />
         </mesh>
         <mesh position={[0, 0.7, 0]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshBasicMaterial color={COLOR_SCHEME.characters.racket.strings} transparent opacity={0.3} side={THREE.DoubleSide} />
         </mesh>
      </group>

      {/* Simple Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="black" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
