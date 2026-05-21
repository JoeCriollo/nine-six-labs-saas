'use server';

import { db } from '../db';
import { revalidatePath } from 'next/cache';
import { EXPENSE_CATEGORIES } from '../constants';

export async function getExpenses() {
  try {
    const expenses = await db.expense.findMany({
      orderBy: { date: 'desc' }
    });
    return { success: true, data: expenses };
  } catch (error) {
    return { success: false, error: 'Error al obtener gastos' };
  }
}

export async function createExpense(data: {
  description: string;
  amount: number;
  category: string;
  date?: string;
}) {
  try {
    if (!data.description) throw new Error('La descripción es requerida');
    if (data.amount <= 0) throw new Error('El monto debe ser mayor a cero');

    await db.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        category: data.category || 'Otro',
        date: data.date ? new Date(data.date) : new Date(),
      }
    });

    revalidatePath('/expenses');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteExpense(id: string) {
  try {
    await db.expense.delete({ where: { id } });
    revalidatePath('/expenses');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
