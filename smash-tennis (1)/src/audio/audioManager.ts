import { playHitSound, playMissSound, playScoreSound } from './sounds';

export type AudioEventName =
  | 'hit.normal'
  | 'hit.smash'
  | 'point.player'
  | 'point.ai'
  | 'ai.nearMiss'
  | 'ui.start'
  | 'special.flameSmash';

export const playAudioEvent = (eventName: AudioEventName) => {
  switch (eventName) {
    case 'hit.normal':
    case 'hit.smash':
    case 'special.flameSmash':
      return playHitSound();
    case 'point.player':
    case 'ui.start':
      return playScoreSound();
    case 'point.ai':
    case 'ai.nearMiss':
      return playMissSound();
  }
};
