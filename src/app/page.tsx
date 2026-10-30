import Link from "next/link";

const modes = [
  {
    href: "/tournament?type=normal",
    icon: "🏆",
    title: "ทัวร์นาเมนต์",
    desc: "คำนวณเงินรางวัลตามอันดับ หักค่าดำเนินการ",
  },
  {
    href: "/tournament?type=bounty",
    icon: "🎯",
    title: "ทัวร์นาเมนต์ Bounty",
    desc: "แยกกองบาวน์ตี้ น็อคใครได้ค่าหัวคนนั้น",
  },
  {
    href: "/cash",
    icon: "💵",
    title: "แคชเกม",
    desc: "สรุปได้/เสีย และใครต้องโอนให้ใคร",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 py-3">
      <h1 className="text-2xl font-bold">เลือกโหมด</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {modes.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="text-3xl">{m.icon}</div>
            <div className="mt-2 text-lg font-semibold">{m.title}</div>
            <p className="mt-1 text-sm text-zinc-500">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
