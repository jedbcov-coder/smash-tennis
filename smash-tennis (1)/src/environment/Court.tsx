import * as THREE from 'three';
import { TEXTURE_RULES } from '../design/textures';
import {
  COURT_LENGTH,
  COURT_RENDERING,
  DOUBLES_COURT_WIDTH,
  NET_HEIGHT,
  SINGLES_COURT_WIDTH,
  COURT_SURFACE_SETTINGS
} from '../gameplay/gameTuning';

import type { CourtSurface } from '../types';

export function Court({ courtSurface }: { courtSurface: CourtSurface }) {
  const surfaceColors = COURT_SURFACE_SETTINGS[courtSurface].colors;

  return (
    <group>
      {/* Surrounding Pavement */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[COURT_RENDERING.surroundingWidth, COURT_RENDERING.surroundingLength]} />
        <meshStandardMaterial color={surfaceColors.surrounding} roughness={TEXTURE_RULES.court.roughness} />
      </mesh>

      {/* Main Playing Surface (Doubles) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[DOUBLES_COURT_WIDTH, COURT_LENGTH]} />
        <meshStandardMaterial color={surfaceColors.playingSurface} roughness={TEXTURE_RULES.court.roughness} />
      </mesh>

      {/* Lines Group */}
      <group position={[0, 0.01, 0]}>
        {/* Baselines */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, COURT_LENGTH / 2]}>
          <planeGeometry args={[DOUBLES_COURT_WIDTH, COURT_RENDERING.lineWidth]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -COURT_LENGTH / 2]}>
          <planeGeometry args={[DOUBLES_COURT_WIDTH, COURT_RENDERING.lineWidth]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>

        {/* Doubles Sidelines */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[DOUBLES_COURT_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[COURT_RENDERING.lineWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-DOUBLES_COURT_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[COURT_RENDERING.lineWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>

        {/* Singles Sidelines */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SINGLES_COURT_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[COURT_RENDERING.lineWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-SINGLES_COURT_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[COURT_RENDERING.lineWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>

        {/* Service Lines */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, COURT_RENDERING.serviceLineZ]}>
          <planeGeometry args={[SINGLES_COURT_WIDTH, COURT_RENDERING.lineWidth]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -COURT_RENDERING.serviceLineZ]}>
          <planeGeometry args={[SINGLES_COURT_WIDTH, COURT_RENDERING.lineWidth]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>

        {/* Center Service Line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[COURT_RENDERING.lineWidth, COURT_RENDERING.serviceLineZ * 2]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>

        {/* Center Marks */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, COURT_LENGTH / 2 - 0.2]}>
          <planeGeometry args={[COURT_RENDERING.lineWidth, COURT_RENDERING.centerMarkLength]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -COURT_LENGTH / 2 + 0.2]}>
          <planeGeometry args={[COURT_RENDERING.lineWidth, COURT_RENDERING.centerMarkLength]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>

        {/* Mid court line (net position mark) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[DOUBLES_COURT_WIDTH, COURT_RENDERING.lineWidth * 0.5]} />
          <meshBasicMaterial color={surfaceColors.lines} opacity={0.3} transparent />
        </mesh>
      </group>

      {/* Net */}
      <group position={[0, 0.52, 0]}>
        <mesh>
          <boxGeometry
            args={[DOUBLES_COURT_WIDTH + COURT_RENDERING.netPostPadding * 2, NET_HEIGHT, COURT_RENDERING.netDepth]}
          />
          <meshStandardMaterial 
            color={surfaceColors.net} 
            transparent 
            opacity={0.3} 
            wireframe={true} // Net texture feel
          />
        </mesh>
        {/* Net Top Band */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry
            args={[
              DOUBLES_COURT_WIDTH + COURT_RENDERING.netPostPadding * 2,
              COURT_RENDERING.netTopBandHeight,
              COURT_RENDERING.netTopBandDepth
            ]}
          />
          <meshStandardMaterial color={surfaceColors.net} />
        </mesh>
      </group>

      {/* Net Posts */}
      <mesh position={[DOUBLES_COURT_WIDTH / 2 + COURT_RENDERING.netPostPadding, 0.5, 0]}>
        <cylinderGeometry args={[COURT_RENDERING.lineWidth, COURT_RENDERING.lineWidth, COURT_RENDERING.netPostHeight]} />
        <meshStandardMaterial color={surfaceColors.netPost} />
      </mesh>
      <mesh position={[-DOUBLES_COURT_WIDTH / 2 - COURT_RENDERING.netPostPadding, 0.5, 0]}>
        <cylinderGeometry args={[COURT_RENDERING.lineWidth, COURT_RENDERING.lineWidth, COURT_RENDERING.netPostHeight]} />
        <meshStandardMaterial color={surfaceColors.netPost} />
      </mesh>
    </group>
  );
}
