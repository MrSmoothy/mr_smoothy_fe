"use client";

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCart } from "@/lib/api";
import { getGuestCartCount } from "@/lib/guestCart";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
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
    <header className="bg-[#4A3728] w-full sticky top-0 z-50 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-[#E8DDCB] flex items-center justify-center flex-shrink-0">
            <span className="text-[#4A3728] font-bold text-lg">MS</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-[#E8DDCB] leading-tight font-serif">Mr.Smoothy</span>
            <span className="text-xs text-[#E8DDCB] leading-tight font-sans">Healthy Living Since 2024</span>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className={`px-3 py-2 rounded transition-opacity font-medium ${
              pathname === '/' 
                ? 'bg-[#E8DDCB] text-[#4A3728]' 
                : 'text-[#E8DDCB] hover:opacity-80'
            }`}
          >
            Home
          </Link>
          <Link
            href="/menu"
            className="text-[#E8DDCB] hover:opacity-80 transition-opacity font-medium px-3 py-2"
          >
            Ready Menu
          </Link>
          <Link
            href="/build"
            className="text-[#E8DDCB] hover:opacity-80 transition-opacity font-medium px-3 py-2"
          >
            Custom Menu
          </Link>
          <Link
            href="#"
            className="text-[#E8DDCB] hover:opacity-80 transition-opacity font-medium px-3 py-2"
          >
            Packaging
          </Link>
          <Link
            href="/cart"
            className="relative text-[#E8DDCB] hover:opacity-80 transition-opacity px-3 py-2"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin/dashboard"
                  className="text-[#E8DDCB] hover:opacity-80 transition-opacity font-medium px-3 py-2"
                >
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-2 px-3 py-2">
                <User className="w-5 h-5 text-[#E8DDCB]" />
                <span className="text-[#E8DDCB] text-sm">{user.fullName || user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md bg-black px-6 py-2 text-[#E8DDCB] font-medium hover:opacity-90 transition-opacity"
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[#E8DDCB] hover:opacity-80 transition-opacity font-medium px-3 py-2"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-[#E8DDCB] hover:opacity-80 transition-opacity font-medium px-3 py-2"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
