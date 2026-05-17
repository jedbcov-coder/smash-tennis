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
  const selectedSurface = COURT_SURFACE_SETTINGS[courtSurface];

  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6 text-center z-50 overflow-y-auto">
        <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter mb-4 text-shadow-sm uppercase">
          Smash<br /><span className="text-blue-500">Tennis</span>
        </h1>
        <p className="text-gray-300 mb-6 max-w-md uppercase tracking-widest text-sm">
          Pick a court surface, then use mouse to move and click or Space to swing.
          Arcade intros, point rewards, and match XP now celebrate every rally.
        </p>

        <div className="mb-6 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {COURT_SURFACES.map((surface) => {
            const settings = COURT_SURFACE_SETTINGS[surface];
            const isSelected = surface === courtSurface;

            return (
              <button
                key={surface}
                type="button"
                onClick={() => setCourtSurface(surface)}
                className={`rounded-xl border p-3 text-left transition-all hover:scale-105 ${
                  isSelected ? 'border-white bg-white text-black shadow-2xl' : 'border-white/20 bg-black/50 text-white hover:bg-white/10'
                }`}
              >
                <div className="mb-2 h-2 rounded-full" style={{ backgroundColor: settings.colors.playingSurface }} />
                <div className="text-sm font-black uppercase italic">{settings.label}</div>
                <div className={`mt-1 text-[10px] uppercase leading-snug ${isSelected ? 'text-black/70' : 'text-white/60'}`}>
                  {settings.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mb-8 rounded-lg border border-white/15 bg-black/55 px-4 py-3 text-xs uppercase tracking-widest text-white/70">
          Selected: <span className="font-black text-white" style={{ color: selectedSurface.colors.lines }}>{selectedSurface.label}</span>
          <span className="mx-2 text-white/25">|</span>
          Ball {(selectedSurface.ballSpeedMultiplier * 100).toFixed(0)}% · Bounce {(selectedSurface.bounceMultiplier * 100).toFixed(0)}% · Move {(selectedSurface.playerMovementMultiplier * 100).toFixed(0)}%
        </div>

        <button
          onClick={startGame}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-12 rounded-lg text-xl transition-all hover:scale-105 uppercase tracking-widest"
        >
          Start Match
        </button>
      </div>
    );
  }

  if (gameState === GameState.INTRO) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-6 text-center text-white pointer-events-none">
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
    const progressPercent = Math.min(100, matchStats.totalXp % 100);

    return (
      <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-50 overflow-y-auto">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-950/90 p-7 text-white shadow-2xl">
          <h2 className={`text-5xl md:text-7xl font-black italic tracking-tighter mb-3 uppercase ${isWin ? 'text-blue-400' : 'text-red-500'}`}>
            {isWin ? 'Match Won!' : 'Match Lost'}
          </h2>
          <p className="text-gray-300 mb-6 text-lg uppercase tracking-widest">
            {isWin ? 'Congratulations, Champion.' : 'Better luck next time.'}
          </p>

          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-white/10 p-3">
              <div className="text-[10px] uppercase tracking-widest text-white/50">Final Sets</div>
              <div className="text-2xl font-black">{score.playerSets}-{score.aiSets}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <div className="text-[10px] uppercase tracking-widest text-white/50">Points Won</div>
              <div className="text-2xl font-black">{matchStats.playerPointsWon}-{matchStats.aiPointsWon}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <div className="text-[10px] uppercase tracking-widest text-white/50">Longest Rally</div>
              <div className="text-2xl font-black">{matchStats.longestRally}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <div className="text-[10px] uppercase tracking-widest text-white/50">Best Combo</div>
              <div className="text-2xl font-black">x{matchStats.bestCombo}</div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-fuchsia-300/30 bg-black/40 p-4 text-left">
            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-widest text-fuchsia-100">
              <span>Match XP</span>
              <span>{matchStats.totalXp} XP</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-orange-300" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-2 text-xs uppercase tracking-widest text-white/50">
              Local-only progress for this match. No account or database needed.
            </div>
            {pointReward && (
              <div className="mt-3 text-sm uppercase tracking-widest text-white/70">
                Last reward: {pointReward.styleBonus} · +{pointReward.xpGained} XP
              </div>
            )}
          </div>

          <button
            onClick={startGame}
            className="bg-white text-black hover:bg-gray-200 font-bold py-4 px-12 rounded-lg text-xl transition-all hover:scale-105 uppercase tracking-widest"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
