import * as THREE from 'three';
import { COLOR_SCHEME } from '../design/colorScheme';
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
  const lineGlowWidth = COURT_RENDERING.lineWidth * 2.25;
  const singlesGlowWidth = COURT_RENDERING.lineWidth * 3.1;
  const borderGlowWidth = COURT_RENDERING.lineWidth * 3.2;
  const doublesLaneWidth = (DOUBLES_COURT_WIDTH - SINGLES_COURT_WIDTH) / 2;

  return (
    <group>
      {/* Dark arcade floor around the playable court. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[COURT_RENDERING.surroundingWidth, COURT_RENDERING.surroundingLength]} />
        <meshStandardMaterial
          color={surfaceColors.surrounding}
          emissive={surfaceColors.surrounding}
          emissiveIntensity={0.16}
          roughness={TEXTURE_RULES.court.roughness}
        />
      </mesh>

      {/* Main playing surface with a darker base so the lines and ball stay readable. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} receiveShadow>
        <planeGeometry args={[DOUBLES_COURT_WIDTH, COURT_LENGTH]} />
        <meshStandardMaterial
          color={surfaceColors.playingSurface}
          emissive={surfaceColors.playingSurface}
          emissiveIntensity={0.2}
          roughness={TEXTURE_RULES.court.roughness}
        />
      </mesh>

      {/* Doubles alleys are decorative in singles mode, so keep them visible but quieter. */}
      <group position={[0, -0.02, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(SINGLES_COURT_WIDTH + DOUBLES_COURT_WIDTH) / 4, 0, 0]} receiveShadow>
          <planeGeometry args={[doublesLaneWidth, COURT_LENGTH]} />
          <meshStandardMaterial
            color={surfaceColors.surrounding}
            emissive={surfaceColors.surrounding}
            emissiveIntensity={0.07}
            roughness={TEXTURE_RULES.court.roughness}
            transparent
            opacity={0.52}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-(SINGLES_COURT_WIDTH + DOUBLES_COURT_WIDTH) / 4, 0, 0]} receiveShadow>
          <planeGeometry args={[doublesLaneWidth, COURT_LENGTH]} />
          <meshStandardMaterial
            color={surfaceColors.surrounding}
            emissive={surfaceColors.surrounding}
            emissiveIntensity={0.07}
            roughness={TEXTURE_RULES.court.roughness}
            transparent
            opacity={0.52}
          />
        </mesh>
      </group>

      {/* Soft neon border glow just outside the court. */}
      <group position={[0, 0.004, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, COURT_LENGTH / 2 + 0.08]}>
          <planeGeometry args={[DOUBLES_COURT_WIDTH + 0.55, borderGlowWidth]} />
          <meshBasicMaterial color={COLOR_SCHEME.neon.magentaHot} transparent opacity={0.28} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -COURT_LENGTH / 2 - 0.08]}>
          <planeGeometry args={[DOUBLES_COURT_WIDTH + 0.55, borderGlowWidth]} />
          <meshBasicMaterial color={COLOR_SCHEME.neon.magentaHot} transparent opacity={0.28} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[DOUBLES_COURT_WIDTH / 2 + 0.08, 0, 0]}>
          <planeGeometry args={[borderGlowWidth, COURT_LENGTH + 0.55]} />
          <meshBasicMaterial color={COLOR_SCHEME.neon.cyan} transparent opacity={0.26} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-DOUBLES_COURT_WIDTH / 2 - 0.08, 0, 0]}>
          <planeGeometry args={[borderGlowWidth, COURT_LENGTH + 0.55]} />
          <meshBasicMaterial color={COLOR_SCHEME.neon.cyan} transparent opacity={0.26} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Lines Group */}
      <group position={[0, 0.018, 0]}>
        {/* Baselines */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, COURT_LENGTH / 2]}>
          <planeGeometry args={[DOUBLES_COURT_WIDTH, lineGlowWidth]} />
          <meshBasicMaterial color={surfaceColors.lines} transparent opacity={0.28} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, COURT_LENGTH / 2]}>
          <planeGeometry args={[DOUBLES_COURT_WIDTH, COURT_RENDERING.lineWidth]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, -COURT_LENGTH / 2]}>
          <planeGeometry args={[DOUBLES_COURT_WIDTH, lineGlowWidth]} />
          <meshBasicMaterial color={surfaceColors.lines} transparent opacity={0.28} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -COURT_LENGTH / 2]}>
          <planeGeometry args={[DOUBLES_COURT_WIDTH, COURT_RENDERING.lineWidth]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>

        {/* Doubles Sidelines (decorative in singles play) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[DOUBLES_COURT_WIDTH / 2, -0.004, 0]}>
          <planeGeometry args={[lineGlowWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} transparent opacity={0.12} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[DOUBLES_COURT_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[COURT_RENDERING.lineWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-DOUBLES_COURT_WIDTH / 2, -0.004, 0]}>
          <planeGeometry args={[lineGlowWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} transparent opacity={0.12} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-DOUBLES_COURT_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[COURT_RENDERING.lineWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>

        {/* Singles Sidelines (gameplay boundaries) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SINGLES_COURT_WIDTH / 2, -0.004, 0]}>
          <planeGeometry args={[singlesGlowWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} transparent opacity={0.38} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SINGLES_COURT_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[COURT_RENDERING.lineWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-SINGLES_COURT_WIDTH / 2, -0.004, 0]}>
          <planeGeometry args={[singlesGlowWidth, COURT_LENGTH]} />
          <meshBasicMaterial color={surfaceColors.lines} transparent opacity={0.38} blending={THREE.AdditiveBlending} />
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
          <meshBasicMaterial color={COLOR_SCHEME.neon.gold} opacity={0.45} transparent blending={THREE.AdditiveBlending} />
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
            emissive={surfaceColors.net}
            emissiveIntensity={0.7}
            transparent
            opacity={0.34}
            wireframe={true}
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
          <meshStandardMaterial color={surfaceColors.net} emissive={surfaceColors.net} emissiveIntensity={0.55} />
        </mesh>
      </group>

      {/* Net Posts */}
      <mesh position={[DOUBLES_COURT_WIDTH / 2 + COURT_RENDERING.netPostPadding, 0.5, 0]}>
        <cylinderGeometry args={[COURT_RENDERING.lineWidth, COURT_RENDERING.lineWidth, COURT_RENDERING.netPostHeight]} />
        <meshStandardMaterial color={surfaceColors.netPost} emissive={surfaceColors.netPost} emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[-DOUBLES_COURT_WIDTH / 2 - COURT_RENDERING.netPostPadding, 0.5, 0]}>
        <cylinderGeometry args={[COURT_RENDERING.lineWidth, COURT_RENDERING.lineWidth, COURT_RENDERING.netPostHeight]} />
        <meshStandardMaterial color={surfaceColors.netPost} emissive={surfaceColors.netPost} emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}
