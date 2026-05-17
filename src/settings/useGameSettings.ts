import { useEffect, useState } from 'react';

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  reducedMotion: boolean;
  screenShakeAmount: number;
  highContrastMode: boolean;
  showInputHelp: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 80,
  reducedMotion: false,
  screenShakeAmount: 70,
  highContrastMode: false,
  showInputHelp: true
};

const STORAGE_KEY = 'smash-tennis-game-settings-v1';

const clampPercent = (value: unknown, fallback: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
};

const readSavedBoolean = (value: unknown, fallback: boolean) => {
  return typeof value === 'boolean' ? value : fallback;
};

const readSavedSettings = (): GameSettings => {
  if (typeof window === 'undefined') return DEFAULT_GAME_SETTINGS;

  const savedSettings = window.localStorage.getItem(STORAGE_KEY);
  if (!savedSettings) return DEFAULT_GAME_SETTINGS;

  try {
    const parsedSettings = JSON.parse(savedSettings) as Partial<GameSettings>;

    return {
      masterVolume: clampPercent(parsedSettings.masterVolume, DEFAULT_GAME_SETTINGS.masterVolume),
      musicVolume: clampPercent(parsedSettings.musicVolume, DEFAULT_GAME_SETTINGS.musicVolume),
      sfxVolume: clampPercent(parsedSettings.sfxVolume, DEFAULT_GAME_SETTINGS.sfxVolume),
      reducedMotion: readSavedBoolean(parsedSettings.reducedMotion, DEFAULT_GAME_SETTINGS.reducedMotion),
      screenShakeAmount: clampPercent(parsedSettings.screenShakeAmount, DEFAULT_GAME_SETTINGS.screenShakeAmount),
      highContrastMode: readSavedBoolean(parsedSettings.highContrastMode, DEFAULT_GAME_SETTINGS.highContrastMode),
      showInputHelp: readSavedBoolean(parsedSettings.showInputHelp, DEFAULT_GAME_SETTINGS.showInputHelp)
    };
  } catch {
    return DEFAULT_GAME_SETTINGS;
  }
};

export function useGameSettings() {
  const [settings, setSettingsState] = useState<GameSettings>(readSavedSettings);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setSettings = (nextSettings: Partial<GameSettings>) => {
    setSettingsState((currentSettings) => ({ ...currentSettings, ...nextSettings }));
  };

  const resetSettings = () => {
    setSettingsState(DEFAULT_GAME_SETTINGS);
  };

  return { settings, setSettings, resetSettings };
}
