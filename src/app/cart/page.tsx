"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart, removeFromCart, clearCart, type Cart } from "@/lib/api";
import { getGuestCart, removeFromGuestCart, clearGuestCart, type GuestCart } from "@/lib/guestCart";
import { Trash2, ShoppingBag, AlertCircle, RefreshCw } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | string | null>(null);
  const [user, setUser] = useState<any>(null);

  function loadUser() {
    try {
      const stored = localStorage.getItem("auth_user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {}
  }

  useEffect(() => {
    loadUser();
    
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
    // Load cart when user state changes
    if (user) {
      console.log("User logged in, loading cart...");
      loadCart();
    } else {
      console.log("User not logged in, loading guest cart...");
      loadGuestCart();
    }
  }, [user]);

  useEffect(() => {
    // Listen for cart updates
    const handleCartUpdate = () => {
      console.log("Cart updated event received, user:", user);
      // Delay to ensure API has processed the update
      setTimeout(() => {
        if (user) {
          console.log("Reloading cart after update...");
          loadCart();
        } else {
          console.log("Reloading guest cart after update...");
          loadGuestCart();
        }
      }, 800);
    };
    
    // Also reload when page gains focus (user might have added items in another tab)
    const handleFocus = () => {
      console.log("Page focused, reloading cart...");
      if (user) {
        loadCart();
      } else {
        loadGuestCart();
      }
    };
    
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

  async function loadCart() {
    try {
      setLoading(true);
      console.log("Loading cart for logged in user...");
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.log("No auth token found");
        setCart({ cartId: 0, items: [], totalPrice: 0 });
        return;
      }
      const res = await getCart();
      console.log("Cart API response:", res);
      console.log("Cart data:", res.data);
      if (res.data) {
        // Ensure items array exists
        if (res.data.items && Array.isArray(res.data.items)) {
          console.log("Cart items:", res.data.items.length, res.data.items);
          setCart(res.data);
        } else {
          console.log("Cart has no items array, setting empty cart");
          setCart({ 
            cartId: res.data.cartId || 0, 
            items: [], 
            totalPrice: res.data.totalPrice || 0 
          });
        }
      } else {
        console.log("No cart data in response");
        setCart({ cartId: 0, items: [], totalPrice: 0 });
      }
    } catch (err: any) {
      console.error("Failed to load cart:", err);
      console.error("Error details:", err.message, err.stack);
      // If cart is empty or error, set empty cart
      setCart({ cartId: 0, items: [], totalPrice: 0 });
    } finally {
      setLoading(false);
    }
  }

  function loadGuestCart() {
    try {
      setLoading(true);
      const cart = getGuestCart();
      console.log("Guest cart loaded:", cart);
      setGuestCart(cart);
    } catch (err) {
      console.error("Failed to load guest cart:", err);
      setGuestCart({ items: [], totalPrice: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveItem(itemId: number | string) {
    try {
      setRemoving(itemId);
      if (user) {
        await removeFromCart(itemId as number);
        await loadCart();
      } else {
        removeFromGuestCart(itemId as string);
        loadGuestCart();
      }
      // Notify header to refresh cart count
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err: any) {
      alert(err.message || "ไม่สามารถลบสินค้าได้");
    } finally {
      setRemoving(null);
    }
  }

  async function handleClearCart() {
    if (!confirm("คุณต้องการลบสินค้าทั้งหมดออกจากตะกร้าหรือไม่?")) return;
    try {
      if (user) {
        await clearCart();
        await loadCart();
      } else {
        clearGuestCart();
        loadGuestCart();
      }
      // Notify header to refresh cart count
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err: any) {
      alert(err.message || "ไม่สามารถล้างตะกร้าได้");
    }
  }

  if (loading) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="text-[#4A2C1B] text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  const displayCart = user ? cart : guestCart;
  const items = user 
    ? (cart?.items || []) 
    : (guestCart?.items || []);

  console.log("Cart Page Render:", { user, cart, guestCart, items: items.length });

  if (!loading && items.length === 0) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-bold text-[#4A2C1B] mb-8">ตะกร้าสินค้า</h1>
          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">คุณกำลังเป็น Guest User</span>
              </div>
              <p className="text-yellow-700 text-sm mt-2">
                ข้อมูลตะกร้าถูกเก็บในเบราว์เซอร์ของคุณ เข้าสู่ระบบเพื่อรับแต้มและสิทธิพิเศษ
              </p>
              <button
                onClick={() => router.push("/login?redirect=/cart")}
                className="mt-3 bg-[#4A2C1B] text-white px-4 py-2 rounded-md text-sm hover:opacity-90 transition-opacity"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <p className="text-[#4A2C1B] text-xl mb-6">ตะกร้าของคุณยังว่างอยู่</p>
            <button
              onClick={() => router.push("/build")}
              className="bg-[#4A2C1B] text-[#F5EFE6] px-8 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
            >
              ไปสร้าง Smoothy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5EFE6] min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-[#4A2C1B]">ตะกร้าสินค้า</h1>
          <div className="flex items-center gap-4">
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800">
                💡 Guest User - เข้าสู่ระบบเพื่อรับแต้ม
              </div>
            )}
            <button
              onClick={() => {
                if (user) {
                  loadCart();
                } else {
                  loadGuestCart();
                }
              }}
              disabled={loading}
              className="text-[#4A2C1B] hover:text-[#5A3C2B] font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                ล้างตะกร้า
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#4A2C1B] mb-2">
                      {item.type === "PREDEFINED" ? item.predefinedDrinkName : "น้ำปั่นแบบกำหนดเอง"}
                    </h3>
                    <p className="text-[#4A2C1B]/70 mb-2">ขนาด: {item.cupSizeName}</p>
                    <p className="text-[#4A2C1B]/70 mb-2">จำนวน: {item.quantity}</p>
                    {item.fruits && item.fruits.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm text-[#4A2C1B]/60 mb-1">ส่วนผสม:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.fruits.map((fruit, idx) => (
                            <span
                              key={idx}
                              className="bg-[#C9A78B] text-[#4A2C1B] px-2 py-1 rounded text-xs"
                            >
                              {fruit.fruitName} x{fruit.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-lg font-bold text-[#4A2C1B]">
                      {Number(item.totalPrice).toFixed(2)} บาท
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={removing === item.id}
                    className="ml-4 text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#4A2C1B] rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-2xl font-bold text-[#F5EFE6]">ยอดรวม</span>
            <span className="text-3xl font-bold text-[#F5EFE6]">
              {Number(displayCart?.totalPrice || 0).toFixed(2)} บาท
            </span>
          </div>
          <button
            onClick={() => {
              if (user) {
                router.push("/checkout");
              } else {
                router.push("/payment");
              }
            }}
            className="w-full bg-black text-[#F5EFE6] py-4 rounded-md font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            ดำเนินการสั่งซื้อ
          </button>
        </div>
      </div>
    </div>
  );
}

