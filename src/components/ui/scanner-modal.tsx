"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./button";

interface ScannerModalProps {
  onScan: (sku: string) => void;
  onClose: () => void;
}

export function ScannerModal({ onScan, onClose }: ScannerModalProps) {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let html5QrCode: any = null;
    let isComponentMounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        
        // Si el componente se desmontó mientras cargaba el import, no continuar
        if (!isComponentMounted) return;

        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText: string) => {
            // Callback al detectar un código
            if (html5QrCode && html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                html5QrCode.clear();
              }).catch(() => {});
            }
            onScan(decodedText.trim());
          },
          () => {} // Ignorar errores de frame silenciosamente
        );

        if (isComponentMounted) {
          setScanning(true);
        }
      } catch (err: any) {
        if (isComponentMounted) {
          setError("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
        }
      }
    };

    startScanner();

    return () => {
      isComponentMounted = false;
      if (scannerRef.current) {
        try {
          // Intentar detener; manejar tanto promesa exitosa como rechazada/error síncrono
          const stopPromise = scannerRef.current.stop();
          if (stopPromise && stopPromise.then) {
            stopPromise.then(() => {
              scannerRef.current?.clear();
            }).catch(() => {
              scannerRef.current?.clear();
            });
          } else {
            scannerRef.current.clear();
          }
        } catch (e) {
          // Capturar error si stop() falla síncronamente
          try { scannerRef.current.clear(); } catch(e2) {}
        }
      }
    };
  }, [onScan]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Escáner QR"
    >
      <div className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Escanear Producto
            </h2>
            <p className="mt-0.5 text-xs text-[#666]">
              Apunta al código QR o de barras del SKU
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[#666] transition hover:border-[var(--negative)] hover:text-[var(--negative)]"
            aria-label="Cerrar escáner"
          >
            ✕
          </button>
        </div>

        {/* Scanner viewport */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-black">
          <div id="qr-reader" className="w-full" />
          {/* Corner decorators */}
          <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 rounded-tl border-l-2 border-t-2 border-[var(--accent)]" />
          <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 rounded-tr border-r-2 border-t-2 border-[var(--accent)]" />
          <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 rounded-bl border-b-2 border-l-2 border-[var(--accent)]" />
          <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 rounded-br border-b-2 border-r-2 border-[var(--accent)]" />
        </div>

        {/* Status */}
        {scanning && !error && (
          <p className="text-center text-xs text-[var(--positive)] animate-pulse">
            ● Cámara activa — esperando código...
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-[var(--negative)] bg-[var(--negative)]/10 px-3 py-2 text-center text-xs text-[var(--negative)]">
            {error}
          </p>
        )}

        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
