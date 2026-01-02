"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart, createOrder, type Cart, type OrderCreateRequest } from "@/lib/api";
import { CreditCard, MapPin, Clock, CheckCircle, Package, XCircle, Eye } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderResponse, setOrderResponse] = useState<any>(null);
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
      alert("Please fill in all required fields");
      return;
    }
    
    // ตรวจสอบเบอร์โทรต้องครบ 10 หลัก
    if (formData.phoneNumber.length !== 10) {
      alert("Please enter a 10-digit phone number");
      return;
    }

    try {
      setSubmitting(true);
      
      // สร้าง order request
      // pickupTime จะถูกแปลง format ใน createOrder function
      const orderRequest: OrderCreateRequest = {
        pickupTime: formData.pickupTime,
        phoneNumber: formData.phoneNumber,
        notes: formData.notes || undefined,
      };
      
      const response = await createOrder(orderRequest);
      
      // เก็บ order response
      if (response.data) {
        setOrderResponse(response.data);
      }
      
      window.dispatchEvent(new Event("cartUpdated"));
      window.dispatchEvent(new Event("orderUpdated"));
      
      setOrderPlaced(true);
    } catch (err: any) {
      alert(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-[#14433B] text-xl">Loading...</div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-[#14433B] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-[#14433B] mb-4">Order Confirmed!</h2>
          <p className="text-[#14433B]/70 mb-6">
          Your order is confirmed. Please collect it at the store at the designated time.
          </p>
          <div className="bg-[#C9A78B]/30 rounded-lg p-4 mb-6 text-left space-y-3">
            {orderResponse?.orderId && (
              <div>
                <p className="text-sm text-[#14433B]/70 mb-1">Order Number:</p>
                <p className="font-semibold text-[#14433B]">#{String(orderResponse.orderId).padStart(3, "0")}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-[#14433B]/70 mb-1">Order Status:</p>
              <div className="flex items-center gap-2">
                {orderResponse?.status ? (
                  <>
                    {orderResponse.status === "PENDING" && <Clock className="w-5 h-5 text-yellow-500" />}
                    {orderResponse.status === "CONFIRMED" && <Package className="w-5 h-5 text-blue-500" />}
                    {orderResponse.status === "PREPARING" && <Package className="w-5 h-5 text-blue-500" />}
                    {orderResponse.status === "READY" && <CheckCircle className="w-5 h-5 text-[#14433B]" />}
                    {orderResponse.status === "COMPLETED" && <CheckCircle className="w-5 h-5 text-[#14433B]" />}
                    {orderResponse.status === "CANCELLED" && <XCircle className="w-5 h-5 text-red-500" />}
                    <span className="font-semibold text-[#14433B]">
                      {orderResponse.status === "PENDING" ? "Pending Confirmation" :
                       orderResponse.status === "CONFIRMED" ? "Confirmed" :
                       orderResponse.status === "PREPARING" ? "Preparing" :
                       orderResponse.status === "READY" ? "Ready" :
                       orderResponse.status === "COMPLETED" ? "Completed" :
                       orderResponse.status === "CANCELLED" ? "Cancelled" : orderResponse.status}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-[#14433B]">Pending Confirmation</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-[#14433B]/70 mb-1">Pickup Time:</p>
              <p className="font-semibold text-[#14433B]">{formData.pickupTimeDisplay || formData.pickupTime}</p>
            </div>
            <div>
              <p className="text-sm text-[#14433B]/70 mb-1">Contact Number:</p>
              <p className="font-semibold text-[#14433B]">{formData.phoneNumber}</p>
            </div>
            {orderResponse?.totalPrice && (
              <div>
                <p className="text-sm text-[#14433B]/70 mb-1">Total Price:</p>
                <p className="font-semibold text-[#14433B] text-lg">
                  {Number(orderResponse.totalPrice).toFixed(2)} THB
                </p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/cart")}
              className="w-full bg-[#14433B] text-[#FFF6F0] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              View All Orders
            </button>
            <button
              onClick={() => router.push("/menu")}
              className="w-full bg-[#C9A78B] text-[#14433B] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#14433B] text-xl mb-4">Your cart is empty</p>
          <button
            onClick={() => router.push("/menu")}
            className="bg-[#14433B] text-[#FFF6F0] px-6 py-2 rounded-md"
          >
            Go to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF6F0] min-h-screen py-6 sm:py-8 md:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#14433B] mb-6 sm:mb-8">Confirm Order</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#14433B] mb-3 sm:mb-4">Order Summary</h2>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#14433B]">
                          {item.type === "PREDEFINED" ? item.predefinedDrinkName : "Custom Smoothy"}
                        </h3>
                        <p className="text-sm text-[#14433B]/70">Size: {item.cupSizeName}</p>
                        <p className="text-sm text-[#14433B]/70">Quantity: {item.quantity}</p>
                        {item.fruits && item.fruits.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-[#14433B]/60">Ingredients</p>
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
                          {Number(item.totalPrice).toFixed(2)} THB
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup Information */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#14433B] mb-3 sm:mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                Pickup Information
              </h2>
              <div className="space-y-4">
                  <div>
                  <label className="block text-[#14433B] font-semibold mb-2">
                    Pickup Time <span className="text-red-500">*</span>
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
                    Please select the pickup time (minimum 30 minutes from now and not more than 3 days)
                  </p>
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">
                    Contact Number <span className="text-red-500">*</span>
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
                      Please enter a 10-digit phone number
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. no sugar, want more ice"
                    rows={3}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#14433B] rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FFF6F0] mb-3 sm:mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[#FFF6F0]">
                  <span>Total Price:</span>
                  <span>{Number(cart.totalPrice || 0).toFixed(2)} THB</span>
                </div>
                <div className="flex justify-between text-[#FFF6F0]">
                  <span>Delivery Fee:</span>
                  <span className="text-[#14433B]/80">Free (Pick up at the store at the scheduled time)</span>
                </div>
                <div className="border-t border-[#FFF6F0]/20 pt-3 mt-3">
                  <div className="flex justify-between text-[#FFF6F0] text-xl font-bold">
                    <span>Total:</span>
                    <span>{Number(cart.totalPrice || 0).toFixed(2)} THB</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#FFF6F0]/10 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-[#FFF6F0] mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Delivery Method</span>
                </div>
                <p className="text-sm text-[#FFF6F0]/80">
                Pick up at the store at the designated time
                </p>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting || !formData.pickupTime || !formData.phoneNumber}
                className="w-full bg-black text-[#FFF6F0] py-3 sm:py-4 rounded-md font-bold text-base sm:text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                {submitting ? "Processing..." : "Confirm Order"}
              </button>

              <button
                onClick={() => router.back()}
                className="w-full mt-2 sm:mt-3 bg-[#FFF6F0]/20 text-[#FFF6F0] py-2.5 sm:py-3 rounded-md font-medium hover:bg-[#FFF6F0]/30 transition-colors text-sm sm:text-base"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

