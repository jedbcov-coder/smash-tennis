import type { CourtSurface, PlayerType } from '../types';

const PLAYER_PROGRESS_STORAGE_KEY = 'smash-tennis-player-progress-v1';
export const PLAYER_LEVEL_XP = 250;

export interface PlayerProgress {
  playerLevel: number;
  totalXp: number;
  unlockedCourts: CourtSurface[];
  unlockedCosmetics: string[];
  bestRally: number;
  bestCombo: number;
  matchWins: number;
  matchLosses: number;
}

export interface ProgressPointReward {
  winner: PlayerType;
  rallyLength: number;
  comboCount: number;
  xpGained: number;
}

const DEFAULT_UNLOCKED_COURTS: CourtSurface[] = ['grass', 'hard'];
const DEFAULT_UNLOCKED_COSMETICS = ['classic-blue-kit'];

const COURT_UNLOCKS_BY_LEVEL: Array<{ level: number; court: CourtSurface }> = [
  { level: 2, court: 'clay' },
  { level: 3, court: 'neon' },
  { level: 4, court: 'ice' }
];

const COSMETIC_UNLOCKS_BY_LEVEL = [
  { level: 2, cosmetic: 'cyan-wristbands' },
  { level: 3, cosmetic: 'gold-racket' },
  { level: 4, cosmetic: 'flame-trail' }
];

function isBrowserStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function calculateLevel(totalXp: number): number {
  return Math.max(1, Math.floor(totalXp / PLAYER_LEVEL_XP) + 1);
}

function addUniqueItem<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}

function applyLevelUnlocks(progress: PlayerProgress): PlayerProgress {
  let unlockedCourts = [...progress.unlockedCourts];
  let unlockedCosmetics = [...progress.unlockedCosmetics];

  COURT_UNLOCKS_BY_LEVEL.forEach(({ level, court }) => {
    if (progress.playerLevel >= level) {
      unlockedCourts = addUniqueItem(unlockedCourts, court);
    }
  });

  COSMETIC_UNLOCKS_BY_LEVEL.forEach(({ level, cosmetic }) => {
    if (progress.playerLevel >= level) {
      unlockedCosmetics = addUniqueItem(unlockedCosmetics, cosmetic);
    }
  });

  return {
    ...progress,
    unlockedCourts,
    unlockedCosmetics
  };
}

function normalizeProgress(progress: Partial<PlayerProgress> | null): PlayerProgress {
  const totalXp = Math.max(0, Math.floor(progress?.totalXp ?? 0));
  const normalizedProgress: PlayerProgress = {
    playerLevel: calculateLevel(totalXp),
    totalXp,
    unlockedCourts: progress?.unlockedCourts?.length ? progress.unlockedCourts : DEFAULT_UNLOCKED_COURTS,
    unlockedCosmetics: progress?.unlockedCosmetics?.length ? progress.unlockedCosmetics : DEFAULT_UNLOCKED_COSMETICS,
    bestRally: Math.max(0, Math.floor(progress?.bestRally ?? 0)),
    bestCombo: Math.max(0, Math.floor(progress?.bestCombo ?? 0)),
    matchWins: Math.max(0, Math.floor(progress?.matchWins ?? 0)),
    matchLosses: Math.max(0, Math.floor(progress?.matchLosses ?? 0))
  };

  return applyLevelUnlocks(normalizedProgress);
}

export function getDefaultPlayerProgress(): PlayerProgress {
  return normalizeProgress(null);
}

export function loadPlayerProgress(): PlayerProgress {
  if (!isBrowserStorageAvailable()) {
    return getDefaultPlayerProgress();
  }

  try {
    const savedProgress = window.localStorage.getItem(PLAYER_PROGRESS_STORAGE_KEY);
    if (!savedProgress) {
      return getDefaultPlayerProgress();
    }

    return normalizeProgress(JSON.parse(savedProgress) as Partial<PlayerProgress>);
  } catch {
    return getDefaultPlayerProgress();
  }
}

export function savePlayerProgress(progress: PlayerProgress): PlayerProgress {
  const normalizedProgress = normalizeProgress(progress);

  try {
    if (isBrowserStorageAvailable()) {
      window.localStorage.setItem(PLAYER_PROGRESS_STORAGE_KEY, JSON.stringify(normalizedProgress));
    }
  } catch {
    // Keep the game playable if the browser blocks localStorage.
  }

  return normalizedProgress;
}

export function recordPointProgress(currentProgress: PlayerProgress, reward: ProgressPointReward): PlayerProgress {
  return savePlayerProgress({
    ...currentProgress,
    totalXp: currentProgress.totalXp + reward.xpGained,
    bestRally: Math.max(currentProgress.bestRally, reward.rallyLength),
    bestCombo: Math.max(currentProgress.bestCombo, reward.comboCount)
  });
}

export function recordMatchProgress(currentProgress: PlayerProgress, winner: PlayerType): PlayerProgress {
  return savePlayerProgress({
    ...currentProgress,
    matchWins: currentProgress.matchWins + (winner === 'PLAYER' ? 1 : 0),
    matchLosses: currentProgress.matchLosses + (winner === 'AI' ? 1 : 0)
  });
}
