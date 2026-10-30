import { nonNeg, round2 } from "./format";

export type CashPlayer = {
  id: string;
  name: string;
  buyIns: number[]; // each buy-in amount; can differ
  cashOut: number | null; // null = not cashed out yet
};

export type CashGame = {
  operationCost: number; // fixed ฿, taken out of the pot
  players: CashPlayer[];
};

export type CashRow = {
  id: string;
  name: string;
  totalIn: number;
  cashOut: number | null;
  pl: number | null;
};

export type Transfer = { from: string; to: string; amount: number };

export type CashResult = {
  rows: CashRow[];
  totalIn: number;
  operationCost: number;
  expectedOut: number; // chips that should be on the table
  totalOut: number;
  diff: number; // totalOut - expectedOut; should be 0
  allCashedOut: boolean;
  balanced: boolean;
  transfers: Transfer[];
};

export const HOUSE = "ค่าดำเนินการ";

export function calculateCash(g: CashGame): CashResult {
  const rows = g.players.map((p) => {
    const totalIn = p.buyIns.reduce((a, b) => a + nonNeg(b), 0);
    const cashOut = p.cashOut === null ? null : nonNeg(p.cashOut);
    return {
      id: p.id,
      name: p.name,
      totalIn,
      cashOut,
      pl: cashOut === null ? null : round2(cashOut - totalIn),
    };
  });

  const totalIn = rows.reduce((a, r) => a + r.totalIn, 0);
  const operationCost = Math.min(nonNeg(g.operationCost), totalIn);
  const expectedOut = totalIn - operationCost;
  const totalOut = rows.reduce((a, r) => a + (r.cashOut ?? 0), 0);
  const diff = round2(totalOut - expectedOut);
  const allCashedOut = rows.length > 0 && rows.every((r) => r.cashOut !== null);
  const balanced = allCashedOut && diff === 0;

  const balances = rows.map((r) => ({ name: r.name, amount: r.pl ?? 0 }));
  if (operationCost > 0) balances.push({ name: HOUSE, amount: operationCost });

  return {
    rows,
    totalIn,
    operationCost,
    expectedOut,
    totalOut,
    diff,
    allCashedOut,
    balanced,
    transfers: balanced ? settle(balances) : [],
  };
}

// Greedy settlement: largest debtor pays largest creditor until all even.
// Works in satang so rounding never leaves a stray 0.01.
export function settle(balances: { name: string; amount: number }[]): Transfer[] {
  const toSatang = (x: number) => Math.round(x * 100);
  const debtors = balances
    .map((b) => ({ name: b.name, left: -toSatang(b.amount) }))
    .filter((b) => b.left > 0)
    .sort((a, b) => b.left - a.left);
  const creditors = balances
    .map((b) => ({ name: b.name, left: toSatang(b.amount) }))
    .filter((b) => b.left > 0)
    .sort((a, b) => b.left - a.left);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].left, creditors[j].left);
    transfers.push({ from: debtors[i].name, to: creditors[j].name, amount: amt / 100 });
    debtors[i].left -= amt;
    creditors[j].left -= amt;
    if (debtors[i].left === 0) i++;
    if (creditors[j].left === 0) j++;
  }
  return transfers;
}
