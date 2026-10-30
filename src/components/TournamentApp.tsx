"use client";

import { Fragment, useMemo, useState } from "react";
import { baht, shortId, signedBaht } from "@/lib/format";
import { tournamentText, tourTitle } from "@/lib/share";
import {
  bustPlayer,
  byPlace,
  calculateTournament,
  defaultTourSettings,
  rebuyPlayer,
  removePlayer,
  suggestPayouts,
  undoBust,
  type TourPlayer,
  type TourSettings,
  type TourType,
  type Tournament,
} from "@/lib/tournament";
import { ShareBar } from "./ShareBar";
import { PoolSummary } from "./TournamentResults";
import { btn, Card, ConfirmButton, Counter, inputCls, NumberField, plColor, usePersistentState } from "./ui";

const newTournament = (type: TourType): Tournament => ({
  type,
  settings: defaultTourSettings,
  players: [],
  payouts: [100],
  knockouts: [],
});

export default function TournamentApp({ type }: { type: TourType }) {
  const [t, setT] = usePersistentState(`tour-${type}-v1`, () => newTournament(type));
  const [newName, setNewName] = useState("");
  const [bustingId, setBustingId] = useState<string | null>(null);

  const r = useMemo(() => calculateTournament(t), [t]);
  const isBounty = type === "bounty";
  const s = t.settings;

  const setSetting = <K extends keyof TourSettings>(key: K, value: TourSettings[K]) =>
    setT((x) => ({ ...x, settings: { ...x.settings, [key]: value } }));
  const setPlayer = (id: string, patch: Partial<TourPlayer>) =>
    setT((x) => ({ ...x, players: x.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const addPlayer = () => {
    const name = newName.trim() || `ผู้เล่น ${t.players.length + 1}`;
    setT((x) => ({
      ...x,
      players: [...x.players, { id: shortId(), name, rebuys: 0, addOns: 0, bustedAt: null }],
    }));
    setNewName("");
  };

  const bust = (victimId: string, byId: string | null) => {
    setT((x) => bustPlayer(x, victimId, byId));
    setBustingId(null);
  };

  // Keep settings and player names for the next game; clear everything else.
  const newGame = () => {
    setT((x) => ({
      ...x,
      players: x.players.map((p) => ({ ...p, rebuys: 0, addOns: 0, bustedAt: null })),
      knockouts: [],
    }));
    setBustingId(null);
  };

  const playerOf = (id: string) => t.players.find((p) => p.id === id)!;
  const activePlayers = t.players.filter((p) => p.bustedAt === null);
  // Players still in stay on top (in entry order), busted ones below by place.
  const rows = [...r.rows].sort(byPlace);
  const percentOk = r.percentSum === 100;
  const colCount = 8 + (s.addOnEnabled ? 1 : 0) + (isBounty ? 1 : 0);

  return (
    // On tablet landscape and up the page fits one screen; each column scrolls on its own.
    <div className="flex flex-col gap-3 lg:h-full">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-xl font-bold">
          {isBounty ? "🎯 " : "🏆 "}
          {tourTitle(t)}
        </h1>
        <span className="text-sm text-zinc-500">
          {t.players.length} คน · {r.totalEntries} เอนทรี · เหลือ {r.activeCount}
        </span>
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          รางวัลสุทธิ {baht(r.netPool)}
        </span>
        <div className="ml-auto">
          <ConfirmButton onConfirm={newGame}>เริ่มเกมใหม่</ConfirmButton>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Players + live results */}
        <section className="flex min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <form
            className="mb-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addPlayer();
            }}
          >
            <input
              className={`${inputCls} py-1.5`}
              placeholder="ชื่อผู้เล่น"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit" className={`${btn.primary} shrink-0 py-1.5`}>
              + เพิ่มผู้เล่น
            </button>
          </form>

          <div className="min-h-0 flex-1 overflow-auto">
            {t.players.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">ยังไม่มีผู้เล่น</p>
            ) : (
              // Fixed column widths so the table doesn't shift as numbers change.
              <table className="w-full min-w-[560px] table-fixed text-sm">
                <colgroup>
                  <col className="w-[52px]" />
                  <col />
                  <col className="w-[100px]" />
                  {s.addOnEnabled && <col className="w-[100px]" />}
                  <col className="w-[76px]" />
                  <col className="w-[80px]" />
                  {isBounty && <col className="w-[96px]" />}
                  <col className="w-[84px]" />
                  <col className="w-[76px]" />
                  <col className="w-[28px]" />
                </colgroup>
                <thead className="sticky top-0 z-10 whitespace-nowrap bg-white text-left text-xs text-zinc-500 dark:bg-zinc-950">
                  <tr>
                    <th className="py-1.5 pr-1">อันดับ</th>
                    <th className="py-1.5">ผู้เล่น</th>
                    <th className="py-1.5 text-center">บายอิน</th>
                    {s.addOnEnabled && <th className="py-1.5 text-center">แอดออน</th>}
                    <th className="py-1.5 pl-3 text-right">จ่าย</th>
                    <th className="py-1.5 pl-3 text-right">รางวัล</th>
                    {isBounty && <th className="py-1.5 pl-3 text-right">บาวน์ตี้</th>}
                    <th className="py-1.5 pl-3 text-right">สุทธิ</th>
                    <th />
                    <th />
                  </tr>
                </thead>
                <tbody className="whitespace-nowrap tabular-nums">
                  {rows.map((row) => {
                    const p = playerOf(row.id);
                    const out = row.busted;
                    return (
                      <Fragment key={row.id}>
                        <tr className="border-t border-zinc-100 dark:border-zinc-800">
                          <td className="py-1 pr-1">
                            {row.place !== null ? (
                              <span className={`font-semibold ${row.prize > 0 ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                                {row.place}
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                เล่นอยู่
                              </span>
                            )}
                          </td>
                          <td className={`py-1 ${out ? "opacity-60" : ""}`}>
                            <input
                              className="w-full min-w-20 rounded-md bg-transparent px-1 py-1 outline-none hover:bg-zinc-100 focus:bg-zinc-100 dark:hover:bg-zinc-900 dark:focus:bg-zinc-900"
                              value={p.name}
                              aria-label="ชื่อผู้เล่น"
                              onChange={(e) => setPlayer(p.id, { name: e.target.value })}
                            />
                          </td>
                          <td className="py-1">
                            <Counter
                              label="บายอิน"
                              hideLabel
                              value={row.entries}
                              min={1}
                              onMinus={() => setPlayer(p.id, { rebuys: p.rebuys - 1 })}
                              onPlus={() => setT((x) => rebuyPlayer(x, p.id))}
                            />
                          </td>
                          {s.addOnEnabled && (
                            <td className="py-1">
                              <Counter
                                label="แอดออน"
                                hideLabel
                                value={p.addOns}
                                onMinus={() => setPlayer(p.id, { addOns: p.addOns - 1 })}
                                onPlus={() => setPlayer(p.id, { addOns: p.addOns + 1 })}
                              />
                            </td>
                          )}
                          <td className="py-1 pl-3 text-right font-mono">{baht(row.paid)}</td>
                          <td className="py-1 pl-3 text-right font-mono">{row.prize ? baht(row.prize) : "-"}</td>
                          {isBounty && (
                            <td className="py-1 pl-3 text-right font-mono">
                              {row.bountyWon ? baht(row.bountyWon) : "-"}
                              {row.knockouts > 0 && <span className="ml-1 text-xs text-amber-600">({row.knockouts})</span>}
                            </td>
                          )}
                          <td className={`py-1 pl-3 text-right font-mono font-semibold ${plColor(row.net)}`}>
                            {signedBaht(row.net)}
                          </td>
                          <td className="py-1 pl-2 text-right">
                            {out ? (
                              <button className={`${btn.small} whitespace-nowrap`} onClick={() => setT((x) => undoBust(x, p.id))}>
                                ↩ ยกเลิก
                              </button>
                            ) : (
                              activePlayers.length > 1 && (
                                <button
                                  className="whitespace-nowrap rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                                  onClick={() => (isBounty ? setBustingId(p.id) : bust(p.id, null))}
                                >
                                  ตกรอบ
                                </button>
                              )
                            )}
                          </td>
                          <td className="py-1 pl-1 text-right">
                            <button
                              className="px-1 text-zinc-400 hover:text-red-600"
                              aria-label={`ลบ ${p.name}`}
                              onClick={() => setT((x) => removePlayer(x, p.id))}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                        {bustingId === p.id && (
                          <tr>
                            <td colSpan={colCount} className="pb-2">
                              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 p-2 dark:bg-amber-950/40">
                                <span className="text-sm">ใครน็อค {p.name}?</span>
                                {activePlayers
                                  .filter((x) => x.id !== p.id)
                                  .map((x) => (
                                    <button key={x.id} className={`${btn.outline} py-1`} onClick={() => bust(p.id, x.id)}>
                                      {x.name}
                                    </button>
                                  ))}
                                <button className="px-2 text-sm text-zinc-500" onClick={() => setBustingId(null)}>
                                  ยกเลิก
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Settings, pool, payouts, share */}
        <aside className="min-h-0 space-y-3 overflow-y-auto">
          <details
            open={t.players.length === 0}
            className="group rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <summary className="cursor-pointer list-none text-sm">
              <span className="font-semibold">⚙️ ตั้งค่า</span>
              <span className="ml-2 text-zinc-500 group-open:hidden">
                บายอิน {baht(s.buyIn || 0)} · รีบาย {baht(s.rebuy || 0)}
                {isBounty && ` · บาวน์ตี้ ${baht(s.bounty || 0)}`} · ค่าดำเนินการ {baht(s.operationCost || 0)}
                {s.bubble > 0 && ` · บับเบิล ${baht(s.bubble)}`}
              </span>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberField label="ค่าบายอิน" value={s.buyIn} onChange={(v) => setSetting("buyIn", v)} />
              <NumberField label="ค่ารีบาย" value={s.rebuy} onChange={(v) => setSetting("rebuy", v)} />
              {isBounty && (
                <NumberField label="บาวน์ตี้ต่อเอนทรี" value={s.bounty} onChange={(v) => setSetting("bounty", v)} />
              )}
              <NumberField
                label="ค่าดำเนินการ (฿)"
                value={s.operationCost}
                onChange={(v) => setSetting("operationCost", v)}
              />
              <NumberField label="ค่าบับเบิล (฿)" value={s.bubble ?? 0} onChange={(v) => setSetting("bubble", v)} />
              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={s.addOnEnabled}
                    onChange={(e) => setSetting("addOnEnabled", e.target.checked)}
                  />
                  มีแอดออน
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  disabled={!s.addOnEnabled}
                  aria-label="ค่าแอดออน"
                  className={`${inputCls} mt-1 disabled:opacity-40`}
                  value={Number.isFinite(s.addOn) ? s.addOn : ""}
                  onChange={(e) => setSetting("addOn", e.target.valueAsNumber)}
                />
              </div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400">
                ปัดเศษรางวัลลงทีละ
                <select
                  className={`${inputCls} mt-1 text-zinc-900 dark:text-zinc-100`}
                  value={s.roundTo}
                  onChange={(e) => setSetting("roundTo", Number(e.target.value))}
                >
                  {[1, 10, 20, 50, 100].map((u) => (
                    <option key={u} value={u}>
                      {baht(u)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {isBounty && s.bounty > Math.min(s.buyIn || 0, s.rebuy || 0) && (
              <p className="mt-2 text-sm text-red-600">ค่าบาวน์ตี้มากกว่าค่าบายอิน/รีบาย</p>
            )}
          </details>

          <PoolSummary t={t} r={r} />

          <Card
            title="สัดส่วนรางวัล"
            action={
              <button
                className={btn.small}
                onClick={() => setT((x) => ({ ...x, payouts: suggestPayouts(calculateTournament(x).totalEntries) }))}
              >
                แนะนำสำหรับ {r.totalEntries} เอนทรี
              </button>
            }
          >
            <ul className="space-y-1.5">
              {r.prizes.map((prize, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-14 text-sm font-medium">อันดับ {prize.place}</span>
                  <div className="relative w-20">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      aria-label={`เปอร์เซ็นต์อันดับ ${prize.place}`}
                      className={`${inputCls} py-1 pr-7`}
                      value={Number.isFinite(t.payouts[i]) ? t.payouts[i] : ""}
                      onChange={(e) =>
                        setT((x) => ({
                          ...x,
                          payouts: x.payouts.map((v, j) => (j === i ? e.target.valueAsNumber : v)),
                        }))
                      }
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1.5 text-sm text-zinc-400">%</span>
                  </div>
                  <span className="flex-1 text-right font-mono font-semibold tabular-nums">{baht(prize.amount)}</span>
                  <button
                    className="px-1 text-zinc-400 hover:text-red-600"
                    aria-label={`ลบอันดับ ${prize.place}`}
                    onClick={() => setT((x) => ({ ...x, payouts: x.payouts.filter((_, j) => j !== i) }))}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            {r.bubble ? (
              <div className="mt-1.5 flex items-center gap-2 text-sm text-sky-700 dark:text-sky-400">
                <span className="w-14 font-medium">อันดับ {r.bubble.place}</span>
                <span>บับเบิล</span>
                <span className="flex-1 text-right font-mono font-semibold tabular-nums">{baht(r.bubble.amount)}</span>
                <span className="w-5" />
              </div>
            ) : (
              s.bubble > 0 && (
                <p className="mt-1.5 text-xs text-zinc-500">
                  บับเบิลจะได้เมื่อมีผู้เล่นมากกว่า {r.prizes.length} คน
                </p>
              )
            )}
            <div className="mt-2 flex items-center justify-between text-sm">
              <button
                className="text-emerald-600 hover:underline"
                onClick={() => setT((x) => ({ ...x, payouts: [...x.payouts, 0] }))}
              >
                + เพิ่มอันดับ
              </button>
              <span className={percentOk ? "text-emerald-600" : "font-semibold text-red-600"}>
                รวม {r.percentSum}%{!percentOk && " (ต้องเท่ากับ 100%)"}
              </span>
            </div>
          </Card>

          {t.players.length > 0 && (
            <Card title={r.finished ? "🏁 จบเกมแล้ว" : "แชร์ผล"}>
              <ShareBar payload={{ k: "t", d: t }} text={tournamentText(t)} />
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
