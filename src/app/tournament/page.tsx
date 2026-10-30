import { Suspense } from "react";
import TournamentApp from "@/components/TournamentApp";
import { ClientOnly } from "@/components/ui";

type Props = { searchParams: Promise<{ type?: string }> };

export default function TournamentPage({ searchParams }: Props) {
  return (
    <Suspense>
      <Tournament searchParams={searchParams} />
    </Suspense>
  );
}

async function Tournament({ searchParams }: Props) {
  const type = (await searchParams).type === "bounty" ? "bounty" : "normal";
  return (
    <ClientOnly>
      <TournamentApp key={type} type={type} />
    </ClientOnly>
  );
}
