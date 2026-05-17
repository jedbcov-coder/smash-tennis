import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type BallHandle } from '../environment/Ball';

type ActiveEffect = {
  id: string;
  position: THREE.Vector3;
  type: 'smash' | 'normal';
  startTime: number;
};

function ImpactSprite({ effect, onComplete }: { effect: ActiveEffect; onComplete: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const sparksRef = useRef<THREE.Points>(null);
  const duration = effect.type === 'smash' ? 0.6 : 0.3;
  
  // Set up particles once
  const sparkCount = effect.type === 'smash' ? 30 : 10;
  const particles = useRef<{ positions: Float32Array, velocities: THREE.Vector3[] } | null>(null);
  
  if (!particles.current) {
    const pos = new Float32Array(sparkCount * 3);
    const vel: THREE.Vector3[] = [];
    for (let i = 0; i < sparkCount; i++) {
        pos[i * 3] = 0;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = 0;
        const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        const speed = effect.type === 'smash' ? 10 + Math.random() * 15 : 3 + Math.random() * 5;
        vel.push(dir.multiplyScalar(speed));
    }
    particles.current = { positions: pos, velocities: vel };
  }

  const { positions, velocities } = particles.current;

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime() - effect.startTime;
    if (elapsed > duration) {
      onComplete();
      return;
    }
    
    const t = elapsed / duration;
    
    if (ringRef.current) {
        const ringScale = THREE.MathUtils.lerp(0.5, effect.type === 'smash' ? 12 : 3, t);
        ringRef.current.scale.setScalar(ringScale);
        (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - t;
    }
    
    if (sparksRef.current) {
        const geom = sparksRef.current.geometry;
        const posAttr = geom.attributes.position;
        for (let i = 0; i < sparkCount; i++) {
            posAttr.setXYZ(
                i, 
                posAttr.getX(i) + velocities[i].x * delta,
                posAttr.getY(i) + velocities[i].y * delta,
                posAttr.getZ(i) + velocities[i].z * delta
            );
            // apply slight drag
            velocities[i].multiplyScalar(0.9);
        }
        posAttr.needsUpdate = true;
        (sparksRef.current.material as THREE.PointsMaterial).opacity = 1 - (t * t);
    }
  });

  const color = effect.type === 'smash' ? '#facc15' : '#ffffff';

  return (
    <group position={effect.position} ref={groupRef}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.4, 32]} />
        <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {effect.type === 'smash' && (
          <mesh rotation={[0, 0, 0]} ref={ringRef}>
            <ringGeometry args={[0.3, 0.5, 32]} />
            <meshBasicMaterial color={'#ff9900'} transparent opacity={1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
      )}
      <points ref={sparksRef}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={sparkCount} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={effect.type === 'smash' ? 0.3 : 0.15} color={color} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

export function VFXController({ ballRef }: { ballRef: React.RefObject<BallHandle | null> }) {
  const [effects, setEffects] = useState<ActiveEffect[]>([]);

  useEffect(() => {
    const handleEvent = (type: 'smash' | 'normal') => {
      if (ballRef.current) {
         setEffects(prev => [...prev, {
            id: Math.random().toString(),
            position: ballRef.current!.getPosition(), // clone internally if needed, but ImpactSprite puts group at pos
            type,
            startTime: 0 // Will be set on first frame by child or we can just pass clock elapsed time somehow. Wait... it's better if we pass Date.now() / 1000 - but clock and Date.now differ.
         }]);
      }
    };

    const onNormal = () => handleEvent('normal');
    const onSmash = () => handleEvent('smash');

    window.addEventListener('vfx:hit.normal', onNormal);
    window.addEventListener('vfx:overhead-smash', onSmash);

    return () => {
        window.removeEventListener('vfx:hit.normal', onNormal);
        window.removeEventListener('vfx:overhead-smash', onSmash);
    };
  }, [ballRef]);

  // To fix startTime, we use a wrapper component that captures the clock's start time.
  return (
    <>
      {effects.map(effect => (
        <EffectWrapper 
             key={effect.id} 
             effect={effect} 
             onComplete={() => setEffects(prev => prev.filter(e => e.id !== effect.id))} 
        />
      ))}
    </>
  );
}

function EffectWrapper({ effect, onComplete }: { effect: ActiveEffect, onComplete: () => void }) {
    const [started, setStarted] = useState(false);
    const effectWithTime = useRef<ActiveEffect | null>(null);

    useFrame(({ clock }) => {
        if (!started) {
            effectWithTime.current = { ...effect, startTime: clock.getElapsedTime() };
            setStarted(true);
        }
    });

    if (!started || !effectWithTime.current) return null;
    return <ImpactSprite effect={effectWithTime.current} onComplete={onComplete} />;
}
