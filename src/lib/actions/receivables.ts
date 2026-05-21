'use server';

import { db } from '../db';
import { revalidatePath } from 'next/cache';

export async function getReceivables() {
  try {
    const salesWithDebt = await db.sale.findMany({
      where: {
        paymentType: 'CREDIT',
      },
      include: {
        customer: true,
        payments: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    const receivables = salesWithDebt.map(sale => {
      const totalPaid = sale.payments.reduce((acc, p) => acc + p.amount, 0);
      const remainingDebt = sale.totalAmount - totalPaid;
      
      // Keep only those with actual remaining debt > 0
      return {
        ...sale,
        totalPaid,
        remainingDebt
      };
    }).filter(sale => sale.remainingDebt > 0.01);

    return { success: true, data: receivables };
  } catch (error) {
    return { success: false, error: 'Fallo al obtener cuentas por cobrar' };
  }
}

export async function registerPayment(saleId: string, amount: number) {
  try {
    await db.payment.create({
      data: {
        saleId,
        amount
      }
    });

    revalidatePath('/receivables');
    revalidatePath('/customers');
    revalidatePath('/sales/history');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Fallo al registrar pago' };
  }
}
