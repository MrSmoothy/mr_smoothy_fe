"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyOrders, type Order } from "@/lib/api";
import { getGuestOrders, type GuestOrder } from "@/lib/guestCart";
import { Package, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [guestOrders, setGuestOrders] = useState<GuestOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {}

    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      if (user) {
        const res = await getMyOrders();
        setOrders(res.data || []);
        setGuestOrders([]);
      } else {
        const guest = getGuestOrders();
        setGuestOrders(guest);
        setOrders([]);
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
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
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
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A2C1B] mx-auto mb-4"></div>
          <div className="text-[#4A2C1B] text-xl">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="bg-[#F5EFE6] min-h-screen py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#4A2C1B] mb-2">ประวัติการสั่งซื้อ</h1>
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
                className="mt-3 bg-[#4A2C1B] text-white px-4 py-2 rounded-md text-sm hover:opacity-90 transition-opacity"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          )}
        </div>

        {allOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <p className="text-[#4A2C1B] text-xl mb-6">ยังไม่มีประวัติการสั่งซื้อ</p>
            <button
              onClick={() => router.push("/build")}
              className="bg-[#4A2C1B] text-[#F5EFE6] px-8 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
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
                      <h3 className="text-xl font-bold text-[#4A2C1B]">
                        คำสั่งซื้อ #{String(order.orderId).replace("guest_order_", "")}
                      </h3>
                      {getStatusIcon(order.status)}
                    </div>
                    <p className="text-sm text-[#4A2C1B]/70">
                      สั่งซื้อเมื่อ: {new Date(order.createdAt).toLocaleString("th-TH")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        order.status === "CONFIRMED" || order.status === "PREPARING" ? "bg-blue-100 text-blue-800" :
                        order.status === "READY" ? "bg-green-100 text-green-800" :
                        order.status === "COMPLETED" ? "bg-green-200 text-green-900" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-[#4A2C1B]">
                      {Number(order.totalPrice).toFixed(2)} บาท
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#4A2C1B]">
                            {item.type === "PREDEFINED" ? item.predefinedDrinkName : "น้ำปั่นแบบกำหนดเอง"}
                          </h4>
                          <p className="text-sm text-[#4A2C1B]/70">
                            {item.cupSizeName} x{item.quantity}
                          </p>
                          {item.fruits && item.fruits.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-[#4A2C1B]/60">ส่วนผสม:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
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
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#4A2C1B]">
                            {Number(item.totalPrice).toFixed(2)} บาท
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A2C1B]/70">เวลารับสินค้า:</span>
                    <span className="text-[#4A2C1B] font-semibold">
                      {new Date(order.pickupTime).toLocaleString("th-TH")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A2C1B]/70">เบอร์โทรติดต่อ:</span>
                    <span className="text-[#4A2C1B] font-semibold">{order.phoneNumber}</span>
                  </div>
                  {order.notes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#4A2C1B]/70">หมายเหตุ:</span>
                      <span className="text-[#4A2C1B]">{order.notes}</span>
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

