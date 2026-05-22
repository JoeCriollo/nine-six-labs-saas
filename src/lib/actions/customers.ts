'use server';

import { db } from '../db';
import { revalidatePath } from 'next/cache';

export async function getCustomers() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sales: {
          include: {
            payments: true,
            items: true,
          },
          orderBy: { date: 'desc' }
        }
      }
    });

    const result = customers.map(c => {
      const totalSpent = c.sales.reduce((acc, s) => acc + s.totalAmount, 0);
      const totalPaid = c.sales.reduce((acc, s) =>
        acc + s.payments.reduce((a, p) => a + p.amount, 0), 0);
      const activeDebt = totalSpent - totalPaid;
      const lastSale = c.sales[0]?.date ?? null;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        walletBalance: c.walletBalance,
        createdAt: c.createdAt,
        purchaseCount: c.sales.length,
        totalSpent,
        activeDebt,
        lastSale,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Error al obtener clientes' };
  }
}

export async function updateCustomer(id: string, data: { name: string; phone?: string; address?: string }) {
  try {
    if (!data.name) throw new Error('El nombre es requerido');
    await db.customer.update({ where: { id }, data });
    revalidatePath('/customers');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const customer = await db.customer.findUnique({
      where: { id },
      include: { sales: { include: { payments: true } } }
    });
    if (!customer) throw new Error('Cliente no encontrado');

    const hasDebt = customer.sales.some(s => {
      const paid = s.payments.reduce((a, p) => a + p.amount, 0);
      return s.totalAmount - paid > 0.01;
    });

    if (hasDebt) throw new Error('No se puede eliminar un cliente con deuda pendiente');

    await db.customer.delete({ where: { id } });
    revalidatePath('/customers');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
