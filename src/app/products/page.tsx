import { getProducts } from "@/lib/actions/products";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const result = await getProducts();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Catálogo de Productos</h2>
        <p className="text-sm text-[#888] mt-1">Gestiona tu catálogo. Los productos se crean automáticamente al importar.</p>
      </div>
      <ProductsClient products={result.data || []} />
    </div>
  );
}
