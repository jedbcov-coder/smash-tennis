export type AudioSettings = {
  masterVolume: number;
  sfxVolume: number;
  uiVolume: number;
  musicVolume: number;
  muted: boolean;
};

export type AudioMixerChannel = 'sfx' | 'ui' | 'music';

const STORAGE_KEY = 'smash-tennis-audio-settings';

export const defaultAudioSettings: AudioSettings = {
  masterVolume: 1,
  sfxVolume: 1,
  uiVolume: 1,
  // Reserved for future background music. Keeping it here lets the game save
  // one complete audio-settings object before music is added.
  musicVolume: 1,
  muted: false
};

let currentAudioSettings: AudioSettings = { ...defaultAudioSettings };

const clampVolume = (value: unknown, fallback: number) => {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
};

const readBoolean = (value: unknown, fallback: boolean) => {
  return typeof value === 'boolean' ? value : fallback;
};

const getSafeLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const normalizeAudioSettings = (settings: Partial<AudioSettings>): AudioSettings => ({
  masterVolume: clampVolume(settings.masterVolume, defaultAudioSettings.masterVolume),
  sfxVolume: clampVolume(settings.sfxVolume, defaultAudioSettings.sfxVolume),
  uiVolume: clampVolume(settings.uiVolume, defaultAudioSettings.uiVolume),
  musicVolume: clampVolume(settings.musicVolume, defaultAudioSettings.musicVolume),
  muted: readBoolean(settings.muted, defaultAudioSettings.muted)
});

const loadAudioSettings = () => {
  const storage = getSafeLocalStorage();

  if (!storage) {
    return;
  }

  try {
    const savedSettings = storage.getItem(STORAGE_KEY);

    if (!savedSettings) {
      return;
    }

    const parsedSettings = JSON.parse(savedSettings) as unknown;

    if (parsedSettings && typeof parsedSettings === 'object') {
      currentAudioSettings = normalizeAudioSettings(parsedSettings as Partial<AudioSettings>);
    }
  } catch {
    currentAudioSettings = { ...defaultAudioSettings };
  }
};

const saveAudioSettings = () => {
  const storage = getSafeLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(currentAudioSettings));
  } catch {
    // Storage can be blocked in private browsing or embedded previews. Audio
    // should still work with in-memory settings if saving fails.
  }
};

loadAudioSettings();

export const getAudioSettings = () => ({ ...currentAudioSettings });

export const updateAudioSettings = (settings: Partial<AudioSettings>) => {
  currentAudioSettings = normalizeAudioSettings({ ...currentAudioSettings, ...settings });
  saveAudioSettings();

  return getAudioSettings();
};

export const setAudioMuted = (muted: boolean) => updateAudioSettings({ muted });

export const getAudioEventVolume = (channel: AudioMixerChannel) => {
  const settings = getAudioSettings();

  if (settings.muted) {
    return 0;
  }

  const channelVolume =
    channel === 'ui' ? settings.uiVolume : channel === 'music' ? settings.musicVolume : settings.sfxVolume;

  return settings.masterVolume * channelVolume;
};

export const volumeToDecibelAdjustment = (volume: number) => {
  const safeVolume = clampVolume(volume, 0);

  if (safeVolume <= 0) {
    return Number.NEGATIVE_INFINITY;
  }

  return 20 * Math.log10(safeVolume);
};
