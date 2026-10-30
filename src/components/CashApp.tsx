"use client";

import { useMemo, useState } from "react";
import { calculateCash, type CashGame, type CashPlayer, type CashRow } from "@/lib/cash";
import { baht, shortId, signedBaht } from "@/lib/format";
import { cashText } from "@/lib/share";
import { CashSummary, Transfers } from "./CashResults";
import { ShareBar } from "./ShareBar";
import { btn, Card, ConfirmButton, Counter, inputCls, NumberField, plColor, usePersistentState } from "./ui";

type CashState = CashGame & { defaultBuyIn: number };

const newCashGame = (): CashState => ({ operationCost: 0, defaultBuyIn: 1000, players: [] });

export default function CashApp() {
  const [g, setG] = usePersistentState<CashState>("cash-v1", newCashGame);
  const [newName, setNewName] = useState("");
  const r = useMemo(() => calculateCash(g), [g]);

  const setPlayer = (id: string, patch: Partial<CashPlayer>) =>
    setG((x) => ({ ...x, players: x.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const addPlayer = () => {
    const name = newName.trim() || `ผู้เล่น ${g.players.length + 1}`;
    setG((x) => ({
      ...x,
      players: [...x.players, { id: shortId(), name, buyIns: [x.defaultBuyIn], cashOut: null }],
    }));
    setNewName("");
  };

  // Keep player names and settings; clear buy-ins and cash-outs.
  const newGame = () =>
    setG((x) => ({
      ...x,
      players: x.players.map((p) => ({ ...p, buyIns: [x.defaultBuyIn], cashOut: null })),
    }));

  const shared: CashGame = { operationCost: g.operationCost, players: g.players };
  const cashedOut = r.rows.filter((x) => x.cashOut !== null).length;

  return (
    // Same one-screen tablet layout as the tournament page.
    <div className="flex flex-col gap-3 lg:h-full">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-xl font-bold">💵 แคชเกม</h1>
        <span className="text-sm text-zinc-500">
          {g.players.length} คน · แคชเอาท์แล้ว {cashedOut}/{g.players.length}
        </span>
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          บายอินรวม {baht(r.totalIn)}
        </span>
        <div className="ml-auto">
          <ConfirmButton onConfirm={newGame}>เริ่มเกมใหม่</ConfirmButton>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_360px]">
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
            {g.players.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">ยังไม่มีผู้เล่น</p>
            ) : (
              // Fixed column widths so the table doesn't shift as numbers change.
              <table className="w-full min-w-[560px] table-fixed text-sm">
                <colgroup>
                  <col />
                  <col className="w-[104px]" />
                  <col className="w-[108px]" />
                  <col className="w-[88px]" />
                  <col className="w-[124px]" />
                  <col className="w-[92px]" />
                  <col className="w-[28px]" />
                </colgroup>
                <thead className="sticky top-0 z-10 whitespace-nowrap bg-white text-left text-xs text-zinc-500 dark:bg-zinc-950">
                  <tr>
                    <th className="py-1.5">ผู้เล่น</th>
                    <th className="py-1.5 text-center">บายอิน (+{baht(g.defaultBuyIn || 0)})</th>
                    <th className="py-1.5 text-center">จำนวนอื่น</th>
                    <th className="py-1.5 pl-3 text-right">รวมบายอิน</th>
                    <th className="py-1.5 pl-3">แคชเอาท์</th>
                    <th className="py-1.5 pl-3 text-right">ได้/เสีย</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="whitespace-nowrap tabular-nums">
                  {g.players.map((p) => (
                    <CashPlayerRow
                      key={p.id}
                      p={p}
                      row={r.rows.find((x) => x.id === p.id)!}
                      defaultBuyIn={g.defaultBuyIn}
                      onChange={(patch) => setPlayer(p.id, patch)}
                      onRemove={() => setG((x) => ({ ...x, players: x.players.filter((q) => q.id !== p.id) }))}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <aside className="min-h-0 space-y-3 overflow-y-auto">
          <details
            open={g.players.length === 0}
            className="group rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <summary className="cursor-pointer list-none text-sm">
              <span className="font-semibold">⚙️ ตั้งค่า</span>
              <span className="ml-2 text-zinc-500 group-open:hidden">
                บายอินเริ่มต้น {baht(g.defaultBuyIn || 0)} · ค่าดำเนินการ {baht(g.operationCost || 0)}
              </span>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberField
                label="บายอินเริ่มต้น"
                value={g.defaultBuyIn}
                onChange={(v) => setG((x) => ({ ...x, defaultBuyIn: v }))}
              />
              <NumberField
                label="ค่าดำเนินการ (฿)"
                value={g.operationCost}
                onChange={(v) => setG((x) => ({ ...x, operationCost: v }))}
              />
            </div>
          </details>

          <CashSummary r={r} />

          {g.players.length > 0 && (
            <Card title={r.balanced ? "🏁 สรุปการโอน" : "แชร์ผล"}>
              {r.balanced ? (
                <div className="-mt-4">
                  <Transfers r={r} />
                </div>
              ) : (
                <p className="text-sm text-zinc-500">การโอนจะแสดงเมื่อแคชเอาท์ครบและยอดตรงกัน</p>
              )}
              <ShareBar payload={{ k: "c", d: shared }} text={cashText(shared)} />
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function CashPlayerRow({
  p,
  row,
  defaultBuyIn,
  onChange,
  onRemove,
}: {
  p: CashPlayer;
  row: CashRow;
  defaultBuyIn: number;
  onChange: (patch: Partial<CashPlayer>) => void;
  onRemove: () => void;
}) {
  const [custom, setCustom] = useState("");

  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-800">
      <td className="py-1">
        <input
          className="w-full min-w-20 rounded-md bg-transparent px-1 py-1 outline-none hover:bg-zinc-100 focus:bg-zinc-100 dark:hover:bg-zinc-900 dark:focus:bg-zinc-900"
          value={p.name}
          aria-label="ชื่อผู้เล่น"
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </td>
      <td className="py-1" title={p.buyIns.map(baht).join(" + ")}>
        {/* − removes the latest buy-in, + adds one at the default amount */}
        <Counter
          label="บายอิน"
          hideLabel
          value={p.buyIns.length}
          onMinus={() => onChange({ buyIns: p.buyIns.slice(0, -1) })}
          onPlus={() => defaultBuyIn > 0 && onChange({ buyIns: [...p.buyIns, defaultBuyIn] })}
        />
      </td>
      <td className="py-1 pl-2">
        <form
          className="flex justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            const amount = Number(custom);
            if (amount > 0) onChange({ buyIns: [...p.buyIns, amount] });
            setCustom("");
          }}
        >
          <input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="฿ + Enter"
            aria-label={`บายอินจำนวนอื่น ${p.name}`}
            className="w-24 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </form>
      </td>
      <td className="py-1 pl-3 text-right font-mono">{baht(row.totalIn)}</td>
      <td className="py-1 pl-3">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="ยังไม่แคชเอาท์"
          aria-label={`แคชเอาท์ ${p.name}`}
          className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={p.cashOut ?? ""}
          onChange={(e) => onChange({ cashOut: e.target.value === "" ? null : e.target.valueAsNumber })}
        />
      </td>
      <td className={`py-1 pl-3 text-right font-mono font-semibold ${row.pl === null ? "text-zinc-400" : plColor(row.pl)}`}>
        {row.pl === null ? "-" : signedBaht(row.pl)}
      </td>
      <td className="py-1 pl-1 text-right">
        <button className="px-1 text-zinc-400 hover:text-red-600" aria-label={`ลบ ${p.name}`} onClick={onRemove}>
          ✕
        </button>
      </td>
    </tr>
  );
}
