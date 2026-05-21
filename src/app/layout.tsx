import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Users, CreditCard, Import, Box, TrendingDown, ShoppingBag, TrendingUp } from "lucide-react";
import SidebarLogo from "@/components/SidebarLogo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nine Six Command Center",
  description: "SaaS Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r border-[var(--border)] bg-[var(--card)] p-4 flex flex-col">
            <div className="mb-8 px-4 flex flex-col items-center">
              <SidebarLogo />
            </div>
            
            <nav className="space-y-1 flex-1">
              <Link href="/" className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-[#1a1a1a] transition-colors">
                <LayoutDashboard className="h-5 w-5 text-[#888]" />
                <span className="font-medium text-sm">Dashboard</span>
              </Link>
              <Link href="/imports" className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-[#1a1a1a] transition-colors">
                <Import className="h-5 w-5 text-[#888]" />
                <span className="font-medium text-sm">Importaciones</span>
              </Link>
              <Link href="/analytics/lots" className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-[#1a1a1a] transition-colors">
                <TrendingUp className="h-5 w-5 text-[#888]" />
                <span className="font-medium text-sm">Rendimiento Lotes</span>
              </Link>
              <Link href="/inventory" className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-[#1a1a1a] transition-colors">
                <Package className="h-5 w-5 text-[#888]" />
                <span className="font-medium text-sm">Inventario</span>
              </Link>
              <Link href="/products" className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-[#1a1a1a] transition-colors">
                <Box className="h-5 w-5 text-[#888]" />
                <span className="font-medium text-sm">Catálogo</span>
              </Link>
              <Link href="/sales" className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-[#1a1a1a] transition-colors">
                <ShoppingCart className="h-5 w-5 text-[#888]" />
                <span className="font-medium text-sm">Punto de Venta</span>
              </Link>
              <Link href="/sales/history" className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-[#1a1a1a] transition-colors">
                <ShoppingBag className="h-5 w-5 text-[#888]" />
                <span className="font-medium text-sm">Historial de Ventas</span>
              </Link>
              <Link href="/customers" className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-[#1a1a1a] transition-colors">
                <Users className="h-5 w-5 text-[#888]" />
                <span className="font-medium text-sm">CRM Clientes</span>
              </Link>
              <Link href="/receivables" className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-[#1a1a1a] transition-colors">
                <CreditCard className="h-5 w-5 text-[#888]" />
                <span className="font-medium text-sm">Cuentas por Cobrar</span>
              </Link>
              <Link href="/expenses" className="flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-[#1a1a1a] transition-colors">
                <TrendingDown className="h-5 w-5 text-[#888]" />
                <span className="font-medium text-sm">Gastos</span>
              </Link>
            </nav>
            
            <div className="mt-auto px-4 py-4 text-xs text-[#555]">
              &copy; 2026 Nine Six Labs
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
