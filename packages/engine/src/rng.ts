export type Rng = {
  next(): number;
  int(n: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: T[]): T[];
};

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number) => Math.floor(next() * n);
  return {
    next,
    int,
    pick<T>(arr: readonly T[]): T {
      if (arr.length === 0) throw new Error('pick from empty array');
      return arr[int(arr.length)];
    },
    shuffle<T>(arr: T[]): T[] {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32) >>> 0;
}
