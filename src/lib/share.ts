import type { CashGame } from "./cash";
import type { Tournament } from "./tournament";

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

export const tourTitle = (t: Tournament) =>
  t.type === "bounty" ? "ทัวร์นาเมนต์ Bounty" : "ทัวร์นาเมนต์";
