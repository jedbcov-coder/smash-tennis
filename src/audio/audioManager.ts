import {
  playComboIncreaseSound,
  playCurveHitSound,
  playDefeatSound,
  playMatchPointSound,
  playMegaSmashSound,
  playMissSound,
  playNormalHitSound,
  playPerfectReturnSound,
  playPowerReadySound,
  playScoreSound,
  playSmashHitSound,
  playUiHoverSound,
  playUiSelectSound,
  playWinSound
} from './sounds';
import {
  type AudioMixerChannel,
  getAudioEventVolume,
  updateAudioSettings,
  volumeToDecibelAdjustment
} from './audioSettings';

export const setAudioSettings = updateAudioSettings;

export type AudioEventName =
  | 'hit.normal'
  | 'hit.curve'
  | 'hit.smash'
  | 'return.perfect'
  | 'smash.mega'
  | 'power.ready'
  | 'combo.increase'
  | 'match.point'
  | 'ui.hover'
  | 'ui.select'
  | 'match.win'
  | 'match.defeat'
  | 'point.player'
  | 'point.ai'
  | 'ai.nearMiss'
  | 'ui.start'
  | 'special.flameSmash';


const uiAudioEvents = new Set<AudioEventName>(['ui.hover', 'ui.select', 'ui.start']);

const getAudioEventChannel = (eventName: AudioEventName): AudioMixerChannel => {
  return uiAudioEvents.has(eventName) ? 'ui' : 'sfx';
};

export const playAudioEvent = (eventName: AudioEventName) => {
  const eventVolume = getAudioEventVolume(getAudioEventChannel(eventName));

  if (eventVolume <= 0) {
    return;
  }

  const volumeAdjustment = volumeToDecibelAdjustment(eventVolume);

  switch (eventName) {
    case 'hit.normal':
      return playNormalHitSound(volumeAdjustment);
    case 'hit.curve':
      return playCurveHitSound(volumeAdjustment);
    case 'hit.smash':
      return playSmashHitSound(volumeAdjustment);
    case 'return.perfect':
      return playPerfectReturnSound(volumeAdjustment);
    case 'smash.mega':
    case 'special.flameSmash':
      return playMegaSmashSound(volumeAdjustment);
    case 'power.ready':
      return playPowerReadySound(volumeAdjustment);
    case 'combo.increase':
      return playComboIncreaseSound(volumeAdjustment);
    case 'match.point':
      return playMatchPointSound(volumeAdjustment);
    case 'ui.hover':
      return playUiHoverSound(volumeAdjustment);
    case 'ui.select':
    case 'ui.start':
      return playUiSelectSound(volumeAdjustment);
    case 'match.win':
      return playWinSound(volumeAdjustment);
    case 'match.defeat':
      return playDefeatSound(volumeAdjustment);
    case 'point.player':
      return playScoreSound(volumeAdjustment);
    case 'point.ai':
    case 'ai.nearMiss':
      return playMissSound(volumeAdjustment);
  }
};
