"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getGuestCart, clearGuestCart, type GuestCart } from "@/lib/guestCart";
import { createGuestOrder, type GuestOrderCreateRequest } from "@/lib/api";
import { CreditCard, CheckCircle, AlertCircle, Lock, Shield, Clock, Package, XCircle, Eye } from "lucide-react";

export default function PaymentPage() {
  const router = useRouter();
  const [guestCart, setGuestCart] = useState<GuestCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderResponse, setOrderResponse] = useState<any>(null);
  const [formData, setFormData] = useState({
    pickupTime: "",
    pickupTimeDisplay: "",
    phoneNumber: "",
    notes: "",
    customerName: "",
    email: "",
    paymentMethod: "cash" as "cash" | "card" | "promptpay",
  });

  useEffect(() => {
    loadGuestCart();
  }, []);

  function loadGuestCart() {
    try {
      setLoading(true);
      const cart = getGuestCart();
      setGuestCart(cart);
      if (!cart || cart.items.length === 0) {
        router.push("/cart");
      }
    } catch (err) {
      console.error("Failed to load guest cart:", err);
      router.push("/cart");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    if (!formData.pickupTime || !formData.phoneNumber || !formData.customerName) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    
    // ตรวจสอบเบอร์โทรต้องครบ 10 หลัก
    if (formData.phoneNumber.length !== 10) {
      alert("กรุณากรอกเบอร์โทรให้ครบ 10 หลัก");
      return;
    }

    if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
      alert("ตะกร้าสินค้าว่าง");
      return;
    }

    try {
      setSubmitting(true);

      // แปลง guest cart items เป็น API request format
      const orderItems: GuestOrderCreateRequest["items"] = guestCart.items.map(item => ({
        type: item.type,
        cupSizeId: item.cupSizeId,
        quantity: item.quantity,
        predefinedDrinkId: item.predefinedDrinkId,
        fruits: item.fruits?.map(f => ({
          fruitId: f.fruitId,
          quantity: f.quantity,
        })),
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }));

      // สร้าง guest order request
      // pickupTime จะถูกแปลง format ใน createGuestOrder function
      const orderRequest: GuestOrderCreateRequest = {
        pickupTime: formData.pickupTime,
        phoneNumber: formData.phoneNumber,
        customerName: formData.customerName,
        customerEmail: formData.email || undefined,
        notes: formData.notes || undefined,
        items: orderItems,
      };

      // ส่ง order ไปยัง backend
      const response = await createGuestOrder(orderRequest);
      
      // เก็บ order response
      if (response.data) {
        setOrderResponse(response.data);
        
        // เก็บ order ID และ phone number ไว้ใน localStorage สำหรับ guest users
        const guestOrderIds = JSON.parse(localStorage.getItem("guest_order_ids") || "[]");
        if (response.data.orderId && !guestOrderIds.includes(response.data.orderId)) {
          guestOrderIds.push(response.data.orderId);
          localStorage.setItem("guest_order_ids", JSON.stringify(guestOrderIds));
        }
        // เก็บ phone number เพื่อใช้ดึง orders จาก API
        if (formData.phoneNumber) {
          localStorage.setItem("guest_phone_number", formData.phoneNumber);
        }
      }

      // ล้าง guest cart
      clearGuestCart();
      window.dispatchEvent(new Event("cartUpdated"));
      window.dispatchEvent(new Event("orderUpdated"));

      setPaymentSuccess(true);
    } catch (err: any) {
      console.error("Payment error:", err);
      alert("เกิดข้อผิดพลาดในการชำระเงิน: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
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

  if (paymentSuccess) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-scaleIn">
          <CheckCircle className="w-20 h-20 text-[#14433B] mx-auto mb-6 animate-bounce" />
          <h2 className="text-3xl font-bold text-[#14433B] mb-4">ชำระเงินสำเร็จ!</h2>
          <p className="text-[#14433B]/70 mb-6">
            คำสั่งซื้อของคุณได้รับการยืนยันแล้ว กรุณามารับสินค้าที่ร้านตามเวลาที่กำหนด
          </p>
          
          <div className="bg-[#C9A78B]/20 rounded-lg p-4 mb-6 text-left space-y-2">
            {orderResponse?.orderId && (
              <div>
                <p className="text-sm text-[#14433B]/70">หมายเลขคำสั่งซื้อ:</p>
                <p className="font-semibold text-[#14433B]">#{String(orderResponse.orderId).padStart(3, "0")}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-[#14433B]/70">สถานะคำสั่งซื้อ:</p>
              <div className="flex items-center gap-2 mt-1">
                {orderResponse?.status ? (
                  <>
                    {orderResponse.status === "PENDING" && <Clock className="w-5 h-5 text-yellow-500" />}
                    {orderResponse.status === "CONFIRMED" && <Package className="w-5 h-5 text-blue-500" />}
                    {orderResponse.status === "PREPARING" && <Package className="w-5 h-5 text-blue-500" />}
                    {orderResponse.status === "READY" && <CheckCircle className="w-5 h-5 text-[#14433B]" />}
                    {orderResponse.status === "COMPLETED" && <CheckCircle className="w-5 h-5 text-[#14433B]" />}
                    {orderResponse.status === "CANCELLED" && <XCircle className="w-5 h-5 text-red-500" />}
                    <span className="font-semibold text-[#14433B]">
                      {orderResponse.status === "PENDING" ? "รอการยืนยัน" :
                       orderResponse.status === "CONFIRMED" ? "ยืนยันแล้ว" :
                       orderResponse.status === "PREPARING" ? "กำลังเตรียม" :
                       orderResponse.status === "READY" ? "พร้อมรับ" :
                       orderResponse.status === "COMPLETED" ? "รับแล้ว" :
                       orderResponse.status === "CANCELLED" ? "ยกเลิก" : orderResponse.status}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-[#14433B]">รอการยืนยัน</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-[#14433B]/70">ชื่อลูกค้า:</p>
              <p className="font-semibold text-[#14433B]">{formData.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-[#14433B]/70">เบอร์โทรติดต่อ:</p>
              <p className="font-semibold text-[#14433B]">{formData.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm text-[#14433B]/70">เวลารับสินค้า:</p>
              <p className="font-semibold text-[#14433B]">{formData.pickupTimeDisplay}</p>
            </div>
            <div>
              <p className="text-sm text-[#14433B]/70">ยอดรวม:</p>
              <p className="font-semibold text-[#14433B] text-lg">
                {Number(orderResponse?.totalPrice || guestCart?.totalPrice || 0).toFixed(2)} บาท
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-left">
                <p className="font-semibold mb-1">💡 หมายเหตุสำหรับ Guest User</p>
                <p className="text-xs">
                  คำสั่งซื้อของคุณถูกเก็บในเบราว์เซอร์ กรุณาเข้าสู่ระบบเพื่อ:
                </p>
                <ul className="text-xs mt-1 list-disc list-inside space-y-1">
                  <li>รับแต้มสะสม</li>
                  <li>ดูประวัติการสั่งซื้อ</li>
                  <li>รับการแจ้งเตือนสถานะออเดอร์</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/cart")}
              className="w-full bg-[#14433B] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              ดูสถานะคำสั่งซื้อทั้งหมด
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/login?redirect=/orders")}
                className="flex-1 bg-[#C9A78B] text-[#14433B] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex-1 bg-[#C9A78B] text-[#14433B] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!guestCart || guestCart.items.length === 0) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#14433B] text-xl mb-4">ตะกร้าของคุณว่างอยู่</p>
          <button
            onClick={() => router.push("/cart")}
            className="bg-[#14433B] text-[#FFF6F0] px-6 py-2 rounded-md"
          >
            กลับไปตะกร้า
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF6F0] min-h-screen py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-[#14433B] mb-8 text-center">ชำระเงิน</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details & Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-[#14433B] mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                ข้อมูลลูกค้า
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="กรุณากรอกชื่อ-นามสกุล"
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">
                    เบอร์โทรติดต่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      // จำกัดให้กรอกได้แค่ตัวเลขและไม่เกิน 10 ตัว
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setFormData({ ...formData, phoneNumber: value });
                    }}
                    placeholder="08X-XXX-XXXX"
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                  {formData.phoneNumber && formData.phoneNumber.length !== 10 && (
                    <p className="text-sm text-red-500 mt-1">
                      กรุณากรอกเบอร์โทรให้ครบ 10 หลัก
                    </p>
                  )}
                  <p className="text-sm text-[#14433B]/60 mt-1">
                    ใช้สำหรับติดต่อเมื่อสินค้าพร้อม
                  </p>
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">
                    อีเมล (ไม่บังคับ)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                  />
                  <p className="text-sm text-[#14433B]/60 mt-1">
                    ใช้สำหรับส่งใบเสร็จและอัพเดทสถานะ
                  </p>
                </div>
              </div>
            </div>

            {/* Pickup Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-[#14433B] mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                ข้อมูลการรับสินค้า
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">
                    เวลารับสินค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.pickupTimeDisplay}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Convert datetime-local format (yyyy-MM-ddTHH:mm) to LocalDateTime format (yyyy-MM-ddTHH:mm:ss)
                      // datetime-local returns format like "2025-11-21T14:35" without seconds
                      const localDateTimeString = value ? `${value}:00` : "";
                      setFormData({ 
                        ...formData, 
                        pickupTime: localDateTimeString,
                        pickupTimeDisplay: value
                      });
                    }}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    required
                    min={(() => {
                      const now = new Date();
                      now.setMinutes(now.getMinutes() + 30); // ขั้นต่ำ 30 นาทีจากปัจจุบัน
                      return now.toISOString().slice(0, 16);
                    })()}
                    max={(() => {
                      const maxDate = new Date();
                      maxDate.setDate(maxDate.getDate() + 3); // ไม่เกิน 3 วัน
                      return maxDate.toISOString().slice(0, 16);
                    })()}
                  />
                  <p className="text-sm text-[#14433B]/60 mt-1">
                    กรุณาเลือกเวลาที่ต้องการมารับสินค้า (ขั้นต่ำ 30 นาทีจากปัจจุบัน และไม่เกิน 3 วัน)
                  </p>
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">
                    หมายเหตุเพิ่มเติม (ไม่บังคับ)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="เช่น ไม่ใส่น้ำตาล, ต้องการน้ำแข็งมาก"
                    rows={3}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-[#14433B] mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                วิธีการชำระเงิน
              </h2>
              <div className="space-y-3">
                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.paymentMethod === "cash"
                    ? "border-[#14433B] bg-[#C9A78B]/20"
                    : "border-[#14433B]/30 hover:border-[#14433B]/50"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === "cash"}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-[#14433B]">ชำระเงินสดที่ร้าน</div>
                    <div className="text-sm text-[#14433B]/70">จ่ายเงินเมื่อมารับสินค้า</div>
                  </div>
                </label>

                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.paymentMethod === "promptpay"
                    ? "border-[#14433B] bg-[#C9A78B]/20"
                    : "border-[#14433B]/30 hover:border-[#14433B]/50"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="promptpay"
                    checked={formData.paymentMethod === "promptpay"}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-[#14433B]">PromptPay</div>
                    <div className="text-sm text-[#14433B]/70">สแกน QR Code เพื่อชำระเงิน</div>
                  </div>
                </label>

                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.paymentMethod === "card"
                    ? "border-[#14433B] bg-[#C9A78B]/20"
                    : "border-[#14433B]/30 hover:border-[#14433B]/50"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === "card"}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-[#14433B]">บัตรเครดิต/เดบิต</div>
                    <div className="text-sm text-[#14433B]/70">ชำระเงินด้วยบัตร</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#14433B] rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-[#FFF6F0] mb-4">สรุปคำสั่งซื้อ</h2>
              
              {/* Order Items */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[#FFF6F0] mb-3">รายการสินค้า</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {guestCart.items.map((item) => (
                    <div key={item.id} className="bg-[#FFF6F0]/10 rounded-lg p-3 border border-[#FFF6F0]/20">
                      <div className="text-sm text-[#FFF6F0] font-semibold mb-1">
                        {item.type === "PREDEFINED" ? item.predefinedDrinkName : "น้ำปั่นแบบกำหนดเอง"}
                      </div>
                      <div className="text-xs text-[#FFF6F0]/80 mb-1">
                        ขนาด: {item.cupSizeName} | จำนวน: x{item.quantity}
                      </div>
                      {item.fruits && item.fruits.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-[#FFF6F0]/70 mb-1">ส่วนผสม:</div>
                          <div className="flex flex-wrap gap-1">
                            {item.fruits.map((fruit, idx) => (
                              <span
                                key={idx}
                                className="bg-[#FFF6F0]/20 text-[#FFF6F0] px-2 py-0.5 rounded text-xs"
                              >
                                {fruit.fruitName} x{fruit.quantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-[#FFF6F0] font-bold mt-2 text-right">
                        {Number(item.totalPrice).toFixed(2)} บาท
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mb-6 border-t border-[#FFF6F0]/20 pt-4">
                <div className="flex justify-between text-[#FFF6F0]">
                  <span>ยอดรวมสินค้า:</span>
                  <span>{Number(guestCart.totalPrice || 0).toFixed(2)} บาท</span>
                </div>
                <div className="flex justify-between text-[#FFF6F0]">
                  <span>ค่าจัดส่ง:</span>
                  <span className="text-[#14433B]/80">ฟรี (รับที่ร้าน)</span>
                </div>
                <div className="border-t border-[#FFF6F0]/20 pt-3 mt-3">
                  <div className="flex justify-between text-[#FFF6F0] text-xl font-bold">
                    <span>รวมทั้งสิ้น:</span>
                    <span>{Number(guestCart.totalPrice || 0).toFixed(2)} บาท</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50/10 border border-yellow-200/30 rounded-lg p-3 mb-6">
                <div className="flex items-center gap-2 text-yellow-200 text-sm mb-1">
                  <Lock className="w-4 h-4" />
                  <span className="font-semibold">ปลอดภัย 100%</span>
                </div>
                <p className="text-xs text-[#FFF6F0]/80">
                  ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย
                </p>
              </div>

              <button
                onClick={handlePayment}
                disabled={submitting || !formData.pickupTime || !formData.phoneNumber || !formData.customerName}
                className="w-full bg-black text-[#FFF6F0] py-4 rounded-md font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>กำลังดำเนินการ...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>ยืนยันการชำระเงิน</span>
                  </>
                )}
              </button>

              <button
                onClick={() => router.back()}
                className="w-full mt-3 bg-[#FFF6F0]/20 text-[#FFF6F0] py-3 rounded-md font-medium hover:bg-[#FFF6F0]/30 transition-colors"
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

