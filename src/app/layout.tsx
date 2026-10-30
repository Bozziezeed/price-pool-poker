import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const thai = IBM_Plex_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Poker Home Game",
  description: "คำนวณเงินรางวัลทัวร์นาเมนต์และผลแคชเกมโป๊กเกอร์",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${thai.variable} h-full antialiased`}>
      {/* From tablet landscape up, the app is exactly one screen tall; main scrolls if a page is longer. */}
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 lg:h-dvh dark:bg-black dark:text-zinc-100">
        <header className="border-b border-zinc-200 bg-emerald-800 text-white dark:border-zinc-800">
          <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 text-sm">
            <Link href="/" className="mr-auto text-base font-bold">
              ♠ PEACH CLUB POKER
            </Link>
            <Link href="/tournament?type=normal" className="hover:underline">
              ทัวร์
            </Link>
            <Link href="/tournament?type=bounty" className="hover:underline">
              Bounty
            </Link>
            <Link href="/cash" className="hover:underline">
              แคชเกม
            </Link>
          </nav>
        </header>
        <main className="w-full flex-1 lg:min-h-0 lg:overflow-y-auto">
          <div className="mx-auto h-full w-full max-w-7xl px-4 py-3">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
