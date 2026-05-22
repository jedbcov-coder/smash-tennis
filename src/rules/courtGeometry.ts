import { ARCADE_LANDING_FORGIVENESS, COURT_LENGTH, COURT_RENDERING, ERROR_MARGINS, SINGLES_COURT_WIDTH } from '../gameplay/gameTuning';
import type { PlayerType } from '../types';
import type { ServeSide } from '../physics/ShotPhysics';

const SINGLES_HALF_WIDTH = SINGLES_COURT_WIDTH / 2;

function getSinglesHalfWidthWithMargin() {
  return SINGLES_HALF_WIDTH + ERROR_MARGINS.width + ARCADE_LANDING_FORGIVENESS;
}

function getServiceLineWithMargin() {
  return COURT_RENDERING.serviceLineZ + ERROR_MARGINS.length + ARCADE_LANDING_FORGIVENESS;
}

function getCenterLineMargin() {
  return ERROR_MARGINS.length + ARCADE_LANDING_FORGIVENESS;
}

export function getDiagonalServiceBoxTarget({ hitter, serveSide }: { hitter: PlayerType; serveSide: ServeSide }) {
  const serviceLineZ = COURT_RENDERING.serviceLineZ;
  const targetZ = hitter === 'PLAYER' ? -serviceLineZ * 0.6 : serviceLineZ * 0.6;
  const targetX =
    hitter === 'PLAYER'
      ? serveSide === 'DEUCE'
        ? SINGLES_HALF_WIDTH * 0.5
        : -SINGLES_HALF_WIDTH * 0.5
      : serveSide === 'DEUCE'
        ? -SINGLES_HALF_WIDTH * 0.5
        : SINGLES_HALF_WIDTH * 0.5;

  return {
    targetX,
    targetZ,
    minZ: hitter === 'PLAYER' ? -getServiceLineWithMargin() : getCenterLineMargin(),
    maxZ: hitter === 'PLAYER' ? -getCenterLineMargin() : getServiceLineWithMargin(),
    landsOnPositiveX: targetX >= 0
  };
}

export function isWithinSinglesBounds(x: number, z: number): boolean {
  const halfWidth = getSinglesHalfWidthWithMargin();
  const halfLength = COURT_LENGTH / 2 + ERROR_MARGINS.length + ARCADE_LANDING_FORGIVENESS;

  return Math.abs(x) <= halfWidth && z >= -halfLength && z <= halfLength;
}

export function isWithinDiagonalServiceBox(x: number, z: number, hitter: PlayerType, serveSide: ServeSide): boolean {
  if (!isWithinSinglesBounds(x, z)) {
    return false;
  }

  const centerLineMargin = getCenterLineMargin();
  const targetBox = getDiagonalServiceBoxTarget({ hitter, serveSide });

  if (z < targetBox.minZ || z > targetBox.maxZ) return false;
  if (targetBox.landsOnPositiveX) return x >= -centerLineMargin;
  return x <= centerLineMargin;
}

export function isFirstBounceLegalInSingles(x: number, z: number, landingSide: 'PLAYER' | 'AI'): boolean {
  if (!isWithinSinglesBounds(x, z)) {
    return false;
  }

  const centerLineMargin = getCenterLineMargin();

  if (landingSide === 'AI') {
    return z <= centerLineMargin;
  }

  return z >= -centerLineMargin;
}
