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

export const playAudioEvent = (eventName: AudioEventName) => {
  switch (eventName) {
    case 'hit.normal':
      return playNormalHitSound();
    case 'hit.curve':
      return playCurveHitSound();
    case 'hit.smash':
    case 'special.flameSmash':
      return playHitSound();
    case 'point.player':
    case 'ui.start':
      return playUiSelectSound();
    case 'match.win':
      return playWinSound();
    case 'match.defeat':
      return playDefeatSound();
    case 'point.player':
      return playScoreSound();
    case 'point.ai':
    case 'ai.nearMiss':
      return playMissSound();
  }
};
