"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart, createOrder, type Cart, type OrderCreateRequest } from "@/lib/api";
import { CreditCard, MapPin, Clock, CheckCircle } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    pickupTime: "",
    pickupTimeDisplay: "", // สำหรับแสดงใน input datetime-local
    phoneNumber: "",
    notes: "",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      const user = stored ? JSON.parse(stored) : null;
      
      if (!user) {
        // Guest user - redirect to payment page
        router.push("/payment");
        return;
      }
    } catch {}
    
    loadCart();
  }, [router]);

  async function loadCart() {
    try {
      setLoading(true);
      const res = await getCart();
      setCart(res.data || null);
      if (!res.data || !res.data.items || res.data.items.length === 0) {
        router.push("/cart");
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
      router.push("/cart");
    } finally {
      setLoading(false);
    }
  }

  async function handlePlaceOrder() {
    if (!formData.pickupTime || !formData.phoneNumber) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setSubmitting(true);
      const orderRequest: OrderCreateRequest = {
        pickupTime: formData.pickupTime,
        phoneNumber: formData.phoneNumber,
        notes: formData.notes || undefined,
      };
      
      await createOrder(orderRequest);
      window.dispatchEvent(new Event("cartUpdated"));
      
      setOrderPlaced(true);
    } catch (err: any) {
      alert(err.message || "ไม่สามารถสั่งซื้อได้");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="text-[#4A2C1B] text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-[#4A2C1B] mb-4">สั่งซื้อสำเร็จ!</h2>
          <p className="text-[#4A2C1B]/70 mb-6">
            คำสั่งซื้อของคุณได้รับการยืนยันแล้ว กรุณามารับสินค้าที่ร้านตามเวลาที่กำหนด
          </p>
          <div className="bg-[#C9A78B]/30 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-[#4A2C1B]/70 mb-2">เวลารับสินค้า:</p>
            <p className="font-semibold text-[#4A2C1B]">{formData.pickupTime}</p>
            <p className="text-sm text-[#4A2C1B]/70 mt-4 mb-2">เบอร์โทรติดต่อ:</p>
            <p className="font-semibold text-[#4A2C1B]">{formData.phoneNumber}</p>
          </div>
          <button
            onClick={() => router.push("/menu")}
            className="w-full bg-[#4A2C1B] text-[#F5EFE6] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
          >
            กลับไปหน้าเมนู
          </button>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#4A2C1B] text-xl mb-4">ตะกร้าของคุณว่างอยู่</p>
          <button
            onClick={() => router.push("/menu")}
            className="bg-[#4A2C1B] text-[#F5EFE6] px-6 py-2 rounded-md"
          >
            ไปเลือกเมนู
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5EFE6] min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl font-bold text-[#4A2C1B] mb-8">ยืนยันคำสั่งซื้อ</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-[#4A2C1B] mb-4">รายการสินค้า</h2>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#4A2C1B]">
                          {item.type === "PREDEFINED" ? item.predefinedDrinkName : "น้ำปั่นแบบกำหนดเอง"}
                        </h3>
                        <p className="text-sm text-[#4A2C1B]/70">ขนาด: {item.cupSizeName}</p>
                        <p className="text-sm text-[#4A2C1B]/70">จำนวน: {item.quantity}</p>
                        {item.fruits && item.fruits.length > 0 && (
                          <div className="mt-2">
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
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-[#4A2C1B] mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                ข้อมูลการรับสินค้า
              </h2>
              <div className="space-y-4">
                  <div>
                  <label className="block text-[#4A2C1B] font-semibold mb-2">
                    เวลารับสินค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.pickupTimeDisplay}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Convert to ISO string format for API (backend expects ISO format)
                      const isoString = value ? new Date(value).toISOString() : "";
                      setFormData({ 
                        ...formData, 
                        pickupTime: isoString,
                        pickupTimeDisplay: value
                      });
                    }}
                    className="w-full rounded-md border border-[#4A2C1B]/30 px-4 py-3 text-[#4A2C1B] outline-none focus:ring-2 focus:ring-[#4A2C1B]/50"
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-sm text-[#4A2C1B]/60 mt-1">
                    กรุณาเลือกเวลาที่ต้องการมารับสินค้า (ขั้นต่ำ 30 นาทีจากปัจจุบัน)
                  </p>
                </div>

                <div>
                  <label className="block text-[#4A2C1B] font-semibold mb-2">
                    เบอร์โทรติดต่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="08X-XXX-XXXX"
                    className="w-full rounded-md border border-[#4A2C1B]/30 px-4 py-3 text-[#4A2C1B] outline-none focus:ring-2 focus:ring-[#4A2C1B]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#4A2C1B] font-semibold mb-2">
                    หมายเหตุเพิ่มเติม (ไม่บังคับ)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="เช่น ไม่ใส่น้ำตาล, ต้องการน้ำแข็งมาก"
                    rows={3}
                    className="w-full rounded-md border border-[#4A2C1B]/30 px-4 py-3 text-[#4A2C1B] outline-none focus:ring-2 focus:ring-[#4A2C1B]/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#4A2C1B] rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-[#F5EFE6] mb-4">สรุปคำสั่งซื้อ</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[#F5EFE6]">
                  <span>ยอดรวมสินค้า:</span>
                  <span>{Number(cart.totalPrice || 0).toFixed(2)} บาท</span>
                </div>
                <div className="flex justify-between text-[#F5EFE6]">
                  <span>ค่าจัดส่ง:</span>
                  <span className="text-green-400">ฟรี (รับที่ร้าน)</span>
                </div>
                <div className="border-t border-[#F5EFE6]/20 pt-3 mt-3">
                  <div className="flex justify-between text-[#F5EFE6] text-xl font-bold">
                    <span>รวมทั้งสิ้น:</span>
                    <span>{Number(cart.totalPrice || 0).toFixed(2)} บาท</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F5EFE6]/10 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-[#F5EFE6] mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">วิธีการรับสินค้า</span>
                </div>
                <p className="text-sm text-[#F5EFE6]/80">
                  มารับสินค้าที่ร้านตามเวลาที่กำหนด
                </p>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting || !formData.pickupTime || !formData.phoneNumber}
                className="w-full bg-black text-[#F5EFE6] py-4 rounded-md font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                {submitting ? "กำลังดำเนินการ..." : "ยืนยันการสั่งซื้อ"}
              </button>

              <button
                onClick={() => router.back()}
                className="w-full mt-3 bg-[#F5EFE6]/20 text-[#F5EFE6] py-3 rounded-md font-medium hover:bg-[#F5EFE6]/30 transition-colors"
              >
                ย้อนกลับ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

