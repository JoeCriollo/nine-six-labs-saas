"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  growth: number | null;
  label?: string;
}

export default function GrowthBadge({ growth, label }: Props) {
  if (growth === null) return null;

  const isPositive = growth > 0;
  const isNeutral  = growth === 0;
  const pct = Math.abs(growth).toFixed(1);

  return (
    <div
      role="status"
      aria-label={`${isPositive ? "Crecimiento" : "Caída"} de ${pct}% ${label ?? "vs período anterior"}`}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 ${
        isNeutral  ? "bg-[#333] text-[#888]" :
        isPositive ? "bg-[var(--positive)]/10 text-[var(--positive)]" :
                     "bg-[var(--negative)]/10 text-[var(--negative)]"
      }`}
    >
      {isNeutral  ? <Minus className="h-2.5 w-2.5" /> :
       isPositive ? <TrendingUp className="h-2.5 w-2.5" /> :
                    <TrendingDown className="h-2.5 w-2.5" />}
      {isPositive ? "+" : "-"}{pct}% vs anterior
    </div>
  );
}
