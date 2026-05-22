"use client";

import { Trophy, Crown } from "lucide-react";

type TopProduct  = { name: string; brand: string; unitsSold: number; revenue: number };
type TopCustomer = { name: string; totalSpent: number; purchaseCount: number };

interface Props {
  topProducts:  TopProduct[];
  topCustomers: TopCustomer[];
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className="h-1.5 w-full rounded-full bg-[#222] overflow-hidden"
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function DashboardRankings({ topProducts, topCustomers }: Props) {
  const maxUnits   = topProducts[0]?.unitsSold  || 1;
  const maxRevenue = topCustomers[0]?.totalSpent || 1;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Top Products */}
      <section aria-label="Top productos más vendidos" className="rounded-xl border border-[#222] bg-[var(--card)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Productos</h2>
          <span className="text-xs text-[#555]">por unidades vendidas</span>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-sm text-[#555] text-center py-4">Sin datos para este período</p>
        ) : (
          <ol className="space-y-3">
            {topProducts.map((p, i) => (
              <li key={i} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                        i === 0 ? "bg-amber-400/20 text-amber-400" :
                        i === 1 ? "bg-zinc-400/20 text-zinc-300" :
                        i === 2 ? "bg-orange-700/20 text-orange-600" :
                                  "bg-[#222] text-[#666]"
                      }`}
                      aria-label={`Posición ${i + 1}`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-white truncate font-medium">
                      {p.brand} {p.name}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-bold text-[var(--accent)]">{p.unitsSold} u</span>
                    <span className="block text-[10px] text-[#555]">${p.revenue.toFixed(0)}</span>
                  </div>
                </div>
                <ProgressBar value={p.unitsSold} max={maxUnits} color="#00E5FF" />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Top Customers */}
      <section aria-label="Top clientes MVP" className="rounded-xl border border-[#222] bg-[var(--card)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-[var(--positive)]" aria-hidden="true" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Clientes MVP</h2>
          <span className="text-xs text-[#555]">por volumen de compra</span>
        </div>

        {topCustomers.length === 0 ? (
          <p className="text-sm text-[#555] text-center py-4">Sin datos para este período</p>
        ) : (
          <ol className="space-y-3">
            {topCustomers.map((c, i) => (
              <li key={i} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                        i === 0 ? "bg-amber-400/20 text-amber-400" :
                        i === 1 ? "bg-zinc-400/20 text-zinc-300" :
                        i === 2 ? "bg-orange-700/20 text-orange-600" :
                                  "bg-[#222] text-[#666]"
                      }`}
                      aria-label={`Posición ${i + 1}`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-white truncate font-medium">{c.name}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-bold text-[var(--positive)]">${c.totalSpent.toFixed(0)}</span>
                    <span className="block text-[10px] text-[#555]">{c.purchaseCount} compra{c.purchaseCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <ProgressBar value={c.totalSpent} max={maxRevenue} color="#39FF14" />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
