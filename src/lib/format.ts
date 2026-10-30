export const baht = (x: number) =>
  "฿" + x.toLocaleString("th-TH", { maximumFractionDigits: 2 });

// Signed amount, e.g. "+฿1,200" / "-฿500".
export const signedBaht = (x: number) =>
  (x > 0 ? "+" : x < 0 ? "-" : "") + baht(Math.abs(x));

// Treat empty/negative/NaN input as 0.
export const nonNeg = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);

export const round2 = (x: number) => Math.round(x * 100) / 100;

export const shortId = () => Math.random().toString(36).slice(2, 8);
