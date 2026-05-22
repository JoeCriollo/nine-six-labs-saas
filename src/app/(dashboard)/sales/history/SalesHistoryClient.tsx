"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ShoppingBag, FileText, MessageCircle } from "lucide-react";
import { exportToExcel } from "@/lib/utils/export";
import { generateReceiptPDF } from "@/lib/utils/pdf-generator";

export default function SalesHistoryClient({ sales }: { sales: any[] }) {
  const handleExport = () => {
    const data = sales.map(s => ({
      ID: s.id,
      Fecha: new Date(s.date).toLocaleDateString(),
      Cliente: s.customer.name,
      Total: s.totalAmount,
      Tipo: s.paymentType === "CREDIT" ? "Crédito" : "Contado",
      Productos: s.items.map((i: any) => `${i.lot.product.brand} ${i.lot.product.name} (x${i.quantity})`).join(", ")
    }));
    exportToExcel(data, "Ventas_Nine_Six");
  };

  const handleWhatsApp = (s: any) => {
    if (!s.customer.phone) {
      alert("Este cliente no tiene teléfono registrado.");
      return;
    }
    const phone = s.customer.phone.replace(/\D/g, "");
    const totalPaid = s.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
    const remaining = s.totalAmount - totalPaid;
    
    let msg = `\u{1F389} \u00a1Felicidades por tu nueva compra, *${s.customer.name.split(' ')[0]}*! \u{1F680}\n`;
    msg += `Gracias por confiar en Nine Six Labs para alcanzar tus metas.\n\n`;
    msg += `\u{1F6D2} *Tu pedido:*\n`;
    s.items.forEach((i: any) => {
      msg += `\u{25FD} ${i.quantity}x ${i.lot.product.brand} \u2014 ${i.lot.product.name}\n`;
    });
    msg += `\n\u{1F4B0} *Resumen:*\n`;
    msg += `Total de la compra: *$${s.totalAmount.toFixed(2)}*\n`;
    
    if (remaining > 0.01) {
      msg += `Monto abonado: *$${totalPaid.toFixed(2)}*\n`;
      msg += `\u{26A0}\uFE0F Saldo Pendiente: *$${remaining.toFixed(2)}*\n`;
    } else {
      msg += `(Pagado en su totalidad \u{2705})\n`;
    }

    if (s.walletEarned > 0) {
      msg += `\n\u{1F381} *Tu Recompensa:*\n`;
      msg += `Ganaste *$${s.walletEarned.toFixed(2)}* en esta compra.\n`;
      if (s.customer.walletBalance) {
        msg += `Tienes *$${s.customer.walletBalance.toFixed(2)}* ahorrados para tu pr\u00f3ximo pedido! \u{1F929}\n`;
      }
    }
    
    msg += `\n\u{1F4C4} Adjunto te enviamos tu recibo digital. \u00a1A darle con todo en tu entrenamiento! \u{1F4AA}\u{1F525}`;

    
    const text = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-4">
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
                      {s.paymentType === 'CREDIT' ? 'Crédito' : 'Contado'}
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
                        size="icon" variant="ghost" className="h-7 w-7 text-[#25D366]"
                        onClick={() => handleWhatsApp(s)}
                        title="Enviar por WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
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
