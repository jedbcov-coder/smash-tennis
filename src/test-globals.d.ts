declare function describe(name: string, callback: () => void): void;
declare function test(name: string, callback: () => void | Promise<void>): void;
declare function it(name: string, callback: () => void | Promise<void>): void;
declare function expect<T>(received: T): {
  toBe(expected: T): void;
  toEqual(expected: T): void;
  toBeGreaterThan(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeCloseTo(expected: number, precision?: number): void;
};
