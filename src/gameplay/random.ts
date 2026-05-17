const DEFAULT_RANDOM_SEED = 123456789;

let currentSeed = DEFAULT_RANDOM_SEED;

function normalizeSeed(seed: number) {
  return seed >>> 0 || DEFAULT_RANDOM_SEED;
}

export function setRandomSeed(seed: number) {
  currentSeed = normalizeSeed(seed);
}

export function random() {
  // Linear congruential generator: small, fast, and predictable from the same seed.
  currentSeed = (currentSeed * 1664525 + 1013904223) >>> 0;
  return currentSeed / 4294967296;
}

export function randomRange(min: number, max: number) {
  return min + random() * (max - min);
}

export function randomCentered(amount: number) {
  return randomRange(-amount / 2, amount / 2);
}

export function chance(probability: number) {
  return random() < Math.max(0, Math.min(1, probability));
}
