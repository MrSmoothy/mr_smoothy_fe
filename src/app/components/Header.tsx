"use client";

import Link from "next/link";
import { ShoppingCart, User, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCart } from "@/lib/api";
import { getGuestCartCount } from "@/lib/guestCart";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
      setShowUserMenu(false);
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

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

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
          {/* Hide navigation links and cart for admin */}
          {user?.role !== "ADMIN" && (
            <>
              <Link
                href="/"
                className={`px-3 py-2 rounded transition-all font-medium ${
                  pathname === '/' 
                    ? 'bg-[#E8DDCB] text-[#4A3728] font-semibold' 
                    : 'text-[#E8DDCB] hover:bg-[#E8DDCB]/20 hover:text-[#E8DDCB]'
                }`}
              >
                Home
              </Link>
              <Link
                href="/menu"
                className={`px-3 py-2 rounded transition-all font-medium ${
                  pathname === '/menu' || pathname?.startsWith('/menu/')
                    ? 'bg-[#E8DDCB] text-[#4A3728] font-semibold' 
                    : 'text-[#E8DDCB] hover:bg-[#E8DDCB]/20 hover:text-[#E8DDCB]'
                }`}
              >
                Ready Menu
              </Link>
              <Link
                href="/build"
                className={`px-3 py-2 rounded transition-all font-medium ${
                  pathname === '/build' || pathname?.startsWith('/build/')
                    ? 'bg-[#E8DDCB] text-[#4A3728] font-semibold' 
                    : 'text-[#E8DDCB] hover:bg-[#E8DDCB]/20 hover:text-[#E8DDCB]'
                }`}
              >
                Custom Menu
              </Link>
              <Link
                href="/cart"
                className={`relative px-3 py-2 rounded transition-all ${
                  pathname === '/cart' || pathname?.startsWith('/cart/')
                    ? 'bg-[#E8DDCB] text-[#4A3728]' 
                    : 'text-[#E8DDCB] hover:bg-[#E8DDCB]/20'
                }`}
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}
          {user ? (
            <>
              {/* User Menu Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8DDCB]/10 hover:bg-[#E8DDCB]/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#E8DDCB] flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-[#4A3728]" />
                  </div>
                  <span className="text-[#E8DDCB] font-medium font-sans">{user.fullName || user.username}</span>
                  <ChevronDown className={`w-4 h-4 text-[#E8DDCB] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-[#4A3728]/20 overflow-hidden z-50">
                    <div className="p-4 border-b border-[#4A3728]/10">
                      <p className="font-semibold text-[#4A3728] font-sans">{user.fullName || user.username}</p>
                      <p className="text-sm text-[#4A3728]/70 font-sans">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-[#4A3728] hover:bg-[#E8DDCB]/50 transition-colors font-sans"
                      >
                        <UserCircle className="w-5 h-5" />
                        <span>โปรไฟล์ของฉัน</span>
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 text-[#4A3728] hover:bg-[#E8DDCB]/50 transition-colors font-sans"
                        >
                          <User className="w-5 h-5" />
                          <span>แดชบอร์ด Admin</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-sans"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
