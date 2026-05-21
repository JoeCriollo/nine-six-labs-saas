import { getInventory } from "@/lib/actions/inventory";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const result = await getInventory();

  if (!result.success || !result.data) {
    return (
      <div className="text-[var(--negative)]">
        Error al cargar el inventario: {result.error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
      </div>

      <InventoryClient lots={result.data} />
    </div>
  );
}
