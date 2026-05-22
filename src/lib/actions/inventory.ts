'use server';

import { db } from '../db';
import { revalidatePath } from 'next/cache';

export async function getInventory() {
  try {
    // Traer todos los imports ordenados para asignarles número de lote
    const imports = await db.batch.findMany({
      orderBy: { date: 'asc' },
      include: {
        items: {
          include: {
            lot: {
              include: { product: true }
            }
          }
        }
      }
    });

    // Construir lista de lotes con su número de lote (prioridad al customLoteNumber)
    const lots: any[] = [];
    imports.forEach((imp, importIndex) => {
      const loteNumber = imp.customLoteNumber || (importIndex + 1);
      imp.items.forEach(importItem => {
        if (importItem.lot && importItem.lot.currentQuantity > 0) {
          lots.push({
            ...importItem.lot,
            importId: imp.id,
            loteNumber,
          });
        }
      });
    });

    return { success: true, data: lots };
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return { success: false, error: 'Fallo al obtener el inventario' };
  }
}

export async function updateLotPrice(lotId: string, newPriceSale: number) {
  try {
    if (newPriceSale <= 0) throw new Error('El precio debe ser mayor a cero');
    await db.lot.update({
      where: { id: lotId },
      data: { priceSale: newPriceSale }
    });
    revalidatePath('/inventory');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLotExpiration(lotId: string, newDate: string) {
  try {
    const date = new Date(newDate);
    if (isNaN(date.getTime())) throw new Error('Fecha inválida');
    
    await db.lot.update({
      where: { id: lotId },
      data: { expirationDate: date }
    });
    revalidatePath('/inventory');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateImportLoteNumber(importId: string, newNumber: number) {
  try {
    await db.batch.update({
      where: { id: importId },
      data: { customLoteNumber: newNumber }
    });
    revalidatePath('/inventory');
    revalidatePath('/imports');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export type DashboardPeriod = 'all' | 'month' | 'last_month' | '7d' | 'year';

function getDateRange(period: DashboardPeriod): { gte?: Date; lte?: Date } {
  const now = new Date();
  if (period === 'all') return {};
  if (period === '7d') {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    return { gte: d };
  }
  if (period === 'month') {
    return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  }
  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { gte: start, lte: end };
  }
  if (period === 'year') {
    return { gte: new Date(now.getFullYear(), 0, 1) };
  }
  return {};
}

function getPreviousDateRange(period: DashboardPeriod): { gte?: Date; lte?: Date } {
  const now = new Date();
  if (period === 'all' || period === 'last_month') return {};
  if (period === '7d') {
    const start = new Date(now); start.setDate(start.getDate() - 14);
    const end   = new Date(now); end.setDate(end.getDate() - 7);
    return { gte: start, lte: end };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { gte: start, lte: end };
  }
  if (period === 'year') {
    return { gte: new Date(now.getFullYear() - 1, 0, 1), lte: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59) };
  }
  return {};
}

export async function getDashboardKPIs(period: DashboardPeriod = 'all') {
  try {
    const dateRange = getDateRange(period);
    const prevRange = getPreviousDateRange(period);

    // 1. Sales filtered by period
    const [allSales, prevSales] = await Promise.all([
      db.sale.findMany({
        where: dateRange.gte || dateRange.lte ? { date: dateRange } : undefined,
        include: {
          payments: true,
          items: {
            include: { lot: { include: { product: true } } }
          }
        }
      }),
      (prevRange.gte ? db.sale.findMany({
        where: { date: prevRange },
        include: { payments: true }
      }) : Promise.resolve([])),
    ]);

    let totalSales = 0;
    let totalCogs = 0;
    let accountsReceivableTotal = 0;
    const categoryProfitMap: Record<string, number> = {};
    const productSalesMap: Record<string, { name: string; brand: string; unitsSold: number; revenue: number }> = {};

    for (const sale of allSales) {
      totalSales += sale.totalAmount;
      const totalPaid = sale.payments.reduce((acc, p) => acc + p.amount, 0);
      accountsReceivableTotal += (sale.totalAmount - totalPaid);

      for (const item of sale.items) {
        const itemCogs = item.lot.landedCost * item.quantity;
        const itemRevenue = item.priceSale * item.quantity;
        totalCogs += itemCogs;

        const category = item.lot.product.category || 'Otros';
        categoryProfitMap[category] = (categoryProfitMap[category] || 0) + (itemRevenue - itemCogs);

        const pid = item.lot.productId;
        if (!productSalesMap[pid]) {
          productSalesMap[pid] = { name: item.lot.product.name, brand: item.lot.product.brand, unitsSold: 0, revenue: 0 };
        }
        productSalesMap[pid].unitsSold += item.quantity;
        productSalesMap[pid].revenue  += itemRevenue;
      }
    }

    const grossProfit = totalSales - totalCogs;

    // Previous period KPIs
    const prevTotalSales = prevSales.reduce((acc, s) => acc + s.totalAmount, 0);

    // 2. Expenses filtered by period
    const [allExpenses, prevExpenses] = await Promise.all([
      db.expense.findMany({ where: dateRange.gte || dateRange.lte ? { date: dateRange } : undefined }),
      (prevRange.gte ? db.expense.findMany({ where: { date: prevRange } }) : Promise.resolve([])),
    ]);
    const totalExpenses = allExpenses.reduce((acc, e) => acc + e.amount, 0);
    const prevTotalExpenses = prevExpenses.reduce((acc, e) => acc + e.amount, 0);

    const netProfit = grossProfit - totalExpenses;
    const operatingExpenses = totalExpenses + totalCogs;

    // Previous period net profit (simplified: prevSales - prevExpenses, COGS not re-calculated for prev)
    const prevNetProfit = prevTotalSales - prevTotalExpenses;

    // Growth percentages
    const calcGrowth = (curr: number, prev: number) =>
      prev === 0 ? null : ((curr - prev) / Math.abs(prev)) * 100;

    const growthSales  = calcGrowth(totalSales, prevTotalSales);
    const growthProfit = calcGrowth(netProfit, prevNetProfit);

    // 3. Inventory Value (all active lots, not period-filtered — this is a snapshot)
    const activeLots = await db.lot.findMany({
      where: { currentQuantity: { gt: 0 } },
      select: { currentQuantity: true, landedCost: true, priceSale: true }
    });
    const inventoryValue     = activeLots.reduce((acc, l) => acc + l.currentQuantity * l.landedCost, 0);
    const projectedProfit    = activeLots.reduce((acc, l) => acc + l.currentQuantity * (l.priceSale - l.landedCost), 0);

    // 4. Expiring lots alert
    const expiringLots = await db.lot.count({
      where: {
        currentQuantity: { gt: 0 },
        expirationDate: { lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
      }
    });

    // 5. Critical stock alert (≤3 units)
    const criticalStockLots = await db.lot.findMany({
      where: { currentQuantity: { gt: 0, lte: 3 } },
      include: { product: { select: { name: true, brand: true } } },
      take: 5
    });

    // 6. Overdue debt customers
    const now = new Date();
    const overdueSales = await db.sale.findMany({
      where: { paymentType: 'CREDIT', dueDate: { lt: now } },
      include: {
        customer: { select: { name: true } },
        payments: true,
      },
      take: 5
    });
    const overdueCustomers = overdueSales
      .map(s => {
        const paid = s.payments.reduce((a, p) => a + p.amount, 0);
        const remaining = s.totalAmount - paid;
        return remaining > 0.01 ? { name: s.customer.name, amount: remaining } : null;
      })
      .filter(Boolean);

    // 7. Performance chart (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const performanceSales = await db.sale.findMany({
      where: { date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' }
    });
    const performanceMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      performanceMap[d.toISOString().split('T')[0]] = 0;
    }
    for (const sale of performanceSales) {
      const dateStr = new Date(sale.date).toISOString().split('T')[0];
      if (performanceMap[dateStr] !== undefined) performanceMap[dateStr] += sale.totalAmount;
    }
    const performanceData = Object.entries(performanceMap).map(([date, total]) => ({ date, total }));

    // 8. Recent Sales
    const recentSales = await db.sale.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      where: dateRange.gte || dateRange.lte ? { date: dateRange } : undefined,
      include: { customer: true, items: { include: { lot: { include: { product: true } } } } }
    });

    // 9. Top products
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    // 10. Top customers
    const customerMap: Record<string, { name: string; totalSpent: number; purchaseCount: number }> = {};
    for (const sale of allSales) {
      if (!customerMap[sale.customerId]) {
        const found = recentSales.find(s => s.customerId === sale.customerId);
        customerMap[sale.customerId] = { name: found?.customer?.name || 'Cliente', totalSpent: 0, purchaseCount: 0 };
      }
      customerMap[sale.customerId].totalSpent += sale.totalAmount;
      customerMap[sale.customerId].purchaseCount += 1;
    }
    // Need actual customer names — fetch them separately
    const customerIds = Object.keys(customerMap);
    const customers = customerIds.length > 0 ? await db.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true }
    }) : [];
    for (const c of customers) {
      if (customerMap[c.id]) customerMap[c.id].name = c.name;
    }
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      success: true,
      data: {
        period,
        // Core KPIs
        totalSales, totalCogs, grossProfit,
        totalExpenses, netProfit, operatingExpenses,
        accountsReceivableTotal,
        // Growth
        growthSales, growthProfit,
        // Inventory snapshot
        inventoryValue, projectedProfit,
        // Alerts
        criticalAlertsCount: expiringLots,
        criticalStockLots,
        overdueCustomers,
        // Charts
        recentSales, performanceData,
        categoryProfit: categoryProfitMap,
        // Rankings
        topProducts, topCustomers,
      }
    };
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return { success: false, error: 'Fallo al obtener KPIs' };
  }
}



