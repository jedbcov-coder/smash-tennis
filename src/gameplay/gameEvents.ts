export type GameEventName =
  | 'vfx:hit.normal'
  | 'vfx:smash-opportunity'
  | 'vfx:overhead-smash'
  | 'vfx:flame-smash';

export function dispatchGameEvent(name: GameEventName) {
  window.dispatchEvent(new CustomEvent(name));
}
