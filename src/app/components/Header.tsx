"use client";

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart } from "@/lib/api";
import { getGuestCartCount } from "@/lib/guestCart";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);

  function loadUser() {
    try {
      const stored = localStorage.getItem("auth_user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {}
  }

  useEffect(() => {
    loadUser();
    
    // Listen for auth state changes (login/logout)
    const handleAuthChange = () => {
      loadUser();
    };
    
    window.addEventListener("authStateChanged", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("focus", handleAuthChange);
    
    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("focus", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    // Load cart for logged in users
    if (user) {
      loadCart();
    } else {
      // Load guest cart count
      updateGuestCartCount();
    }
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      if (user) {
        loadCart();
      } else {
        updateGuestCartCount();
      }
    };
    
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("focus", handleCartUpdate);
    
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("focus", handleCartUpdate);
    };
  }, [user]);

  function updateGuestCartCount() {
    const count = getGuestCartCount();
    setCartCount(count);
  }

  async function loadCart() {
    try {
      const res = await getCart();
      const totalItems = res.data?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(totalItems);
    } catch (err) {
      // Cart might be empty or not accessible
      setCartCount(0);
    }
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    // Dispatch event to notify other components about logout
    window.dispatchEvent(new Event("authStateChanged"));
    router.push("/");
  }

  return (
    <header className="bg-[#4A2C1B] w-full sticky top-0 z-50 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-[#F5EFE6] hover:opacity-90 transition-opacity">
          Mr. Smoothy
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin/dashboard"
                  className="text-[#F5EFE6] hover:opacity-80 transition-opacity font-medium"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/fruits"
                className="text-[#F5EFE6] hover:opacity-80 transition-opacity font-medium"
              >
                ผลไม้
              </Link>
              <Link
                href="/build"
                className="text-[#F5EFE6] hover:opacity-80 transition-opacity font-medium"
              >
                สร้าง Smoothy
              </Link>
              <Link
                href="/menu"
                className="text-[#F5EFE6] hover:opacity-80 transition-opacity font-medium"
              >
                เมนู
              </Link>
              <Link
                href="/cart"
                className="relative text-[#F5EFE6] hover:opacity-80 transition-opacity"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/orders"
                className="text-[#F5EFE6] hover:opacity-80 transition-opacity font-medium"
              >
                คำสั่งซื้อ
              </Link>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#F5EFE6]" />
                <span className="text-[#F5EFE6] text-sm">{user.fullName || user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md bg-black px-6 py-2 text-[#F5EFE6] font-medium hover:opacity-90 transition-opacity"
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <>
              <Link
                href="/fruits"
                className="text-[#F5EFE6] hover:opacity-80 transition-opacity font-medium"
              >
                ผลไม้
              </Link>
              <Link
                href="/build"
                className="text-[#F5EFE6] hover:opacity-80 transition-opacity font-medium"
              >
                สร้าง Smoothy
              </Link>
              <Link
                href="/menu"
                className="text-[#F5EFE6] hover:opacity-80 transition-opacity font-medium"
              >
                เมนู
              </Link>
              <Link
                href="/cart"
                className="relative text-[#F5EFE6] hover:opacity-80 transition-opacity"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/orders"
                className="text-[#F5EFE6] hover:opacity-80 transition-opacity font-medium"
              >
                คำสั่งซื้อ
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-black px-6 py-2 text-[#F5EFE6] font-medium hover:opacity-90 transition-opacity"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[#F5EFE6] px-6 py-2 text-[#4A2C1B] font-medium hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
