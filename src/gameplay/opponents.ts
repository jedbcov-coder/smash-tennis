export type OpponentId = 'hidalgo' | 'nova' | 'racketron';

export type PreferredShotType = 'flat drive' | 'topspin curve' | 'slice angle';

export type SpecialMoveStyle = 'baseline blast' | 'neon rush' | 'glitch slice';

export interface OpponentProfile {
  id: OpponentId;
  displayName: string;
  theme: {
    label: string;
    color: string;
    glowColor: string;
  };
  movementSpeed: number;
  accuracy: number;
  aggression: number;
  missChance: number;
  preferredShotType: PreferredShotType;
  specialMoveStyle: SpecialMoveStyle;
  description: string;
}

export const OPPONENT_PROFILES: OpponentProfile[] = [
  {
    id: 'hidalgo',
    displayName: 'Hidalgo',
    theme: {
      label: 'Crimson Rival',
      color: '#ef4444',
      glowColor: '#f43f5e'
    },
    movementSpeed: 3.5,
    accuracy: 0.72,
    aggression: 0.55,
    missChance: 0.08,
    preferredShotType: 'topspin curve',
    specialMoveStyle: 'baseline blast',
    description: 'Balanced rallies with steady movement and curved returns.'
  },
  {
    id: 'nova',
    displayName: 'Nova',
    theme: {
      label: 'Cyan Sprinter',
      color: '#22d3ee',
      glowColor: '#67e8f9'
    },
    movementSpeed: 4.1,
    accuracy: 0.64,
    aggression: 0.82,
    missChance: 0.12,
    preferredShotType: 'flat drive',
    specialMoveStyle: 'neon rush',
    description: 'Fast feet and hard drives, but takes more risky swings.'
  },
  {
    id: 'racketron',
    displayName: 'Racketron',
    theme: {
      label: 'Violet Trickster',
      color: '#a78bfa',
      glowColor: '#e879f9'
    },
    movementSpeed: 3.15,
    accuracy: 0.86,
    aggression: 0.38,
    missChance: 0.05,
    preferredShotType: 'slice angle',
    specialMoveStyle: 'glitch slice',
    description: 'Slower court coverage with accurate angled slice shots.'
  }
];

export const DEFAULT_OPPONENT_PROFILE = OPPONENT_PROFILES[0];

export function getOpponentProfile(opponentId: OpponentId): OpponentProfile {
  return OPPONENT_PROFILES.find((opponent) => opponent.id === opponentId) ?? DEFAULT_OPPONENT_PROFILE;
}
