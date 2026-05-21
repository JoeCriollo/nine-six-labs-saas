"use client";

import { useState, useCallback } from "react";
import { processImport, getProductBySku, ImportItemDTO } from "@/lib/actions/imports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScannerModal } from "@/components/ui/scanner-modal";

// ──────────────────────────────────────────────
// Tipos internos del carrito
// ──────────────────────────────────────────────
interface CartItem extends ImportItemDTO {
  _cartId: string; // ID único solo en cliente para poder eliminar filas
  productName: string;
  productBrand: string;
  productSize: string;
}

interface ProductFormState {
  productId: string;
  productLabel: string; // "Brand · Name · Size"
  quantity: string;
  costUsa: string;
  expirationDate: string;
  marginPercent: string;
}

const EMPTY_FORM: ProductFormState = {
  productId: "",
  productLabel: "",
  quantity: "",
  costUsa: "",
  expirationDate: "",
  marginPercent: "15",
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────
export default function ImportsPage() {
  // Estado global del cargamento
  const [freightTotal, setFreightTotal] = useState("");
  const [loteNumber, setLoteNumber] = useState("");

  // Carrito de ítems
  const [cart, setCart] = useState<CartItem[]>([]);

  // Escáner
  const [showScanner, setShowScanner] = useState(false);

  // Formulario rápido de producto (se muestra tras el scan)
  const [productForm, setProductForm] = useState<ProductFormState | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Procesamiento final
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // ── Handlers ─────────────────────────────────

  // Llamado por ScannerModal cuando detecta un código
  const handleScan = useCallback(async (sku: string) => {
    setShowScanner(false);
    setLookupError(null);
    setLookupLoading(true);
    setProductForm(null);

    const res = await getProductBySku(sku);

    setLookupLoading(false);

    if (!res.success || !res.data) {
      setLookupError(`SKU "${sku}" no encontrado en la base de datos. Verifica el código o agrega el producto primero.`);
      return;
    }

    const p = res.data;
    setProductForm({
      productId: p.id,
      productLabel: `${p.brand} · ${p.name} · ${p.size}`,
      quantity: "",
      costUsa: "",
      expirationDate: "",
      marginPercent: "15",
    });
  }, []);

  // Añade el ítem del formulario al carrito
  const handleAddToCart = () => {
    if (!productForm) return;

    const qty = parseInt(productForm.quantity);
    const cost = parseFloat(productForm.costUsa);
    const margin = parseFloat(productForm.marginPercent);

    if (!qty || qty <= 0) return setLookupError("La cantidad debe ser mayor a 0.");
    if (!cost || cost <= 0) return setLookupError("El costo USA debe ser mayor a $0.");
    if (!productForm.expirationDate) return setLookupError("La fecha de expiración es requerida.");
    if (isNaN(margin) || margin < 0) return setLookupError("El margen debe ser un número positivo.");

    const [brand, name, size] = productForm.productLabel.split(" · ");

    const newItem: CartItem = {
      _cartId: uid(),
      productId: productForm.productId,
      productName: name ?? "",
      productBrand: brand ?? "",
      productSize: size ?? "",
      quantity: qty,
      costUsa: cost,
      expirationDate: new Date(productForm.expirationDate).toISOString(),
      marginPercent: margin,
    };

    setCart((prev) => [...prev, newItem]);
    setProductForm(null);
    setLookupError(null);
  };

  const handleRemoveItem = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i._cartId !== cartId));
  };

  // Procesa el cargamento completo
  const handleProcessShipment = async () => {
    if (cart.length === 0) return;

    const freight = parseFloat(freightTotal);
    if (!freight || freight <= 0) {
      setResult({ success: false, message: "Ingresa un flete total válido antes de procesar." });
      return;
    }

    setProcessing(true);
    setResult(null);

    const dtos: ImportItemDTO[] = cart.map(({ _cartId, productName, productBrand, productSize, ...dto }) => dto);

    const res = await processImport(dtos, freight, loteNumber);

    setProcessing(false);

    if (res.success) {
      setCart([]);
      setFreightTotal("");
      setLoteNumber("");
      setResult({ success: true, message: `✅ Cargamento procesado con éxito. Se crearon ${dtos.length} lote(s) en el inventario.` });
    } else {
      setResult({ success: false, message: res.error ?? "Error desconocido al procesar el cargamento." });
    }
  };

  // ── Cálculos de previsualización ─────────────
  const freight = parseFloat(freightTotal) || 0;
  const totalVolume = cart.reduce((acc, item) => {
    // Estimación cliente-side para preview (el cálculo real lo hace el backend con product-matching)
    return acc + item.quantity;
  }, 0);

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Importaciones
          </h1>
          <p className="mt-1 text-sm text-[#555]">
            Registra un nuevo cargamento escaneando los productos uno a uno.
          </p>
        </div>
        {cart.length > 0 && (
          <span className="inline-flex h-8 items-center rounded-full border border-[var(--positive)]/40 bg-[var(--positive)]/10 px-3 text-xs font-medium text-[var(--positive)]">
            {cart.length} producto{cart.length !== 1 ? "s" : ""} en carrito
          </span>
        )}
      </div>

      {/* ── Sección 1: Datos generales del cargamento ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📦 Datos del Cargamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#666]" htmlFor="freight-input">
                Flete Total (USD) <span className="text-[var(--negative)]">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[#555]">
                  $
                </span>
                <input
                  id="freight-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={freightTotal}
                  onChange={(e) => setFreightTotal(e.target.value)}
                  className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] pl-7 pr-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#666]" htmlFor="lote-input">
                Número de Lote (opcional)
              </label>
              <input
                id="lote-input"
                type="number"
                min="1"
                placeholder="Ej: 42"
                value={loteNumber}
                onChange={(e) => setLoteNumber(e.target.value)}
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Sección 2: Escáner + Formulario rápido ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📷 Escanear Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            id="open-scanner-btn"
            variant="accent"
            onClick={() => {
              setShowScanner(true);
              setLookupError(null);
              setProductForm(null);
            }}
            disabled={lookupLoading}
          >
            {lookupLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Buscando producto...
              </span>
            ) : (
              "📷  Escanear Producto"
            )}
          </Button>

          {/* Error de búsqueda */}
          {lookupError && (
            <div className="rounded-lg border border-[var(--negative)] bg-[var(--negative)]/10 px-4 py-3 text-sm text-[var(--negative)]">
              {lookupError}
            </div>
          )}

          {/* Formulario rápido post-scan */}
          {productForm && (
            <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                Producto detectado
              </p>
              <p className="mb-4 text-sm font-medium text-[var(--foreground)]">
                {productForm.productLabel}
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Cantidad */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#666]">
                    Cantidad <span className="text-[var(--negative)]">*</span>
                  </label>
                  <input
                    id="quick-quantity"
                    type="number"
                    min="1"
                    placeholder="Ej: 24"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm((f) => f && { ...f, quantity: e.target.value })}
                    className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    autoFocus
                  />
                </div>

                {/* Costo USA */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#666]">
                    Costo USA / unidad <span className="text-[var(--negative)]">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[#555]">
                      $
                    </span>
                    <input
                      id="quick-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={productForm.costUsa}
                      onChange={(e) => setProductForm((f) => f && { ...f, costUsa: e.target.value })}
                      className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] pl-7 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    />
                  </div>
                </div>

                {/* Fecha de expiración */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#666]">
                    Fecha de Expiración <span className="text-[var(--negative)]">*</span>
                  </label>
                  <input
                    id="quick-expiry"
                    type="date"
                    value={productForm.expirationDate}
                    onChange={(e) => setProductForm((f) => f && { ...f, expirationDate: e.target.value })}
                    className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  />
                </div>

                {/* Margen */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#666]">
                    Margen de Ganancia (%)
                  </label>
                  <div className="relative">
                    <input
                      id="quick-margin"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="15"
                      value={productForm.marginPercent}
                      onChange={(e) => setProductForm((f) => f && { ...f, marginPercent: e.target.value })}
                      className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[#555]">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button id="add-to-cart-btn" variant="positive" onClick={handleAddToCart}>
                  ✓ Agregar al Carrito
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setProductForm(null);
                    setLookupError(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Sección 3: Resumen del Carrito ── */}
      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🛒 Resumen del Cargamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[#555]">
                    <th className="pb-3 pr-4 font-medium">Producto</th>
                    <th className="pb-3 pr-4 font-medium text-right">Qty</th>
                    <th className="pb-3 pr-4 font-medium text-right">Costo USA</th>
                    <th className="pb-3 pr-4 font-medium text-right">Margen</th>
                    <th className="pb-3 pr-4 font-medium">Vence</th>
                    <th className="pb-3 font-medium text-right">Subtotal</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {cart.map((item) => {
                    const subtotal = item.quantity * item.costUsa;
                    const expiryDate = new Date(item.expirationDate).toLocaleDateString("es-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <tr
                        key={item._cartId}
                        className="transition-colors hover:bg-[var(--border)]/20"
                      >
                        <td className="py-3 pr-4">
                          <p className="font-medium text-[var(--foreground)]">{item.productBrand} {item.productName}</p>
                          <p className="text-xs text-[#555]">{item.productSize}</p>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono">{item.quantity}</td>
                        <td className="py-3 pr-4 text-right font-mono text-[var(--positive)]">
                          ${fmt(item.costUsa)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono">{item.marginPercent}%</td>
                        <td className="py-3 pr-4 text-xs text-[#666]">{expiryDate}</td>
                        <td className="py-3 pr-4 text-right font-mono font-semibold">
                          ${fmt(subtotal)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleRemoveItem(item._cartId)}
                            className="rounded-md px-2 py-1 text-xs text-[#555] transition hover:bg-[var(--negative)]/10 hover:text-[var(--negative)]"
                            aria-label="Eliminar ítem"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="mt-4 flex flex-col gap-1 border-t border-[var(--border)] pt-4 text-sm">
              <div className="flex justify-between text-[#555]">
                <span>Subtotal mercancía</span>
                <span className="font-mono">
                  ${fmt(cart.reduce((a, i) => a + i.quantity * i.costUsa, 0))}
                </span>
              </div>
              <div className="flex justify-between text-[#555]">
                <span>Flete total (a prorratear)</span>
                <span className="font-mono text-[var(--accent)]">
                  ${fmt(freight)}
                </span>
              </div>
              <div className="mt-1 flex justify-between border-t border-[var(--border)] pt-2 font-semibold text-[var(--foreground)]">
                <span>Total estimado</span>
                <span className="font-mono">
                  ${fmt(cart.reduce((a, i) => a + i.quantity * i.costUsa, 0) + freight)}
                </span>
              </div>
            </div>

            {/* Botón de procesamiento */}
            <div className="mt-6">
              <Button
                id="process-shipment-btn"
                variant="positive"
                size="lg"
                onClick={handleProcessShipment}
                disabled={processing || cart.length === 0}
                className="w-full"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Procesando cargamento...
                  </span>
                ) : (
                  `🚀  Procesar Cargamento (${cart.length} producto${cart.length !== 1 ? "s" : ""})`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Resultado final ── */}
      {result && (
        <div
          className={`rounded-xl border px-5 py-4 text-sm font-medium ${
            result.success
              ? "border-[var(--positive)] bg-[var(--positive)]/10 text-[var(--positive)]"
              : "border-[var(--negative)] bg-[var(--negative)]/10 text-[var(--negative)]"
          }`}
        >
          {result.message}
        </div>
      )}

      {/* ── Modal del escáner (portal) ── */}
      {showScanner && (
        <ScannerModal
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
