import CashApp from "@/components/CashApp";
import { ClientOnly } from "@/components/ui";

export default function CashPage() {
  return (
    <ClientOnly>
      <CashApp />
    </ClientOnly>
  );
}
