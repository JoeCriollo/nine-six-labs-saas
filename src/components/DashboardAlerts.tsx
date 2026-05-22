"use client";

import { AlertTriangle, Package, Clock, CreditCard } from "lucide-react";

type CriticalLot = { product: { name: string; brand: string }; currentQuantity: number };
type OverdueCustomer = { name: string; amount: number } | null;

interface Props {
  criticalStockLots: CriticalLot[];
  overdueCustomers: OverdueCustomer[];
  expiringCount: number;
}

export default function DashboardAlerts({ criticalStockLots, overdueCustomers, expiringCount }: Props) {
  const validOverdue = overdueCustomers.filter(Boolean) as { name: string; amount: number }[];
  const hasAlerts = criticalStockLots.length > 0 || validOverdue.length > 0 || expiringCount > 0;

  if (!hasAlerts) return null;

  return (
    <section aria-label="Alertas de acción requerida" className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest">⚡ Acción Requerida</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Expiring Soon */}
        {expiringCount > 0 && (
          <a
            href="/inventory"
            className="group flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
          >
            <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
              <Clock className="h-4 w-4 text-amber-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">Vencimiento Próximo</p>
              <p className="text-sm text-white font-semibold mt-0.5">
                {expiringCount} lote{expiringCount !== 1 ? "s" : ""} en los próximos 90 días
              </p>
              <p className="text-xs text-amber-400/60 mt-1 group-hover:text-amber-400 transition-colors">
                Ver inventario →
              </p>
            </div>
          </a>
        )}

        {/* Critical Stock */}
        {criticalStockLots.map((lot, i) => (
          <a
            key={i}
            href="/inventory"
            className="group flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors"
          >
            <div className="p-2 rounded-lg bg-red-500/20 shrink-0">
              <Package className="h-4 w-4 text-red-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Stock Crítico</p>
              <p className="text-sm text-white font-semibold mt-0.5 truncate">
                {lot.product.brand} {lot.product.name}
              </p>
              <p className="text-xs text-red-400/80 mt-1">
                Solo <span className="font-bold text-red-300">{lot.currentQuantity}</span> unidad{lot.currentQuantity !== 1 ? "es" : ""} restante{lot.currentQuantity !== 1 ? "s" : ""}
              </p>
            </div>
          </a>
        ))}

        {/* Overdue Debts */}
        {validOverdue.map((c, i) => (
          <a
            key={i}
            href="/receivables"
            className="group flex items-start gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
          >
            <div className="p-2 rounded-lg bg-orange-500/20 shrink-0">
              <CreditCard className="h-4 w-4 text-orange-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wide">Deuda Vencida</p>
              <p className="text-sm text-white font-semibold mt-0.5 truncate">{c.name}</p>
              <p className="text-xs text-orange-400/80 mt-1">
                Debe <span className="font-bold text-orange-300">${c.amount.toFixed(2)}</span>
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
