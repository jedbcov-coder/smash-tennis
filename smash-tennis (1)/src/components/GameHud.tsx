import { GameState, type PlayerType, type Score } from '../types';
import type { GameplayDifficultyStats } from '../hooks/useGameplayLoop';
import { GRADIENTS } from '../design/gradients';
import { formatTennisScore } from '../serve/scoringRules';

interface GameHudProps {
  score: Score;
  gameState: GameState;
  servingPlayer: PlayerType;
  isTiebreak: boolean;
  targetRallyLength: number;
  difficultyStats: GameplayDifficultyStats;
  lastPointWinner: PlayerType | null;
  serverFaults: number;
}

export function GameHud({
  score,
  gameState,
  servingPlayer,
  isTiebreak,
  targetRallyLength,
  difficultyStats,
  lastPointWinner,
  serverFaults
}: GameHudProps) {
  const playerLabel = formatTennisScore(score.playerScore, isTiebreak);
  const aiLabel = formatTennisScore(score.aiScore, isTiebreak);


  return (
    <>
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
            Speed: {(difficultyStats.pointDifficultyMultiplier * 100).toFixed(0)}%
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
