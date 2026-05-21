import { getCustomers, getAvailableProducts } from "@/lib/actions/data";
import SalesClient from "./SalesClient";

export default async function SalesPage() {
  const [customersResult, productsResult] = await Promise.all([
    getCustomers(),
    getAvailableProducts()
  ]);

  if (!customersResult.success || !productsResult.success) {
    return <div className="text-[var(--negative)]">Error al cargar datos maestros.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Punto de Venta (POS)</h2>
      </div>
      <SalesClient 
        customers={customersResult.data || []} 
        products={productsResult.data || []} 
      />
    </div>
  );
}
