"use client";

import { useState } from "react";
import { updateCustomer, deleteCustomer } from "@/lib/actions/customers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Check, X, Trash2, MessageCircle, TrendingUp, Users, DollarSign } from "lucide-react";

export default function CustomersClient({ customers }: { customers: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", phone: "", address: "" });
  const [savingId, setSavingId] = useState<string | null>(null);

  const totalLTV = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalDebt = customers.reduce((acc, c) => acc + c.activeDebt, 0);

  const startEdit = (customer: any) => {
    setEditingId(customer.id);
    setEditData({ name: customer.name, phone: customer.phone || "", address: customer.address || "" });
  };

  const saveEdit = async (id: string) => {
    setSavingId(id);
    const res = await updateCustomer(id, editData);
    if (!res.success) alert(res.error || "Error al guardar");
    setSavingId(null);
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar a ${name}? Esta acción no puede deshacerse.`)) return;
    const res = await deleteCustomer(id);
    if (!res.success) alert(res.error || "Error al eliminar");
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#888]">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-[var(--accent)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#888]">Ingresos Totales (LTV)</CardTitle>
            <TrendingUp className="h-4 w-4 text-[var(--positive)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--positive)]">
              ${totalLTV.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#888]">Deuda Total Activa</CardTitle>
            <DollarSign className="h-4 w-4 text-[var(--negative)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--negative)]">
              ${totalDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <div className="rounded-md border border-[var(--border)] bg-[var(--card)] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead className="text-right">Compras</TableHead>
              <TableHead className="text-right">LTV Total</TableHead>
              <TableHead className="text-right">Deuda Activa</TableHead>
              <TableHead>Última Compra</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-[#888]">
                  No hay clientes registrados. Se crean automáticamente al hacer una venta.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => {
                const isEditing = editingId === c.id;
                return (
                  <TableRow key={c.id}>
                    {/* Name */}
                    <TableCell className="font-medium min-w-[140px]">
                      {isEditing ? (
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="h-7 text-sm"
                          autoFocus
                        />
                      ) : c.name}
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="min-w-[150px]">
                      {isEditing ? (
                        <Input
                          value={editData.phone}
                          placeholder="+1 809..."
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          className="h-7 text-sm"
                        />
                      ) : (
                        c.phone ? (
                          <button
                            onClick={() => openWhatsApp(c.phone)}
                            className="flex items-center gap-1 text-[#25D366] hover:underline text-sm"
                          >
                            <MessageCircle className="h-3 w-3" /> {c.phone}
                          </button>
                        ) : <span className="text-[#555] text-xs">Sin teléfono</span>
                      )}
                    </TableCell>

                    {/* Address */}
                    <TableCell className="min-w-[180px]">
                      {isEditing ? (
                        <Input
                          value={editData.address}
                          placeholder="Dirección..."
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                          className="h-7 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-[#888]">{c.address || "—"}</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-bold text-[var(--accent)]">
                      {c.purchaseCount}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[var(--positive)]">
                      ${c.totalSpent.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${c.activeDebt > 0 ? "text-[var(--negative)]" : "text-[#555]"}`}>
                      ${c.activeDebt.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs text-[#888]">
                      {c.lastSale ? new Date(c.lastSale).toLocaleDateString() : "Sin compras"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 text-[var(--positive)]"
                            disabled={savingId === c.id}
                            onClick={() => saveEdit(c.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 text-[#888]"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 text-[#888] hover:text-[var(--accent)]"
                            onClick={() => startEdit(c)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 text-[#888] hover:text-[var(--negative)]"
                            onClick={() => handleDelete(c.id, c.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
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
