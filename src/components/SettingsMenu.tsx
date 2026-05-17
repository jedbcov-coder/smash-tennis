import type { GameSettings } from '../settings/useGameSettings';

interface SettingsMenuProps {
  settings: GameSettings;
  setSettings: (settings: Partial<GameSettings>) => void;
  resetSettings: () => void;
}

function PercentSlider({
  id,
  label,
  value,
  onChange,
  helper
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
}) {
  return (
    <label htmlFor={id} className="block rounded-xl border border-white/10 bg-black/35 p-3 text-left">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-white/75">{label}</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-black text-cyan-100">{value}%</span>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cyan-300"
      />
      {helper && <div className="mt-1 text-[10px] uppercase tracking-wider text-white/45">{helper}</div>}
    </label>
  );
}

function ToggleSetting({
  id,
  label,
  checked,
  onChange,
  helper
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helper: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/35 p-3 text-left">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-cyan-300"
      />
      <span className="flex-1">
        <span className="block text-[11px] font-black uppercase tracking-widest text-white/75">{label}</span>
        <span className="block text-[10px] uppercase tracking-wider text-white/45">{helper}</span>
      </span>
    </label>
  );
}

export function SettingsMenu({ settings, setSettings, resetSettings }: SettingsMenuProps) {
  return (
    <section className="w-full max-w-4xl rounded-3xl border border-cyan-200/25 bg-slate-950/75 p-4 shadow-[0_0_32px_rgba(34,211,238,0.16)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-left">
        <div>
          <h2 className="text-lg font-black uppercase tracking-widest text-cyan-100">Settings</h2>
          <p className="text-xs uppercase tracking-wider text-white/50">Saved automatically on this browser.</p>
        </div>
        <button
          type="button"
          onClick={resetSettings}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-white/75 transition hover:bg-white/20"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <PercentSlider id="master-volume" label="Master volume" value={settings.masterVolume} onChange={(masterVolume) => setSettings({ masterVolume })} />
        <PercentSlider id="music-volume" label="Music volume" value={settings.musicVolume} onChange={(musicVolume) => setSettings({ musicVolume })} helper="Saved for music tracks." />
        <PercentSlider id="sfx-volume" label="SFX volume" value={settings.sfxVolume} onChange={(sfxVolume) => setSettings({ sfxVolume })} />
        <PercentSlider id="screen-shake" label="Screen shake" value={settings.screenShakeAmount} onChange={(screenShakeAmount) => setSettings({ screenShakeAmount })} />
        <ToggleSetting id="reduced-motion" label="Reduced motion" checked={settings.reducedMotion} onChange={(reducedMotion) => setSettings({ reducedMotion })} helper="Calms flashing, pulsing, and camera shake." />
        <ToggleSetting id="high-contrast" label="High contrast mode" checked={settings.highContrastMode} onChange={(highContrastMode) => setSettings({ highContrastMode })} helper="Makes panels darker and borders brighter." />
        <ToggleSetting id="input-help" label="Show input help" checked={settings.showInputHelp} onChange={(showInputHelp) => setSettings({ showInputHelp })} helper="Shows the control tips in the HUD." />
      </div>
    </section>
  );
}
