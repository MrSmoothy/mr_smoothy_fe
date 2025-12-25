"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCart, removeFromCart, clearCart, getMyOrders, getGuestOrdersByPhoneNumber, type Cart, type Order } from "@/lib/api";
import { getGuestCart, removeFromGuestCart, clearGuestCart, type GuestCart } from "@/lib/guestCart";
import { getImageUrl } from "@/lib/image";
import { Trash2, ShoppingBag, AlertCircle, RefreshCw, Package, Clock, CheckCircle, XCircle } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCart | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
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
    // Load cart and orders when user state changes
    if (user) {
      loadCart();
      loadPendingOrders();
    } else {
      loadGuestCart();
      loadGuestPendingOrders();
    }
  }, [user]);

  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Listen for cart and order updates
    const handleCartUpdate = () => {
      // Clear existing timeout to prevent multiple calls
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
      
      // Delay to ensure API has processed the update
      reloadTimeoutRef.current = setTimeout(() => {
        if (user) {
          loadCart();
          loadPendingOrders();
        } else {
          loadGuestCart();
          loadGuestPendingOrders();
        }
      }, 500);
    };
    
    const handleOrderUpdate = () => {
      if (user) {
        loadPendingOrders();
      } else {
        loadGuestPendingOrders();
      }
    };
    
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("orderUpdated", handleOrderUpdate);
    
    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("orderUpdated", handleOrderUpdate);
    };
  }, [user]);

  async function loadCart() {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setCart({ cartId: 0, items: [], totalPrice: 0 });
        return;
      }
      const res = await getCart();
      if (res.data) {
        // Ensure items array exists
        if (res.data.items && Array.isArray(res.data.items)) {
          setCart(res.data);
        } else {
          setCart({ 
            cartId: res.data.cartId || 0, 
            items: [], 
            totalPrice: res.data.totalPrice || 0 
          });
        }
      } else {
        setCart({ cartId: 0, items: [], totalPrice: 0 });
      }
    } catch (err: any) {
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
      setGuestCart(cart);
    } catch (err) {
      setGuestCart({ items: [], totalPrice: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingOrders() {
    try {
      const res = await getMyOrders();
      const pending = (res.data || []).filter(
        (order: Order) => order.status && order.status !== "COMPLETED" && order.status !== "CANCELLED"
      );
      setPendingOrders(pending);
    } catch (err) {
      console.error("Failed to load pending orders:", err);
      setPendingOrders([]);
    }
  }

  async function loadGuestPendingOrders() {
    try {
      const phoneNumber = localStorage.getItem("guest_phone_number");
      if (phoneNumber) {
        const res = await getGuestOrdersByPhoneNumber(phoneNumber);
        const pending = (res.data || []).filter(
          (order: Order) => order.status && order.status !== "COMPLETED" && order.status !== "CANCELLED"
        );
        setPendingOrders(pending);
      } else {
        setPendingOrders([]);
      }
    } catch (err) {
      setPendingOrders([]);
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
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-[#14433B] text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  const displayCart = user ? cart : guestCart;
  const items = user 
    ? (cart?.items || []) 
    : (guestCart?.items || []);


  function getStatusIcon(status: string) {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "CONFIRMED":
      case "PREPARING":
        return <Package className="w-4 h-4 text-blue-500" />;
      case "READY":
        return <CheckCircle className="w-4 h-4 text-[#14433B]" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  }

  function getStatusText(status: string) {
    const statusMap: Record<string, string> = {
      PENDING: "รอการยืนยัน",
      CONFIRMED: "ยืนยันแล้ว",
      PREPARING: "กำลังเตรียม",
      READY: "พร้อมรับ",
      COMPLETED: "รับแล้ว",
      CANCELLED: "ยกเลิก",
    };
    return statusMap[status?.toUpperCase() || ""] || status;
  }

  function formatDateTime(dateString?: string) {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  }

  if (!loading && items.length === 0 && pendingOrders.length === 0) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-bold text-[#14433B] mb-8">ตะกร้าสินค้า</h1>
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
                className="mt-3 bg-[#14433B] text-white px-4 py-2 rounded-md text-sm hover:opacity-90 transition-opacity"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <p className="text-[#14433B] text-xl mb-6">ตะกร้าของคุณยังว่างอยู่</p>
            <button
              onClick={() => router.push("/build")}
              className="bg-[#14433B] text-[#FFF6F0] px-8 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
            >
              ไปสร้าง Smoothy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF6F0] min-h-screen py-6 sm:py-8 md:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Pending Orders Section */}
        {pendingOrders.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-[#14433B] font-sans">คำสั่งซื้อที่กำลังดำเนินการ</h2>
              </div>
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div
                    key={order.orderId}
                    className="border border-[#14433B]/20 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-600 font-semibold font-sans">
                            #{String(order.orderId).padStart(3, "0")}
                          </span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status || "PENDING")}
                            <span className="text-sm font-medium text-[#14433B] font-sans">
                              {getStatusText(order.status || "PENDING")}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-[#14433B]/70 font-sans">
                          เวลารับ: {order.pickupTime ? formatDateTime(order.pickupTime) : "-"}
                        </p>
                        {order.customerName && (
                          <p className="text-sm text-[#14433B]/70 font-sans">
                            ชื่อ: {order.customerName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#14433B] font-sans">
                          ฿{Number(order.totalPrice || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-[#14433B]/60 font-sans">
                          {order.items?.length || 0} รายการ
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#14433B]/10">
                      <p className="text-xs text-[#14433B]/60 font-sans mb-2">รายการสินค้า:</p>
                      <div className="space-y-1">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="text-sm text-[#14433B]/80 font-sans">
                            • {item.predefinedDrinkName || "น้ำปั่นแบบกำหนดเอง"} x{item.quantity} ({item.cupSizeName})
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <p className="text-xs text-[#14433B]/60 font-sans">
                            และอีก {order.items.length - 3} รายการ...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Link
                        href={`/orders?orderId=${order.orderId}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm inline-block"
                      >
                        ดูรายละเอียด →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#14433B]">ตะกร้าสินค้า</h1>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-yellow-800">
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
              className="text-[#14433B] hover:text-[#1a5444] font-medium flex items-center gap-2 disabled:opacity-50"
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

        {items.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="space-y-4 sm:space-y-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-[#14433B]/20 pb-4 sm:pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {item.type === "PREDEFINED" && item.predefinedDrinkImageUrl ? (
                          <img
                            src={getImageUrl(item.predefinedDrinkImageUrl)}
                            alt={item.predefinedDrinkName || "น้ำปั่น"}
                            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-cover rounded-lg border border-[#14433B]/20 shadow-sm"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#FFF6F0] to-[#D4C5B0] rounded-lg border border-[#14433B]/20 flex items-center justify-center shadow-sm ${item.type === "PREDEFINED" && item.predefinedDrinkImageUrl ? "hidden" : ""}`}>
                          <span className="text-2xl sm:text-3xl md:text-4xl">🥤</span>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-[#14433B] mb-1 sm:mb-2 font-serif">
                          {item.type === "PREDEFINED" ? item.predefinedDrinkName : "น้ำปั่นแบบกำหนดเอง"}
                        </h3>
                        <div className="space-y-1 mb-3">
                          <p className="text-[#14433B]/70 font-sans">ขนาด: {item.cupSizeName}</p>
                          <p className="text-[#14433B]/70 font-sans">จำนวน: {item.quantity} แก้ว</p>
                          {item.fruits && item.fruits.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-[#14433B]/60 mb-1 font-sans">ส่วนผสม:</p>
                              <div className="flex flex-wrap gap-2">
                                {item.fruits.map((fruit, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-[#FFF6F0] text-[#14433B] px-2 py-1 rounded text-xs font-sans"
                                  >
                                    {fruit.fruitName} x{fruit.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xl font-bold text-[#14433B] font-serif">
                          {Number(item.totalPrice).toFixed(2)} บาท
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={removing === item.id}
                        className="flex-shrink-0 text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="ลบสินค้า"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#14433B] rounded-lg shadow-md p-4 sm:p-6 mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-[#FFF6F0]">ยอดรวม</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#FFF6F0]">
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
                className="w-full bg-black text-[#FFF6F0] py-3 sm:py-4 rounded-md font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity"
              >
                ดำเนินการสั่งซื้อ
              </button>
            </div>
          </>
        )}
      </div>
      
      {items.length === 0 && pendingOrders.length > 0 && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#14433B] mb-2 font-sans">ไม่มีสินค้าในตะกร้า</h3>
            <p className="text-[#14433B]/70 mb-6 font-sans">
              คุณมีคำสั่งซื้อที่กำลังดำเนินการอยู่ {pendingOrders.length} รายการ
            </p>
            <button
              onClick={() => router.push("/orders")}
              className="bg-[#14433B] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity font-sans"
            >
              ดูคำสั่งซื้อทั้งหมด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

