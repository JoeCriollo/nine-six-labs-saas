"use client";

import { useState, useCallback } from "react";
import { processSale, getProductBySkuForPOS } from "@/lib/actions/sales";
import { generateReceiptPDF } from "@/lib/utils/pdf-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScannerModal } from "@/components/ui/scanner-modal";
import { ShoppingBag } from "lucide-react";

export default function SalesClient({ customers, products }: { customers: any[], products: any[] }) {
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [customerId, setCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number; unitPrice: number; name: string }[]>([]);
  const [paymentType, setPaymentType] = useState<"FULL" | "CREDIT">("FULL");
  const [upfrontPayment, setUpfrontPayment] = useState<string>("");
  const [leadSource, setLeadSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Scanner state ────────────────────────────
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleAddItem = (productId: string) => {
    if (!productId) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Use the first lot's sale price as reference
    const priceSale = product.lots[0]?.priceSale || 0;

    const existingItem = selectedItems.find(i => i.productId === productId);
    if (existingItem) {
      setSelectedItems(selectedItems.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { productId, quantity: 1, unitPrice: priceSale, name: `${product.brand} ${product.name}` }]);
    }
  };

  /**
   * Llamado por ScannerModal al detectar un QR/barcode.
   * Busca el producto por SKU, valida stock y lo agrega (o incrementa) en el carrito.
   */
  const handleScanForPOS = useCallback(async (sku: string) => {
    setShowScanner(false);
    setScanError(null);
    setScanLoading(true);

    const res = await getProductBySkuForPOS(sku);

    setScanLoading(false);

    if (!res.success || !res.data) {
      setScanError(res.error ?? `SKU "${sku}" no encontrado.`);
      return;
    }

    const { productId, productName, productSize, priceSale, totalStock } = res.data;

    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);

      if (existing) {
        // Validate we don't exceed available stock
        if (existing.quantity >= totalStock) {
          setScanError(`Stock máximo alcanzado para "${productName}" (${totalStock} unidades disponibles).`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      // New item — add to cart
      return [
        ...prev,
        {
          productId,
          quantity: 1,
          unitPrice: priceSale,
          name: `${productName} (${productSize})`,
        },
      ];
    });
  }, []);

  const totalAmount = selectedItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  const handleSubmit = async () => {
    if (!customerId) {
      setMessage({ type: "error", text: "Debe seleccionar o ingresar un cliente." });
      return;
    }
    if (customerId === "NEW" && !newCustomerName) {
      setMessage({ type: "error", text: "Debe ingresar el nombre del nuevo cliente." });
      return;
    }
    if (selectedItems.length === 0) {
      setMessage({ type: "error", text: "Debe agregar al menos un producto." });
      return;
    }

    const selectedCustomer = customers.find(c => c.id === customerId);
    const walletBalance = selectedCustomer?.walletBalance || 0;
    const walletUsed = useWallet ? Math.min(walletBalance, totalAmount) : 0;
    const payableAmount = totalAmount - walletUsed;

    const upfrontAmount = parseFloat(upfrontPayment) || (paymentType === "FULL" ? payableAmount : 0);

    setLoading(true);
    setMessage(null);

    const res = await processSale({
      customerId,
      newCustomer: customerId === "NEW" ? { name: newCustomerName, phone: newCustomerPhone, address: newCustomerAddress } : undefined,
      items: selectedItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
      paymentType,
      upfrontPaymentAmount: upfrontAmount,
      useWalletAmount: useWallet ? walletBalance : 0,
      leadSource
    });

    if (res.success) {
      setMessage({ type: "success", text: "Venta registrada exitosamente." });
      setLastSaleData((res as any).data);
      setSelectedItems([]);
      setUpfrontPayment("");
      setCustomerId("");
      setUseWallet(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerAddress("");
    } else {
      setMessage({ type: "error", text: (res as any).error || "Error al procesar la venta." });
    }
    setLoading(false);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Products & Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de Venta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[#888]">Cliente</label>
            <select 
              className="w-full h-9 rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)]"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Seleccione un cliente...</option>
              <option value="NEW">Nuevo Cliente</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {customerId === "NEW" && (
            <div className="p-3 bg-[#1a1a1a] border border-[#333] rounded-md space-y-3 animate-in fade-in slide-in-from-top-1">
              <div className="space-y-1">
                <label className="text-xs text-[#888]">Nombre Completo</label>
                <Input 
                  placeholder="Ej. Juan Pérez" 
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#888]">WhatsApp / Teléfono</label>
                <Input 
                  placeholder="Ej. +1 809 555 5555" 
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#888]">Dirección</label>
                <Input 
                  placeholder="Ej. Calle 5, Apto 2B, Ensanche Naco" 
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Loyalty Alert */}
          {customerId && customerId !== "NEW" && (() => {
            const customer = customers.find(c => c.id === customerId);
            const salesCount = customer?._count?.sales || 0;
            if (salesCount === 9) {
              return (
                <div className="p-4 bg-[var(--positive)]/20 border border-[var(--positive)] rounded-lg animate-pulse">
                  <p className="text-[var(--positive)] font-bold text-center">
                    🏆 ¡ESTA ES LA VENTA #10! <br/> 
                    Aplica Premio / Lavado Gratis
                  </p>
                </div>
              );
            }
            return null;
          })()}
          
          <div className="space-y-2">
            <label className="text-sm text-[#888]">Agregar Producto</label>
            <div className="flex gap-2">
              <select
                className="flex-1 h-9 rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)]"
                onChange={(e) => { handleAddItem(e.target.value); e.target.value = ""; }}
              >
                <option value="">Seleccione para agregar...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.brand} - {p.name} ({p.size})</option>
                ))}
              </select>
              <Button
                id="pos-scan-btn"
                variant="outline"
                size="icon"
                title="Escanear producto con QR"
                onClick={() => { setScanError(null); setShowScanner(true); }}
                disabled={scanLoading}
                className="shrink-0 border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/10"
              >
                {scanLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                ) : (
                  "📷"
                )}
              </Button>
            </div>

            {/* Scan error feedback */}
            {scanError && (
              <p className="text-xs text-[var(--negative)] bg-[var(--negative)]/10 border border-[var(--negative)]/30 rounded-md px-3 py-2">
                {scanError}
              </p>
            )}
          </div>

          {/* Cart Items */}
          <div className="mt-4 border border-[var(--border)] rounded-md overflow-hidden bg-[#111]">
            {selectedItems.map(item => (
              <div key={item.productId} className="flex justify-between items-center p-3 border-b border-[var(--border)] last:border-0">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-[#888]">${item.unitPrice.toFixed(2)} c/u</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Input 
                    type="number" 
                    min="1" 
                    className="w-16 h-7 text-right" 
                    value={item.quantity} 
                    onChange={(e) => {
                      const q = parseInt(e.target.value);
                      if (q > 0) setSelectedItems(selectedItems.map(i => i.productId === item.productId ? { ...i, quantity: q } : i));
                    }} 
                  />
                  <span className="font-bold text-[var(--accent)] w-16 text-right">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                  <Button variant="ghost" size="sm" className="text-red-500 h-7 w-7 p-0" onClick={() => setSelectedItems(selectedItems.filter(i => i.productId !== item.productId))}>×</Button>
                </div>
              </div>
            ))}
            {selectedItems.length === 0 && (
              <div className="p-4 text-center text-sm text-[#555]">Carrito vacío</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checkout */}
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-4">
            <div className="flex justify-between items-end">
              <span className="text-lg text-[#888]">Subtotal</span>
              <span className="text-xl font-medium text-[#ccc]">${totalAmount.toFixed(2)}</span>
            </div>
            
            {customerId && customerId !== "NEW" && customers.find(c => c.id === customerId)?.walletBalance > 0 && (
              <div className="flex items-center justify-between bg-[var(--accent)]/10 p-3 rounded-md border border-[var(--accent)]/30 mt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="use-wallet" 
                    checked={useWallet} 
                    onChange={(e) => setUseWallet(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <label htmlFor="use-wallet" className="text-sm font-medium text-[var(--accent)] cursor-pointer">
                    Usar Monedero Virtual
                  </label>
                </div>
                <span className="text-sm font-bold text-[var(--accent)]">
                  Disp: ${customers.find(c => c.id === customerId)?.walletBalance.toFixed(2)}
                </span>
              </div>
            )}
            
            {useWallet && customerId && customerId !== "NEW" && (
              <div className="flex justify-between items-end">
                <span className="text-sm text-[var(--accent)]">Descuento Monedero</span>
                <span className="text-sm font-bold text-[var(--accent)]">
                  -${Math.min(customers.find(c => c.id === customerId)?.walletBalance || 0, totalAmount).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-end pt-2">
              <span className="text-xl text-[#888] font-bold">Total a Pagar</span>
              <span className="text-4xl font-bold text-[var(--positive)]">
                ${(totalAmount - (useWallet ? Math.min(customers.find(c => c.id === customerId)?.walletBalance || 0, totalAmount) : 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-[#888]">Tipo de Pago</label>
              <div className="flex space-x-2">
                <Button 
                  variant={paymentType === "FULL" ? "accent" : "outline"} 
                  className="flex-1" 
                  onClick={() => setPaymentType("FULL")}
                >
                  Contado
                </Button>
                <Button 
                  variant={paymentType === "CREDIT" ? "accent" : "outline"} 
                  className="flex-1" 
                  onClick={() => setPaymentType("CREDIT")}
                >
                  Crédito
                </Button>
              </div>
            </div>

            {paymentType === "CREDIT" && (
              <div className="space-y-2 p-3 bg-[#1a1a1a] border border-[#333] rounded-md">
                <label className="text-sm text-[#888]">Pago Inicial (Anticipo Mínimo 50%)</label>
                <Input 
                  type="number" 
                  placeholder={`Mínimo $${((totalAmount - (useWallet ? Math.min(customers.find(c => c.id === customerId)?.walletBalance || 0, totalAmount) : 0)) * 0.5).toFixed(2)}`}
                  value={upfrontPayment}
                  onChange={(e) => setUpfrontPayment(e.target.value)}
                />
                <p className="text-xs text-[var(--negative)]">Restante a 15 días.</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-[#888]">Origen (Lead Source)</label>
              <Input 
                placeholder="Ej. Instagram, TikTok" 
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
              />
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg" 
            variant="positive" 
            disabled={selectedItems.length === 0 || loading}
            onClick={handleSubmit}
          >
            {loading ? "Procesando..." : "Confirmar Venta"}
          </Button>

          {message && (
            <div className="space-y-3">
              <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-[#39FF14]/10 text-[var(--positive)]' : 'bg-[#FF3131]/10 text-[var(--negative)]'}`}>
                {message.text}
              </div>
              {message.type === 'success' && (
                <div className="p-3 bg-[#111] border border-[#222] rounded-md text-center space-y-2">
                  <p className="text-xs text-[#888]">La venta ha sido guardada. Puedes generar el recibo oficial desde el **Historial de Ventas** para enviarlo por WhatsApp.</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full border-[var(--positive)] text-[var(--positive)]"
                    onClick={() => window.location.href = '/sales/history'}
                  >
                    Ir al Historial
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* QR Scanner Modal */}
      {showScanner && (
        <ScannerModal
          onScan={handleScanForPOS}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
