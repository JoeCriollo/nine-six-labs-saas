'use server';

import { db } from '../db';

export async function getCustomers() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { sales: true }
        }
      }
    });
    return { success: true, data: customers };
  } catch (error) {
    return { success: false, error: 'Fallo al obtener clientes' };
  }
}

export async function getAvailableProducts() {
  try {
    const products = await db.product.findMany({
      where: {
        lots: {
          some: {
            currentQuantity: { gt: 0 }
          }
        }
      },
      include: {
        lots: {
          where: { currentQuantity: { gt: 0 } }
        }
      }
    });

    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: 'Fallo al obtener productos' };
  }
}
