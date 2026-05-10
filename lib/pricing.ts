/**
 * Polymarket gives YES probability in [0, 1]. We treat that as the country
 * "share price" by multiplying by 100 and rounding to two decimal places.
 */
export function probabilityToPrice(p: number): number {
  if (!Number.isFinite(p) || p < 0) return 0;
  return Math.round(p * 100 * 100) / 100;
}

export function pctChange(current: number, baseline: number): number {
  if (baseline === 0) return 0;
  return ((current - baseline) / baseline) * 100;
}

export function roundCurrency(n: number): number {
  return Math.round(n * 100) / 100;
}
