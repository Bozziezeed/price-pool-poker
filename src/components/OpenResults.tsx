"use client";

import { useRouter } from "next/navigation";
import { encodeShare, type SharePayload } from "@/lib/share";
import { btn } from "./ui";

export function OpenResults({ payload }: { payload: SharePayload }) {
  const router = useRouter();

  const open = async () => {
    // Open before the await: browsers block pop-ups opened after async work.
    const tab = window.open("", "_blank");
    const url = `/share?d=${await encodeShare(payload)}`;
    if (tab) tab.location.href = url;
    else router.push(url);
  };

  return (
    <button className={`${btn.primary} mt-4`} onClick={open}>
      📊 เปิดดูผลสรุป
    </button>
  );
}
