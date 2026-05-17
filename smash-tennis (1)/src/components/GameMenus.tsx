import { useEffect, useRef } from 'react';
import { playAudioEvent } from '../audio/audioManager';
import { COLOR_SCHEME } from '../design/colorScheme';
import { GRADIENTS } from '../design/gradients';
import { COURT_SURFACE_SETTINGS } from '../gameplay/gameTuning';
import { GameState, type CourtSurface, type PlayerType, type Score } from '../types';
import type { MatchStats, PointReward } from '../serve/useTennisGame';

const COURT_SURFACES = Object.keys(COURT_SURFACE_SETTINGS) as CourtSurface[];
const PLAYER_NAME = 'Blake';
const AI_NAME = 'Hidalgo';

export function GameMenus({
  gameState,
  winner,
  startGame,
  courtSurface,
  setCourtSurface,
  score,
  pointReward,
  matchStats
}: {
  gameState: GameState;
  winner: PlayerType | null;
  startGame: () => void;
  courtSurface: CourtSurface;
  setCourtSurface: (surface: CourtSurface) => void;
  score: Score;
  pointReward: PointReward | null;
  matchStats: MatchStats;
}) {
  const playedResultFor = useRef<PlayerType | null>(null);
  const selectedSurface = COURT_SURFACE_SETTINGS[courtSurface];

  const handleStartGame = () => {
    playAudioEvent('ui.select');
    startGame();
  };

  const handleSurfaceSelect = (surface: CourtSurface) => {
    playAudioEvent('ui.select');
    setCourtSurface(surface);
  };

  useEffect(() => {
    if (gameState !== GameState.GAME_OVER) {
      playedResultFor.current = null;
      return;
    }

    if (!winner || playedResultFor.current === winner) {
      return;
    }

    playedResultFor.current = winner;
    playAudioEvent(winner === 'PLAYER' ? 'match.win' : 'match.defeat');
  }, [gameState, winner]);

  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-black/82 p-6 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-75" style={{ background: GRADIENTS.uiBackground }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ background: GRADIENTS.crtScanline, backgroundSize: '100% 2px, 3px 100%' }} />

        <div className="relative flex flex-col items-center">
          <div className="mb-3 rounded-full border border-cyan-200/35 bg-black/55 px-4 py-1 text-[10px] font-black uppercase tracking-[0.45em] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.35)]">
            Arcade Rally Mode
          </div>
          <h1 className="neon-title mb-4 text-6xl font-black italic uppercase tracking-tighter text-white md:text-8xl">
            Neon Smash<br /><span>Tennis</span>
          </h1>
          <p className="mb-6 max-w-md text-sm uppercase tracking-widest text-slate-200">
            Pick a readable neon court, then move with the mouse and click or press Space to serve, swing, and smash.
          </p>

          <div className="mb-6 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {COURT_SURFACES.map((surface) => {
              const settings = COURT_SURFACE_SETTINGS[surface];
              const isSelected = surface === courtSurface;

              return (
                <button
                  key={surface}
                  type="button"
                  onClick={() => handleSurfaceSelect(surface)}
                  className={`rounded-2xl border bg-black/55 p-4 text-left uppercase tracking-widest transition-all hover:-translate-y-1 hover:bg-white/10 ${isSelected ? 'border-white shadow-[0_0_28px_rgba(255,255,255,0.24)]' : 'border-white/15'}`}
                  style={{ boxShadow: isSelected ? `0 0 28px ${settings.colors.lines}55` : undefined }}
                >
                  <div className="text-sm font-black text-white" style={{ color: settings.colors.lines }}>{settings.label}</div>
                  <div className="mt-2 text-[10px] leading-relaxed text-white/60">{settings.description}</div>
                </button>
              );
            })}
          </div>

          <div className="mb-8 rounded-lg border border-white/15 bg-black/55 px-4 py-3 text-xs uppercase tracking-widest text-white/70">
            Selected: <span className="font-black text-white" style={{ color: selectedSurface.colors.lines }}>{selectedSurface.label}</span>
            <span className="mx-2 text-white/25">|</span>
            Ball {(selectedSurface.ballSpeedMultiplier * 100).toFixed(0)}% · Bounce {(selectedSurface.bounceHeightMultiplier * 100).toFixed(0)}% · Slide {(selectedSurface.slideAmount * 100).toFixed(0)}% · Move {(selectedSurface.playerMovementMultiplier * 100).toFixed(0)}%
          </div>

          <button
            onClick={handleStartGame}
            className="neon-button rounded-lg px-12 py-4 text-xl font-black uppercase tracking-widest text-black transition-all hover:scale-105"
            style={{ background: GRADIENTS.button }}
          >
            Start Match
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.INTRO) {
    return (
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-6 text-center text-white">
        <div className="w-full max-w-3xl rounded-3xl border border-cyan-300/40 bg-slate-950/85 p-8 shadow-[0_0_50px_rgba(34,211,238,0.35)]">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.45em] text-cyan-200">Exhibition Match</div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="rounded-2xl bg-blue-600/25 p-5">
              <div className="text-sm uppercase tracking-widest text-blue-100/70">Player</div>
              <div className="text-4xl font-black italic uppercase text-blue-200">{PLAYER_NAME}</div>
            </div>
            <div className="text-3xl font-black italic text-white/70">VS</div>
            <div className="rounded-2xl bg-red-600/25 p-5">
              <div className="text-sm uppercase tracking-widest text-red-100/70">Rival</div>
              <div className="text-4xl font-black italic uppercase text-red-200">{AI_NAME}</div>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 uppercase tracking-widest text-white/80">
            Tonight on <span className="font-black" style={{ color: selectedSurface.colors.lines }}>{selectedSurface.label}</span>
          </div>
          <div className="mt-6 animate-pulse text-2xl font-black italic uppercase tracking-[0.35em] text-orange-200">Get Ready</div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    const isWin = winner === 'PLAYER';
    const pointXp = pointReward?.xpGained ?? 0;

    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/86 p-6 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-65" style={{ background: isWin ? GRADIENTS.uiBackground : GRADIENTS.danger }} />
        <div className="relative flex flex-col items-center">
          <div className="mb-3 rounded-full border border-white/25 bg-black/60 px-4 py-1 text-[10px] font-black uppercase tracking-[0.45em] text-white/75">
            Neon Smash Tennis
          </div>
          <h2
            className="neon-title mb-4 whitespace-pre-line text-6xl font-black italic uppercase tracking-tighter md:text-8xl"
            style={{ color: isWin ? COLOR_SCHEME.neon.cyanSoft : COLOR_SCHEME.neon.dangerHot }}
          >
            {isWin ? 'Match\nWon!' : 'Match\nLost'}
          </h2>
          <p className="mb-4 text-xl uppercase tracking-widest text-slate-200">
            {isWin ? 'You lit up the court, champion.' : 'Recharge and try one more rally.'}
          </p>
          <div className="mb-8 rounded-2xl border border-white/10 bg-black/45 px-5 py-3 text-xs uppercase tracking-widest text-white/70">
            Sets {score.playerSets}-{score.aiSets} · Games {score.playerGames}-{score.aiGames} · XP {matchStats.totalXp}
            {pointXp > 0 && <span className="text-cyan-200"> · Last point +{pointXp}</span>}
          </div>
          <button
            onClick={handleStartGame}
            className="neon-button rounded-lg px-12 py-4 text-xl font-black uppercase tracking-widest text-black transition-all hover:scale-105"
            style={{ background: GRADIENTS.button }}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
