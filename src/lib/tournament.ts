import { nonNeg, round2 } from "./format";

export type TourType = "normal" | "bounty";

export type TourSettings = {
  buyIn: number;
  rebuy: number;
  addOnEnabled: boolean;
  addOn: number;
  bounty: number; // per entry, bounty tournaments only
  operationCost: number; // fixed ฿ per tournament
  bubble: number; // fixed ฿ for the first place out of the money; 0 = none
  roundTo: number; // round each prize down to this unit
};

export type TourPlayer = {
  id: string;
  name: string;
  rebuys: number;
  addOns: number;
  bustedAt: number | null; // bust order; null = still playing
};

// One per bust. A re-buy keeps the knockout, so the bounty stays earned.
export type Knockout = { victimId: string; byId: string | null };

export type Tournament = {
  type: TourType;
  settings: TourSettings;
  players: TourPlayer[];
  payouts: number[]; // percent per place, index 0 = 1st
  knockouts: Knockout[];
};

export type Prize = { place: number; percent: number; amount: number };

export type TourRow = {
  id: string;
  name: string;
  entries: number;
  rebuys: number;
  addOns: number;
  paid: number;
  place: number | null; // null while still playing
  prize: number;
  knockouts: number;
  bountyWon: number;
  net: number;
  busted: boolean;
};

export type TourResult = {
  rows: TourRow[];
  totalEntries: number;
  totalRebuys: number;
  totalAddOns: number;
  totalPaid: number;
  bountyPool: number;
  prizeGross: number;
  operationCost: number;
  bubble: Prize | null; // percent is 0; amount is the fixed bubble prize
  netPool: number; // what the payout percentages split (after bubble)
  percentSum: number;
  prizes: Prize[];
  activeCount: number;
  finished: boolean;
};

export const defaultTourSettings: TourSettings = {
  buyIn: 500,
  rebuy: 500,
  addOnEnabled: false,
  addOn: 500,
  bounty: 100,
  operationCost: 0,
  bubble: 0,
  roundTo: 10,
};

// Suggested payout structure based on field size.
export function suggestPayouts(playerCount: number): number[] {
  if (playerCount <= 3) return [100];
  if (playerCount <= 6) return [65, 35];
  if (playerCount <= 10) return [50, 30, 20];
  if (playerCount <= 20) return [45, 27, 18, 10];
  if (playerCount <= 30) return [40, 25, 15, 11, 9];
  return [35, 22, 15, 11, 9, 8];
}

