"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMyOrders, getGuestOrdersByPhoneNumber, getOrderById, getGuestOrderById, type Order } from "@/lib/api";
import { getGuestOrders, type GuestOrder } from "@/lib/guestCart";
import { Package, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams?.get("orderId");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [guestOrders, setGuestOrders] = useState<GuestOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {}
  }, []);

  useEffect(() => {
    if (loadingRef.current) return; // Prevent multiple simultaneous calls
    
    // Load user first
    const stored = localStorage.getItem("auth_user");
    const currentUser = stored ? JSON.parse(stored) : null;
    setUser(currentUser);

    // Then load order/orders based on orderIdParam
    if (orderIdParam) {
      const orderId = Number(orderIdParam);
      if (!isNaN(orderId) && orderId > 0) {
        loadSingleOrder(orderId);
      }
    } else {
      loadOrders();
    }
    
    // Cleanup function to reset loading flag when orderIdParam changes
    return () => {
      loadingRef.current = false;
    };
  }, [orderIdParam]);

  async function loadSingleOrder(orderId: number) {
    if (loadingRef.current) return; // Prevent multiple simultaneous calls
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      // Get user state from localStorage directly to avoid stale closure
      const stored = localStorage.getItem("auth_user");
      const currentUser = stored ? JSON.parse(stored) : null;
      
      if (currentUser) {
        const res = await getOrderById(orderId);
        setSelectedOrder(res.data || null);
      } else {
        const res = await getGuestOrderById(orderId);
        setSelectedOrder(res.data || null);
      }
    } catch (err) {
      console.error("Failed to load order:", err);
      setSelectedOrder(null);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  async function loadOrders() {
    try {
      setLoading(true);
      if (user) {
        const res = await getMyOrders();
        setOrders(res.data || []);
        setGuestOrders([]);
      } else {
        // สำหรับ guest users: ลองดึงจาก localStorage ก่อน (order IDs)
        const guestOrderIds = JSON.parse(localStorage.getItem("guest_order_ids") || "[]");
        const phoneNumber = localStorage.getItem("guest_phone_number");
        
        if (phoneNumber && guestOrderIds.length > 0) {
          try {
            // ดึง orders จาก API โดยใช้ phone number
            const res = await getGuestOrdersByPhoneNumber(phoneNumber);
            if (res.data && res.data.length > 0) {
              // แปลง Order เป็น GuestOrder format
              const guestOrders: GuestOrder[] = res.data.map(order => ({
                id: String(order.orderId || ""),
                items: order.items?.map(item => ({
                  id: String(item.id || ""),
                  type: item.type as "PREDEFINED" | "CUSTOM",
                  cupSizeId: 0, // ไม่มีใน response
                  cupSizeName: item.cupSizeName || "",
                  quantity: item.quantity || 0,
                  predefinedDrinkId: undefined,
                  predefinedDrinkName: item.predefinedDrinkName,
                  fruits: item.fruits?.map(f => ({
                    fruitId: f.fruitId || 0,
                    fruitName: f.fruitName || "",
                    quantity: f.quantity || 0,
                    pricePerUnit: Number(f.pricePerUnit || 0),
                  })),
                  unitPrice: Number(item.unitPrice || 0),
                  totalPrice: Number(item.totalPrice || 0),
                  createdAt: new Date().toISOString(),
                })) || [],
                totalPrice: Number(order.totalPrice || 0),
                customerName: order.customerName || "",
                phoneNumber: order.phoneNumber || "",
                email: order.customerEmail,
                pickupTime: order.pickupTime || "",
                pickupTimeDisplay: order.pickupTime ? new Date(order.pickupTime).toLocaleString("th-TH") : "",
                notes: order.notes,
                paymentMethod: "cash" as const,
                status: order.status || "PENDING",
                createdAt: order.createdAt || new Date().toISOString(),
              }));
              setGuestOrders(guestOrders);
              setOrders([]);
            } else {
              // Fallback to localStorage
              const guest = getGuestOrders();
              setGuestOrders(guest);
              setOrders([]);
            }
          } catch (apiErr) {
            console.error("Failed to load guest orders from API:", apiErr);
            // Fallback to localStorage
            const guest = getGuestOrders();
            setGuestOrders(guest);
            setOrders([]);
          }
        } else {
          // Fallback to localStorage
          const guest = getGuestOrders();
          setGuestOrders(guest);
          setOrders([]);
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      if (!user) {
        const guest = getGuestOrders();
        setGuestOrders(guest);
      }
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status.toUpperCase()) {
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "CONFIRMED":
      case "PREPARING":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "READY":
        return <CheckCircle className="w-5 h-5 text-[#14433B]" />;
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5 text-[#14433B]" />;
      case "CANCELLED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
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
    return statusMap[status.toUpperCase()] || status;
  }

  if (loading) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14433B] mx-auto mb-4"></div>
          <div className="text-[#14433B] text-xl">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  // ถ้ามี orderId parameter และมี selectedOrder ให้แสดงรายละเอียด order เดียว
  if (orderIdParam && selectedOrder) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => router.push("/orders")}
              className="mb-4 text-[#14433B] hover:text-[#1a5444] font-medium flex items-center gap-2 transition-colors"
            >
              ← กลับไปรายการคำสั่งซื้อทั้งหมด
            </button>
            <h1 className="text-4xl font-bold text-[#14433B] mb-2">รายละเอียดคำสั่งซื้อ</h1>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Order Header */}
            <div className="border-b border-[#14433B]/20 pb-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-[#14433B]">
                      คำสั่งซื้อ #{String(selectedOrder.orderId).padStart(3, "0")}
                    </h2>
                    {getStatusIcon(selectedOrder.status || "PENDING")}
                  </div>
                  <p className="text-sm text-[#14433B]/70">
                    วันที่สั่ง: {new Date(selectedOrder.createdAt).toLocaleString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedOrder.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    selectedOrder.status === "CONFIRMED" || selectedOrder.status === "PREPARING" ? "bg-blue-100 text-blue-800" :
                    selectedOrder.status === "READY" ? "bg-[#14433B]/20 text-[#14433B]" :
                    selectedOrder.status === "COMPLETED" ? "bg-[#14433B]/30 text-[#14433B]" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {getStatusText(selectedOrder.status || "PENDING")}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#14433B] mb-4">รายการสินค้า</h3>
              <div className="space-y-4">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="border border-[#14433B]/10 rounded-lg p-4 bg-[#FFF6F0]/50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#14433B] text-lg">
                          {item.type === "PREDEFINED" ? item.predefinedDrinkName : "น้ำปั่นแบบกำหนดเอง"}
                        </h4>
                        <p className="text-sm text-[#14433B]/70 mt-1">
                          ขนาด: {item.cupSizeName} | จำนวน: {item.quantity} แก้ว
                        </p>
                        {item.fruits && item.fruits.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-[#14433B] mb-2 font-sans">Ingredients:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.fruits.map((fruit, idx) => (
                                <span
                                  key={idx}
                                  className="bg-[#FFF6F0] text-[#14433B] px-3 py-1 rounded-md text-sm font-medium"
                                >
                                  {fruit.fruitName} x{fruit.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-[#14433B]/70">ราคาต่อหน่วย</p>
                        <p className="font-semibold text-[#14433B]">
                          ฿{Number(item.unitPrice).toFixed(2)}
                        </p>
                        <p className="text-lg font-bold text-[#14433B] mt-2">
                          ฿{Number(item.totalPrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-[#14433B]/20 pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-[#14433B]/70">ยอดรวมทั้งสิ้น:</span>
                  <span className="text-2xl font-bold text-[#14433B]">
                    ฿{Number(selectedOrder.totalPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-t border-[#14433B]/20 pt-6 mt-6">
              <h3 className="text-xl font-semibold text-[#14433B] mb-4">ข้อมูลการติดต่อ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#14433B]/70 mb-1">เบอร์โทรติดต่อ:</p>
                  <p className="font-semibold text-[#14433B]">{selectedOrder.phoneNumber}</p>
                </div>
                {(selectedOrder as any).customerName && (
                  <div>
                    <p className="text-sm text-[#14433B]/70 mb-1">ชื่อลูกค้า:</p>
                    <p className="font-semibold text-[#14433B]">{(selectedOrder as any).customerName}</p>
                  </div>
                )}
                {(selectedOrder as any).customerEmail && (
                  <div>
                    <p className="text-sm text-[#14433B]/70 mb-1">อีเมล:</p>
                    <p className="font-semibold text-[#14433B]">{(selectedOrder as any).customerEmail}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-[#14433B]/70 mb-1">เวลารับสินค้า:</p>
                  <p className="font-semibold text-[#14433B]">
                    {new Date(selectedOrder.pickupTime).toLocaleString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {selectedOrder.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-[#14433B]/70 mb-1">หมายเหตุ:</p>
                    <p className="font-semibold text-[#14433B] bg-[#FFF6F0]/50 p-3 rounded-lg">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ถ้าไม่มี orderId parameter หรือ selectedOrder ยังโหลดไม่ได้ ให้แสดงรายการทั้งหมด
  const displayOrders = user ? orders : guestOrders;
  const allOrders = user 
    ? orders 
    : guestOrders.map(go => ({
        orderId: go.id,
        items: go.items.map(item => ({
          id: item.id,
          type: item.type,
          cupSizeId: item.cupSizeId,
          cupSizeName: item.cupSizeName,
          quantity: item.quantity,
          predefinedDrinkId: item.predefinedDrinkId,
          predefinedDrinkName: item.predefinedDrinkName,
          fruits: item.fruits?.map(f => ({
            fruitId: f.fruitId,
            fruitName: f.fruitName,
            quantity: f.quantity,
            pricePerUnit: f.pricePerUnit,
          })),
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        totalPrice: go.totalPrice,
        status: go.status,
        pickupTime: go.pickupTime,
        phoneNumber: go.phoneNumber,
        notes: go.notes,
        createdAt: go.createdAt,
        updatedAt: go.createdAt,
      }));

  // ถ้ามี orderId parameter ให้แสดงรายละเอียด order เดียว
  if (orderIdParam && !loading && selectedOrder) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => router.push("/orders")}
              className="mb-4 text-[#14433B] hover:text-[#1a5444] font-medium flex items-center gap-2 transition-colors"
            >
              ← กลับไปรายการคำสั่งซื้อทั้งหมด
            </button>
            <h1 className="text-4xl font-bold text-[#14433B] mb-2">รายละเอียดคำสั่งซื้อ</h1>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Order Header */}
            <div className="border-b border-[#14433B]/20 pb-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-[#14433B]">
                      คำสั่งซื้อ #{String(selectedOrder.orderId).padStart(3, "0")}
                    </h2>
                    {getStatusIcon(selectedOrder.status || "PENDING")}
                  </div>
                  <p className="text-sm text-[#14433B]/70">
                    วันที่สั่ง: {new Date(selectedOrder.createdAt).toLocaleString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedOrder.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    selectedOrder.status === "CONFIRMED" || selectedOrder.status === "PREPARING" ? "bg-blue-100 text-blue-800" :
                    selectedOrder.status === "READY" ? "bg-[#14433B]/20 text-[#14433B]" :
                    selectedOrder.status === "COMPLETED" ? "bg-[#14433B]/30 text-[#14433B]" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {getStatusText(selectedOrder.status || "PENDING")}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#14433B] mb-4">รายการสินค้า</h3>
              <div className="space-y-4">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="border border-[#14433B]/10 rounded-lg p-4 bg-[#FFF6F0]/50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#14433B] text-lg">
                          {item.type === "PREDEFINED" ? item.predefinedDrinkName : "น้ำปั่นแบบกำหนดเอง"}
                        </h4>
                        <p className="text-sm text-[#14433B]/70 mt-1">
                          ขนาด: {item.cupSizeName} | จำนวน: {item.quantity} แก้ว
                        </p>
                        {item.fruits && item.fruits.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-[#14433B] mb-2 font-sans">Ingredients:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.fruits.map((fruit, idx) => (
                                <span
                                  key={idx}
                                  className="bg-[#FFF6F0] text-[#14433B] px-3 py-1 rounded-md text-sm font-medium"
                                >
                                  {fruit.fruitName} x{fruit.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-[#14433B]/70">ราคาต่อหน่วย</p>
                        <p className="font-semibold text-[#14433B]">
                          ฿{Number(item.unitPrice).toFixed(2)}
                        </p>
                        <p className="text-lg font-bold text-[#14433B] mt-2">
                          ฿{Number(item.totalPrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-[#14433B]/20 pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-[#14433B]/70">ยอดรวมทั้งสิ้น:</span>
                  <span className="text-2xl font-bold text-[#14433B]">
                    ฿{Number(selectedOrder.totalPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-t border-[#14433B]/20 pt-6 mt-6">
              <h3 className="text-xl font-semibold text-[#14433B] mb-4">ข้อมูลการติดต่อ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#14433B]/70 mb-1">เบอร์โทรติดต่อ:</p>
                  <p className="font-semibold text-[#14433B]">{selectedOrder.phoneNumber}</p>
                </div>
                {selectedOrder.customerName && (
                  <div>
                    <p className="text-sm text-[#14433B]/70 mb-1">ชื่อลูกค้า:</p>
                    <p className="font-semibold text-[#14433B]">{selectedOrder.customerName}</p>
                  </div>
                )}
                {selectedOrder.customerEmail && (
                  <div>
                    <p className="text-sm text-[#14433B]/70 mb-1">อีเมล:</p>
                    <p className="font-semibold text-[#14433B]">{selectedOrder.customerEmail}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-[#14433B]/70 mb-1">เวลารับสินค้า:</p>
                  <p className="font-semibold text-[#14433B]">
                    {new Date(selectedOrder.pickupTime).toLocaleString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {selectedOrder.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-[#14433B]/70 mb-1">หมายเหตุ:</p>
                    <p className="font-semibold text-[#14433B] bg-[#FFF6F0]/50 p-3 rounded-lg">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ถ้าไม่มี orderId parameter ให้แสดงรายการทั้งหมด
  return (
    <div className="bg-[#FFF6F0] min-h-screen py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#14433B] mb-2">ประวัติการสั่งซื้อ</h1>
          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">คุณกำลังเป็น Guest User</span>
              </div>
              <p className="text-yellow-700 text-sm">
                ประวัติการสั่งซื้อถูกเก็บในเบราว์เซอร์ของคุณ เข้าสู่ระบบเพื่อรับแต้มและดูประวัติแบบถาวร
              </p>
              <button
                onClick={() => router.push("/login?redirect=/orders")}
                className="mt-3 bg-[#14433B] text-white px-4 py-2 rounded-md text-sm hover:opacity-90 transition-opacity"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          )}
        </div>

        {allOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <p className="text-[#14433B] text-xl mb-6">ยังไม่มีประวัติการสั่งซื้อ</p>
            <button
              onClick={() => router.push("/build")}
              className="bg-[#14433B] text-[#FFF6F0] px-8 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
            >
              เริ่มสั่งซื้อ
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {allOrders.map((order) => (
              <div
                key={order.orderId}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-[#14433B]">
                        คำสั่งซื้อ #{String(order.orderId).replace("guest_order_", "")}
                      </h3>
                      {getStatusIcon(order.status)}
                    </div>
                    <p className="text-sm text-[#14433B]/70">
                      สั่งซื้อเมื่อ: {new Date(order.createdAt).toLocaleString("th-TH")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        order.status === "CONFIRMED" || order.status === "PREPARING" ? "bg-blue-100 text-blue-800" :
                        order.status === "READY" ? "bg-[#14433B]/20 text-[#14433B]" :
                        order.status === "COMPLETED" ? "bg-[#14433B]/30 text-[#14433B]" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-[#14433B]">
                      {Number(order.totalPrice).toFixed(2)} บาท
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#14433B]">
                            {item.type === "PREDEFINED" ? item.predefinedDrinkName : "น้ำปั่นแบบกำหนดเอง"}
                          </h4>
                          <p className="text-sm text-[#14433B]/70">
                            {item.cupSizeName} x{item.quantity}
                          </p>
                          {item.fruits && item.fruits.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-[#14433B]/60">Ingredients:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.fruits.map((fruit, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-[#C9A78B] text-[#14433B] px-2 py-1 rounded text-xs"
                                  >
                                    {fruit.fruitName} x{fruit.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#14433B]">
                            {Number(item.totalPrice).toFixed(2)} บาท
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#14433B]/70">เวลารับสินค้า:</span>
                    <span className="text-[#14433B] font-semibold">
                      {new Date(order.pickupTime).toLocaleString("th-TH")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#14433B]/70">เบอร์โทรติดต่อ:</span>
                    <span className="text-[#14433B] font-semibold">{order.phoneNumber}</span>
                  </div>
                  {order.notes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#14433B]/70">หมายเหตุ:</span>
                      <span className="text-[#14433B]">{order.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14433B] mx-auto mb-4"></div>
          <div className="text-[#14433B] text-xl">กำลังโหลด...</div>
        </div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}

