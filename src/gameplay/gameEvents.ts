export type GameEventName =
  | 'hit.normal'
  | 'smash.opportunity'
  | 'smash.activated'
  | 'smash.missed'
  | 'vfx.overheadSmash'
  | 'vfx.flameSmash';

export function dispatchGameEvent(name: GameEventName) {
  window.dispatchEvent(new CustomEvent(name));
}

export function subscribeToGameEvent(name: GameEventName, handler: EventListener) {
  window.addEventListener(name, handler);

  return () => {
    window.removeEventListener(name, handler);
  };
}
