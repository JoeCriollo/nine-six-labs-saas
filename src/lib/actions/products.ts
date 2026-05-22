'use server';

import { db } from '../db';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
  try {
    const products = await db.product.findMany({
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
      include: {
        lots: {
          where: { currentQuantity: { gt: 0 } },
          select: { id: true, currentQuantity: true }
        }
      }
    });

    const result = products.map(p => ({
      ...p,
      activeLots: p.lots.length,
      totalStock: p.lots.reduce((acc, l) => acc + l.currentQuantity, 0),
    }));

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Error al obtener productos' };
  }
}

export async function updateProduct(id: string, data: {
  brand: string;
  name: string;
  category: string;
  flavor: string;
  size: string;
  servings?: number | null;
}) {
  try {
    if (!data.brand || !data.name) throw new Error('Marca y nombre son requeridos');
    await db.product.update({ where: { id }, data });
    revalidatePath('/products');
    revalidatePath('/inventory');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
      include: { lots: { where: { currentQuantity: { gt: 0 } } } }
    });
    if (!product) throw new Error('Producto no encontrado');
    if (product.lots.length > 0) {
      throw new Error('No se puede eliminar un producto con stock activo');
    }
    await db.product.delete({ where: { id } });
    revalidatePath('/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
export async function getProductTemplates() {
  try {
    const templates = await db.productTemplate.findMany({
      orderBy: { keyName: 'asc' }
    });
    return { success: true, data: templates };
  } catch (error) {
    return { success: false, error: 'Error al obtener plantillas' };
  }
}

export async function updateProductTemplate(id: string, data: {
  length: number;
  width: number;
  height: number;
  category: string;
}) {
  try {
    await db.productTemplate.update({
      where: { id },
      data
    });
    revalidatePath('/settings/templates');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
