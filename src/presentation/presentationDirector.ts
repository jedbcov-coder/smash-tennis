import { playAudioEvent, type AudioEventName } from '../audio/audioManager';
import type { PlayerType } from '../types';

export type PresentationMomentName =
  | 'match.intro'
  | 'serve.start'
  | 'return.perfect'
  | 'rally.long'
  | 'smash.opportunity'
  | 'smash.flame'
  | 'match.point'
  | 'match.result';

export type PresentationHudCallout =
  | 'GET READY'
  | 'SERVE START'
  | 'PERFECT RETURN'
  | 'LONG RALLY'
  | 'SMASH CHANCE'
  | 'MEGA SMASH'
  | 'POWER READY'
  | 'FLAME SMASH'
  | 'MATCH POINT'
  | 'YOU WIN'
  | 'TRY AGAIN'
  | 'TOO LATE'
  | 'SECOND BOUNCE'
  | 'LET'
  | `COMBO x${number}`;

export type PresentationVfxEventName =
  | 'vfx:hit.normal'
  | 'vfx:overhead-smash'
  | 'vfx:flame-smash'
  | 'vfx:smash-opportunity';

export type PresentationCameraInstruction =
  | { type: 'intro-pan'; durationMs: number }
  | { type: 'serve-focus'; servingPlayer: PlayerType; durationMs: number }
  | { type: 'return-pop'; durationMs: number; shakeSeconds: number }
  | { type: 'rally-pulse'; rallyCount: number; durationMs: number; shakeSeconds: number }
  | { type: 'smash-zoom'; durationMs: number; shakeSeconds: number }
  | { type: 'flame-smash-shake'; durationMs: number; shakeSeconds: number }
  | { type: 'match-point-tighten'; durationMs: number }
  | { type: 'result-hold'; winner: PlayerType; durationMs: number };

interface PresentationMomentContext {
  servingPlayer?: PlayerType;
  rallyCount?: number;
  winner?: PlayerType;
}

interface PresentationMomentPlan {
  camera?: PresentationCameraInstruction;
  hud?: PresentationHudCallout;
  audio?: AudioEventName;
  vfx?: PresentationVfxEventName;
}

interface PresentationDirectorHandlers {
  onCameraInstruction?: (instruction: PresentationCameraInstruction) => void;
  onHudCallout?: (callout: PresentationHudCallout) => void;
  playAudio?: (eventName: AudioEventName) => void;
  dispatchVfx?: (eventName: PresentationVfxEventName) => void;
}

function dispatchBrowserEvent<T>(name: string, detail?: T) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function getPresentationMomentPlan(moment: PresentationMomentName, context: PresentationMomentContext = {}): PresentationMomentPlan {
  switch (moment) {
    case 'match.intro':
      return {
        camera: { type: 'intro-pan', durationMs: 1800 },
        hud: 'GET READY',
        audio: 'ui.start'
      };
    case 'serve.start':
      return {
        camera: { type: 'serve-focus', servingPlayer: context.servingPlayer ?? 'PLAYER', durationMs: 900 },
        hud: 'SERVE START'
      };
    case 'return.perfect':
      return {
        camera: { type: 'return-pop', durationMs: 450, shakeSeconds: 0.12 },
        hud: 'PERFECT RETURN',
        audio: 'return.perfect',
        vfx: 'vfx:hit.normal'
      };
    case 'rally.long':
      return {
        camera: { type: 'rally-pulse', rallyCount: context.rallyCount ?? 0, durationMs: 650, shakeSeconds: 0.08 },
        hud: 'LONG RALLY',
        audio: 'combo.increase'
      };
    case 'smash.opportunity':
      return {
        camera: { type: 'smash-zoom', durationMs: 800, shakeSeconds: 0.1 },
        hud: 'SMASH CHANCE',
        vfx: 'vfx:smash-opportunity'
      };
    case 'smash.flame':
      return {
        camera: { type: 'flame-smash-shake', durationMs: 700, shakeSeconds: 0.36 },
        hud: 'FLAME SMASH',
        audio: 'special.flameSmash',
        vfx: 'vfx:flame-smash'
      };
    case 'match.point':
      return {
        camera: { type: 'match-point-tighten', durationMs: 1200 },
        hud: 'MATCH POINT',
        audio: 'match.point'
      };
    case 'match.result': {
      const winner = context.winner ?? 'AI';
      return {
        camera: { type: 'result-hold', winner, durationMs: 1600 },
        hud: winner === 'PLAYER' ? 'YOU WIN' : 'TRY AGAIN',
        audio: winner === 'PLAYER' ? 'match.win' : 'match.defeat'
      };
    }
  }
}

export function createPresentationDirector(handlers: PresentationDirectorHandlers = {}) {
  const triggerCameraInstruction = (instruction: PresentationCameraInstruction) => {
    handlers.onCameraInstruction?.(instruction);
    dispatchBrowserEvent('presentation:camera', instruction);
  };

  const triggerHudCallout = (callout: PresentationHudCallout) => {
    handlers.onHudCallout?.(callout);
    dispatchBrowserEvent('presentation:hud-callout', callout);
  };

  const triggerAudioEvent = (eventName: AudioEventName) => {
    if (handlers.playAudio) {
      handlers.playAudio(eventName);
      return;
    }

    playAudioEvent(eventName);
  };

  const triggerVfxEvent = (eventName: PresentationVfxEventName) => {
    if (handlers.dispatchVfx) {
      handlers.dispatchVfx(eventName);
      return;
    }

    dispatchBrowserEvent(eventName);
  };

  const presentMoment = (moment: PresentationMomentName, context?: PresentationMomentContext) => {
    const plan = getPresentationMomentPlan(moment, context);

    if (plan.camera) triggerCameraInstruction(plan.camera);
    if (plan.hud) triggerHudCallout(plan.hud);
    if (plan.audio) triggerAudioEvent(plan.audio);
    if (plan.vfx) triggerVfxEvent(plan.vfx);
  };

  return {
    presentMoment,
    triggerCameraInstruction,
    triggerHudCallout,
    triggerAudioEvent,
    triggerVfxEvent
  };
}

export const presentationDirector = createPresentationDirector();
