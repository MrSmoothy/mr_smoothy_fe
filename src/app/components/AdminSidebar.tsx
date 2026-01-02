"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, CupSoda, ShoppingCart, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [showMenuSubmenu, setShowMenuSubmenu] = useState(false);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

  return (
    <div className="w-64 bg-[#14433B] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#5A4A3A]">
        <h1 className="text-2xl font-bold text-[#FFF6F0] font-serif">Admin Dashboard</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/admin/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-sans ${
            isActive("/admin/dashboard")
              ? "bg-[#FFF6F0] text-[#14433B]"
              : "text-[#FFF6F0] hover:bg-[#5A4A3A]"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/admin/home-editor"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-sans ${
            isActive("/admin/home-editor")
              ? "bg-[#FFF6F0] text-[#14433B]"
              : "text-[#FFF6F0] hover:bg-[#5A4A3A]"
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home Editor</span>
        </Link>

        {/* Manage Menu with Submenu */}
        <div>
          <button
            onClick={() => setShowMenuSubmenu(!showMenuSubmenu)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-sans ${
              isActive("/admin/fruits") || isActive("/admin/drinks") || isActive("/admin/cup-sizes")
                ? "bg-[#FFF6F0] text-[#14433B]"
                : "text-[#FFF6F0] hover:bg-[#5A4A3A]"
            }`}
          >
            <div className="flex items-center gap-3">
              <CupSoda className="w-5 h-5" />
              <span>Manage Menu</span>
            </div>
            <ChevronRight
              className={`w-4 h-4 transition-transform ${showMenuSubmenu ? "rotate-90" : ""}`}
            />
          </button>
          {showMenuSubmenu && (
            <div className="ml-4 mt-1 space-y-1">
              <Link
                href="/admin/fruits"
                className={`block px-4 py-2 rounded-lg transition-colors font-sans ${
                  isActive("/admin/fruits")
                    ? "bg-[#FFF6F0] text-[#14433B]"
                    : "text-[#FFF6F0]/80 hover:bg-[#5A4A3A]"
                }`}
              >
                จัดการ
              </Link>
              <Link
                href="/admin/drinks"
                className={`block px-4 py-2 rounded-lg transition-colors font-sans ${
                  isActive("/admin/drinks")
                    ? "bg-[#FFF6F0] text-[#14433B]"
                    : "text-[#FFF6F0]/80 hover:bg-[#5A4A3A]"
                }`}
              >
                จัดการเมนู
              </Link>
              <Link
                href="/admin/cup-sizes"
                className={`block px-4 py-2 rounded-lg transition-colors font-sans ${
                  isActive("/admin/cup-sizes")
                    ? "bg-[#FFF6F0] text-[#14433B]"
                    : "text-[#FFF6F0]/80 hover:bg-[#5A4A3A]"
                }`}
              >
                จัดการขนาดแก้ว
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/admin/orders"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-sans ${
            isActive("/admin/orders")
              ? "bg-[#FFF6F0] text-[#14433B]"
              : "text-[#FFF6F0] hover:bg-[#5A4A3A]"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Order</span>
        </Link>
      </nav>
    </div>
  );
}