export async function deleteLot(lotId: string) {
  try {
    const lot = await db.lot.findUnique({
      where: { id: lotId },
      include: { saleItems: true, importItem: true }
    });

    if (!lot) {
      return { success: false, error: 'Lote no encontrado' };
    }

    // ELIMINADO PARA PRUEBAS:
    // if (lot.saleItems.length > 0) {
    //   return { success: false, error: 'No se puede eliminar un lote que ya tiene ventas registradas...' };
    // }

    await db.$transaction(async (tx) => {
      // MODO PRUEBA: Eliminar SaleItems asociados primero para no romper las llaves foráneas
      if (lot.saleItems.length > 0) {
        await tx.saleItem.deleteMany({ where: { lotId: lotId } });
      }

      // Eliminar el lote
      await tx.lot.delete({ where: { id: lotId } });
      
      // Eliminar el ImportItem asociado si existe
      if (lot.importItemId) {
        await tx.importItem.delete({ where: { id: lot.importItemId } });
      }
    });

    revalidatePath('/inventory');
    revalidatePath('/');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting lot:', error);
    return { success: false, error: 'Fallo al eliminar el lote' };
  }
}
export async function getLotPerformance() {
  try {
    const imports = await db.batch.findMany({
      orderBy: { date: 'desc' },
      include: {
        items: {
          include: {
            lot: {
              include: {
                saleItems: true
              }
            }
          }
        }
      }
    });

    const performance = imports.map((imp, index) => {
      let totalInvestment = imp.freightTotalUsd;
      let totalRevenue = 0;
      let itemsSold = 0;
      let totalItems = 0;

      imp.items.forEach(item => {
        totalInvestment += (item.costUsaUnit * item.quantity);
        totalItems += item.quantity;

        if (item.lot) {
          itemsSold += (item.lot.initialQuantity - item.lot.currentQuantity);
          // Calculate revenue from saleItems
          item.lot.saleItems.forEach(si => {
            totalRevenue += (si.priceSale * si.quantity);
          });
        }
      });

      const netProfit = totalRevenue - totalInvestment;
      const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
      const progress = totalItems > 0 ? (itemsSold / totalItems) * 100 : 0;

      return {
        id: imp.id,
        loteNumber: imp.customLoteNumber || (imports.length - index), // Use custom or dynamic index
        date: imp.date,
        totalInvestment,
        totalRevenue,
        netProfit,
        roi,
        progress,
        itemsSold,
        totalItems,
        freight: imp.freightTotalUsd
      };
    });

    return { success: true, data: performance };
  } catch (error) {
    console.error('Error fetching lot performance:', error);
    return { success: false, error: 'Fallo al obtener rendimiento de lotes' };
  }
}
