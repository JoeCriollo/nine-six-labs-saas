import { Suspense } from "react";
import { getDashboardKPIs, DashboardPeriod } from "@/lib/actions/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  AlertCircle,
  CreditCard,
  TrendingDown,
  LayoutGrid,
  ShoppingBag,
  Package,
  Sparkles,
} from "lucide-react";
import PerformanceChart from "@/components/PerformanceChart";
import CategoryProfitChart from "@/components/CategoryProfitChart";
import DashboardFilters from "@/components/DashboardFilters";
import DashboardAlerts from "@/components/DashboardAlerts";
import DashboardRankings from "@/components/DashboardRankings";
import GrowthBadge from "@/components/GrowthBadge";

const PERIOD_LABELS: Record<string, string> = {
  all:        "Histórico Total",
  month:      "Este Mes",
  last_month: "Mes Pasado",
  year:       "Este Año",
  "7d":       "Últimos 7 Días",
};

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = (params?.period ?? "all") as DashboardPeriod;

  const kpiData = await getDashboardKPIs(period);

  if (!kpiData.success || !kpiData.data) {
    return (
      <div role="alert" className="text-[var(--negative)] p-4 rounded-lg border border-[var(--negative)]/30 bg-[var(--negative)]/5">
        Error al cargar los datos del dashboard. Asegúrate de configurar la base de datos.
      </div>
    );
  }

  const {
    totalSales,
    totalCogs,
    totalExpenses,
    netProfit,
    accountsReceivableTotal,
    recentSales,
    performanceData,
    categoryProfit,
    growthSales,
    growthProfit,
    inventoryValue,
    projectedProfit,
    criticalAlertsCount,
    criticalStockLots,
    overdueCustomers,
    topProducts,
    topCustomers,
  } = kpiData.data;

  const isProfitNegative = netProfit < 0;
  const periodLabel = PERIOD_LABELS[period] ?? "Todo el tiempo";

  return (
    <div className="space-y-8">
      {/* Hero Logo Section */}
      <div className="flex flex-col items-center justify-center py-10 bg-[#000] rounded-2xl border border-[#222] shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--positive)]/10 to-transparent pointer-events-none" />
        <img
          src="/logo.png"
          alt="Nine Six Labs"
          className="h-48 w-auto object-contain relative z-10"
          style={{ mixBlendMode: "screen" }}
        />
        <div className="mt-4 text-center relative z-10">
          <p className="text-[var(--positive)] font-bold tracking-[0.3em] text-sm uppercase opacity-80">
            Command Center
          </p>
        </div>
      </div>

      {/* Period filter + label */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Centro de Mando</h1>
          <p className="text-xs text-[#555] mt-0.5">
            Mostrando: <span className="text-[var(--accent)] font-semibold">{periodLabel}</span>
          </p>
        </div>
        <Suspense fallback={null}>
          <DashboardFilters current={period} />
        </Suspense>
      </div>

      {/* Action Alerts */}
      <DashboardAlerts
        criticalStockLots={criticalStockLots as any}
        overdueCustomers={overdueCustomers as any}
        expiringCount={criticalAlertsCount}
      />

      {/* KPI Cards — row 1 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Ingresos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Ingresos
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[var(--positive)]" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[var(--positive)]">
              ${totalSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <GrowthBadge growth={growthSales} />
            <p className="text-[10px] text-[#555] mt-1">Facturación del período</p>
          </CardContent>
        </Card>

        {/* COGS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Costo Mercancía
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-[#ffaa00]" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#ffaa00]">
              ${totalCogs.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#555] mt-1">Inversión en productos vendidos</p>
          </CardContent>
        </Card>

        {/* Gastos Operativos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Gastos Operativos
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-[var(--negative)]" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[var(--negative)]">
              ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#555] mt-1">Marketing, fijos y varios</p>
          </CardContent>
        </Card>

        {/* Beneficio Neto */}
        <Card
          className={
            isProfitNegative
              ? "border-[var(--negative)]/50 bg-[var(--negative)]/5"
              : "border-[var(--positive)]/20 shadow-[0_0_15px_rgba(50,255,0,0.05)]"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Beneficio Neto
            </CardTitle>
            <div
              className={`p-1 rounded ${isProfitNegative ? "bg-[var(--negative)]/20" : "bg-[var(--positive)]/20"}`}
            >
              <DollarSign
                className={`h-4 w-4 ${isProfitNegative ? "text-[var(--negative)]" : "text-[var(--positive)]"}`}
                aria-hidden="true"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold ${isProfitNegative ? "text-[var(--negative)]" : "text-[var(--positive)]"}`}
            >
              ${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <GrowthBadge growth={growthProfit} />
            <p className="text-[10px] text-[#555] mt-1">Ganancia real (Bolsillo)</p>
          </CardContent>
        </Card>

        {/* Cuentas por Cobrar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Por Cobrar
            </CardTitle>
            <CreditCard className="h-4 w-4 text-[#00E5FF]" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#00E5FF]">
              ${accountsReceivableTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#555] mt-1">Capital pendiente de cobro</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards — row 2: Inventory snapshot */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="border-[#00E5FF]/20 bg-[#00E5FF]/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Valor del Inventario
            </CardTitle>
            <Package className="h-4 w-4 text-[#00E5FF]" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00E5FF]">
              ${inventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#555] mt-1">
              Capital invertido actualmente en bodega (precio de costo)
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--positive)]/20 bg-[var(--positive)]/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Ganancia Proyectada
            </CardTitle>
            <Sparkles className="h-4 w-4 text-[var(--positive)]" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--positive)]">
              ${projectedProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#555] mt-1">
              Si vendes todo el inventario disponible al precio actual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-[#222] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rendimiento del Negocio</CardTitle>
            <span className="text-xs text-[#555]">Últimos 7 días</span>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <PerformanceChart data={performanceData} />
          </CardContent>
        </Card>

        <Card className="border border-[#222]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Margen por Categoría</CardTitle>
            <LayoutGrid className="h-4 w-4 text-[#555]" aria-hidden="true" />
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <CategoryProfitChart data={categoryProfit} />
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <DashboardRankings topProducts={topProducts} topCustomers={topCustomers} />

      {/* Recent Sales */}
      <Card className="border border-[#222]">
        <CardHeader>
          <CardTitle>Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-[#555] col-span-full text-center py-4">
                No hay ventas en este período.
              </p>
            ) : (
              recentSales.map((sale: any) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#222]"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white truncate">
                      {sale.customer.name}
                    </span>
                    <span className="text-xs text-[#888]">
                      {sale.items.length} producto(s) —{" "}
                      {new Date(sale.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-sm font-bold text-[var(--positive)]">
                      ${sale.totalAmount.toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${
                        sale.paymentType === "CREDIT"
                          ? "border-[var(--negative)] text-[var(--negative)]"
                          : "border-[var(--positive)] text-[var(--positive)]"
                      }`}
                    >
                      {sale.paymentType === "CREDIT" ? "Crédito" : "Contado"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
