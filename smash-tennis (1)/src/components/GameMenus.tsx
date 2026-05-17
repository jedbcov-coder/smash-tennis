import { COLOR_SCHEME } from '../design/colorScheme';
import { GRADIENTS } from '../design/gradients';
import { COURT_SURFACE_SETTINGS } from '../gameplay/gameTuning';
import { GameState, type CourtSurface, type PlayerType } from '../types';

const COURT_SURFACES = Object.keys(COURT_SURFACE_SETTINGS) as CourtSurface[];

export function GameMenus({
  gameState,
  winner,
  startGame,
  courtSurface,
  setCourtSurface
}: {
  gameState: GameState;
  winner: PlayerType | null;
  startGame: () => void;
  courtSurface: CourtSurface;
  setCourtSurface: (surface: CourtSurface) => void;
}) {
  if (gameState === GameState.MENU) {
    const selectedSurface = COURT_SURFACE_SETTINGS[courtSurface];

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

        <div className="mb-8 rounded-lg border border-white/15 bg-black/55 px-4 py-3 text-xs uppercase tracking-widest text-white/70">
          Selected: <span className="font-black text-white" style={{ color: selectedSurface.colors.lines }}>{selectedSurface.label}</span>
          <span className="mx-2 text-white/25">|</span>
          Ball {(selectedSurface.ballSpeedMultiplier * 100).toFixed(0)}% · Bounce {(selectedSurface.bounceHeightMultiplier * 100).toFixed(0)}% · Slide {(selectedSurface.slideAmount * 100).toFixed(0)}% · Move {(selectedSurface.playerMovementMultiplier * 100).toFixed(0)}%
        </div>

          <button
            onClick={startGame}
            className="neon-button rounded-lg px-12 py-4 text-xl font-black uppercase tracking-widest text-black transition-all hover:scale-105"
            style={{ background: GRADIENTS.button }}
          >
            Start Match
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    const isWin = winner === 'PLAYER';
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
          <p className="mb-8 text-xl uppercase tracking-widest text-slate-200">
            {isWin ? 'You lit up the court, champion.' : 'Recharge and try one more rally.'}
          </p>
          <button
            onClick={startGame}
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
