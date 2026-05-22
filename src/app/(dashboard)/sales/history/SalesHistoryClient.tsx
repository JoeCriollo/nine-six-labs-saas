"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ShoppingBag, FileText, MessageCircle, Copy, Check } from "lucide-react";
import { exportToExcel } from "@/lib/utils/export";
import { generateReceiptPDF } from "@/lib/utils/pdf-generator";

export default function SalesHistoryClient({ sales }: { sales: any[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleExport = () => {
    const data = sales.map(s => ({
      ID: s.id,
      Fecha: new Date(s.date).toLocaleDateString(),
      Cliente: s.customer.name,
      Total: s.totalAmount,
      Tipo: s.paymentType === "CREDIT" ? "Credito" : "Contado",
      Productos: s.items.map((i: any) => `${i.lot.product.brand} ${i.lot.product.name} (x${i.quantity})`).join(", ")
    }));
    exportToExcel(data, "Ventas_Nine_Six");
  };

  const buildMessage = (s: any): string => {
    const totalPaid = s.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
    const remaining = s.totalAmount - totalPaid;
    const firstName = s.customer.name.split(" ")[0];

    // Emojis built via fromCodePoint — immune to file encoding issues
    const e = (cp: number) => String.fromCodePoint(cp);

    let msg = `${e(0x1F389)} Felicidades por tu nueva compra, *${firstName}*! ${e(0x1F680)}\n`;
    msg += `Gracias por confiar en Nine Six Labs para alcanzar tus metas.\n\n`;
    msg += `${e(0x1F6D2)} *Tu pedido:*\n`;
    s.items.forEach((i: any) => {
      msg += `${e(0x25FD)} ${i.quantity}x ${i.lot.product.brand} - ${i.lot.product.name}\n`;
    });
    msg += `\n${e(0x1F4B0)} *Resumen:*\n`;
    msg += `Total de la compra: *$${s.totalAmount.toFixed(2)}*\n`;

    if (remaining > 0.01) {
      msg += `Monto abonado: *$${totalPaid.toFixed(2)}*\n`;
      msg += `${e(0x26A0)}${e(0xFE0F)} Saldo Pendiente: *$${remaining.toFixed(2)}*\n`;
    } else {
      msg += `Pagado en su totalidad ${e(0x2705)}\n`;
    }

    if (s.walletEarned > 0) {
      msg += `\n${e(0x1F381)} *Tu Recompensa:*\n`;
      msg += `Ganaste *$${s.walletEarned.toFixed(2)}* en esta compra.\n`;
      if (s.customer.walletBalance) {
        msg += `Tienes *$${s.customer.walletBalance.toFixed(2)}* ahorrados para tu proximo pedido! ${e(0x1F929)}\n`;
      }
    }

    msg += `\n${e(0x1F4C4)} Adjunto te enviamos tu recibo digital. A darle con todo en tu entrenamiento! ${e(0x1F4AA)}${e(0x1F525)}`;
    return msg;
  };

  const handleWhatsApp = async (s: any) => {
    if (!s.customer.phone) {
      alert("Este cliente no tiene telefono registrado.");
      return;
    }

    const msg = buildMessage(s);

    try {
      // Copy to clipboard — emojis survive perfectly via clipboard API
      await navigator.clipboard.writeText(msg);
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 3000);

      // Open WhatsApp directly to the contact (without pre-filling text via URL
      // because WhatsApp's wa.me redirect corrupts 4-byte emojis)
      const phone = s.customer.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}`, "_blank");
    } catch {
      // Fallback: try the URL method
      const phone = s.customer.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}`, "_blank");
    }
  };

  return (
    <div className="space-y-4">
      {/* Copied toast */}
      {copiedId && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[var(--positive)]/90 text-black font-semibold px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
          <Check className="h-4 w-4" />
          Mensaje copiado — pega en WhatsApp
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" /> Exportar a Excel
        </Button>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--card)] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-[#888]">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="h-8 w-8 text-[#333]" />
                    No hay ventas registradas.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm text-[#888]">
                    {new Date(s.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{s.customer.name}</TableCell>
                  <TableCell className="text-xs text-[#888] max-w-[300px] truncate">
                    {s.items.map((i: any) => `${i.lot.product.name} (x${i.quantity})`).join(", ")}
                  </TableCell>
                  <TableCell className="text-right font-bold text-[var(--positive)]">
                    ${s.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${s.paymentType === 'CREDIT' ? 'border-[var(--negative)] text-[var(--negative)]' : 'border-[var(--positive)] text-[var(--positive)]'}`}>
                      {s.paymentType === 'CREDIT' ? 'Credito' : 'Contado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7 text-[var(--accent)]"
                        onClick={() => generateReceiptPDF(s)}
                        title="Descargar PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className={`h-7 w-7 transition-colors ${copiedId === s.id ? "text-[var(--positive)]" : "text-[#25D366]"}`}
                        onClick={() => handleWhatsApp(s)}
                        title={copiedId === s.id ? "Mensaje copiado!" : "Copiar mensaje y abrir WhatsApp"}
                      >
                        {copiedId === s.id
                          ? <Copy className="h-4 w-4" />
                          : <MessageCircle className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
