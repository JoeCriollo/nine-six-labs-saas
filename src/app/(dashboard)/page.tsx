import { getDashboardKPIs } from "@/lib/actions/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, CreditCard, TrendingDown, LayoutGrid, ShoppingBag } from "lucide-react";
import PerformanceChart from "@/components/PerformanceChart";
import CategoryProfitChart from "@/components/CategoryProfitChart";

export default async function Dashboard() {
  const kpiData = await getDashboardKPIs();

  if (!kpiData.success || !kpiData.data) {
    return (
      <div className="text-[var(--negative)]">
        Error al cargar los datos del dashboard. Asegúrate de configurar la base de datos.
      </div>
    );
  }

  const { 
    totalSales, 
    operatingExpenses, 
    netProfit, 
    accountsReceivableTotal, 
    recentSales, 
    performanceData,
    categoryProfit 
  } = kpiData.data;

  const isProfitNegative = netProfit < 0;

  return (
    <div className="space-y-8">
      {/* Hero Logo Section */}
      <div className="flex flex-col items-center justify-center py-10 bg-[#000] rounded-2xl border border-[#222] shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--positive)]/10 to-transparent pointer-events-none" />
        <img 
          src="/logo.png" 
          alt="Nine Six Labs" 
          className="h-48 w-auto object-contain relative z-10"
          style={{ mixBlendMode: 'screen' }}
        />
        <div className="mt-4 text-center relative z-10">
          <p className="text-[var(--positive)] font-bold tracking-[0.3em] text-sm uppercase opacity-80">
            Command Center
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Ingresos (Ventas Totales) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[var(--positive)]" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[var(--positive)]">
              ${totalSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#555] mt-1">Facturación histórica</p>
          </CardContent>
        </Card>
        
        {/* Costo de Mercancía (COGS) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Costo Mercancía
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-[#ffaa00]" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#ffaa00]">
              ${kpiData.data.totalCogs.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#555] mt-1">Inversión en productos vendidos</p>
          </CardContent>
        </Card>

        {/* Gastos Fijos/Variables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Gastos Operativos
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-[var(--negative)]" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[var(--negative)]">
              ${kpiData.data.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#555] mt-1">Marketing, fijos y varios</p>
          </CardContent>
        </Card>

        {/* Beneficio Neto (Bolsillo) */}
        <Card className={isProfitNegative ? "border-[var(--negative)]/50 bg-[var(--negative)]/5" : "border-[var(--positive)]/20 shadow-[0_0_15px_rgba(50,255,0,0.05)]"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Beneficio Neto
            </CardTitle>
            <div className={`p-1 rounded ${isProfitNegative ? "bg-[var(--negative)]/20" : "bg-[var(--positive)]/20"}`}>
              <DollarSign className={`h-4 w-4 ${isProfitNegative ? "text-[var(--negative)]" : "text-[var(--positive)]"}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${isProfitNegative ? "text-[var(--negative)]" : "text-[var(--positive)]"}`}>
              ${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#555] mt-1">Ganancia real (Bolsillo)</p>
          </CardContent>
        </Card>

        {/* Cuentas por Cobrar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Cuentas por Cobrar
            </CardTitle>
            <CreditCard className="h-4 w-4 text-[#00E5FF]" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#00E5FF]">
              ${accountsReceivableTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#555] mt-1">Capital pendiente de cobro</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Main Performance Chart */}
        <Card className="border border-[#222] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rendimiento del Negocio</CardTitle>
            <TrendingDown className="h-4 w-4 text-[#555]" />
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <PerformanceChart data={performanceData} />
          </CardContent>
        </Card>

        {/* Category Profit Chart */}
        <Card className="border border-[#222]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Margen por Categoría</CardTitle>
            <LayoutGrid className="h-4 w-4 text-[#555]" />
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <CategoryProfitChart data={categoryProfit} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Section */}
      <div className="grid gap-6">
        <Card className="border border-[#222]">
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentSales.length === 0 ? (
                <p className="text-sm text-[#555] col-span-full">No hay ventas registradas aún.</p>
              ) : (
                recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#222]">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{sale.customer.name}</span>
                      <span className="text-xs text-[#888]">
                        {sale.items.length} producto(s) — {new Date(sale.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-[var(--positive)]">
                        ${sale.totalAmount.toFixed(2)}
                      </span>
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${sale.paymentType === 'CREDIT' ? 'border-[var(--negative)] text-[var(--negative)]' : 'border-[var(--positive)] text-[var(--positive)]'}`}>
                        {sale.paymentType === 'CREDIT' ? 'Crédito' : 'Contado'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
