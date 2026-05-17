import { useEffect, useRef } from 'react';
import { playAudioEvent } from '../audio/audioManager';
import { presentationDirector } from '../presentation/presentationDirector';
import { COLOR_SCHEME } from '../design/colorScheme';
import { GRADIENTS } from '../design/gradients';
import { SettingsMenu } from './SettingsMenu';
import { COURT_SURFACE_SETTINGS } from '../gameplay/gameTuning';
import { OPPONENT_PROFILES, type OpponentId, type OpponentProfile } from '../gameplay/opponents';
import { PLAYER_LEVEL_XP, type PlayerProgress } from '../progression/playerProgress';
import type { MatchStats, PointReward } from '../serve/useTennisGame';
import { GameState, type CourtSurface, type PlayerType, type Score } from '../types';
import type { GameSettings } from '../settings/useGameSettings';

const COURT_SURFACES = Object.keys(COURT_SURFACE_SETTINGS) as CourtSurface[];
const PLAYER_NAME = 'Blake';

type GameMenusProps = {
  gameState: GameState;
  winner: PlayerType | null;
  startGame: () => void;
  courtSurface: CourtSurface;
  setCourtSurface: (surface: CourtSurface) => void;
  opponentProfile: OpponentProfile;
  opponentId: OpponentId;
  setOpponentId: (opponentId: OpponentId) => void;
  score: Score;
  pointReward: PointReward | null;
  matchStats: MatchStats;
  playerProgress: PlayerProgress;
  settings: GameSettings;
  setSettings: (settings: Partial<GameSettings>) => void;
  resetSettings: () => void;
};

type CourtSelectCardProps = {
  surface: CourtSurface;
  isSelected: boolean;
  onSelect: (surface: CourtSurface) => void;
};

type MatchupIntroPanelProps = {
  courtSurface: CourtSurface;
  opponentProfile: OpponentProfile;
};

type OpponentSelectCardProps = {
  opponent: OpponentProfile;
  isSelected: boolean;
  onSelect: (opponentId: OpponentId) => void;
};

type GameOverStatsPanelProps = {
  score: Score;
  pointReward: PointReward | null;
  matchStats: MatchStats;
};

type PrimaryMenuButtonProps = {
  children: string;
  onClick: () => void;
};

function CourtSelectCard({ surface, isSelected, onSelect }: CourtSelectCardProps) {
  const settings = COURT_SURFACE_SETTINGS[surface];

  return (
    <button
      onClick={() => onSelect(surface)}
      className={`rounded-2xl border bg-black/55 p-4 text-left transition-all hover:-translate-y-1 hover:bg-white/10 ${isSelected ? 'border-white shadow-[0_0_24px_rgba(255,255,255,0.28)]' : 'border-white/15'}`}
      style={{ boxShadow: isSelected ? `0 0 28px ${settings.colors.lines}66` : undefined }}
    >
      <div className="mb-2 h-2 rounded-full" style={{ background: settings.colors.lines }} />
      <div className="text-sm font-black uppercase tracking-widest text-white">{settings.label}</div>
      <div className="mt-2 text-[11px] uppercase leading-relaxed tracking-wider text-white/60">{settings.description}</div>
    </button>
  );
}

function MatchupIntroPanel({ courtSurface, opponentProfile }: MatchupIntroPanelProps) {
  const selectedSurface = COURT_SURFACE_SETTINGS[courtSurface];

  return (
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
          <div className="text-4xl font-black italic uppercase" style={{ color: opponentProfile.theme.glowColor }}>{opponentProfile.displayName}</div>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 uppercase tracking-widest text-white/80">
        Tonight on <span className="font-black" style={{ color: selectedSurface.colors.lines }}>{selectedSurface.label}</span>
      </div>
      <div className="mt-6 animate-pulse text-2xl font-black italic uppercase tracking-[0.35em] text-orange-200">Get Ready</div>
    </div>
  );
}


function OpponentSelectCard({ opponent, isSelected, onSelect }: OpponentSelectCardProps) {
  return (
    <button
      onClick={() => onSelect(opponent.id)}
      className={`rounded-2xl border bg-black/55 p-4 text-left transition-all hover:-translate-y-1 hover:bg-white/10 ${isSelected ? 'border-white shadow-[0_0_24px_rgba(255,255,255,0.28)]' : 'border-white/15'}`}
      style={{ boxShadow: isSelected ? `0 0 28px ${opponent.theme.glowColor}66` : undefined }}
    >
      <div className="mb-2 h-2 rounded-full" style={{ background: opponent.theme.color }} />
      <div className="text-sm font-black uppercase tracking-widest" style={{ color: opponent.theme.glowColor }}>{opponent.displayName}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/45">{opponent.theme.label}</div>
      <div className="mt-2 text-[11px] uppercase leading-relaxed tracking-wider text-white/60">{opponent.description}</div>
      <div className="mt-3 text-[10px] uppercase tracking-wider text-white/45">{opponent.preferredShotType} · {opponent.specialMoveStyle}</div>
    </button>
  );
}

