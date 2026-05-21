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

export async function getDashboardKPIs() {
  try {
    // 1. Sales and COGS
    const allSales = await db.sale.findMany({
      include: {
        payments: true,
        items: {
          include: {
            lot: {
              include: { product: true }
            }
          }
        }
      }
    });

    let totalSales = 0;
    let totalCogs = 0;
    let accountsReceivableTotal = 0;
    const categoryProfitMap: Record<string, number> = {};

    for (const sale of allSales) {
      totalSales += sale.totalAmount;
      const totalPaid = sale.payments.reduce((acc, p) => acc + p.amount, 0);
      accountsReceivableTotal += (sale.totalAmount - totalPaid);

      for (const item of sale.items) {
        const itemCogs = item.lot.landedCost * item.quantity;
        const itemRevenue = item.priceSale * item.quantity;
        const itemProfit = itemRevenue - itemCogs;
        totalCogs += itemCogs;

        const category = item.lot.product.category || "Otros";
        categoryProfitMap[category] = (categoryProfitMap[category] || 0) + itemProfit;
      }
    }

    const grossProfit = totalSales - totalCogs;

    // 2. Expenses (All time for total calculation or filtered if needed, but user said "all records in Expense table")
    const allExpenses = await db.expense.findMany();
    const totalExpenses = allExpenses.reduce((acc, e) => acc + e.amount, 0);

    const netProfit = grossProfit - totalExpenses;
    const operatingExpenses = totalExpenses + totalCogs;

    // 3. Critical alerts count (low stock & expiring soon)
    const expiringLots = await db.lot.count({
      where: {
        currentQuantity: { gt: 0 },
        expirationDate: {
          lte: new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000) // <= 90 days
        }
      }
    });

    // 5. Sales Performance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const performanceSales = await db.sale.findMany({
      where: { date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' }
    });

    // Group by date
    const performanceMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      performanceMap[d.toISOString().split('T')[0]] = 0;
    }

    for (const sale of performanceSales) {
      const dateStr = new Date(sale.date).toISOString().split('T')[0];
      if (performanceMap[dateStr] !== undefined) {
        performanceMap[dateStr] += sale.totalAmount;
      }
    }

    const performanceData = Object.entries(performanceMap)
      .map(([date, total]) => ({ date, total }))
      .reverse();

    // 6. Recent Sales
    const recentSales = await db.sale.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        customer: true,
        items: {
          include: {
            lot: {
              include: { product: true }
            }
          }
        }
      }
    });

    return {
      success: true,
      data: {
        totalSales,
        totalCogs,
        grossProfit,
        totalExpenses,
        netProfit,
        operatingExpenses,
        accountsReceivableTotal,
        criticalAlertsCount: expiringLots,
        recentSales,
        performanceData,
        categoryProfit: categoryProfitMap
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
