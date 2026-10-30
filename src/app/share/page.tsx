import { Suspense } from "react";
import ShareView from "@/components/ShareView";

type Props = { searchParams: Promise<{ d?: string }> };

export default function SharePage({ searchParams }: Props) {
  return (
    <Suspense>
      <Shared searchParams={searchParams} />
    </Suspense>
  );
}

async function Shared({ searchParams }: Props) {
  return <ShareView data={(await searchParams).d ?? ""} />;
}
