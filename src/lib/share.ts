import { calculateCash, type CashGame } from "./cash";
import { baht, signedBaht } from "./format";
import { byPlace, calculateTournament, type Tournament } from "./tournament";

export type SharePayload =
  | { k: "t"; d: Tournament }
  | { k: "c"; d: CashGame };

// The whole game goes into the link itself (deflate + base64url), so sharing
// needs no database.
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const body = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(body).arrayBuffer());
}

export async function encodeShare(payload: SharePayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  const bytes = await pipe(json, new CompressionStream("deflate-raw"));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function decodeShare(data: string): Promise<SharePayload> {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const json = await pipe(bytes, new DecompressionStream("deflate-raw"));
  return JSON.parse(new TextDecoder().decode(json));
}

const medal = (place: number) => ["🥇", "🥈", "🥉"][place - 1] ?? "▫️";

export const tourTitle = (t: Tournament) =>
  t.type === "bounty" ? "ทัวร์นาเมนต์ Bounty" : "ทัวร์นาเมนต์";

// Plain-text summary for pasting into LINE.
export function tournamentText(t: Tournament): string {
  const r = calculateTournament(t);
  const bounty = t.type === "bounty";
  const lines = [
    `🏆 ${tourTitle(t)} (${t.players.length} คน)`,
    `เงินรางวัลสุทธิ ${baht(r.netPool)}`,
    `(ยอดรวม ${baht(r.totalPaid)}${bounty ? ` · บาวน์ตี้ ${baht(r.bountyPool)}` : ""} · ค่าดำเนินการ ${baht(r.operationCost)})`,
    "",
    "— เงินรางวัล —",
    ...r.prizes.map((p) => {
      const who = r.rows.find((row) => row.place === p.place);
      return `${medal(p.place)} ${p.place}. ${who?.name ?? "-"}  ${baht(p.amount)}`;
    }),
  ];
  if (r.bubble) {
    const who = r.rows.find((row) => row.place === r.bubble!.place);
    lines.push(`🫧 ${r.bubble.place}. ${who?.name ?? "-"}  ${baht(r.bubble.amount)} (บับเบิล)`);
  }
  if (bounty) {
    lines.push("", "— บาวน์ตี้ —");
    for (const row of [...r.rows].sort((a, b) => b.bountyWon - a.bountyWon)) {
      if (row.bountyWon > 0) lines.push(`${row.name}  ${row.knockouts} น็อค  ${baht(row.bountyWon)}`);
    }
  }
  lines.push("", "— สุทธิ —");
  for (const row of [...r.rows].sort(byPlace)) {
    lines.push(`${row.place ?? "-"}. ${row.name}  ${signedBaht(row.net)}`);
  }
  return lines.join("\n");
}

export function cashText(g: CashGame): string {
  const r = calculateCash(g);
  const lines = [
    `💵 แคชเกม (${g.players.length} คน)`,
    `บายอินรวม ${baht(r.totalIn)} · ค่าดำเนินการ ${baht(r.operationCost)}`,
    "",
    "— ได้/เสีย —",
    ...[...r.rows]
      .sort((a, b) => (b.pl ?? 0) - (a.pl ?? 0))
      .map((row) => `${row.name}  ${row.pl === null ? "ยังไม่แคชเอาท์" : signedBaht(row.pl)}`),
  ];
  if (r.transfers.length > 0) {
    lines.push("", "— การโอน —");
    for (const tr of r.transfers) lines.push(`${tr.from} → ${tr.to}  ${baht(tr.amount)}`);
  }
  return lines.join("\n");
}
