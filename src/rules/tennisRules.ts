import type { PlayerType } from '../types';

export type RuleDecision =
  | { type: 'fault' }
  | { type: 'let' }
  | { type: 'continue' }
  | { type: 'point'; winner: PlayerType };

interface DecideFirstBounceOutcomeInput {
  hitter: PlayerType;
  isServe: boolean;
  landedInBounds: boolean;
  serveTouchedNet: boolean;
}

export function decideFirstBounceOutcome(input: DecideFirstBounceOutcomeInput): RuleDecision {
  if (!input.landedInBounds) {
    if (input.isServe) {
      return { type: 'fault' };
    }

    return { type: 'point', winner: input.hitter === 'PLAYER' ? 'AI' : 'PLAYER' };
  }

  if (input.isServe && input.serveTouchedNet) {
    return { type: 'let' };
  }

  return { type: 'continue' };
}
