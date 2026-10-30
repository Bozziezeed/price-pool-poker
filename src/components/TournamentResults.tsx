import { baht, signedBaht } from "@/lib/format";
import { byPlace, type TourResult, type Tournament } from "@/lib/tournament";
import { Card, plColor, SummaryRow } from "./ui";

export function PoolSummary({ t, r }: { t: Tournament; r: TourResult }) {
  const s = t.settings;
  const bounty = t.type === "bounty";
  return (
    <Card title="สรุปเงินรางวัล">
      <dl>
        <SummaryRow label={`บายอิน (${t.players.length} × ${baht(s.buyIn || 0)})`} value={baht(t.players.length * (s.buyIn || 0))} />
        <SummaryRow label={`รีบาย (${r.totalRebuys} × ${baht(s.rebuy || 0)})`} value={baht(r.totalRebuys * (s.rebuy || 0))} />
        {s.addOnEnabled && (
          <SummaryRow label={`แอดออน (${r.totalAddOns} × ${baht(s.addOn || 0)})`} value={baht(r.totalAddOns * (s.addOn || 0))} />
        )}
        <SummaryRow label="ยอดรวมทั้งหมด" value={baht(r.totalPaid)} strong />
        {bounty && (
          <SummaryRow
            label={`กองบาวน์ตี้ (${r.totalEntries} × ${baht(s.bounty || 0)})`}
            value={`−${baht(r.bountyPool)}`}
            className="text-amber-600"
          />
        )}
        <SummaryRow label="ค่าดำเนินการ" value={`−${baht(r.operationCost)}`} className="text-red-600" />
        {r.bubble && (
          <SummaryRow
            label={`บับเบิล (อันดับ ${r.bubble.place})`}
            value={`−${baht(r.bubble.amount)}`}
            className="text-sky-600"
          />
        )}
        <SummaryRow
          label="เงินรางวัลสุทธิ"
          value={baht(r.netPool)}
          strong
          className="text-xl text-emerald-700 dark:text-emerald-400"
        />
      </dl>
    </Card>
  );
}

export function ResultsTable({ t, r }: { t: Tournament; r: TourResult }) {
  const bounty = t.type === "bounty";
  const rows = [...r.rows].sort(byPlace);
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="text-left text-xs text-zinc-500">
          <tr>
            <th className="pb-2">อันดับ</th>
            <th className="pb-2">ผู้เล่น</th>
            <th className="pb-2 text-center">บายอิน</th>
            <th className="pb-2 text-right">จ่าย</th>
            <th className="pb-2 text-right">รางวัล</th>
            {bounty && <th className="pb-2 text-right">บาวน์ตี้</th>}
            <th className="pb-2 text-right">สุทธิ</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="py-2 font-medium">
                {row.place ?? <span className="text-xs text-emerald-600">เล่นอยู่</span>}
              </td>
              <td className="py-2">{row.name}</td>
              <td className="py-2 text-center font-mono">
                {row.entries}
                {row.addOns > 0 && <span className="ml-1 text-xs text-zinc-500">+{row.addOns} แอดออน</span>}
              </td>
              <td className="py-2 text-right font-mono">{baht(row.paid)}</td>
              <td className="py-2 text-right font-mono">{row.prize ? baht(row.prize) : "-"}</td>
              {bounty && (
                <td className="py-2 text-right font-mono">
                  {row.bountyWon ? baht(row.bountyWon) : "-"}
                  {row.knockouts > 0 && <span className="ml-1 text-xs text-zinc-500">({row.knockouts})</span>}
                </td>
              )}
              <td className={`py-2 text-right font-mono font-semibold ${plColor(row.net)}`}>
                {signedBaht(row.net)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
