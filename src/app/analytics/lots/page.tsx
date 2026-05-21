import { getLotPerformance } from "@/lib/actions/inventory";
import LotAnalyticsClient from "./LotAnalyticsClient";

export default async function LotAnalyticsPage() {
  const res = await getLotPerformance();
  
  if (!res.success) {
    return <div>Error al cargar analítica de lotes.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Rendimiento por Lote</h2>
        <p className="text-[#888]">Análisis detallado de inversión, ingresos y ROI de cada consolidación.</p>
      </div>

      <LotAnalyticsClient performance={res.data || []} />
    </div>
  );
}
