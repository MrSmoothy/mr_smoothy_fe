"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFruits, getCupSizes, addToCart, type Fruit, type CupSize, type FruitCategory } from "@/lib/api";
import { addToGuestCart, getGuestCartCount } from "@/lib/guestCart";
import SmoothyCup from "@/app/components/SmoothyCup";
import FruitSelector from "@/app/components/FruitSelector";
import { ShoppingCart, Sparkles, AlertCircle } from "lucide-react";

const MAX_FRUITS = 5;

export default function BuildPage() {
  const router = useRouter();
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [cupSizes, setCupSizes] = useState<CupSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCupSize, setSelectedCupSize] = useState<CupSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedFruits, setSelectedFruits] = useState<Map<number, { fruit: Fruit; quantity: number }>>(new Map());
  const [user, setUser] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<FruitCategory | "ALL">("ALL");

  function loadUser() {
    try {
      const stored = localStorage.getItem("auth_user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {}
  }

  useEffect(() => {
    loadUser();
    
    // Listen for auth state changes
    const handleAuthChange = () => {
      loadUser();
    };
    
    window.addEventListener("authStateChanged", handleAuthChange);
    window.addEventListener("focus", handleAuthChange);
    
    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
      window.removeEventListener("focus", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [fruitsRes, cupSizesRes] = await Promise.all([
        getFruits().catch(err => {
          return { data: [], success: false, message: err.message };
        }),
        getCupSizes().catch(err => {
          return { data: [], success: false, message: err.message };
        }),
      ]);

      const filteredFruits = Array.isArray(fruitsRes.data) 
        ? fruitsRes.data
            .filter(f => f && f.active)
            .map(f => ({
              ...f,
              // ถ้าไม่มี category ให้ตั้งเป็น FRUIT (default)
              category: (f.category || "FRUIT") as FruitCategory
            }))
        : [];
      const filteredCupSizes = Array.isArray(cupSizesRes.data) 
        ? cupSizesRes.data.filter(c => c && c.active) 
        : [];
      
      
      setFruits(filteredFruits);
      setCupSizes(filteredCupSizes);
      
      if (filteredCupSizes.length > 0) {
        setSelectedCupSize(filteredCupSizes[0]);
      }
      
      if (filteredFruits.length === 0) {
        setError("ไม่พบข้อมูลผลไม้ในระบบ กรุณาตรวจสอบ API");
      }
    } catch (err: any) {
      console.error("❌ Failed to load data:", err);
      setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
      setFruits([]);
      setCupSizes([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFruitChange(fruitId: number, delta: number) {
    setSelectedFruits(prev => {
      const newMap = new Map(prev);
      const fruit = fruits.find(f => f.id === fruitId);
      if (!fruit) {
        console.warn("Fruit not found:", fruitId);
        return newMap;
      }

      const current = newMap.get(fruitId);
      const currentQty = current?.quantity || 0;
      const newQty = Math.max(0, Math.min(MAX_FRUITS, currentQty + delta));
      
      const totalFruits = Array.from(newMap.values()).reduce((sum, item) => sum + item.quantity, 0);
      const remainingSlots = MAX_FRUITS - totalFruits + currentQty;
      
      // ตรวจสอบว่าไม่เกิน limit
      if (delta > 0 && remainingSlots <= 0) {
        return newMap; // ไม่สามารถเพิ่มได้
      }

      if (newQty === 0) {
        newMap.delete(fruitId);
      } else {
        newMap.set(fruitId, { fruit, quantity: newQty });
      }
      
      return newMap;
    });
  }

  async function handleAddToCart() {
    if (!selectedCupSize) {
      alert("กรุณาเลือกขนาดแก้ว");
      return;
    }

    const totalFruits = Array.from(selectedFruits.values()).reduce((sum, item) => sum + item.quantity, 0);
    if (totalFruits === 0) {
      alert("กรุณาเลือกผลไม้อย่างน้อย 1 ชนิด");
      return;
    }

    // ถ้าเป็น guest user ให้เก็บใน localStorage
    if (!user) {
      try {
        setAddingToCart(true);
        
        // คำนวณราคา
        const fruitsPrice = Array.from(selectedFruits.values()).reduce(
          (sum, { fruit, quantity }) => sum + Number(fruit.pricePerUnit) * quantity,
          0
        );
        const cupSizePrice = selectedCupSize.priceExtra || 0;
        const unitPrice = fruitsPrice + cupSizePrice;
        const totalPrice = unitPrice * quantity;

        // สร้าง guest cart item
        const guestItem = {
          type: "CUSTOM" as const,
          cupSizeId: selectedCupSize.id,
          cupSizeName: selectedCupSize.name,
          quantity,
          fruits: Array.from(selectedFruits.entries()).map(([fruitId, { fruit, quantity }]) => ({
            fruitId,
            fruitName: fruit.name,
            quantity,
            pricePerUnit: Number(fruit.pricePerUnit),
          })),
          unitPrice,
          totalPrice,
        };

        // เพิ่มลง guest cart
        addToGuestCart(guestItem);
        
        // Notify header to refresh cart count
        window.dispatchEvent(new Event("cartUpdated"));
        
        alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว! 🎉\n\n💡 หมายเหตุ: คุณกำลังเป็น Guest User - ข้อมูลจะถูกเก็บในเบราว์เซอร์\nเข้าสู่ระบบเพื่อรับแต้มและสิทธิพิเศษ!");
        
        // Reset form
        setQuantity(1);
        setSelectedFruits(new Map());
      } catch (err: any) {
        console.error("❌ Error adding to guest cart:", err);
        alert("ไม่สามารถเพิ่มลงตะกร้าได้: " + (err.message || "Unknown error"));
      } finally {
        setAddingToCart(false);
      }
      return;
    }

    // ถ้าเป็น logged in user ให้เพิ่มลง server cart
    try {
      setAddingToCart(true);
      const ingredients = Array.from(selectedFruits.entries()).map(([fruitId, { quantity }]) => ({
        fruitId,
        quantity,
      }));
      
      
      await addToCart({
        type: "CUSTOM",
        cupSizeId: selectedCupSize.id,
        quantity,
        ingredients,
      });
      
      // Notify header to refresh cart count
      window.dispatchEvent(new Event("cartUpdated"));
      
      alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว! 🎉");
      
      // Reset form
      setQuantity(1);
      setSelectedFruits(new Map());
    } catch (err: any) {
      console.error("❌ Error adding to cart:", err);
      if (err.message?.includes("Authentication required") || err.message?.includes("Authentication")) {
        alert("กรุณาเข้าสู่ระบบเพื่อเพิ่มลงตะกร้า");
        router.push("/login?redirect=/build");
      } else {
        alert(err.message || "ไม่สามารถเพิ่มลงตะกร้าได้");
      }
    } finally {
      setAddingToCart(false);
    }
  }

  const totalFruits = Array.from(selectedFruits.values()).reduce((sum, item) => sum + item.quantity, 0);
  const canAddToCart = selectedCupSize && totalFruits > 0;

  if (loading) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A2C1B] mx-auto mb-4"></div>
          <div className="text-[#4A2C1B] text-xl">กำลังโหลดข้อมูลผลไม้...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 text-xl font-bold mb-2">เกิดข้อผิดพลาด</div>
          <div className="text-[#4A2C1B] mb-4">{error}</div>
          <button
            onClick={loadData}
            className="bg-[#4A2C1B] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  if (fruits.length === 0) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-[#4A2C1B] text-xl font-bold mb-4">ยังไม่มีผลไม้ในระบบ</div>
          <div className="text-[#4A2C1B]/70 mb-4">
            กรุณาตรวจสอบว่า backend API ทำงานอยู่ที่ {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}
          </div>
          <button
            onClick={loadData}
            className="bg-[#4A2C1B] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            ลองโหลดอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#F5EFE6] via-[#F5EFE6] to-[#E8DDD0] min-h-screen py-4 sm:py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center animate-fadeIn">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#4A2C1B]" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#4A2C1B]">
              สร้าง Smoothy ของคุณเอง
            </h1>
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#4A2C1B]" />
          </div>
          <p className="text-[#4A2C1B]/70 text-base sm:text-lg px-4">
            เลือกส่วนผสมที่คุณชื่นชอบ สูงสุด {MAX_FRUITS} อย่าง (ผลไม้ ผัก และส่วนเสริม)
          </p>
          {!user && (
            <div className="mt-4 inline-block bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800">
              💡 คุณกำลังเป็น Guest User - สามารถเลือกผลไม้ได้ แต่อาจจะไม่ได้รับแต้มหรือสิทธิพิเศษ
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pb-24 lg:pb-0">
          {/* Left Column - Smoothy Cup */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-[#4A2C1B]/10 animate-scaleIn">
                <h2 className="text-xl sm:text-2xl font-bold text-[#4A2C1B] mb-4 sm:mb-6 text-center">
                  Smoothy ของคุณ
                </h2>
                
                <SmoothyCup
                  selectedFruits={selectedFruits}
                  maxFruits={MAX_FRUITS}
                  cupSize={selectedCupSize || undefined}
                />

                {/* Cup Size Selector */}
                {cupSizes.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <label className="block text-sm font-semibold text-[#4A2C1B]">
                      เลือกขนาดแก้ว
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {cupSizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedCupSize(size)}
                          className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                            selectedCupSize?.id === size.id
                              ? "border-[#4A2C1B] bg-[#4A2C1B] text-white shadow-lg scale-105"
                              : "border-[#4A2C1B]/30 bg-white hover:border-[#4A2C1B]/50 text-[#4A2C1B]"
                          }`}
                        >
                          <div className="font-semibold text-sm">{size.name}</div>
                          <div className="text-xs opacity-80">{size.volumeMl}ml</div>
                          {size.priceExtra > 0 && (
                            <div className="text-xs">+{size.priceExtra.toFixed(0)}฿</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mt-6 space-y-3">
                  <label className="block text-sm font-semibold text-[#4A2C1B]">
                    จำนวน
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-[#4A2C1B]/10 hover:bg-[#4A2C1B]/20 text-[#4A2C1B] font-bold transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="flex-1 text-center text-lg font-bold text-[#4A2C1B] bg-white border-2 border-[#4A2C1B]/20 rounded-lg py-2"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg bg-[#4A2C1B]/10 hover:bg-[#4A2C1B]/20 text-[#4A2C1B] font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button - Desktop */}
                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart || addingToCart}
                  className={`hidden lg:flex mt-6 w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 items-center justify-center gap-2 ${
                    canAddToCart
                      ? "bg-[#4A2C1B] text-white hover:bg-[#5A3C2B] hover:shadow-xl hover:scale-105 active:scale-95 border-2 border-[#4A2C1B]"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300"
                  }`}
                >
                  {addingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="text-white">กำลังเพิ่ม...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className={`w-5 h-5 ${canAddToCart ? "text-white" : "text-gray-500"}`} />
                      <span className={canAddToCart ? "text-white" : "text-gray-500"}>เพิ่มลงตะกร้า</span>
                    </>
                  )}
                </button>

                {/* Price Calculation */}
                {canAddToCart && (
                  <div className="mt-4 p-4 bg-[#C9A78B]/10 rounded-lg border border-[#4A2C1B]/20">
                    <div className="text-sm text-[#4A2C1B]/70 mb-2">ราคาโดยประมาณ:</div>
                    <div className="text-2xl font-bold text-[#4A2C1B]">
                      {(
                        Array.from(selectedFruits.values()).reduce(
                          (sum, { fruit, quantity }) => sum + Number(fruit.pricePerUnit) * quantity,
                          0
                        ) +
                        (selectedCupSize?.priceExtra || 0)
                      ).toFixed(2)} บาท
                    </div>
                    <div className="text-xs text-[#4A2C1B]/60 mt-1">
                      x {quantity} แก้ว
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Fruit Selector */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-[#4A2C1B]/10 animate-slideIn">
              {/* Category Filter */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-[#4A2C1B]">เลือกส่วนผสม</h3>
                  <div className="text-xs sm:text-sm text-[#4A2C1B]/70">
                    {Array.from(selectedFruits.values()).reduce((sum, item) => sum + item.quantity, 0)} / {MAX_FRUITS} ส่วนผสม
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                      selectedCategory === "ALL"
                        ? "bg-[#4A3728] text-white shadow-md"
                        : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setSelectedCategory("FRUIT")}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                      selectedCategory === "FRUIT"
                        ? "bg-[#4A3728] text-white shadow-md"
                        : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                    }`}
                  >
                    ผลไม้
                  </button>
                  <button
                    onClick={() => setSelectedCategory("VEGETABLE")}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                      selectedCategory === "VEGETABLE"
                        ? "bg-[#4A3728] text-white shadow-md"
                        : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                    }`}
                  >
                    ผัก
                  </button>
                  <button
                    onClick={() => setSelectedCategory("ADDON")}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                      selectedCategory === "ADDON"
                        ? "bg-[#4A3728] text-white shadow-md"
                        : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                    }`}
                  >
                    ส่วนเสริม
                  </button>
                </div>
              </div>
              
              {fruits.length > 0 ? (
                <FruitSelector
                  fruits={selectedCategory === "ALL" 
                    ? fruits 
                    : fruits.filter(f => {
                        // ถ้าไม่มี category ให้ถือว่าเป็น FRUIT (สำหรับข้อมูลเก่า)
                        const fruitCategory = f.category || "FRUIT";
                        return fruitCategory === selectedCategory;
                      })}
                  selectedFruits={selectedFruits}
                  maxFruits={MAX_FRUITS}
                  onFruitChange={handleFruitChange}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-[#4A2C1B]/60 text-lg mb-4">ไม่พบข้อมูลผลไม้</div>
                  <button
                    onClick={loadData}
                    className="bg-[#4A2C1B] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    ลองโหลดอีกครั้ง
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Add to Cart Button - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-[#4A2C1B]/20 shadow-lg p-4 safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-2">
            {canAddToCart && (
              <div className="flex-1">
                <div className="text-xs text-[#4A2C1B]/70">ราคาโดยประมาณ:</div>
                <div className="text-lg font-bold text-[#4A2C1B]">
                  {(
                    Array.from(selectedFruits.values()).reduce(
                      (sum, { fruit, quantity }) => sum + Number(fruit.pricePerUnit) * quantity,
                      0
                    ) +
                    (selectedCupSize?.priceExtra || 0)
                  ).toFixed(2)} บาท
                </div>
              </div>
            )}
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart || addingToCart}
              className={`flex-shrink-0 px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                canAddToCart
                  ? "bg-[#4A2C1B] text-white shadow-lg active:scale-95 border-2 border-[#4A2C1B] hover:bg-[#5A3C2B]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300"
              }`}
            >
              {addingToCart ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm text-white">กำลังเพิ่ม...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className={`w-5 h-5 ${canAddToCart ? "text-white" : "text-gray-500"}`} />
                  <span className={canAddToCart ? "text-white" : "text-gray-500"}>เพิ่มลงตะกร้า</span>
                </>
              )}
            </button>
          </div>
          {canAddToCart && (
            <div className="text-xs text-[#4A2C1B]/60 text-center">
              x {quantity} แก้ว
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
