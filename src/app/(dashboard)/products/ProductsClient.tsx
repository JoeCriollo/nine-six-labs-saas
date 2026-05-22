"use client";

import { useState } from "react";
import { updateProduct, deleteProduct } from "@/lib/actions/products";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Trash2, Package } from "lucide-react";

export default function ProductsClient({ products }: { products: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ brand: "", name: "", category: "", flavor: "", size: "" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("TODOS");

  const categories = ["Proteínas", "Creatinas", "Pre-Entrenos", "Aminoácidos", "Vitaminas", "Minerales", "Quemadores"];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Proteínas":   return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "Creatinas":   return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "Pre-Entrenos": return "bg-red-500/20 text-red-300 border-red-500/40";
      case "Aminoácidos": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "Vitaminas":   return "bg-yellow-400/20 text-yellow-300 border-yellow-400/40";
      case "Minerales":   return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "Quemadores":  return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      default:            return "bg-gray-500/20 text-gray-300 border-gray-500/40";
    }
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditData({ brand: p.brand, name: p.name, category: p.category || "Otros", flavor: p.flavor, size: p.size });
  };

  const saveEdit = async (id: string) => {
    setSavingId(id);
    const res = await updateProduct(id, editData);
    if (!res.success) alert(res.error || "Error al guardar");
    setSavingId(null);
    setEditingId(null);
  };

  const filteredProducts = filterCategory === "TODOS" 
    ? products 
    : products.filter(p => p.category === filterCategory);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar ${name}? Solo es posible si no tiene stock activo.`)) return;
    const res = await deleteProduct(id);
    if (!res.success) alert(res.error || "Error al eliminar");
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button 
          variant={filterCategory === "TODOS" ? "accent" : "outline"}
          size="sm"
          onClick={() => setFilterCategory("TODOS")}
        >
          Todos
        </Button>
        {categories.map(cat => (
          <Button 
            key={cat}
            variant={filterCategory === cat ? "accent" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--card)] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Sabor</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead className="text-right">Lotes Activos</TableHead>
              <TableHead className="text-right">Stock Total</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-[#888]">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-[#333]" />
                    No hay productos en esta categoría.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((p) => {
                const isEditing = editingId === p.id;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="min-w-[120px]">
                      {isEditing ? (
                        <select 
                          className="w-full h-7 rounded-md border border-[var(--border)] bg-[var(--input)] px-2 text-xs"
                          value={editData.category}
                          onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        >
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(p.category)}`}>
                          {p.category || "Otros"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[130px]">
                      {isEditing ? (
                        <Input value={editData.brand} onChange={(e) => setEditData({ ...editData, brand: e.target.value })} className="h-7 text-sm" />
                      ) : <span className="font-medium">{p.brand}</span>}
                    </TableCell>
                    <TableCell className="min-w-[160px]">
                      {isEditing ? (
                        <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="h-7 text-sm" />
                      ) : p.name}
                    </TableCell>
                    <TableCell className="min-w-[130px]">
                      {isEditing ? (
                        <Input value={editData.flavor} onChange={(e) => setEditData({ ...editData, flavor: e.target.value })} className="h-7 text-sm" />
                      ) : <span className="text-[#888]">{p.flavor}</span>}
                    </TableCell>
                    <TableCell className="min-w-[100px]">
                      {isEditing ? (
                        <Input value={editData.size} onChange={(e) => setEditData({ ...editData, size: e.target.value })} className="h-7 text-sm" />
                      ) : <span className="text-[#888]">{p.size}</span>}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[var(--accent)]">{p.activeLots}</TableCell>
                    <TableCell className="text-right font-bold">{p.totalStock}</TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--positive)]" disabled={savingId === p.id} onClick={() => saveEdit(p.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-[#888]" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-[#888] hover:text-[var(--accent)]" onClick={() => startEdit(p)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-[#888] hover:text-[var(--negative)]" onClick={() => handleDelete(p.id, p.name)}>
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