export function calculateTournament(t: Tournament): TourResult {
  const s = t.settings;
  const bounty = t.type === "bounty" ? nonNeg(s.bounty) : 0;
  const addOnPrice = s.addOnEnabled ? nonNeg(s.addOn) : 0;

  const entriesOf = (p: TourPlayer) => 1 + nonNeg(p.rebuys);
  const addOnsOf = (p: TourPlayer) => (s.addOnEnabled ? nonNeg(p.addOns) : 0);
  const paidOf = (p: TourPlayer) =>
    nonNeg(s.buyIn) + nonNeg(p.rebuys) * nonNeg(s.rebuy) + addOnsOf(p) * addOnPrice;

  const sum = (f: (p: TourPlayer) => number) =>
    t.players.reduce((acc, p) => acc + f(p), 0);
  const totalEntries = sum(entriesOf);
  const totalRebuys = sum((p) => nonNeg(p.rebuys));
  const totalAddOns = sum(addOnsOf);
  const totalPaid = sum(paidOf);

  const bountyPool = totalEntries * bounty;
  const prizeGross = Math.max(totalPaid - bountyPool, 0);
  const operationCost = Math.min(nonNeg(s.operationCost), prizeGross);

  // The bubble (first place out of the money) gets a fixed amount off the top,
  // as long as there is someone in that place.
  const percents = t.payouts.map(nonNeg);
  const bubblePlace = percents.length + 1;
  const bubbleAmount =
    t.players.length >= bubblePlace ? Math.min(nonNeg(s.bubble), prizeGross - operationCost) : 0;
  const bubble = bubbleAmount > 0 ? { place: bubblePlace, percent: 0, amount: bubbleAmount } : null;
  const netPool = prizeGross - operationCost - bubbleAmount;

  // Round each prize down, then give the leftover to 1st place so the
  // prizes always add up to exactly the net pool.
  const percentSum = round2(percents.reduce((a, b) => a + b, 0));
  const unit = nonNeg(s.roundTo) || 1;
  const prizes = percents.map((percent, i) => ({
    place: i + 1,
    percent,
    amount: Math.floor((netPool * percent) / 100 / unit) * unit,
  }));
  if (prizes.length > 0 && percentSum === 100) {
    const paidOut = prizes.reduce((a, p) => a + p.amount, 0);
    prizes[0].amount = round2(prizes[0].amount + netPool - paidOut);
  }

  // Places: first bust gets last place; the last one standing is 1st.
  const busted = t.players
    .filter((p) => p.bustedAt !== null)
    .sort((a, b) => a.bustedAt! - b.bustedAt!);
  const active = t.players.filter((p) => p.bustedAt === null);
  const finished = t.players.length >= 2 && active.length === 1;
  const placeOf = new Map<string, number>();
  busted.forEach((p, i) => placeOf.set(p.id, t.players.length - i));
  if (finished) placeOf.set(active[0].id, 1);

  // Each knockout pays the eliminator one bounty. Bounties never claimed
  // (the winner's own) go to the winner.
  const koCount = new Map<string, number>();
  for (const ko of t.knockouts) {
    if (ko.byId) koCount.set(ko.byId, (koCount.get(ko.byId) ?? 0) + 1);
  }
  const claimed = [...koCount.values()].reduce((a, b) => a + b, 0) * bounty;
  const unclaimed = Math.max(bountyPool - claimed, 0);

  const rows = t.players.map((p) => {
    const place = placeOf.get(p.id) ?? null;
    const prize =
      place === null ? 0 : place === bubble?.place ? bubble.amount : (prizes[place - 1]?.amount ?? 0);
    const knockouts = koCount.get(p.id) ?? 0;
    const bountyWon =
      knockouts * bounty + (finished && place === 1 ? unclaimed : 0);
    const paid = paidOf(p);
    return {
      id: p.id,
      name: p.name,
      entries: entriesOf(p),
      rebuys: nonNeg(p.rebuys),
      addOns: addOnsOf(p),
      paid,
      place,
      prize,
      knockouts,
      bountyWon,
      net: round2(prize + bountyWon - paid),
      busted: p.bustedAt !== null,
    };
  });

  return {
    rows,
    totalEntries,
    totalRebuys,
    totalAddOns,
    totalPaid,
    bountyPool,
    prizeGross,
    operationCost,
    bubble,
    netPool,
    percentSum,
    prizes,
    activeCount: active.length,
    finished,
  };
}

// Results order: players still in first, then by finishing place.
export const byPlace = (a: TourRow, b: TourRow) => (a.place ?? 0) - (b.place ?? 0);

export function bustPlayer(t: Tournament, victimId: string, byId: string | null): Tournament {
  const seq = Math.max(0, ...t.players.map((p) => p.bustedAt ?? 0)) + 1;
  return {
    ...t,
    players: t.players.map((p) => (p.id === victimId ? { ...p, bustedAt: seq } : p)),
    knockouts: [...t.knockouts, { victimId, byId }],
  };
}

// Undo the player's latest bust (a mistake), removing its knockout too.
export function undoBust(t: Tournament, id: string): Tournament {
  const idx = t.knockouts.findLastIndex((k) => k.victimId === id);
  return {
    ...t,
    players: t.players.map((p) => (p.id === id ? { ...p, bustedAt: null } : p)),
    knockouts: idx < 0 ? t.knockouts : t.knockouts.filter((_, i) => i !== idx),
  };
}

// Re-buy brings a busted player back in; their knockout still counts.
export function rebuyPlayer(t: Tournament, id: string): Tournament {
  return {
    ...t,
    players: t.players.map((p) =>
      p.id === id ? { ...p, rebuys: p.rebuys + 1, bustedAt: null } : p,
    ),
  };
}

export function removePlayer(t: Tournament, id: string): Tournament {
  return {
    ...t,
    players: t.players.filter((p) => p.id !== id),
    knockouts: t.knockouts
      .filter((k) => k.victimId !== id)
      .map((k) => (k.byId === id ? { ...k, byId: null } : k)),
  };
}
