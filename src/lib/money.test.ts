import { describe, expect, it } from "vitest";
import { calculateCash, HOUSE } from "./cash";
import { decodeShare, encodeShare } from "./share";
import {
  bustPlayer,
  calculateTournament,
  defaultTourSettings,
  rebuyPlayer,
  undoBust,
  type Tournament,
} from "./tournament";

const player = (id: string) => ({ id, name: id, rebuys: 0, addOns: 0, bustedAt: null });

describe("bounty tournament", () => {
  let t: Tournament = {
    type: "bounty",
    settings: { ...defaultTourSettings, buyIn: 500, rebuy: 500, bounty: 100, operationCost: 200, roundTo: 10 },
    players: ["A", "B", "C", "D"].map(player),
    payouts: [65, 35],
    knockouts: [],
  };
  t = bustPlayer(t, "B", "A");
  t = rebuyPlayer(t, "B");
  t = bustPlayer(t, "D", "C");
  t = bustPlayer(t, "B", "A");
  t = bustPlayer(t, "C", "A");
  const r = calculateTournament(t);
  const row = (id: string) => r.rows.find((x) => x.id === id)!;

  it("computes the pools", () => {
    expect(r.totalEntries).toBe(5);
    expect(r.totalPaid).toBe(2500);
    expect(r.bountyPool).toBe(500);
    expect(r.netPool).toBe(1800); // 2500 - 500 bounty - 200 cost
    expect(r.prizes.map((p) => p.amount)).toEqual([1170, 630]);
  });

  it("assigns places by bust order", () => {
    expect(r.finished).toBe(true);
    expect(["A", "C", "B", "D"].map((id) => row(id).place)).toEqual([1, 2, 3, 4]);
  });

  it("pays bounties to eliminators and the winner's own to the winner", () => {
    expect(row("A").bountyWon).toBe(400); // 3 KOs + own bounty
    expect(row("C").bountyWon).toBe(100);
    expect(row("A").net).toBe(1070);
    // Everyone's net adds up to minus the operation cost.
    expect(r.rows.reduce((a, x) => a + x.net, 0)).toBe(-200);
  });

  it("undo removes the knockout", () => {
    const u = calculateTournament(undoBust(t, "C"));
    expect(u.finished).toBe(false);
    expect(u.rows.find((x) => x.id === "A")!.knockouts).toBe(2);
  });
});

describe("normal tournament", () => {
  it("rounds prizes down and gives the leftover to 1st", () => {
    const r = calculateTournament({
      type: "normal",
      settings: { ...defaultTourSettings, buyIn: 350, roundTo: 100 },
      players: ["A", "B", "C"].map(player),
      payouts: [50, 30, 20],
      knockouts: [],
    });
    expect(r.bountyPool).toBe(0);
    expect(r.prizes.map((p) => p.amount)).toEqual([550, 300, 200]);
  });
});

describe("cash game", () => {
  const game = {
    operationCost: 200,
    players: [
      { id: "a", name: "A", buyIns: [1000, 500], cashOut: 2500 },
      { id: "b", name: "B", buyIns: [1000], cashOut: 0 },
      { id: "c", name: "C", buyIns: [1000], cashOut: 800 },
    ],
  };

  it("computes profit/loss and settlement", () => {
    const r = calculateCash(game);
    expect(r.balanced).toBe(true);
    expect(r.rows.map((x) => x.pl)).toEqual([1000, -1000, -200]);
    expect(r.transfers).toEqual([
      { from: "B", to: "A", amount: 1000 },
      { from: "C", to: HOUSE, amount: 200 },
    ]);
  });

  it("flags a mismatch", () => {
    const r = calculateCash({ ...game, players: game.players.map((p) => ({ ...p, cashOut: p.id === "c" ? 300 : p.cashOut })) });
    expect(r.balanced).toBe(false);
    expect(r.diff).toBe(-500);
    expect(r.transfers).toEqual([]);
  });

  it("round-trips through a share link", async () => {
    const data = await encodeShare({ k: "c", d: { ...game, players: [{ ...game.players[0], name: "สมชาย" }] } });
    expect(data).toMatch(/^[A-Za-z0-9_-]+$/);
    const back = await decodeShare(data);
    expect(back.k === "c" && back.d.players[0].name).toBe("สมชาย");
  });
});

describe("bubble", () => {
  const base: Tournament = {
    type: "normal",
    settings: { ...defaultTourSettings, buyIn: 500, operationCost: 0, bubble: 500, roundTo: 10 },
    players: ["A", "B", "C", "D", "E"].map(player),
    payouts: [60, 40],
    knockouts: [],
  };

  it("pays the first place out of the money before the % split", () => {
    let t = base;
    for (const id of ["E", "D", "C", "B"]) t = bustPlayer(t, id, null);
    const r = calculateTournament(t);
    expect(r.bubble).toEqual({ place: 3, percent: 0, amount: 500 });
    expect(r.netPool).toBe(2000); // 2500 - 500 bubble
    expect(r.rows.find((x) => x.id === "C")!.prize).toBe(500); // finished 3rd
    expect(r.rows.map((x) => x.prize)).toEqual([1200, 800, 500, 0, 0]);
  });

  it("is skipped when nobody finishes out of the money", () => {
    const r = calculateTournament({ ...base, players: base.players.slice(0, 2) });
    expect(r.bubble).toBeNull();
    expect(r.netPool).toBe(1000);
  });
});
