import { getReceivables } from "@/lib/actions/receivables";
import ReceivablesClient from "./ReceivablesClient";

export default async function ReceivablesPage() {
  const result = await getReceivables();

  if (!result.success || !result.data) {
    return <div className="text-[var(--negative)]">Error al cargar cuentas por cobrar.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cuentas por Cobrar</h2>
      </div>
      <ReceivablesClient receivables={result.data} />
    </div>
  );
}
