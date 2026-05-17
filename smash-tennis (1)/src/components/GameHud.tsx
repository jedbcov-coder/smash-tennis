import { GameState, type CourtSurface, type PlayerType, type Score } from '../types';
import type { ArcadeHudStats, GameplayDifficultyStats } from '../hooks/useGameplayLoop';
import type { GameplayDifficultyStats } from '../hooks/useGameplayLoop';
import { GRADIENTS } from '../design/gradients';
import { formatTennisScore } from '../serve/scoringRules';
import { COURT_SURFACE_SETTINGS } from '../gameplay/gameTuning';

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
  arcadeHudStats
  courtSurface
}: GameHudProps) {
  const playerLabel = formatTennisScore(score.playerScore, isTiebreak);
  const aiLabel = formatTennisScore(score.aiScore, isTiebreak);
  const surfaceSettings = COURT_SURFACE_SETTINGS[courtSurface];
  const energyWidth = `${arcadeHudStats.energyPercent}%`;


  return (
    <>

      {/* Neon Arcade HUD - Top Center */}
      <div className="absolute left-1/2 top-4 flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
        <div className="flex overflow-hidden rounded-2xl border border-cyan-300/40 bg-slate-950/80 shadow-[0_0_24px_rgba(34,211,238,0.28)] backdrop-blur-sm">
          <div className="border-r border-cyan-300/20 px-4 py-2 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-200/70">Serve / Shot Speed</div>
            <div className="text-2xl font-black italic text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.85)]">
              {arcadeHudStats.serveSpeedMph || '--'} <span className="text-xs not-italic text-white/60">MPH</span>
            </div>
          </div>
          <div className="border-r border-fuchsia-300/20 px-4 py-2 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-fuchsia-200/70">Combo</div>
            <div className="text-2xl font-black italic text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.85)]">
              x{arcadeHudStats.comboCount}
            </div>
          </div>
          <div className="px-4 py-2 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-200/70">Rally</div>
            <div className="text-2xl font-black italic text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.85)]">
              {arcadeHudStats.rallyCount}
            </div>
          </div>
        </div>

        <div className="w-[320px] rounded-full border border-fuchsia-300/40 bg-black/70 p-1 shadow-[0_0_20px_rgba(217,70,239,0.35)]">
          <div className="relative h-4 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-orange-300 transition-all duration-300"
              style={{ width: energyWidth }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase tracking-[0.25em] text-white drop-shadow">
              Energy {arcadeHudStats.energyPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Arcade Callout */}
      {arcadeHudStats.callout && (
        <div className="absolute inset-x-0 top-28 flex justify-center pointer-events-none">
          <div className="animate-pulse rounded-2xl border border-white/50 bg-black/75 px-8 py-3 text-4xl font-black italic uppercase tracking-tighter text-white shadow-[0_0_32px_rgba(34,211,238,0.55)]">
            <span className="bg-gradient-to-r from-cyan-200 via-fuchsia-300 to-orange-300 bg-clip-text text-transparent">
              {arcadeHudStats.callout}
            </span>
          </div>
        </div>
      )}

      {/* TV Style Scoreboard - Lower Left */}
      <div className="absolute bottom-12 left-8 flex flex-col gap-0.5 pointer-events-none drop-shadow-lg">
        {/* Header Ribbon */}
        <div className="flex gap-0.5">
          <div className="bg-white text-black px-2 py-0.5 text-[9px] font-black italic w-fit">
            US OPEN - GAME {score.playerGames + score.aiGames + 1}
          </div>
          <div className="bg-red-600 text-white px-2 py-0.5 text-[9px] font-black italic w-fit uppercase tracking-tighter">
            Rally Target: {targetRallyLength}
          </div>
          <div className="bg-blue-600 text-white px-2 py-0.5 text-[9px] font-black italic w-fit uppercase tracking-tighter">
            Speed: {(difficultyStats.pointDifficultyMultiplier * surfaceSettings.ballSpeedMultiplier * 100).toFixed(0)}%
          </div>
          <div
            className="text-black px-2 py-0.5 text-[9px] font-black italic w-fit uppercase tracking-tighter"
            style={{ backgroundColor: surfaceSettings.colors.lines }}
          >
            {surfaceSettings.label}
          </div>
        </div>

        {/* Score Table */}
        <div className="bg-[#1a1a2e]/95 border-b-2 border-red-600 overflow-hidden shadow-2xl flex flex-col min-w-[240px]">
          {/* Player Row */}
          <div className="flex items-center h-8 px-3 border-b border-white/5">
            <div className="w-2 mr-2">
              {servingPlayer === 'PLAYER' && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />}
            </div>
            <div className="flex-1 text-[13px] font-black text-white uppercase tracking-tighter">
              Blake (Player)
            </div>
            <div className="flex bg-black/40 h-full">
              <div className="w-8 flex items-center justify-center text-white/50 font-bold text-[11px] border-l border-white/10">{score.playerSets}</div>
              <div className="w-8 flex items-center justify-center text-white/50 font-bold text-[11px] border-l border-white/10">{score.playerGames}</div>
              <div className="w-12 flex items-center justify-center bg-white text-black font-black text-[14px]">
                {playerLabel}
              </div>
            </div>
          </div>

          {/* AI Row */}
          <div className="flex items-center h-8 px-3">
            <div className="w-2 mr-2">
              {servingPlayer === 'AI' && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />}
            </div>
            <div className="flex-1 text-[13px] font-black text-white uppercase tracking-tighter">
              Hidalgo (AI)
            </div>
            <div className="flex bg-black/40 h-full">
              <div className="w-8 flex items-center justify-center text-white/50 font-bold text-[11px] border-l border-white/10">{score.aiSets}</div>
              <div className="w-8 flex items-center justify-center text-white/50 font-bold text-[11px] border-l border-white/10">{score.aiGames}</div>
              <div className="w-12 flex items-center justify-center bg-white text-black font-black text-[14px]">
                {aiLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Point Result Banner */}
      {gameState === GameState.SCORING && lastPointWinner && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`px-8 py-5 text-5xl font-black italic uppercase tracking-tighter text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.35)] ${lastPointWinner === 'PLAYER' ? 'bg-blue-600' : 'bg-red-600'}`}>
            {lastPointWinner === 'PLAYER' ? 'Blake Point' : 'Hidalgo Point'}
          </div>
        </div>
      )}

      {/* Serving Instruction */}
      {gameState === GameState.SERVING && (
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <div className="text-white text-3xl font-black italic tracking-tighter drop-shadow-md animate-pulse uppercase">
            {serverFaults === 1 ? 'SECOND SERVE' : servingPlayer === 'PLAYER' ? 'Your Serve' : 'AI Service'}
          </div>
          {servingPlayer === 'PLAYER' && (
            <div className="text-white/60 text-sm font-bold mt-2 uppercase tracking-widest">
              Press Space or Click to Serve
            </div>
          )}
        </div>
      )}

      <div className="absolute top-4 right-4 max-w-[220px] rounded-lg border border-white/15 bg-black/55 p-3 text-left text-white pointer-events-none shadow-2xl">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Court Surface</div>
        <div className="text-lg font-black uppercase italic" style={{ color: surfaceSettings.colors.lines }}>
          {surfaceSettings.label}
        </div>
        <div className="mt-1 text-[10px] uppercase leading-snug text-white/70">
          Ball {(surfaceSettings.ballSpeedMultiplier * 100).toFixed(0)}% · Bounce {(surfaceSettings.bounceMultiplier * 100).toFixed(0)}% · Move {(surfaceSettings.playerMovementMultiplier * 100).toFixed(0)}%
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-4 text-white/30 text-[10px] items-center">
        <span>MOUSE: MOVE PLAYER</span>
        <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
        <span>CLICK: SWING / SERVE</span>
      </div>

      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: GRADIENTS.crtScanline, backgroundSize: '100% 2px, 3px 100%' }}></div>
    </>
  );
}
