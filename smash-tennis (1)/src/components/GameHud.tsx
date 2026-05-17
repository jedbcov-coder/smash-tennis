import { useEffect, useState } from 'react';
import { GameState, type CourtSurface, type PlayerType, type Score } from '../types';
import type { ArcadeHudStats, GameplayDifficultyStats } from '../hooks/useGameplayLoop';
import { COLOR_SCHEME } from '../design/colorScheme';
import { GRADIENTS } from '../design/gradients';
import { formatTennisScore } from '../serve/scoringRules';
import type { PointReward } from '../serve/useTennisGame';
import { COURT_SURFACE_SETTINGS } from '../gameplay/gameTuning';
import type { PointReward } from '../serve/useTennisGame';

interface GameHudProps {
  score: Score;
  gameState: GameState;
  servingPlayer: PlayerType;
  isTiebreak: boolean;
  targetRallyLength: number;
  difficultyStats: GameplayDifficultyStats;
  lastPointWinner: PlayerType | null;
  serverFaults: number;
  courtSurface: CourtSurface;
  arcadeHudStats: ArcadeHudStats;
  pointReward: PointReward | null;
}

export function GameHud({
  score,
  gameState,
  servingPlayer,
  isTiebreak,
  targetRallyLength,
  difficultyStats,
  lastPointWinner,
  serverFaults,
  courtSurface,
  arcadeHudStats,
  pointReward
}: GameHudProps) {
  const [serveCountdown, setServeCountdown] = useState(3);
  const playerLabel = formatTennisScore(score.playerScore, isTiebreak);
  const aiLabel = formatTennisScore(score.aiScore, isTiebreak);
  const surfaceSettings = COURT_SURFACE_SETTINGS[courtSurface];
  const energyWidth = `${arcadeHudStats.energyPercent}%`;
  const intensityWidth = `${Math.round(arcadeHudStats.rallyIntensity * 100)}%`;
  const pointWinnerColor = lastPointWinner === 'PLAYER' ? COLOR_SCHEME.neon.cyan : COLOR_SCHEME.neon.dangerHot;
  const [serveCountdown, setServeCountdown] = useState(3);
  const isPowerReady = arcadeHudStats.energyPercent >= 100;
  const pointWinnerColor = lastPointWinner === 'PLAYER' ? COLOR_SCHEME.neon.cyan : COLOR_SCHEME.neon.dangerHot;
  const [serveCountdown, setServeCountdown] = useState(3);

  useEffect(() => {
    if (gameState !== GameState.SERVE_COUNTDOWN) {
      setServeCountdown(3);
      return;
    }

    setServeCountdown(3);
    const countdownTimer = window.setInterval(() => {
      setServeCountdown((current) => Math.max(1, current - 1));
    }, 500);

    return () => window.clearInterval(countdownTimer);
  }, [gameState]);

  return (
    <>
      {/* Neon Arcade HUD - Top Center */}
      <div className="absolute left-1/2 top-4 flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
        <div className="neon-panel flex overflow-hidden rounded-2xl border border-cyan-300/50 bg-slate-950/85 backdrop-blur-sm">
          <div className="border-r border-cyan-300/25 px-4 py-2 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-100/75">Serve / Shot Speed</div>
            <div className="neon-text-cyan text-2xl font-black italic">
              {arcadeHudStats.serveSpeedMph || '--'} <span className="text-xs not-italic text-white/60">MPH</span>
            </div>
          </div>
          <div className="border-r border-fuchsia-300/25 px-4 py-2 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-fuchsia-100/75">Combo</div>
            <div className="neon-text-magenta text-2xl font-black italic">x{arcadeHudStats.comboCount}</div>
          </div>
          <div className="px-4 py-2 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-100/75">Rally</div>
            <div className="neon-text-orange text-2xl font-black italic">{arcadeHudStats.rallyCount}</div>
          </div>
        </div>

        <div className="neon-energy w-[320px] rounded-full border border-fuchsia-300/45 bg-black/75 p-1">
          <div className="relative h-4 overflow-hidden rounded-full bg-white/10">
            <div
              className="neon-energy-fill h-full rounded-full transition-all duration-300"
              style={{ width: energyWidth, background: GRADIENTS.energy }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase tracking-[0.25em] text-white drop-shadow">
              {isPowerReady ? 'POWER READY - PRESS E' : `Energy ${arcadeHudStats.energyPercent}%`}
            </div>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-300 transition-all duration-300"
              style={{ width: intensityWidth }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black uppercase tracking-[0.2em] text-white/90 drop-shadow">
              Rally Intensity {Math.round(arcadeHudStats.rallyIntensity * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Arcade Callout */}
      {arcadeHudStats.callout && (
        <div className="absolute inset-x-0 top-28 flex justify-center pointer-events-none">
          <div className="neon-callout rounded-2xl border border-white/50 bg-black/80 px-8 py-3 text-4xl font-black italic uppercase tracking-tighter text-white">
            <span className="bg-gradient-to-r from-cyan-200 via-fuchsia-300 to-orange-300 bg-clip-text text-transparent">
              {arcadeHudStats.callout}
            </span>
          </div>
        </div>
      )}

      {/* Scoreboard - Lower Left */}
      <div className="absolute bottom-12 left-8 flex flex-col gap-0.5 pointer-events-none drop-shadow-lg">
        {/* Header Ribbon */}
        <div className="flex gap-0.5">
          <div className="bg-cyan-300 px-2 py-0.5 text-[9px] font-black italic text-black w-fit shadow-[0_0_14px_rgba(34,211,238,0.65)]">
            NEON SMASH - GAME {score.playerGames + score.aiGames + 1}
          </div>
          <div className="bg-rose-500 px-2 py-0.5 text-[9px] font-black italic text-white w-fit uppercase tracking-tighter shadow-[0_0_14px_rgba(244,63,94,0.55)]">
            Rally Target: {targetRallyLength}
          </div>
          <div className="bg-indigo-500 px-2 py-0.5 text-[9px] font-black italic text-white w-fit uppercase tracking-tighter shadow-[0_0_14px_rgba(99,102,241,0.55)]">
            Speed: {(difficultyStats.pointDifficultyMultiplier * surfaceSettings.ballSpeedMultiplier * 100).toFixed(0)}%
          </div>
          <div
            className="px-2 py-0.5 text-[9px] font-black italic text-black w-fit uppercase tracking-tighter"
            style={{ backgroundColor: surfaceSettings.colors.lines, boxShadow: `0 0 14px ${surfaceSettings.colors.lines}` }}
          >
            {surfaceSettings.label}
          </div>
        </div>

        {/* Score Table */}
        <div className="neon-panel min-w-[250px] overflow-hidden border-b-2 border-fuchsia-400/80 bg-[#050712]/95 flex flex-col">
          {/* Player Row */}
          <div className="flex h-8 items-center border-b border-cyan-300/10 px-3">
            <div className="mr-2 w-2">
              {servingPlayer === 'PLAYER' && <div className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.95)]" />}
            </div>
            <div className="flex-1 text-[13px] font-black uppercase tracking-tighter text-white">Blake (Player)</div>
            <div className="flex h-full bg-black/45">
              <div className="flex w-8 items-center justify-center border-l border-white/10 text-[11px] font-bold text-white/55">{score.playerSets}</div>
              <div className="flex w-8 items-center justify-center border-l border-white/10 text-[11px] font-bold text-white/55">{score.playerGames}</div>
              <div className="flex w-12 items-center justify-center bg-cyan-200 text-[14px] font-black text-black">{playerLabel}</div>
            </div>
          </div>

          {/* AI Row */}
          <div className="flex h-8 items-center px-3">
            <div className="mr-2 w-2">
              {servingPlayer === 'AI' && <div className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.95)]" />}
            </div>
            <div className="flex-1 text-[13px] font-black uppercase tracking-tighter text-white">Hidalgo (AI)</div>
            <div className="flex h-full bg-black/45">
              <div className="flex w-8 items-center justify-center border-l border-white/10 text-[11px] font-bold text-white/55">{score.aiSets}</div>
              <div className="flex w-8 items-center justify-center border-l border-white/10 text-[11px] font-bold text-white/55">{score.aiGames}</div>
              <div className="flex w-12 items-center justify-center bg-fuchsia-200 text-[14px] font-black text-black">{aiLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Point Result Banner */}
      {gameState === GameState.SCORING && lastPointWinner && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="neon-callout px-8 py-5 text-5xl font-black italic uppercase tracking-tighter text-white"
            style={{ background: `linear-gradient(90deg, ${pointWinnerColor}, ${COLOR_SCHEME.neon.magentaHot})` }}
          >
            {lastPointWinner === 'PLAYER' ? 'Blake Point' : 'Hidalgo Point'}
          </div>
        </div>
      )}

      {gameState === GameState.SCORING && pointReward && (
        <div className="absolute left-1/2 top-[62%] flex -translate-x-1/2 flex-col items-center rounded-2xl border border-white/15 bg-black/70 px-5 py-3 text-center text-white pointer-events-none">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-white/60">{pointReward.styleBonus}</div>
          <div className="text-lg font-black uppercase">+{pointReward.xpGained} XP · Rally {pointReward.rallyLength}</div>
        </div>
      )}

      {gameState === GameState.SERVE_COUNTDOWN && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="neon-title text-8xl font-black italic text-white">{serveCountdown}</div>
        </div>
      )}

      {/* Serving Instruction */}
      {(gameState === GameState.SERVING || gameState === GameState.SERVE_COUNTDOWN) && (
        <div className="absolute bottom-1/4 left-1/2 flex -translate-x-1/2 flex-col items-center pointer-events-none">
          <div className="neon-text-cyan neon-pulse text-3xl font-black italic uppercase tracking-tighter">
            {gameState === GameState.SERVE_COUNTDOWN ? serveCountdown : serverFaults === 1 ? 'SECOND SERVE' : servingPlayer === 'PLAYER' ? 'Your Serve' : 'AI Service'}
          </div>
          {servingPlayer === 'PLAYER' && (
            <div className="mt-2 text-sm font-bold uppercase tracking-widest text-white/65">Press Space or Click to Serve</div>
          )}
        </div>
      )}

      <div className="neon-panel absolute right-4 top-4 max-w-[220px] rounded-lg border border-cyan-200/25 bg-black/60 p-3 text-left text-white pointer-events-none">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Court Surface</div>
        <div className="text-lg font-black uppercase italic" style={{ color: surfaceSettings.colors.lines, textShadow: `0 0 12px ${surfaceSettings.colors.lines}` }}>
          {surfaceSettings.label}
        </div>
        <div className="mt-1 text-[10px] uppercase leading-snug text-white/70">
          Ball {(surfaceSettings.ballSpeedMultiplier * 100).toFixed(0)}% · Bounce {(surfaceSettings.bounceHeightMultiplier * 100).toFixed(0)}% · Slide {(surfaceSettings.slideAmount * 100).toFixed(0)}% · Move {(surfaceSettings.playerMovementMultiplier * 100).toFixed(0)}%
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-4 text-white/45 text-[10px] items-center">
        <span>MOUSE: MOVE PLAYER</span>
        <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
        <span>CLICK: SWING / SERVE</span>
        <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
        <span>E: FLAME SMASH WHEN READY</span>
      </div>

      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ background: GRADIENTS.crtScanline, backgroundSize: '100% 2px, 3px 100%' }}></div>
    </>
  );
}
