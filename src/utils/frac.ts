import type { Frac } from "../types";

export const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** value of a fraction (mixed supported) as improper numerator/denominator */
export const improper = (f: Frac): [number, number] => [(f.w ?? 0) * f.d + f.n, f.d];

/** exact equality via cross multiplication (accepts equivalent forms) */
export const equals = (a: Frac, b: Frac): boolean => {
  const [an, ad] = improper(a);
  const [bn, bd] = improper(b);
  return an * bd === bn * ad;
};

export const value = (f: Frac): number => {
  const [n, d] = improper(f);
  return n / d;
};

export const isSimplest = (f: Frac): boolean => gcd(f.n, f.d) === 1;

export const fmt = (f: Frac): string =>
  f.w ? `${f.w} ${f.n}/${f.d}` : `${f.n}/${f.d}`;

/** deterministic-ish shuffle for level layouts */
export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
