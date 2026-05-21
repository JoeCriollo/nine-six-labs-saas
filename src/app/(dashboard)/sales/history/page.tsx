import { getSales } from "@/lib/actions/sales";
import SalesHistoryClient from "./SalesHistoryClient";

export default async function SalesHistoryPage() {
  const result = await getSales();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Historial de Ventas</h2>
        <p className="text-sm text-[#888] mt-1">Consulta y exporta todas las ventas realizadas</p>
      </div>
      <SalesHistoryClient sales={result.data || []} />
    </div>
  );
}
