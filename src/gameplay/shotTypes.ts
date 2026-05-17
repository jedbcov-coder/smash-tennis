export const SHOT_TYPES = ['flat', 'topspin', 'slice', 'lob', 'drop', 'smash', 'special'] as const;
export type ShotType = (typeof SHOT_TYPES)[number];

export const HIT_QUALITIES = ['early', 'good', 'perfect', 'late', 'miss'] as const;
export type HitQuality = (typeof HIT_QUALITIES)[number];

export interface ShotTypeTuning {
  speedMultiplier: number;
  arcMultiplier: number;
  spinMultiplier: number;
  riskMultiplier: number;
}

export interface HitQualityTuning {
  speedMultiplier: number;
  arcMultiplier: number;
  spinMultiplier: number;
  riskMultiplier: number;
}

export const SHOT_TYPE_TUNING: Record<ShotType, ShotTypeTuning> = {
  flat: { speedMultiplier: 1.08, arcMultiplier: 0.92, spinMultiplier: 0.55, riskMultiplier: 1.08 },
  topspin: { speedMultiplier: 1, arcMultiplier: 1.1, spinMultiplier: 1.35, riskMultiplier: 0.92 },
  slice: { speedMultiplier: 0.9, arcMultiplier: 0.86, spinMultiplier: -1.1, riskMultiplier: 0.98 },
  lob: { speedMultiplier: 0.78, arcMultiplier: 1.65, spinMultiplier: 0.7, riskMultiplier: 1.05 },
  drop: { speedMultiplier: 0.62, arcMultiplier: 0.78, spinMultiplier: -0.85, riskMultiplier: 1.28 },
  smash: { speedMultiplier: 1.42, arcMultiplier: 0.55, spinMultiplier: 0.65, riskMultiplier: 1.45 },
  special: { speedMultiplier: 1.55, arcMultiplier: 0.7, spinMultiplier: 1.65, riskMultiplier: 0.72 }
};

export const HIT_QUALITY_TUNING: Record<HitQuality, HitQualityTuning> = {
  early: { speedMultiplier: 0.94, arcMultiplier: 1.04, spinMultiplier: 0.85, riskMultiplier: 1.25 },
  good: { speedMultiplier: 1, arcMultiplier: 1, spinMultiplier: 1, riskMultiplier: 1 },
  perfect: { speedMultiplier: 1.12, arcMultiplier: 0.96, spinMultiplier: 1.18, riskMultiplier: 0.45 },
  late: { speedMultiplier: 0.92, arcMultiplier: 1.08, spinMultiplier: 0.8, riskMultiplier: 1.35 },
  miss: { speedMultiplier: 0.52, arcMultiplier: 0.65, spinMultiplier: 0.2, riskMultiplier: 2.4 }
};
