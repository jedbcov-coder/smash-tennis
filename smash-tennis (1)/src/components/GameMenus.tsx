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
      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6 text-center z-50 overflow-y-auto">
        <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter mb-4 text-shadow-sm uppercase">
          Smash<br /><span className="text-blue-500">Tennis</span>
        </h1>
        <p className="text-gray-300 mb-6 max-w-md uppercase tracking-widest text-sm">
          Pick a court surface, then use mouse to move and click or Space to swing.
          Curve shots and bigger smash speed now change with the court.
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
          Ball {(selectedSurface.ballSpeedMultiplier * 100).toFixed(0)}% · Bounce {(selectedSurface.bounceHeightMultiplier * 100).toFixed(0)}% · Slide {(selectedSurface.slideAmount * 100).toFixed(0)}% · Move {(selectedSurface.playerMovementMultiplier * 100).toFixed(0)}%
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

  if (gameState === GameState.GAME_OVER) {
    const isWin = winner === 'PLAYER';
    return (
      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-50">
        <h2 className={`text-6xl md:text-8xl font-black italic tracking-tighter mb-4 uppercase ${isWin ? 'text-blue-400' : 'text-red-500'}`}>
          {isWin ? 'Match\nWon!' : 'Match\nLost'}
        </h2>
        <p className="text-gray-300 mb-8 text-xl uppercase tracking-widest">
          {isWin ? 'Congratulations, Champion.' : 'Better luck next time.'}
        </p>
        <button
          onClick={startGame}
          className="bg-white text-black hover:bg-gray-200 font-bold py-4 px-12 rounded-lg text-xl transition-all hover:scale-105 uppercase tracking-widest"
        >
          Play Again
        </button>
      </div>
    );
  }

  return null;
}
