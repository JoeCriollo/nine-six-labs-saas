import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getBase64Image = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export async function generateReceiptPDF(sale: any) {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150] // Receipt size (standard thermal printer width)
  });

  // Header / Logo
  try {
    const logoBase64 = await getBase64Image('/bg-login.png');
    // Calculate aspect ratio. Width = 40mm.
    doc.addImage(logoBase64, 'PNG', 15, 2, 50, 25); // Adjusted coordinates for logo
  } catch (e) {
    console.error("Failed to load logo", e);
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 80, 25, 'F');
    doc.setTextColor(50, 255, 0);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("NINE SIX LABS", 40, 15, { align: "center" });
  }

  const receiptNum = sale.receiptNumber ? String(sale.receiptNumber).padStart(5, '0') : sale.id.slice(-5).toUpperCase();

  // Sale Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`RECIBO: #${receiptNum}`, 10, 35);
  doc.setFontSize(8);
  doc.text(`FECHA: ${new Date(sale.date).toLocaleString()}`, 10, 40);
  doc.text(`CLIENTE: ${sale.customer.name}`, 10, 45);
  if (sale.customer.phone) doc.text(`TEL: ${sale.customer.phone}`, 10, 50);

  doc.setLineWidth(0.5);
  doc.line(10, 55, 70, 55);

  // Items Table
  const tableData = sale.items.map((item: any) => [
    `${item.lot.product.name}\n(${item.lot.product.flavor})`,
    item.quantity,
    `$${item.priceSale.toFixed(2)}`,
    `$${(item.quantity * item.priceSale).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['Item', 'Cant', 'Precio', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: { fontSize: 8, fontStyle: 'bold', fillColor: [240, 240, 240] },
    styles: { fontSize: 7, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 12, halign: 'right' },
      3: { cellWidth: 15, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", 45, finalY);
  doc.text(`$${sale.totalAmount.toFixed(2)}`, 70, finalY, { align: "right" });

  const totalPaid = sale.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
  const remaining = sale.totalAmount - totalPaid;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("PAGADO:", 45, finalY + 5);
  doc.text(`$${totalPaid.toFixed(2)}`, 70, finalY + 5, { align: "right" });

  if (remaining > 0.01) {
    doc.setTextColor(255, 49, 49); // Red
    doc.setFont("helvetica", "bold");
    doc.text("PENDIENTE:", 45, finalY + 10);
    doc.text(`$${remaining.toFixed(2)}`, 70, finalY + 10, { align: "right" });
    
    if (sale.dueDate) {
      doc.setFontSize(7);
      doc.text(`Vence: ${new Date(sale.dueDate).toLocaleDateString()}`, 70, finalY + 14, { align: "right" });
    }
  }

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("¡Gracias por confiar en Nine Six Labs!", 40, finalY + 25, { align: "center" });

  // Save/Download
  doc.save(`Recibo_NineSix_${sale.id.slice(-6)}.pdf`);
}
