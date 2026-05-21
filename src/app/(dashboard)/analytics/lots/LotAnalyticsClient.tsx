"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Package, Ship } from "lucide-react";

export default function LotAnalyticsClient({ performance }: { performance: any[] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Global ROI Average if needed, or just list */}
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--card)] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lote</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Inversión Total</TableHead>
              <TableHead className="text-right">Ingresos (Ventas)</TableHead>
              <TableHead className="text-right">Utilidad Neta</TableHead>
              <TableHead className="text-center">ROI (%)</TableHead>
              <TableHead className="text-center w-64">Progreso de Venta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-[#888]">
                  No hay datos de lotes disponibles.
                </TableCell>
              </TableRow>
            ) : (
              performance.map((lot) => {
                const isPositive = lot.netProfit > 0;
                const isSoldOut = lot.progress >= 99.9;

                return (
                  <TableRow key={lot.id} className="hover:bg-white/5 transition-colors">
                    <TableCell className="font-bold text-[var(--accent)]">
                      Lote #{lot.loteNumber}
                    </TableCell>
                    <TableCell className="text-sm text-[#888]">
                      {new Date(lot.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col">
                        <span className="font-medium">${lot.totalInvestment.toLocaleString()}</span>
                        <span className="text-[10px] text-[#555]">Incluye ${lot.freight} flete</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-[var(--positive)] font-medium">
                      ${lot.totalRevenue.toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${isPositive ? 'text-[var(--positive)]' : 'text-[#555]'}`}>
                      ${lot.netProfit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${lot.roi > 20 ? 'bg-[var(--positive)]/20 text-[var(--positive)]' : 'bg-[#333] text-[#888]'}`}>
                        {lot.roi.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-[#888]">
                          <span>{lot.itemsSold} / {lot.totalItems} unidades</span>
                          <span>{lot.progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all ${isSoldOut ? 'bg-[var(--positive)]' : 'bg-[var(--accent)]'}`}
                            style={{ width: `${lot.progress}%` }}
                          />
                        </div>
                      </div>
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
