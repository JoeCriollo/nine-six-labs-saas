"use client";

import { useState, Fragment } from "react";
import { registerPayment } from "@/lib/actions/receivables";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { differenceInDays } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ReceivablesClient({ receivables }: { receivables: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [paymentAmounts, setPaymentAmounts] = useState<{ [key: string]: string }>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handlePayment = async (saleId: string, maxAmount: number) => {
    const amountStr = paymentAmounts[saleId];
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    const roundedAmount = Math.round(amount * 100);
    const roundedMax = Math.round(maxAmount * 100);

    if (isNaN(amount) || roundedAmount <= 0 || roundedAmount > roundedMax) {
      alert("Monto inválido. Verifique que no supere la deuda restante.");
      return;
    }
    setLoadingId(saleId);
    const res = await registerPayment(saleId, amount);
    if (!res.success) {
      alert(res.error || "Error al registrar pago");
    } else {
      setPaymentAmounts(prev => ({ ...prev, [saleId]: "" }));
    }
    setLoadingId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--card)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Fecha Venta</TableHead>
            <TableHead>Fecha Límite</TableHead>
            <TableHead className="text-right">Total Venta</TableHead>
            <TableHead className="text-right">Pagado</TableHead>
            <TableHead className="text-right">Deuda Restante</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Abonar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receivables.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center h-24 text-[#888]">
                No hay cuentas por cobrar pendientes.
              </TableCell>
            </TableRow>
          ) : (
            receivables.map((sale) => {
              const daysOverdue = sale.dueDate ? differenceInDays(new Date(), new Date(sale.dueDate)) : 0;
              const isOverdue = daysOverdue > 0;
              const progressPct = sale.totalAmount > 0 
                ? Math.min((sale.totalPaid / sale.totalAmount) * 100, 100)
                : 0;
              const isExpanded = expandedId === sale.id;

              return (
                <Fragment key={sale.id}>
                  <TableRow className={isOverdue ? "bg-[#FF3131]/10" : ""}>
                    {/* Expand toggle */}
                    <TableCell>
                      <Button
                        size="icon" variant="ghost"
                        className="h-6 w-6 text-[#555]"
                        onClick={() => toggleExpand(sale.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{sale.customer.name}</TableCell>
                    <TableCell className="text-sm text-[#888]">{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm text-[#888]">{sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell className="text-right">${sale.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-[var(--positive)]">${sale.totalPaid.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-[var(--negative)]">
                      ${sale.remainingDebt.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {isOverdue ? (
                        <span className="inline-flex items-center rounded-full bg-[var(--negative)] px-2.5 py-0.5 text-xs font-semibold text-white">
                          VENCIDO ({daysOverdue}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
                          PENDIENTE
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Input
                          type="number"
                          placeholder="Monto"
                          className="w-24 h-8 text-right"
                          value={paymentAmounts[sale.id] || ""}
                          onChange={(e) => setPaymentAmounts({ ...paymentAmounts, [sale.id]: e.target.value })}
                        />
                        <Button
                          size="sm" variant="positive"
                          disabled={loadingId === sale.id || !paymentAmounts[sale.id]}
                          onClick={() => handlePayment(sale.id, sale.remainingDebt)}
                        >
                          {loadingId === sale.id ? "..." : "Abonar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expandable: progress bar + payment history */}
                  {isExpanded && (
                    <TableRow key={`${sale.id}-detail`} className="bg-[#0a0a0a]">
                      <TableCell colSpan={9} className="py-3 px-6">
                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-[#888] mb-1">
                            <span>Progreso de pago</span>
                            <span>{progressPct.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-[#222] rounded-full h-2">
                            <div
                              className="bg-[var(--positive)] h-2 rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Payment history */}
                        <p className="text-xs text-[#888] font-bold uppercase mb-2">Historial de Abonos</p>
                        {sale.payments.length === 0 ? (
                          <p className="text-xs text-[#555]">Sin abonos registrados.</p>
                        ) : (
                          <div className="space-y-1">
                            {sale.payments.map((p: any, i: number) => (
                              <div key={p.id} className="flex justify-between text-xs">
                                <span className="text-[#888]">Abono #{i + 1} — {new Date(p.date).toLocaleDateString()}</span>
                                <span className="text-[var(--positive)] font-bold">+${p.amount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
