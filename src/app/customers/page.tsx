import { getCustomers } from "@/lib/actions/customers";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const result = await getCustomers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CRM — Clientes</h2>
          <p className="text-sm text-[#888] mt-1">Historial de compras, deudas y contacto directo</p>
        </div>
      </div>
      <CustomersClient customers={result.data || []} />
    </div>
  );
}
