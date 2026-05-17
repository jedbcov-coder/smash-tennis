import { GameState, type PlayerType } from '../types';

export function GameMenus({
  gameState,
  winner,
  startGame
}: {
  gameState: GameState;
  winner: PlayerType | null;
  startGame: () => void;
}) {
  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 text-center z-50">
        <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter mb-4 text-shadow-sm uppercase">
          Smash<br /><span className="text-blue-500">Tennis</span>
        </h1>
        <p className="text-gray-300 mb-8 max-w-md uppercase tracking-widest text-sm">
          Mouse to move & aim.<br/>
          Click to swing.<br/>
          Hold click in yellow zone for overhead smash.
        </p>
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
