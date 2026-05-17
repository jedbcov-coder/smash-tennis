import { useEffect, useRef } from 'react';
import { playAudioEvent } from '../audio/audioManager';
import { COLOR_SCHEME } from '../design/colorScheme';
import { GRADIENTS } from '../design/gradients';
import { COURT_SURFACE_SETTINGS } from '../gameplay/gameTuning';
import { PLAYER_LEVEL_XP, type PlayerProgress } from '../progression/playerProgress';
import type { MatchStats, PointReward } from '../serve/useTennisGame';
import { GameState, type CourtSurface, type PlayerType, type Score } from '../types';

const COURT_SURFACES = Object.keys(COURT_SURFACE_SETTINGS) as CourtSurface[];
const PLAYER_NAME = 'Blake';

export function GameMenus({
  gameState,
  winner,
  startGame,
  courtSurface,
  setCourtSurface,
  score,
  pointReward,
  matchStats,
  playerProgress
}: {
  gameState: GameState;
  winner: PlayerType | null;
  startGame: () => void;
  courtSurface: CourtSurface;
  setCourtSurface: (surface: CourtSurface) => void;
  score: Score;
  pointReward: PointReward | null;
  matchStats: MatchStats;
  playerProgress: PlayerProgress;
}) {
  const selectedSurface = COURT_SURFACE_SETTINGS[courtSurface];
  const playedResultFor = useRef<PlayerType | null>(null);

  const handleStartGame = () => {
    playAudioEvent('ui.select');
    startGame();
  };

  const handleSurfaceSelect = (surface: CourtSurface) => {
    playAudioEvent('ui.select');
    setCourtSurface(surface);
  };

  const handleOpponentSelect = (opponentId: OpponentId) => {
    playAudioEvent('ui.select');
    setOpponentId(opponentId);
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
            Pick a readable neon court, then move with the mouse and click the court or press Space to serve, swing, and smash.
          </p>

          <div className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-cyan-100/75">Choose court</div>
          <div className="mb-6 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {COURT_SURFACES.map((surface) => {
              const settings = COURT_SURFACE_SETTINGS[surface];
              const isSelected = surface === courtSurface;

              return (
                <button
                  key={surface}
                  onClick={() => handleSurfaceSelect(surface)}
                  className={`rounded-2xl border bg-black/55 p-4 text-left transition-all hover:-translate-y-1 hover:bg-white/10 ${isSelected ? 'border-white shadow-[0_0_24px_rgba(255,255,255,0.28)]' : 'border-white/15'}`}
                  style={{ boxShadow: isSelected ? `0 0 28px ${settings.colors.lines}66` : undefined }}
                >
                  <div className="mb-2 h-2 rounded-full" style={{ background: settings.colors.lines }} />
                  <div className="text-sm font-black uppercase tracking-widest text-white">{settings.label}</div>
                  <div className="mt-2 text-[11px] uppercase leading-relaxed tracking-wider text-white/60">{settings.description}</div>
                </button>
              );
            })}
          </div>

          <div className="mb-4 rounded-lg border border-white/15 bg-black/55 px-4 py-3 text-xs uppercase tracking-widest text-white/70">
            Selected: <span className="font-black text-white" style={{ color: selectedSurface.colors.lines }}>{selectedSurface.label}</span>
            <span className="mx-2 text-white/25">|</span>
            Ball {(selectedSurface.ballSpeedMultiplier * 100).toFixed(0)}% · Bounce {(selectedSurface.bounceHeightMultiplier * 100).toFixed(0)}% · Slide {(selectedSurface.slideAmount * 100).toFixed(0)}% · Move {(selectedSurface.playerMovementMultiplier * 100).toFixed(0)}%
          </div>

          <div className="mb-8 grid w-full max-w-2xl grid-cols-2 gap-3 rounded-2xl border border-cyan-200/20 bg-black/50 p-4 text-left text-xs uppercase tracking-widest text-white/70 md:grid-cols-4">
            <div><span className="block text-white/45">Level</span><span className="font-black text-white">{playerProgress.playerLevel}</span></div>
            <div><span className="block text-white/45">Total XP</span><span className="font-black text-white">{playerProgress.totalXp}</span></div>
            <div><span className="block text-white/45">Record</span><span className="font-black text-white">{playerProgress.matchWins}-{playerProgress.matchLosses}</span></div>
            <div><span className="block text-white/45">Best Rally</span><span className="font-black text-white">{playerProgress.bestRally}</span></div>
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
            <div className="rounded-2xl p-5" style={{ background: `${opponentProfile.theme.color}33` }}>
              <div className="text-sm uppercase tracking-widest text-white/70">Rival</div>
              <div className="text-4xl font-black italic uppercase" style={{ color: opponentProfile.theme.glowColor }}>{opponentProfile.displayName}</div>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 uppercase tracking-widest text-white/80">
            Tonight on <span className="font-black" style={{ color: selectedSurface.colors.lines }}>{selectedSurface.label}</span> against <span className="font-black" style={{ color: opponentProfile.theme.glowColor }}>{opponentProfile.displayName}</span>
          </div>
          <div className="mt-6 animate-pulse text-2xl font-black italic uppercase tracking-[0.35em] text-orange-200">Get Ready</div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    const isWin = winner === 'PLAYER';
    const xpIntoLevel = playerProgress.totalXp % PLAYER_LEVEL_XP;
    const progressPercent = Math.min(100, (xpIntoLevel / PLAYER_LEVEL_XP) * 100);

    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/86 p-6 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-65" style={{ background: isWin ? GRADIENTS.uiBackground : GRADIENTS.danger }} />
        <div className="relative flex w-full max-w-2xl flex-col items-center">
          <div className="mb-3 rounded-full border border-white/25 bg-black/60 px-4 py-1 text-[10px] font-black uppercase tracking-[0.45em] text-white/75">
            Neon Smash Tennis
          </div>
          <h2
            className="neon-title mb-4 whitespace-pre-line text-6xl font-black italic uppercase tracking-tighter md:text-8xl"
            style={{ color: isWin ? COLOR_SCHEME.neon.cyanSoft : COLOR_SCHEME.neon.dangerHot }}
          >
            {isWin ? 'Match\nWon!' : 'Match\nLost'}
          </h2>
          <p className="mb-5 text-xl uppercase tracking-widest text-slate-200">
            {isWin ? 'You lit up the court, champion.' : 'Recharge and try one more rally.'}
          </p>

          <div className="mb-6 grid w-full grid-cols-2 gap-3 rounded-2xl border border-white/15 bg-black/55 p-4 text-left text-xs uppercase tracking-widest text-white/70 md:grid-cols-4">
            <div><span className="block text-white/45">Rival</span><span className="font-black" style={{ color: opponentProfile.theme.glowColor }}>{opponentProfile.displayName}</span></div>
            <div><span className="block text-white/45">Points won</span><span className="font-black text-white">{matchStats.playerPointsWon}-{matchStats.aiPointsWon}</span></div>
            <div><span className="block text-white/45">Best combo</span><span className="font-black text-white">x{matchStats.bestCombo}</span></div>
            <div><span className="block text-white/45">Longest rally</span><span className="font-black text-white">{matchStats.longestRally}</span></div>
          </div>

          {pointReward && (
            <div className="mb-4 text-sm font-black uppercase tracking-widest text-orange-200">
              Last point: {pointReward.styleBonus} · +{pointReward.xpGained} XP
            </div>
          )}
          <div className="mb-8 h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: GRADIENTS.energy }} />
          </div>

          <p className="mb-6 text-xl uppercase tracking-widest text-slate-200">
            {isWin ? 'You lit up the court, champion.' : 'Recharge and try one more rally.'}
          </p>
          <div className="mb-8 grid w-full max-w-2xl grid-cols-2 gap-3 text-left text-xs uppercase tracking-widest text-white/70 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-white/45">Score</span>{score.playerSets}-{score.aiSets} sets</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-white/45">Games</span>{score.playerGames}-{score.aiGames}</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-white/45">Career XP</span>{playerProgress.totalXp}</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-white/45">Level</span>{playerProgress.playerLevel}</div>
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
