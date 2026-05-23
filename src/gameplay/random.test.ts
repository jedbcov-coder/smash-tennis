import { random, setRandomSeed } from './random';

describe('gameplay random seed reproducibility', () => {
  test('replays the same random sequence for the same seed', () => {
    setRandomSeed(20260522);
    const firstRun = [random(), random(), random(), random()];

    setRandomSeed(20260522);
    const secondRun = [random(), random(), random(), random()];

    expect(secondRun).toEqual(firstRun);
  });
});
