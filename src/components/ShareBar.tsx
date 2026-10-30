"use client";

import { useState } from "react";
import { encodeShare, type SharePayload } from "@/lib/share";
import { btn, inputCls } from "./ui";

export function ShareBar({ payload, text }: { payload: SharePayload; text: string }) {
  const [msg, setMsg] = useState("");
  // Clipboard needs https/localhost; otherwise show the text to copy by hand.
  const [fallback, setFallback] = useState<string | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2000);
  };

  const copy = async (value: string, done: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setFallback(null);
      flash(done);
    } catch {
      setFallback(value);
    }
  };

  const shareLink = async () => {
    const url = `${location.origin}/share?d=${await encodeShare(payload)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "ผลเกมโป๊กเกอร์", url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    await copy(url, "คัดลอกลิงก์แล้ว");
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button className={btn.primary} onClick={() => copy(text, "คัดลอกข้อความแล้ว")}>
          📋 คัดลอกข้อความ (LINE)
        </button>
        <button className={btn.outline} onClick={shareLink}>
          🔗 แชร์ลิงก์
        </button>
        {msg && <span className="text-sm text-emerald-600">✓ {msg}</span>}
      </div>
      {fallback && (
        <textarea
          readOnly
          rows={6}
          className={`${inputCls} font-mono text-xs`}
          value={fallback}
          onFocus={(e) => e.target.select()}
        />
      )}
    </div>
  );
}
