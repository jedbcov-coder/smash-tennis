import * as Tone from 'tone';

const startAudio = () => {
  void Tone.start();
};

const disposeLater = (node: Tone.ToneAudioNode, delayMs = 900) => {
  window.setTimeout(() => node.dispose(), delayMs);
};

let masterVolumePercent = 80;
let sfxVolumePercent = 80;

export const setSoundVolumes = ({ masterVolume, sfxVolume }: { masterVolume: number; sfxVolume: number }) => {
  masterVolumePercent = masterVolume;
  sfxVolumePercent = sfxVolume;
};

const getAdjustedVolume = (volume: number) => {
  const combinedVolume = (masterVolumePercent / 100) * (sfxVolumePercent / 100);
  if (combinedVolume <= 0) return null;

  return volume + 20 * Math.log10(combinedVolume);
};

const playBlip = (frequency: string, duration = '16n', volume = -14) => {
  const adjustedVolume = getAdjustedVolume(volume);
  if (adjustedVolume === null) return;

  startAudio();
  const synth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.004, decay: 0.08, sustain: 0.08, release: 0.08 },
    volume: adjustedVolume
  }).toDestination();
  synth.triggerAttackRelease(frequency, duration);
  disposeLater(synth);
};

const playNoiseBurst = (duration = '32n', volume = -16) => {
  const adjustedVolume = getAdjustedVolume(volume);
  if (adjustedVolume === null) return;

  startAudio();
  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.002, decay: 0.08, sustain: 0, release: 0.04 },
    volume: adjustedVolume
  }).toDestination();
  noise.triggerAttackRelease(duration);
  disposeLater(noise);
};

const playNotes = (notes: string[], stepSeconds = 0.06, volume = -14) => {
  const adjustedVolume = getAdjustedVolume(volume);
  if (adjustedVolume === null) return;

  startAudio();
  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.003, decay: 0.08, sustain: 0.04, release: 0.08 },
    volume: adjustedVolume
  }).toDestination();
  const now = Tone.now();
  notes.forEach((note, index) => synth.triggerAttackRelease(note, '32n', now + index * stepSeconds));
  disposeLater(synth, 1200);
};

export const playNormalHitSound = () => {
  playBlip('C3', '32n', -13);
  playNoiseBurst('64n', -22);
};

export const playCurveHitSound = () => {
  const adjustedVolume = getAdjustedVolume(-18);
  if (adjustedVolume === null) return;

  startAudio();
  const synth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.004, decay: 0.12, sustain: 0.02, release: 0.12 },
    volume: adjustedVolume
  }).toDestination();
  const now = Tone.now();
  synth.frequency.setValueAtTime('D3', now);
  synth.frequency.rampTo('A3', 0.14, now);
  synth.triggerAttackRelease('D3', '8n', now);
  disposeLater(synth);
};

export const playSmashHitSound = () => {
  playBlip('G2', '16n', -9);
  playNoiseBurst('16n', -14);
};

export const playPerfectReturnSound = () => {
  playNotes(['C5', 'E5', 'G5'], 0.045, -12);
};

export const playMegaSmashSound = () => {
  playNotes(['G2', 'C3', 'G3', 'C4'], 0.04, -10);
  window.setTimeout(() => playNoiseBurst('8n', -12), 80);
};

export const playPowerReadySound = () => {
  playNotes(['C4', 'E4', 'G4', 'C5'], 0.055, -11);
};

export const playComboIncreaseSound = () => {
  playBlip('A4', '64n', -18);
};

export const playMatchPointSound = () => {
  playNotes(['C4', 'C4', 'G4'], 0.12, -12);
};

export const playUiHoverSound = () => {
  playBlip('E5', '64n', -24);
};

export const playUiSelectSound = () => {
  playNotes(['C5', 'G5'], 0.04, -18);
};

export const playWinSound = () => {
  playNotes(['C4', 'E4', 'G4', 'C5', 'E5'], 0.07, -11);
};

export const playDefeatSound = () => {
  playNotes(['E3', 'D3', 'C3'], 0.12, -14);
};

export const playMissSound = () => {
  playNotes(['C3', 'B2'], 0.08, -15);
};

export const playScoreSound = () => {
  playNotes(['G4', 'C5'], 0.06, -13);
};

export const playHit = playNormalHitSound;
export const playBounce = () => playBlip('G3', '64n', -20);
export const playFault = playMissSound;
export const playScore = playScoreSound;
export const playCheer = playWinSound;
export const playSweep = playCurveHitSound;
export const playHitSound = playNormalHitSound;
