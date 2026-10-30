"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { calculateCash } from "@/lib/cash";
import { decodeShare, tourTitle, type SharePayload } from "@/lib/share";
import { calculateTournament, type Tournament } from "@/lib/tournament";
import { CashSummary, CashTable } from "./CashResults";
import { PoolSummary, ResultsTable } from "./TournamentResults";
import { Card } from "./ui";

export default function ShareView({ data }: { data: string }) {
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    decodeShare(data).then(setPayload, () => setError(true));
  }, [data]);

  if (error || !data) {
    return (
      <p className="py-16 text-center text-zinc-500">
        ลิงก์ไม่ถูกต้อง ·{" "}
        <Link href="/" className="text-emerald-600 underline">
          กลับหน้าแรก
        </Link>
      </p>
    );
  }
  if (!payload) return <p className="py-16 text-center text-zinc-500">กำลังโหลด…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-3">
      <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        👀 ผลที่แชร์มา (ดูอย่างเดียว)
      </p>
      {payload.k === "t" ? (
        <TourShare t={payload.d} />
      ) : (
        <>
          <h1 className="text-2xl font-bold">💵 แคชเกม</h1>
          <Card title="ผลได้/เสีย">
            <CashTable r={calculateCash(payload.d)} />
          </Card>
          <CashSummary r={calculateCash(payload.d)} />
        </>
      )}
    </div>
  );
}

function TourShare({ t }: { t: Tournament }) {
  const r = calculateTournament(t);
  return (
    <>
      <h1 className="text-2xl font-bold">
        {t.type === "bounty" ? "🎯 " : "🏆 "}
        {tourTitle(t)}
      </h1>
      <Card title={r.finished ? "🏁 ผลการแข่งขัน" : "ผลการแข่งขัน (ระหว่างเล่น)"}>
        <ResultsTable t={t} r={r} />
      </Card>
      <PoolSummary t={t} r={r} />
    </>
  );
}
