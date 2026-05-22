"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PERIODS = [
  { value: "all",        label: "Todo el tiempo" },
  { value: "month",      label: "Este Mes" },
  { value: "last_month", label: "Mes Pasado" },
  { value: "year",       label: "Este Año" },
  { value: "7d",         label: "Últimos 7 Días" },
] as const;

export default function DashboardFilters({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div
      role="tablist"
      aria-label="Filtrar período"
      className="flex flex-wrap gap-2"
    >
      {PERIODS.map((p) => {
        const isActive = current === p.value;
        return (
          <button
            key={p.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleChange(p.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              isActive
                ? "bg-[var(--accent)]/20 border-[var(--accent)]/50 text-[var(--accent)]"
                : "bg-[#111] border-[#222] text-[#666] hover:text-white hover:border-[#444]"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
