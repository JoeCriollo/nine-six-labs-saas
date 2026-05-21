import { getExpenses } from "@/lib/actions/expenses";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
  const result = await getExpenses();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gastos Operativos</h2>
        <p className="text-sm text-[#888] mt-1">Registra publicidad, delivery, nómina y más</p>
      </div>
      <ExpensesClient expenses={result.data || []} />
    </div>
  );
}
