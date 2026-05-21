'use server';

import { db } from '../db';
import { revalidatePath } from 'next/cache';
import { findBestDimensions } from '../utils/product-matching';

// DTO tipado que alimenta la Server Action desde el carrito de importación
export interface ImportItemDTO {
  productId: string;
  quantity: number;
  costUsa: number;
  expirationDate: string; // ISO string
  marginPercent: number;
}

/**
 * Busca un producto por SKU para el modal de escaneo QR.
 * Retorna el producto si existe, o null si no se encuentra.
 */
export async function getProductBySku(sku: string) {
  try {
    const product = await db.product.findFirst({
      where: { sku },
      include: {
        lots: {
          where: { currentQuantity: { gt: 0 } },
          select: { currentQuantity: true },
        },
      },
    });

    if (!product) return { success: false, data: null };

    const totalStock = product.lots.reduce((acc, l) => acc + l.currentQuantity, 0);
    return { success: true, data: { ...product, totalStock } };
  } catch {
    return { success: false, data: null };
  }
}

/**
 * Procesa un cargamento de importación a partir del carrito dinámico.
 * Recibe un array tipado de ImportItemDTO, el flete total y un número de lote personalizado.
 * La lógica de prorrateo volumétrico (Landed Cost) queda INTACTA.
 */
export async function processImport(
  items: ImportItemDTO[],
  freightTotalUsd: number,
  customLoteNumber: string
) {
  try {
    if (!items || items.length === 0) {
      throw new Error('El carrito está vacío. Agrega al menos un producto antes de procesar.');
    }

    if (freightTotalUsd <= 0) {
      throw new Error('El flete total debe ser mayor a $0.');
    }

    // ------- Paso 1: Resolver productos y calcular volúmenes --------
    let totalVolumeSum = 0;
    const itemsResolved: {
      productId: string;
      qty: number;
      costUsaUnit: number;
      length: number;
      width: number;
      height: number;
      itemVolume: number;
      margin: number;
      expiry: string;
    }[] = [];

    for (const dto of items) {
      // Verificar que el producto existe en la BD
      const product = await db.product.findUnique({ where: { id: dto.productId } });
      if (!product) {
        throw new Error(`Producto con ID "${dto.productId}" no encontrado en la base de datos.`);
      }

      // Obtener dimensiones del cerebro volumétrico (product-matching)
      const bestDim = findBestDimensions(product.brand, product.name, product.size);

      const itemVolume = bestDim.length * bestDim.width * bestDim.height;
      totalVolumeSum += itemVolume * dto.quantity;

      itemsResolved.push({
        productId: dto.productId,
        qty: dto.quantity,
        costUsaUnit: dto.costUsa,
        length: bestDim.length,
        width: bestDim.width,
        height: bestDim.height,
        itemVolume,
        margin: dto.marginPercent,
        expiry: dto.expirationDate,
      });
    }

    // ------- Paso 2: Transacción Atómica con Cálculo de Flete Volumétrico --------
    const result = await db.$transaction(async (tx) => {
      const loteNum = customLoteNumber ? parseInt(customLoteNumber, 10) : undefined;
      const newImport = await tx.batch.create({
        data: {
          freightTotalUsd,
          customLoteNumber: isNaN(loteNum!) ? undefined : loteNum,
        },
      });

      const processedItems = [];

      for (const item of itemsResolved) {
        // freightPerUnit = (itemVolume / totalVolumeSum) * freightTotalUsd
        const freightUnit =
          totalVolumeSum > 0
            ? (item.itemVolume / totalVolumeSum) * freightTotalUsd
            : 0;

        const landedCost = item.costUsaUnit + freightUnit;
        const priceSale = landedCost * (1 + item.margin / 100);

        const importItem = await tx.importItem.create({
          data: {
            importId: newImport.id,
            productId: item.productId,
            quantity: item.qty,
            costUsaUnit: item.costUsaUnit,
            length: item.length,
            width: item.width,
            height: item.height,
            expirationDate: new Date(item.expiry),
            marginPercent: item.margin,
          },
        });

        const newLot = await tx.lot.create({
          data: {
            productId: item.productId,
            importItemId: importItem.id,
            initialQuantity: item.qty,
            currentQuantity: item.qty,
            costUsaUnit: item.costUsaUnit,
            freightUnit,
            landedCost,
            priceSale,
            expirationDate: new Date(item.expiry),
            isVerified: false,
          },
        });

        await tx.importItem.update({
          where: { id: importItem.id },
          data: { lotId: newLot.id },
        });

        processedItems.push({ importItem, newLot });
      }

      return { newImport, processedItems };
    });

    revalidatePath('/inventory');
    revalidatePath('/imports');
    revalidatePath('/');

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error processing import:', error);
    return { success: false, error: String(error.message ?? error) };
  }
}
