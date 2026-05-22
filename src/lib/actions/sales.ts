'use server';

import { db } from '../db';
import { revalidatePath } from 'next/cache';

export type SaleItemInput = {
  productId: string;
  quantity: number;
};

export type ProcessSaleInput = {
  customerId: string; // Can be "NEW" to use newCustomer fields
  newCustomer?: {
    name: string;
    phone?: string;
    address?: string;
  };
  items: SaleItemInput[];
  paymentType: 'FULL' | 'CREDIT';
  upfrontPaymentAmount: number;
  leadSource?: string;
  useWalletAmount?: number;
};

export async function processSale(data: ProcessSaleInput) {
  try {
    return await db.$transaction(async (tx) => {
      let finalCustomerId = data.customerId;

      // Create new customer if requested
      if (data.customerId === 'NEW' && data.newCustomer) {
        if (!data.newCustomer.name) throw new Error("Nombre de cliente requerido");
        const customer = await tx.customer.create({
          data: {
            name: data.newCustomer.name,
            phone: data.newCustomer.phone,
            address: data.newCustomer.address,
          }
        });
        finalCustomerId = customer.id;
      }

      let totalAmount = 0;
      const lotDeductions: Array<{ lotId: string; quantity: number; priceSale: number; costUsaUnit: number; freightUnit: number }> = [];

      // 1. Process each item and apply FIFO logic
      for (const item of data.items) {
        let remainingQuantityToFulfill = item.quantity;
        
        // Fetch available lots ordered by Expiration Date ASC (FIFO)
        const availableLots = await tx.lot.findMany({
          where: {
            productId: item.productId,
            currentQuantity: { gt: 0 }
          },
          orderBy: {
            expirationDate: 'asc'
          }
        });

        const totalAvailable = availableLots.reduce((acc, lot) => acc + lot.currentQuantity, 0);
        if (totalAvailable < item.quantity) {
          throw new Error(`Stock insuficiente para el producto ${item.productId}`);
        }

        for (const lot of availableLots) {
          if (remainingQuantityToFulfill <= 0) break;

          const quantityFromThisLot = Math.min(lot.currentQuantity, remainingQuantityToFulfill);
          
          // Calculate amount added to total (sale price * quantity)
          totalAmount += lot.priceSale * quantityFromThisLot;

          // Record deduction
          lotDeductions.push({
            lotId: lot.id,
            quantity: quantityFromThisLot,
            priceSale: lot.priceSale,
            costUsaUnit: lot.costUsaUnit,
            freightUnit: lot.freightUnit
          });

          // Deduct from Lot
          await tx.lot.update({
            where: { id: lot.id },
            data: { currentQuantity: lot.currentQuantity - quantityFromThisLot }
          });

          remainingQuantityToFulfill -= quantityFromThisLot;
        }
      }

      // Wallet Logic
      let walletUsed = 0;
      let walletEarned = 0;
      if (data.useWalletAmount && data.useWalletAmount > 0) {
        const customerRecord = await tx.customer.findUnique({ where: { id: finalCustomerId } });
        if (customerRecord && customerRecord.walletBalance > 0) {
           walletUsed = Math.min(data.useWalletAmount, customerRecord.walletBalance, totalAmount);
        }
      }
      
      const finalPayableAmount = totalAmount - walletUsed;
      walletEarned = finalPayableAmount * 0.03; // 3% Cashback sobre lo pagado con dinero real

      // Update Customer Wallet
      if (walletUsed > 0 || walletEarned > 0) {
        await tx.customer.update({
          where: { id: finalCustomerId },
          data: {
            walletBalance: {
              increment: walletEarned - walletUsed
            }
          }
        });
      }

      // 2. Validate Payment
      if (data.paymentType === 'CREDIT') {
        if (data.upfrontPaymentAmount < 0) {
          throw new Error(`El pago inicial no puede ser negativo`);
        }
      } else {
        // FULL payment means upfront must match final payable
        if (Math.abs(data.upfrontPaymentAmount - finalPayableAmount) > 0.01) {
          throw new Error('Pago completo no coincide con el total a pagar después del monedero');
        }
      }

      // 3. Create Sale Record
      const dueDate = data.paymentType === 'CREDIT' 
        ? new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000) // +15 days
        : null;

      const newSale = await tx.sale.create({
        data: {
          customerId: finalCustomerId,
          totalAmount,
          walletUsed,
          walletEarned,
          paymentType: data.paymentType,
          leadSource: data.leadSource,
          dueDate,
        }
      });

      // 4. Create SaleItems
      for (const ded of lotDeductions) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            lotId: ded.lotId,
            quantity: ded.quantity,
            priceSale: ded.priceSale
          }
        });
      }

      // 5. Create Initial Payment
      if (data.upfrontPaymentAmount > 0) {
        await tx.payment.create({
          data: {
            saleId: newSale.id,
            amount: data.upfrontPaymentAmount
          }
        });
      }

      try {
        revalidatePath('/inventory');
        revalidatePath('/sales');
        revalidatePath('/sales/history');
        revalidatePath('/receivables');
        revalidatePath('/customers');
        revalidatePath('/');
      } catch (e) {
        // Safe for non-Next environments
      }
      return { success: true, data: { saleId: newSale.id, totalAmount } };
    });
  } catch (error: any) {
    console.error('Error processing sale:', error);
    return { success: false, error: error.message || 'Fallo al procesar la venta' };
  }
}

export async function getSales() {
  try {
    const sales = await db.sale.findMany({
      orderBy: { date: 'desc' },
      include: {
        customer: true,
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
    return { success: true, data: sales };
  } catch (error) {
    return { success: false, error: 'Error al obtener ventas' };
  }
}

/**
 * Busca un producto por SKU para el flujo de escaneo QR del POS.
 * Retorna el producto y el lote más antiguo disponible (FIFO por expirationDate ASC).
 * Si no hay stock, retorna un error claro.
 */
export async function getProductBySkuForPOS(sku: string) {
  try {
    const product = await db.product.findFirst({
      where: { sku },
      include: {
        lots: {
          where: { currentQuantity: { gt: 0 } },
          orderBy: { expirationDate: 'asc' },
        },
      },
    });

    if (!product) {
      return { success: false, error: `No se encontró ningún producto con SKU "${sku}".` };
    }

    if (product.lots.length === 0) {
      return {
        success: false,
        error: `"${product.brand} ${product.name}" no tiene stock disponible.`,
      };
    }

    const oldestLot = product.lots[0];
    const totalStock = product.lots.reduce((acc, l) => acc + l.currentQuantity, 0);

    return {
      success: true,
      data: {
        productId: product.id,
        productName: `${product.brand} ${product.name}`,
        productSize: product.size,
        lotId: oldestLot.id,
        priceSale: oldestLot.priceSale,
        landedCost: oldestLot.landedCost,
        totalStock,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al buscar el producto.' };
  }
}

