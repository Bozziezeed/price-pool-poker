import { HOUSE, type CashResult } from "@/lib/cash";
import { baht, signedBaht } from "@/lib/format";
import { Card, plColor, SummaryRow } from "./ui";

export function CashSummary({ r }: { r: CashResult }) {
  return (
    <Card title="สรุปยอด">
      <dl>
        <SummaryRow label="บายอินรวม" value={baht(r.totalIn)} />
        <SummaryRow label="ค่าดำเนินการ" value={`−${baht(r.operationCost)}`} className="text-red-600" />
        <SummaryRow label="ชิปที่ควรมีบนโต๊ะ" value={baht(r.expectedOut)} strong />
        <SummaryRow label="แคชเอาท์รวม" value={baht(r.totalOut)} />
      </dl>
      {!r.allCashedOut ? (
        <p className="mt-2 text-sm text-zinc-500">รอผู้เล่นแคชเอาท์ให้ครบ</p>
      ) : r.balanced ? (
        <p className="mt-2 text-sm font-medium text-emerald-600">✓ ยอดตรงกัน</p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-red-600">
          ⚠ ยอดไม่ตรง: แคชเอาท์{r.diff > 0 ? "เกิน" : "ขาด"} {baht(Math.abs(r.diff))}
        </p>
      )}
    </Card>
  );
}

export function CashTable({ r }: { r: CashResult }) {
  const rows = [...r.rows].sort((a, b) => (b.pl ?? -Infinity) - (a.pl ?? -Infinity));
  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[360px] text-sm">
          <thead className="text-left text-xs text-zinc-500">
            <tr>
              <th className="pb-2">ผู้เล่น</th>
              <th className="pb-2 text-right">บายอิน</th>
              <th className="pb-2 text-right">แคชเอาท์</th>
              <th className="pb-2 text-right">ได้/เสีย</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2">{row.name}</td>
                <td className="py-2 text-right font-mono">{baht(row.totalIn)}</td>
                <td className="py-2 text-right font-mono">{row.cashOut === null ? "-" : baht(row.cashOut)}</td>
                <td className={`py-2 text-right font-mono font-semibold ${row.pl === null ? "" : plColor(row.pl)}`}>
                  {row.pl === null ? "-" : signedBaht(row.pl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Transfers r={r} />
    </>
  );
}

export function Transfers({ r }: { r: CashResult }) {
  if (r.transfers.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="mb-2 font-semibold">การโอนเงิน</h3>
      <ul className="space-y-1.5">
        {r.transfers.map((tr, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900"
          >
            <span>
              <b>{tr.from}</b> <span className="text-zinc-400">→</span>{" "}
              <b className={tr.to === HOUSE ? "font-normal text-zinc-500" : ""}>{tr.to}</b>
            </span>
            <span className="font-mono font-semibold tabular-nums">{baht(tr.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
