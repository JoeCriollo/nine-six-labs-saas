"use client";

import { useState } from "react";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, TrendingDown } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Marketing:   "text-[#a78bfa] border-[#a78bfa]",
  Logística:   "text-[#ffaa00] border-[#ffaa00]",
  Operativo:   "text-[var(--accent)] border-[var(--accent)]",
  Nómina:      "text-[#60a5fa] border-[#60a5fa]",
  Otro:        "text-[#888] border-[#888]",
};

export default function ExpensesClient({ expenses }: { expenses: any[] }) {
  const [form, setForm] = useState({ description: "", amount: "", category: "Marketing", date: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Group by category for summary
  const byCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const handleSubmit = async () => {
    if (!form.description || !form.amount) {
      setMessage({ type: "error", text: "Descripción y monto son requeridos." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const res = await createExpense({
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date || undefined,
    });
    if (res.success) {
      setMessage({ type: "success", text: "Gasto registrado." });
      setForm({ description: "", amount: "", category: "Marketing", date: "" });
    } else {
      setMessage({ type: "error", text: res.error || "Error al registrar." });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    await deleteExpense(id);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left: Form + Summary */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-[var(--accent)]" /> Nuevo Gasto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-[#888]">Descripción</label>
              <Input
                placeholder="Ej. Instagram Ads Abril"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-[#888]">Monto (USD)</label>
              <Input
                type="number" min="0.01" step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-[#888]">Categoría</label>
              <select
                className="w-full h-9 rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] mt-1"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#888]">Fecha (Opcional)</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <Button variant="accent" className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading ? "Registrando..." : "Registrar Gasto"}
            </Button>
            {message && (
              <div className={`text-xs p-2 rounded-md ${message.type === "success" ? "bg-[var(--positive)]/10 text-[var(--positive)]" : "bg-[var(--negative)]/10 text-[var(--negative)]"}`}>
                {message.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary by category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-[var(--negative)]" /> Resumen por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {EXPENSE_CATEGORIES.map(cat => (
              byCategory[cat] > 0 && (
                <div key={cat} className="flex justify-between items-center">
                  <span className={`text-xs border px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat]}`}>{cat}</span>
                  <span className="text-sm font-bold">${byCategory[cat].toFixed(2)}</span>
                </div>
              )
            ))}
            <div className="border-t border-[#222] pt-2 flex justify-between items-center">
              <span className="text-xs text-[#888] font-bold">TOTAL</span>
              <span className="text-[var(--negative)] font-bold">${totalExpenses.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Expense list */}
      <div className="md:col-span-2 rounded-md border border-[var(--border)] bg-[var(--card)] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-center">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-[#888]">
                  No hay gastos registrados aún.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.description}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] border px-2 py-0.5 rounded-full ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS["Otro"]}`}>
                      {e.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[#888]">
                    {new Date(e.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-[var(--negative)]">
                    ${e.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-[#888] hover:text-[var(--negative)]"
                      onClick={() => handleDelete(e.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
