"use client";

import { useState } from "react";
import { deleteLot, updateLotPrice, updateLotExpiration, updateImportLoteNumber } from "@/lib/actions/inventory";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { differenceInDays, format } from "date-fns";
import { Trash2, Pencil, Check, X, Calendar, Download, Hash } from "lucide-react";
import { exportToExcel } from "@/lib/utils/export";

export default function InventoryClient({ lots }: { lots: any[] }) {
  // State for Price Editing
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  
  // State for Date Editing
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  
  // State for Lote Number Editing
  const [editingLoteId, setEditingLoteId] = useState<string | null>(null);
  const [editLote, setEditLote] = useState<string>("");

  const [savingId, setSavingId] = useState<string | null>(null);

  const handleExport = () => {
    const data = lots.map(l => ({
      Lote: `#${l.loteNumber}`,
      Marca: l.product.brand,
      Producto: l.product.name,
      Sabor: l.product.flavor,
      Tamaño: l.product.size,
      Stock: l.currentQuantity,
      "Costo USA": l.costUsaUnit,
      "Landed Cost": l.landedCost,
      "Precio Venta": l.priceSale,
      Caducidad: format(new Date(l.expirationDate), 'dd/MM/yyyy')
    }));
    exportToExcel(data, "Inventario_Nine_Six");
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Proteínas":    return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "Creatinas":    return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "Pre-Entrenos": return "bg-red-500/20 text-red-300 border-red-500/40";
      case "Aminoácidos":  return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "Vitaminas":    return "bg-yellow-400/20 text-yellow-300 border-yellow-400/40";
      case "Minerales":    return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "Quemadores":   return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      default:             return "bg-gray-500/20 text-gray-300 border-gray-500/40";
    }
  };

  const getExpirationStatus = (expDate: Date) => {
    const days = differenceInDays(new Date(expDate), new Date());
    if (days < 90)  return { color: 'text-[var(--negative)]',  label: 'Crítico' };
    if (days <= 150) return { color: 'text-[#ffaa00]',          label: 'Atención' };
    return              { color: 'text-[var(--positive)]',      label: 'Óptimo' };
  };

  const handleDelete = async (lotId: string) => {
    if (!window.confirm("¿Eliminar este lote? No podrá deshacerse.")) return;
    const res = await deleteLot(lotId);
    if (!res.success) alert(res.error || "Error al eliminar el lote.");
  };

  // --- Price Edit Functions ---
  const startEditPrice = (lotId: string, currentPrice: number) => {
    setEditingPriceId(lotId);
    setEditPrice(currentPrice.toFixed(2));
    setEditingDateId(null);
  };

  const savePrice = async (lotId: string) => {
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("El precio debe ser un número mayor a cero.");
      return;
    }
    setSavingId(lotId);
    const res = await updateLotPrice(lotId, newPrice);
    if (!res.success) alert(res.error || "Error al guardar el precio.");
    setSavingId(null);
    setEditingPriceId(null);
  };

  // --- Date Edit Functions ---
  const startEditDate = (lotId: string, currentDate: Date) => {
    setEditingDateId(lotId);
    // Format to yyyy-MM-dd for the date input
    setEditDate(new Date(currentDate).toISOString().split('T')[0]);
    setEditingPriceId(null);
  };

  const saveDate = async (lotId: string) => {
    if (!editDate) return;
    setSavingId(lotId);
    const res = await updateLotExpiration(lotId, editDate);
    if (!res.success) alert(res.error || "Error al guardar la fecha.");
    setSavingId(null);
    setEditingDateId(null);
  };

  // --- Lote Edit Functions ---
  const startEditLote = (lotId: string, currentNumber: number) => {
    setEditingLoteId(lotId);
    setEditLote(currentNumber.toString());
    setEditingPriceId(null);
    setEditingDateId(null);
  };

  const saveLote = async (lotId: string, importId: string) => {
    const newNumber = parseInt(editLote);
    if (isNaN(newNumber) || newNumber <= 0) {
      alert("El número de lote debe ser un número positivo.");
      return;
    }
    setSavingId(lotId);
    const res = await updateImportLoteNumber(importId, newNumber);
    if (!res.success) alert(res.error || "Error al guardar el número de lote.");
    setSavingId(null);
    setEditingLoteId(null);
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
            <TableHead className="w-20">Lote</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Costo USA</TableHead>
            <TableHead className="text-right">Flete Unit.</TableHead>
            <TableHead className="text-right">Landed Cost</TableHead>
            <TableHead className="text-right w-44">Precio Venta</TableHead>
            <TableHead className="text-right">Margen (%)</TableHead>
            <TableHead className="text-center w-48">Caducidad</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lots.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center h-24 text-[#888]">
                No hay inventario disponible.
              </TableCell>
            </TableRow>
          ) : (
            lots.map((lot) => {
              const status = getExpirationStatus(lot.expirationDate);
              const effectivePrice = editingPriceId === lot.id
                ? (parseFloat(editPrice) || lot.priceSale)
                : lot.priceSale;
              const margin = lot.landedCost > 0 
                ? ((effectivePrice - lot.landedCost) / lot.landedCost) * 100 
                : 0;
              
              const isEditingPrice = editingPriceId === lot.id;
              const isEditingDate = editingDateId === lot.id;

              return (
                <TableRow key={lot.id}>
                  <TableCell className="text-[var(--accent)] font-bold text-sm whitespace-nowrap">
                    {editingLoteId === lot.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="w-16 h-7 text-sm"
                          value={editLote}
                          autoFocus
                          onChange={(e) => setEditLote(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveLote(lot.id, lot.importId);
                            if (e.key === 'Escape') setEditingLoteId(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-[var(--positive)]"
                          onClick={() => saveLote(lot.id, lot.importId)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-1 cursor-pointer group hover:text-[var(--accent-hover)] transition-colors"
                        onClick={() => startEditLote(lot.id, lot.loteNumber)}
                      >
                        <span>Lote #{lot.loteNumber}</span>
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getCategoryColor(lot.product.category)}`}>
                          {lot.product.category || "Otros"}
                        </span>
                        <span>{lot.product.brand} — {lot.product.name}</span>
                      </div>
                      <span className="text-[#888] text-xs">({lot.product.flavor}, {lot.product.size})</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-[var(--accent)]">
                    {lot.currentQuantity}
                  </TableCell>
                  <TableCell className="text-right">${lot.costUsaUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-[#ffaa00]">${lot.freightUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${lot.landedCost.toFixed(2)}</TableCell>

                  {/* PRECIO VENTA — editable */}
                  <TableCell className="text-right">
                    {isEditingPrice ? (
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="w-24 h-7 text-right text-sm"
                          value={editPrice}
                          autoFocus
                          onChange={(e) => setEditPrice(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') savePrice(lot.id);
                            if (e.key === 'Escape') setEditingPriceId(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-[var(--positive)]"
                          disabled={savingId === lot.id}
                          onClick={() => savePrice(lot.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-[#888]"
                          onClick={() => setEditingPriceId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-end gap-2 cursor-pointer group"
                        onClick={() => startEditPrice(lot.id, lot.priceSale)}
                      >
                        <span className="text-[var(--positive)] font-medium">${lot.priceSale.toFixed(2)}</span>
                        <Pencil className="h-3 w-3 text-[#555] group-hover:text-[var(--accent)] transition-colors" />
                      </div>
                    )}
                  </TableCell>

                  {/* MARGEN */}
                  <TableCell className={`text-right font-medium ${margin >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {margin.toFixed(1)}%
                  </TableCell>

                  {/* CADUCIDAD — editable */}
                  <TableCell className="text-center">
                    {isEditingDate ? (
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="date"
                          className="w-32 h-7 text-xs p-1"
                          value={editDate}
                          autoFocus
                          onChange={(e) => setEditDate(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveDate(lot.id);
                            if (e.key === 'Escape') setEditingDateId(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-[var(--positive)]"
                          disabled={savingId === lot.id}
                          onClick={() => saveDate(lot.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center justify-center gap-2 cursor-pointer group font-medium ${status.color}`}
                        onClick={() => startEditDate(lot.id, lot.expirationDate)}
                      >
                        <span>{format(new Date(lot.expirationDate), 'dd/MM/yyyy')}</span>
                        <Calendar className="h-3 w-3 text-[#555] group-hover:text-[var(--accent)] transition-colors" />
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(lot.id)}
                      className="text-[#888] hover:text-[var(--negative)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}

