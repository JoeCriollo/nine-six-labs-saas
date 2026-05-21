"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Import,
  Box,
  TrendingDown,
  ShoppingBag,
  TrendingUp,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { logout } from "@/lib/actions/auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/imports", label: "Importaciones", icon: Import },
  { href: "/analytics/lots", label: "Rendimiento Lotes", icon: TrendingUp },
  { href: "/inventory", label: "Inventario", icon: Package },
  { href: "/products", label: "Catálogo", icon: Box },
  { href: "/sales", label: "Punto de Venta", icon: ShoppingCart },
  { href: "/sales/history", label: "Historial de Ventas", icon: ShoppingBag },
  { href: "/customers", label: "CRM Clientes", icon: Users },
  { href: "/receivables", label: "Cuentas por Cobrar", icon: CreditCard },
  { href: "/expenses", label: "Gastos", icon: TrendingDown },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Desktop: collapsed (icon-only) state
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center mb-6 px-2 pt-2 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Nine Six Labs"
              width={120}
              height={40}
              className="object-contain"
              priority
            />
          </div>
        )}
        {collapsed && (
          <Image
            src="/logo.png"
            alt="Nine Six Labs"
            width={36}
            height={36}
            className="object-contain rounded-lg"
            priority
          />
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-[#1a1a1a] text-[#666] hover:text-white transition-colors"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="flex lg:hidden items-center justify-center w-7 h-7 rounded-md hover:bg-[#1a1a1a] text-[#666] hover:text-white transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20"
                  : "text-[#888] hover:bg-[#1a1a1a] hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon
                className={`flex-shrink-0 w-5 h-5 transition-colors ${
                  isActive ? "text-[#39FF14]" : "text-[#666] group-hover:text-white"
                }`}
              />
              {!collapsed && <span className="truncate">{label}</span>}
              {/* Tooltip on collapsed desktop */}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-[#111] border border-[#333] text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`mt-auto pt-4 border-t border-[#222] ${collapsed ? "flex justify-center" : ""}`}>
        <form action={logout}>
          <button
            type="submit"
            title={collapsed ? "Cerrar sesión" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#666] hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="flex-shrink-0 w-5 h-5" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </form>
        {!collapsed && (
          <p className="px-3 pt-2 text-xs text-[#444]">© 2026 Nine Six Labs</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0B0B0B]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — mobile drawer + desktop static */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col
          bg-[#111] border-r border-[#1e1e1e]
          transition-all duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${collapsed ? "lg:w-[72px]" : "lg:w-64"}
          ${mobileOpen ? "translate-x-0 w-72 p-4" : "-translate-x-full w-72 p-4 lg:p-4"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-[#111]/80 backdrop-blur-md border-b border-[#1e1e1e] lg:hidden">
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Image
            src="/logo.png"
            alt="Nine Six Labs"
            width={90}
            height={30}
            className="object-contain"
            priority
          />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
