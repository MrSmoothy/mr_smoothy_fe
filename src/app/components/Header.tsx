"use client";

import Link from "next/link";
import { ShoppingCart, User, ChevronDown, LogOut, UserCircle, Package, Menu, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCart, getMyOrders, getGuestOrdersByPhoneNumber, type Order } from "@/lib/api";
import { getGuestCartCount } from "@/lib/guestCart";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  function loadUser() {
    try {
      const stored = localStorage.getItem("auth_user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch { }
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
    // Load cart and orders for logged in users
    if (user) {
      loadCart();
      loadPendingOrders();
    } else {
      // Load guest cart count and orders
      updateGuestCartCount();
      loadGuestPendingOrders();
    }

    // Listen for cart and order updates
    const handleCartUpdate = () => {
      if (user) {
        loadCart();
        loadPendingOrders();
      } else {
        updateGuestCartCount();
        loadGuestPendingOrders();
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("orderUpdated", handleCartUpdate);
    window.addEventListener("focus", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("orderUpdated", handleCartUpdate);
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

  async function loadPendingOrders() {
    try {
      const res = await getMyOrders();
      const pendingOrders = (res.data || []).filter(
        (order: Order) => order.status && order.status !== "COMPLETED" && order.status !== "CANCELLED"
      );
      setPendingOrdersCount(pendingOrders.length);
    } catch (err) {
      setPendingOrdersCount(0);
    }
  }

  async function loadGuestPendingOrders() {
    try {
      const phoneNumber = localStorage.getItem("guest_phone_number");
      if (phoneNumber) {
        const res = await getGuestOrdersByPhoneNumber(phoneNumber);
        const pendingOrders = (res.data || []).filter(
          (order: Order) => order.status && order.status !== "COMPLETED" && order.status !== "CANCELLED"
        );
        setPendingOrdersCount(pendingOrders.length);
      } else {
        setPendingOrdersCount(0);
      }
    } catch (err) {
      setPendingOrdersCount(0);
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

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showMobileMenu) {
        setShowMobileMenu(false);
      }
    }

    if (showMobileMenu) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMobileMenu]);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  return (
    <header className="bg-[#FFFFFF] w-full sticky top-0 z-50 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#E8DDCB] flex items-center justify-center flex-shrink-0">
            <span className="text-[#4A3728] font-bold text-base sm:text-lg">MS</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold text-[#FFFFFF] leading-tight font-serif">Mr.Smoothy</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4">
          <Link
            href="/"
            className={`px-3 py-2 rounded transition-all font-medium ${pathname === '/'
                ? 'bg-[#000000] text-[#FFFFFF] font-semibold'
                : 'text-[#000000] hover:bg-[#000000]/20 hover:text-[#FFFFFF]'
              }`}
          >
            Home
          </Link>
          <Link
            href="/menu"
            className={`px-3 py-2 rounded transition-all font-medium ${pathname === '/menu' || pathname?.startsWith('/menu/')
                ? 'bg-[#000000] text-[#FFFFFF] font-semibold'
                : 'text-[#000000] hover:bg-[#000000]/20 hover:text-[#FFFFFF]'
              }`}
          >
            Ready Menu
          </Link>
          <Link
            href="/build"
            className={`px-3 py-2 rounded transition-all font-medium ${pathname === '/build' || pathname?.startsWith('/build/')
                ? 'bg-[#000000] text-[#FFFFFF] font-semibold'
                : 'text-[#000000] hover:bg-[#000000]/20 hover:text-[#FFFFFF]'
              }`}
          >
            Custom Menu
          </Link>
          <Link
            href="/contact"
            className={`px-3 py-2 rounded transition-all font-medium ${pathname === '/contact' || pathname?.startsWith('/contact/')
                ? 'bg-[#000000] text-[#FFFFFF] font-semibold'
                : 'text-[#000000] hover:bg-[#000000]/20 hover:text-[#FFFFFF]'
              }`}
          >
            Contact
          </Link>
          <div className="relative">
            <Link
              href="/cart"
              className={`group relative px-3 py-2 rounded transition-all inline-flex items-center justify-center ${pathname === '/cart' || pathname?.startsWith('/cart/')
                  ? 'bg-[#000000]'
                  : 'hover:bg-[#000000]/20'
                }`}
            >
              <ShoppingCart
                className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 transition-colors ${pathname === '/cart' || pathname?.startsWith('/cart/')
                    ? 'text-[#FFFFFF]'
                    : 'text-[#000000] group-hover:text-[#FFFFFF]'
                  }`}
                strokeWidth={2}
              />

              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs
                       rounded-full w-5 h-5 flex items-center justify-center
                       font-semibold z-10">
                  {cartCount}
                </span>
              )}
            </Link>

            {pendingOrdersCount > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white
                    text-[10px] px-1.5 py-0.5 rounded-full flex items-center
                    gap-1 font-semibold">
                <Package className="w-3 h-3" />
                <span>{pendingOrdersCount}</span>
              </div>
            )}
          </div>

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#000000]/10 hover:bg-[#000000]/20 transition-colors"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E8DDCB] flex items-center justify-center">
                  <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#000000]" />
                </div>
                <span className="text-[#000000] font-medium font-sans hidden xl:inline">{user.fullName || user.username}</span>
                <ChevronDown className={`w-4 h-4 text-[#000000] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-[#4A3728]/20 overflow-hidden z-50">
                  <div className="p-4 border-b border-[#000000]/10">
                    <p className="font-semibold text-[#000000] font-sans">{user.fullName || user.username}</p>
                    <p className="text-sm text-[#000000]/70 font-sans">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[#000000] hover:bg-[#E8DDCB]/50 transition-colors font-sans"
                    >
                      <UserCircle className="w-5 h-5" />
                      <span>โปรไฟล์ของฉัน</span>
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-[#000000] hover:bg-[#E8DDCB]/50 transition-colors font-sans"
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
          ) : (
            <>
              <Link
                href="/login"
                className="text-[#000000] hover:opacity-80 transition-opacity font-medium px-3 py-2"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-[#000000] hover:opacity-80 transition-opacity font-medium px-3 py-2"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation - Right side icons */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/cart"
            className={`relative p-2 rounded transition-all inline-flex items-center justify-center ${pathname === '/cart' || pathname?.startsWith('/cart/')
                ? 'bg-[#E8DDCB]'
                : 'hover:bg-[#E8DDCB]/20'
              }`}
          >
            {pathname === '/cart' || pathname?.startsWith('/cart/') ? (
              <ShoppingCart
                className="w-5 h-5 text-[#000000]"
                strokeWidth={2}
              />
            ) : (
              <ShoppingCart
                className="w-5 h-5 text-[#E8DDCB]"
                strokeWidth={2}
              />
            )}
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold z-10">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-[#000000] hover:bg-[#E8DDCB]/20 rounded transition-colors"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-[#E8DDCB]/20 bg-[#4A3728]">
          <nav className="px-4 py-4 space-y-2">
            <Link
              href="/"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-4 py-3 rounded transition-all font-medium ${pathname === '/'
                  ? 'bg-[#E8DDCB] text-[#4A3728] font-semibold'
                  : 'text-[#E8DDCB] hover:bg-[#E8DDCB]/20'
                }`}
            >
              Home
            </Link>
            <Link
              href="/menu"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-4 py-3 rounded transition-all font-medium ${pathname === '/menu' || pathname?.startsWith('/menu/')
                  ? 'bg-[#E8DDCB] text-[#4A3728] font-semibold'
                  : 'text-[#E8DDCB] hover:bg-[#E8DDCB]/20'
                }`}
            >
              Ready Menu
            </Link>
            <Link
              href="/build"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-4 py-3 rounded transition-all font-medium ${pathname === '/build' || pathname?.startsWith('/build/')
                  ? 'bg-[#E8DDCB] text-[#4A3728] font-semibold'
                  : 'text-[#E8DDCB] hover:bg-[#E8DDCB]/20'
                }`}
            >
              Custom Menu
            </Link>
            <Link
              href="/contact"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-4 py-3 rounded transition-all font-medium ${pathname === '/contact' || pathname?.startsWith('/contact/')
                  ? 'bg-[#E8DDCB] text-[#4A3728] font-semibold'
                  : 'text-[#E8DDCB] hover:bg-[#E8DDCB]/20'
                }`}
            >
              Contact
            </Link>
            <div className="border-t border-[#E8DDCB]/20 pt-2 mt-2">
              {user ? (
                <>
                  <div className="px-4 py-2 mb-2">
                    <p className="text-[#E8DDCB] font-semibold text-sm">{user.fullName || user.username}</p>
                    <p className="text-[#E8DDCB]/70 text-xs">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[#E8DDCB] hover:bg-[#E8DDCB]/20 rounded transition-colors"
                  >
                    <UserCircle className="w-5 h-5" />
                    <span>โปรไฟล์ของฉัน</span>
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[#E8DDCB] hover:bg-[#E8DDCB]/20 rounded transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span>แดชบอร์ด Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>ออกจากระบบ</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-3 text-[#E8DDCB] hover:bg-[#E8DDCB]/20 rounded transition-colors text-center font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-3 bg-[#E8DDCB] text-[#4A3728] rounded transition-colors text-center font-medium hover:opacity-90"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
            {pendingOrdersCount > 0 && (
              <div className="px-4 py-2 mt-2 border-t border-[#E8DDCB]/20">
                <Link
                  href="/orders"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span>คำสั่งซื้อที่รอ ({pendingOrdersCount})</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
