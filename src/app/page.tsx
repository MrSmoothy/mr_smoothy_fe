"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart, Plus, X } from "lucide-react";
import { getFruits, getDrinks, getCupSizes, addToCart, type Fruit, type PredefinedDrink, type CupSize } from "@/lib/api";
import { addToGuestCart } from "@/lib/guestCart";
import { getImageUrl } from "@/lib/image";
import SmoothyCup from "@/app/components/SmoothyCup";

const MAX_FRUITS = 5;

export default function Home() {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [drinks, setDrinks] = useState<PredefinedDrink[]>([]);
  const [cupSizes, setCupSizes] = useState<CupSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedFruits, setSelectedFruits] = useState<Map<number, { fruit: Fruit; quantity: number }>>(new Map());
  const [selectedCupSize, setSelectedCupSize] = useState<CupSize | null>(null);
  const [showSmoothyCup, setShowSmoothyCup] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

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

  useEffect(() => {
    // แสดงแก้วเมื่อเลือกผลไม้
    if (selectedFruits.size > 0) {
      setShowSmoothyCup(true);
    }
  }, [selectedFruits]);

  async function loadData() {
    try {
      setLoading(true);
      console.log("Starting to load homepage data...");
      
      const [fruitsRes, drinksRes, cupSizesRes] = await Promise.all([
        getFruits().catch(err => {
          console.error("Error loading fruits:", err);
          return { data: [], success: false, message: err.message };
        }),
        getDrinks().catch(err => {
          console.error("Error loading drinks:", err);
          return { data: [], success: false, message: err.message };
        }),
        getCupSizes().catch(err => {
          console.error("Error loading cup sizes:", err);
          return { data: [], success: false, message: err.message };
        }),
      ]);

      console.log("Raw responses:", { fruitsRes, drinksRes, cupSizesRes });

      const filteredFruits = Array.isArray(fruitsRes.data) 
        ? fruitsRes.data.filter(f => f && f.active) 
        : [];
      const filteredDrinks = Array.isArray(drinksRes.data) 
        ? drinksRes.data.filter(d => d && d.active) 
        : [];
      const filteredCupSizes = Array.isArray(cupSizesRes.data) 
        ? cupSizesRes.data.filter(c => c && c.active) 
        : [];
      
      console.log("Loaded fruits:", filteredFruits.length, filteredFruits);
      console.log("Loaded drinks:", filteredDrinks.length, filteredDrinks);
      
      setFruits(filteredFruits);
      setDrinks(filteredDrinks);
      setCupSizes(filteredCupSizes);
      
      if (filteredCupSizes.length > 0) {
        setSelectedCupSize(filteredCupSizes[0]);
      }
    } catch (err: any) {
      console.error("Failed to load data:", err);
      console.error("Error details:", err.message, err.stack);
      setFruits([]);
      setDrinks([]);
      setCupSizes([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFruitChange(fruitId: number, delta: number) {
    setSelectedFruits(prev => {
      const newMap = new Map(prev);
      const fruit = fruits.find(f => f.id === fruitId);
      if (!fruit) return newMap;

      const current = newMap.get(fruitId);
      const currentQty = current?.quantity || 0;
      const newQty = Math.max(0, Math.min(MAX_FRUITS, currentQty + delta));
      
      const totalFruits = Array.from(newMap.values()).reduce((sum, item) => sum + item.quantity, 0);
      const remainingSlots = MAX_FRUITS - totalFruits + currentQty;
      
      if (delta > 0 && remainingSlots <= 0) {
        alert(`สามารถเลือกได้สูงสุด ${MAX_FRUITS} อย่าง`);
        return newMap;
      }

      if (newQty === 0) {
        newMap.delete(fruitId);
      } else {
        newMap.set(fruitId, { fruit, quantity: newQty });
      }
      
      return newMap;
    });
  }

  async function handleAddCustomSmoothyToCart() {
    const totalFruits = Array.from(selectedFruits.values()).reduce((sum, item) => sum + item.quantity, 0);
    if (totalFruits === 0) {
      alert("กรุณาเลือกผลไม้อย่างน้อย 1 ชนิด");
      return;
    }

    if (!selectedCupSize) {
      alert("กรุณาเลือกขนาดแก้ว");
      return;
    }

    // ถ้าเป็น guest user ให้เก็บใน localStorage
    if (!user) {
      try {
        setAddingToCart(true);
        
        const fruitsPrice = Array.from(selectedFruits.values()).reduce(
          (sum, { fruit, quantity }) => sum + Number(fruit.pricePerUnit) * quantity,
          0
        );
        const cupSizePrice = selectedCupSize.priceExtra || 0;
        const unitPrice = fruitsPrice + cupSizePrice;
        const totalPrice = unitPrice;

        const guestItem = {
          type: "CUSTOM" as const,
          cupSizeId: selectedCupSize.id,
          cupSizeName: selectedCupSize.name,
          quantity: 1,
          fruits: Array.from(selectedFruits.entries()).map(([fruitId, { fruit, quantity }]) => ({
            fruitId,
            fruitName: fruit.name,
            quantity,
            pricePerUnit: Number(fruit.pricePerUnit),
          })),
          unitPrice,
          totalPrice,
        };

        addToGuestCart(guestItem);
        window.dispatchEvent(new Event("cartUpdated"));
        
        alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว! 🎉");
        setSelectedFruits(new Map());
        setShowSmoothyCup(false);
      } catch (err: any) {
        console.error("Error adding to guest cart:", err);
        alert("ไม่สามารถเพิ่มลงตะกร้าได้");
      } finally {
        setAddingToCart(false);
      }
      return;
    }

    // Logged in user
    try {
      setAddingToCart(true);
      const ingredients = Array.from(selectedFruits.entries()).map(([fruitId, { quantity }]) => ({
        fruitId,
        quantity,
      }));
      
      await addToCart({
        type: "CUSTOM",
        cupSizeId: selectedCupSize.id,
        quantity: 1,
        ingredients,
      });
      
      window.dispatchEvent(new Event("cartUpdated"));
      alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว! 🎉");
      setSelectedFruits(new Map());
      setShowSmoothyCup(false);
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      alert(err.message || "ไม่สามารถเพิ่มลงตะกร้าได้");
    } finally {
      setAddingToCart(false);
    }
  }

  async function handleAddDrinkToCart(drinkId: number) {
    if (!selectedCupSize) {
      alert("กรุณาเลือกขนาดแก้ว");
      return;
    }

    if (!user) {
      try {
        setAddingToCart(true);
        const drink = drinks.find(d => d.id === drinkId);
        if (!drink) return;

        const cupSizePrice = selectedCupSize.priceExtra || 0;
        const unitPrice = 100 + cupSizePrice; // ราคาพื้นฐาน + ขนาดแก้ว
        const totalPrice = unitPrice;

        const guestItem = {
          type: "PREDEFINED" as const,
          cupSizeId: selectedCupSize.id,
          cupSizeName: selectedCupSize.name,
          quantity: 1,
          predefinedDrinkId: drinkId,
          predefinedDrinkName: drink.name,
          unitPrice,
          totalPrice,
        };

        addToGuestCart(guestItem);
        window.dispatchEvent(new Event("cartUpdated"));
        alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว! 🎉");
      } catch (err: any) {
        console.error("Error adding to guest cart:", err);
        alert("ไม่สามารถเพิ่มลงตะกร้าได้");
      } finally {
        setAddingToCart(false);
      }
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart({
        type: "PREDEFINED",
        cupSizeId: selectedCupSize.id,
        quantity: 1,
        predefinedDrinkId: drinkId,
      });
      
      window.dispatchEvent(new Event("cartUpdated"));
      alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว! 🎉");
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      alert(err.message || "ไม่สามารถเพิ่มลงตะกร้าได้");
    } finally {
      setAddingToCart(false);
    }
  }

  const organicFruits = fruits.filter(f => f.active).slice(0, 4);
  const organicVegetables = fruits.filter(f => f.active).slice(4, 8);
  const totalFruits = Array.from(selectedFruits.values()).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-[#F5EFE6] min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Smoothy Cup Modal - แสดงเมื่อเลือกผลไม้ */}
        {showSmoothyCup && selectedFruits.size > 0 && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#4A2C1B]">Smoothy ของคุณ</h2>
                <button
                  onClick={() => {
                    setShowSmoothyCup(false);
                    setSelectedFruits(new Map());
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <SmoothyCup
                    selectedFruits={selectedFruits}
                    maxFruits={MAX_FRUITS}
                    cupSize={selectedCupSize || undefined}
                  />
                </div>

                <div className="flex-1 space-y-4">
                  {cupSizes.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-[#4A2C1B] mb-2">
                        เลือกขนาดแก้ว
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {cupSizes.map((size) => (
                          <button
                            key={size.id}
                            onClick={() => setSelectedCupSize(size)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedCupSize?.id === size.id
                                ? "border-[#4A2C1B] bg-[#4A2C1B] text-white"
                                : "border-[#4A2C1B]/30 bg-white text-[#4A2C1B]"
                            }`}
                          >
                            <div className="font-bold">{size.name}</div>
                            <div className="text-xs">{size.volumeMl}ml</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAddCustomSmoothyToCart}
                    disabled={addingToCart || totalFruits === 0}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      totalFruits > 0 && selectedCupSize
                        ? "bg-[#4A2C1B] text-white hover:bg-[#5A3C2B]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {addingToCart ? "กำลังเพิ่ม..." : (
                      <>
                        <ShoppingCart className="w-5 h-5 inline mr-2" />
                        เพิ่มลงตะกร้า
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promotion Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-[#4A2C1B]">Promotion</h2>
            <Link href="#" className="text-[#4A2C1B]/70 hover:text-[#4A2C1B] font-medium">
              View All &gt;
            </Link>
          </div>
          <div className="relative">
            <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-200/80 hover:bg-gray-300 rounded-full p-2 transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[300px] h-[200px] bg-gray-200 rounded-lg"
                />
              ))}
            </div>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-200/80 hover:bg-gray-300 rounded-full p-2 transition-colors">
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </section>

        {/* Popular Menu Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-[#4A2C1B]">Popular Menu</h2>
            <Link href="/menu" className="text-[#4A2C1B]/70 hover:text-[#4A2C1B] font-medium">
              View All &gt;
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {loading ? (
              <div className="w-full text-center text-[#4A2C1B]/60 py-8">กำลังโหลด...</div>
            ) : drinks.length === 0 ? (
              <div className="w-full text-center text-[#4A2C1B]/60 py-8">ยังไม่มีเมนูน้ำปั่น</div>
            ) : (
              drinks.slice(0, 6).map((drink) => {
                const isSelected = selectedFruits.size > 0;
                return (
                  <div
                    key={drink.id}
                    className="flex-shrink-0 w-[180px] h-[180px] bg-gray-200 rounded-lg relative group cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <Link href={`/drinks/${drink.id}`} className="absolute inset-0">
                      {drink.imageUrl ? (
                        <img
                          src={getImageUrl(drink.imageUrl)}
                          alt={drink.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 ${drink.imageUrl ? "hidden" : ""}`}>
                        <span className="font-semibold text-sm text-center">{drink.name}</span>
                        {drink.description && (
                          <span className="text-xs text-center mt-1">{drink.description}</span>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs font-semibold truncate">{drink.name}</p>
                        {drink.description && (
                          <p className="text-xs truncate">{drink.description}</p>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddDrinkToCart(drink.id);
                      }}
                      disabled={addingToCart}
                      className="absolute bottom-2 right-2 bg-[#4A2C1B] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#5A3C2B] transition-colors disabled:opacity-50 z-10"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    {drink.id === drinks[0]?.id && drinks.length > 0 && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        N
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Premium Ingredient - Organic Fruits */}
        <section className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#4A2C1B] mb-2">Premium Ingredient</h2>
              <h3 className="text-2xl font-semibold text-[#4A2C1B]">Organic Fruits</h3>
            </div>
            <Link href="/fruits" className="text-[#4A2C1B]/70 hover:text-[#4A2C1B] font-medium">
              ดูทั้งหมด &gt;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-4 text-center text-[#4A2C1B]/60">กำลังโหลด...</div>
            ) : organicFruits.length === 0 ? (
              <div className="col-span-4 text-center text-[#4A2C1B]/60">ยังไม่มีผลไม้</div>
            ) : (
              organicFruits.map((fruit) => {
                const selected = selectedFruits.get(fruit.id);
                const quantity = selected?.quantity || 0;
                const isSelected = quantity > 0;
                const totalFruitsCount = Array.from(selectedFruits.values()).reduce((sum, item) => sum + item.quantity, 0);
                const canAdd = totalFruitsCount < MAX_FRUITS;

                return (
                  <div
                    key={fruit.id}
                    className={`bg-[#F5EFE6] rounded-lg border-2 p-4 hover:shadow-lg transition-all relative ${
                      isSelected ? "border-[#4A2C1B] bg-[#C9A78B]/20" : "border-[#4A2C1B]/20"
                    }`}
                  >
                    {fruit.imageUrl ? (
                      <img
                        src={getImageUrl(fruit.imageUrl)}
                        alt={fruit.name}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-48 bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-gray-400 ${fruit.imageUrl ? "hidden" : ""}`}>
                      ไม่มีรูปภาพ
                    </div>
                    <h4 className="font-semibold text-[#4A2C1B] mb-1">{fruit.name}</h4>
                    {fruit.description && (
                      <p className="text-[#4A2C1B]/70 text-xs mb-2 line-clamp-2">{fruit.description}</p>
                    )}
                    <p className="text-[#4A2C1B] font-bold mb-3">
                      {Number(fruit.pricePerUnit).toFixed(2)} บาท
                    </p>
                    {isSelected ? (
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => handleFruitChange(fruit.id, -1)}
                          className="bg-red-500 text-white w-8 h-8 rounded flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-[#4A2C1B] font-bold min-w-[2rem] text-center">{quantity}</span>
                        <button
                          onClick={() => handleFruitChange(fruit.id, 1)}
                          disabled={!canAdd}
                          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                            canAdd
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleFruitChange(fruit.id, 1)}
                        disabled={!canAdd}
                        className={`w-full py-2 rounded flex items-center justify-center transition-colors ${
                          canAdd
                            ? "bg-[#4A2C1B] text-[#F5EFE6] hover:bg-[#5A3C2B]"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        เลือก
                      </button>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-[#4A2C1B] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Call to Action */}
        {!user && (
          <section className="text-center py-12">
            <h2 className="text-3xl font-bold text-[#4A2C1B] mb-4">เริ่มสั่งน้ำปั่นของคุณตอนนี้</h2>
            <p className="text-[#4A2C1B]/70 mb-6">
              เลือกผลไม้ด้านบนเพื่อสร้าง Smoothy ของคุณเอง หรือเลือกเมนูสำเร็จรูป
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/build"
                className="rounded-md bg-[#4A2C1B] px-8 py-3 text-[#F5EFE6] font-semibold hover:opacity-90 transition-opacity"
              >
                สร้าง Smoothy
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[#C9A78B] px-8 py-3 text-[#4A2C1B] font-semibold hover:opacity-90 transition-opacity"
              >
                สมัครสมาชิก
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-black px-8 py-3 text-[#F5EFE6] font-semibold hover:opacity-90 transition-opacity"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
