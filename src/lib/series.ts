// Deterministic monthly series behind the Annual Report's figures and technical charts.
// Every monthly series sums exactly to the annual figure in the table. Nothing here is money.
export const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
export const COFFEE: Record<number, number> = { 2020: 812, 2021: 901, 2022: 955, 2023: 1010, 2024: 1062, 2025: 1096, 2026: 1140 };
export const LAMPS: Record<number, number> = { 2020: 3, 2021: 5, 2022: 6, 2023: 8, 2024: 7, 2025: 9, 2026: 14 };
const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const MDAYS = (y: number) => [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export type Candle = { y: number; m: number; o: number; h: number; l: number; c: number; vol: number; ma?: number; rsi?: number };
export function coffee(): Candle[] {
  const r = rng(1140), out: Candle[] = [];
  for (const y of [...YEARS].reverse()) {
    const days = MDAYS(y), n = days.reduce((a, b) => a + b, 0), avg = COFFEE[y] / n;
    // daily cups: whole numbers around the year's average, with a winter lean
    const daily: number[][] = days.map((d, m) => Array.from({ length: d }, () => Math.max(1, Math.round(avg + 0.35 * Math.cos((m / 12) * 2 * Math.PI) + (r() - 0.5) * 2.4))));
    let diff = COFFEE[y] - daily.flat().reduce((a, b) => a + b, 0);
    while (diff !== 0) { const m = Math.floor(r() * 12), d = Math.floor(r() * days[m]); const v = daily[m][d] + Math.sign(diff); if (v >= 1 && v <= 6) { daily[m][d] = v; diff -= Math.sign(diff); } }
    daily.forEach((dd, m) => {
      const wk = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
      const weeks = [0, 7, 14, 21].map((s, i) => wk(dd.slice(s, i === 3 ? dd.length : s + 7)));
      out.push({ y, m, o: weeks[0], c: weeks[3], h: Math.max(...weeks), l: Math.min(...weeks), vol: dd.reduce((a, b) => a + b, 0) });
    });
  }
  out.forEach((k, i) => { if (i >= 11) k.ma = out.slice(i - 11, i + 1).reduce((a, b) => a + b.c, 0) / 12; });
  // Relative Sleepiness Index: a 6-month RSI of the closes
  for (let i = 6; i < out.length; i++) {
    let up = 0, dn = 0;
    for (let j = i - 5; j <= i; j++) { const d = out[j].c - out[j - 1].c; if (d > 0) up += d; else dn -= d; }
    out[i].rsi = dn === 0 ? 100 : 100 - 100 / (1 + up / dn);
  }
  return out;
}

export type LampPt = { y: number; m: number; v: number; mid?: number; hi?: number; lo?: number };
export function lamps(): LampPt[] {
  const r = rng(14), out: LampPt[] = [];
  for (const y of [...YEARS].reverse()) {
    const months = Array(12).fill(0);
    // later in 2026 the lamp is simply left on more
    for (let k = 0; k < LAMPS[y]; k++) months[y === 2026 ? 5 + Math.floor(r() * 7) : Math.floor(r() * 12)]++;
    months.forEach((v, m) => out.push({ y, m, v }));
  }
  out.forEach((p, i) => {
    if (i < 5) return;
    const w = out.slice(i - 5, i + 1).map((q) => q.v), mid = w.reduce((a, b) => a + b, 0) / 6;
    const sd = Math.sqrt(w.reduce((a, b) => a + (b - mid) ** 2, 0) / 6);
    Object.assign(p, { mid, hi: mid + 2 * sd, lo: Math.max(0, mid - 2 * sd) });
  });
  return out;
}