function GameOverStatsPanel({ score, pointReward, matchStats }: GameOverStatsPanelProps) {
  const pointXp = pointReward?.xpGained ?? 0;
  const progressPercent = Math.min(100, pointXp);

  return (
    <>
      <div className="mb-6 grid w-full grid-cols-2 gap-3 rounded-2xl border border-white/15 bg-black/55 p-4 text-left text-xs uppercase tracking-widest text-white/70 md:grid-cols-4">
        <div><span className="block text-white/45">Score</span><span className="font-black text-white">{score.playerSets}-{score.aiSets} sets</span></div>
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

      <div className="mb-8 grid w-full max-w-2xl grid-cols-2 gap-3 text-left text-xs uppercase tracking-widest text-white/70 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-white/45">Score</span>{score.playerSets}-{score.aiSets} sets</div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-white/45">Games</span>{score.playerGames}-{score.aiGames}</div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-white/45">XP</span>+{pointXp}</div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-white/45">Next</span>{progressPercent}%</div>
      </div>
    </>
  );
}

function PrimaryMenuButton({ children, onClick }: PrimaryMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="neon-button rounded-lg px-12 py-4 text-xl font-black uppercase tracking-widest text-black transition-all hover:scale-105"
      style={{ background: GRADIENTS.button }}
    >
      {children}
    </button>
  );
}

export function GameMenus({
  gameState,
  winner,
  startGame,
  courtSurface,
  setCourtSurface,
  opponentProfile,
  opponentId,
  setOpponentId,
  score,
  pointReward,
  matchStats,
  playerProgress,
  settings,
  setSettings,
  resetSettings
}: GameMenusProps) {
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
    presentationDirector.presentMoment('match.result', { winner });
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
            {COURT_SURFACES.map((surface) => (
              <CourtSelectCard
                key={surface}
                surface={surface}
                isSelected={surface === courtSurface}
                onSelect={handleSurfaceSelect}
              />
            ))}
          </div>

          <div className="mb-4 rounded-lg border border-white/15 bg-black/55 px-4 py-3 text-xs uppercase tracking-widest text-white/70">
            Selected: <span className="font-black text-white" style={{ color: selectedSurface.colors.lines }}>{selectedSurface.label}</span>
            <span className="mx-2 text-white/25">|</span>
            Ball {(selectedSurface.ballSpeedMultiplier * 100).toFixed(0)}% · Bounce {(selectedSurface.bounceHeightMultiplier * 100).toFixed(0)}% · Slide {(selectedSurface.slideAmount * 100).toFixed(0)}% · Move {(selectedSurface.playerMovementMultiplier * 100).toFixed(0)}%
          </div>

          <div className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-cyan-100/75">Choose rival</div>
          <div className="mb-6 grid max-w-4xl grid-cols-1 gap-3 md:grid-cols-3">
            {OPPONENT_PROFILES.map((opponent) => (
              <OpponentSelectCard
                key={opponent.id}
                opponent={opponent}
                isSelected={opponent.id === opponentId}
                onSelect={handleOpponentSelect}
              />
            ))}
          </div>

          <div className="mb-4 rounded-lg border border-white/15 bg-black/55 px-4 py-3 text-xs uppercase tracking-widest text-white/70">
            Rival: <span className="font-black" style={{ color: opponentProfile.theme.glowColor }}>{opponentProfile.displayName}</span>
            <span className="mx-2 text-white/25">|</span>
            Speed {(opponentProfile.movementSpeed * 10).toFixed(0)} · Accuracy {(opponentProfile.accuracy * 100).toFixed(0)}% · Aggression {(opponentProfile.aggression * 100).toFixed(0)}%
          </div>

          <div className="mb-6 w-full max-w-4xl">
            <SettingsMenu settings={settings} setSettings={setSettings} resetSettings={resetSettings} />
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
        <MatchupIntroPanel courtSurface={courtSurface} opponentProfile={opponentProfile} />
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    const isWin = winner === 'PLAYER';
    const xpIntoLevel = playerProgress.totalXp % PLAYER_LEVEL_XP;
    const progressPercent = Math.min(100, (xpIntoLevel / PLAYER_LEVEL_XP) * 100);
    const resultMessage = isWin
      ? `You beat ${opponentProfile.displayName}!`
      : `${opponentProfile.displayName} wins this match.`;

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
          <p className="mb-5 text-xl uppercase tracking-widest text-slate-200">{resultMessage}</p>

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
          <div className="mb-6 w-full">
            <SettingsMenu settings={settings} setSettings={setSettings} resetSettings={resetSettings} />
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
