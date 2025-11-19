"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFruits, getDrinks, getCupSizes, addToCart, type Fruit, type PredefinedDrink, type CupSize } from "@/lib/api";
import { addToGuestCart } from "@/lib/guestCart";
import { getImageUrl } from "@/lib/image";

export default function MenuPage() {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [drinks, setDrinks] = useState<PredefinedDrink[]>([]);
  const [cupSizes, setCupSizes] = useState<CupSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedCupSize, setSelectedCupSize] = useState<CupSize | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<PredefinedDrink | null>(null);
  const [modalCupSize, setModalCupSize] = useState<CupSize | null>(null);

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
      console.log("Starting to load menu data...");
      
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
      console.log("Loaded cup sizes:", filteredCupSizes.length, filteredCupSizes);
      
      setFruits(filteredFruits);
      setDrinks(filteredDrinks);
      setCupSizes(filteredCupSizes);
      
      // Set default cup size
      if (filteredCupSizes.length > 0) {
        setSelectedCupSize(filteredCupSizes[0]);
        setModalCupSize(filteredCupSizes[0]);
      }
    } catch (err: any) {
      console.error("Failed to load data:", err);
      console.error("Error details:", err.message, err.stack);
      // Set empty arrays on error
      setFruits([]);
      setDrinks([]);
      setCupSizes([]);
    } finally {
      setLoading(false);
    }
  }

  function openModal(drink: PredefinedDrink) {
    setSelectedDrink(drink);
    setModalCupSize(selectedCupSize || (cupSizes.length > 0 ? cupSizes[0] : null));
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedDrink(null);
  }

  async function handleAddToCart(drinkId: number, cupSize?: CupSize) {
    const targetCupSize = cupSize || selectedCupSize || (cupSizes.length > 0 ? cupSizes[0] : null);
    if (!targetCupSize) {
      alert("กรุณารอสักครู่เพื่อโหลดข้อมูลขนาดแก้ว");
      return;
    }

    // ถ้าเป็น guest user ให้เก็บใน localStorage
    if (!user) {
      try {
        setAddingToCart(true);
        const drink = drinks.find(d => d.id === drinkId);
        if (!drink) return;

        // คำนวณราคาจาก ingredients
        let basePrice = 0;
        if (drink.ingredients && drink.ingredients.length > 0) {
          basePrice = drink.ingredients.reduce((sum, ing) => {
            const fruit = fruits.find(f => f.id === ing.fruitId);
            if (fruit) {
              return sum + (Number(fruit.pricePerUnit) * ing.quantity);
            }
            return sum;
          }, 0);
        } else {
          basePrice = 100; // ราคาพื้นฐานถ้าไม่มี ingredients
        }

        const cupSizePrice = targetCupSize.priceExtra || 0;
        const unitPrice = basePrice + cupSizePrice;
        const totalPrice = unitPrice;

        const guestItem = {
          type: "PREDEFINED" as const,
          cupSizeId: targetCupSize.id,
          cupSizeName: targetCupSize.name,
          quantity: 1,
          predefinedDrinkId: drinkId,
          predefinedDrinkName: drink.name,
          predefinedDrinkImageUrl: drink.imageUrl,
          unitPrice,
          totalPrice,
        };

        addToGuestCart(guestItem);
        window.dispatchEvent(new Event("cartUpdated"));
        alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว! 🎉");
        closeModal();
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
      await addToCart({
        type: "PREDEFINED",
        cupSizeId: targetCupSize.id,
        quantity: 1,
        predefinedDrinkId: drinkId,
      });
      window.dispatchEvent(new Event("cartUpdated"));
      alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว! 🎉");
      closeModal();
    } catch (err: any) {
      alert(err.message || "ไม่สามารถเพิ่มลงตะกร้าได้");
    } finally {
      setAddingToCart(false);
    }
  }


  function renderDrinkCard(drink: PredefinedDrink) {
    // คำนวณราคาจาก ingredients
    let price = 100; // ราคาพื้นฐาน
    if (drink.ingredients && drink.ingredients.length > 0 && fruits.length > 0) {
      const basePrice = drink.ingredients.reduce((sum, ing) => {
        const fruit = fruits.find(f => f.id === ing.fruitId);
        if (fruit) {
          return sum + (Number(fruit.pricePerUnit) * ing.quantity);
        }
        return sum;
      }, 0);
      // Add base cup size price (assuming smallest cup)
      const cupPrice = cupSizes.length > 0 ? (cupSizes[0]?.priceExtra || 0) : 0;
      price = basePrice + cupPrice;
      // If prices seem too high, they might be in cents - divide by 100
      if (price > 1000) {
        price = price / 100;
      }
    }
    
    return (
      <div
        key={drink.id}
        className="bg-white rounded-lg border border-[#4A3728]/20 p-4 hover:shadow-lg transition-all relative group"
      >
        <div 
          onClick={() => openModal(drink)}
          className="cursor-pointer"
        >
          {drink.imageUrl ? (
            <img
              src={getImageUrl(drink.imageUrl)}
              alt={drink.name}
              className="w-full h-48 object-cover rounded-lg mb-3"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div className={`w-full h-48 bg-[#D4C5B0] rounded-lg mb-3 flex items-center justify-center text-gray-400 ${drink.imageUrl ? "hidden" : ""}`}>
            <span className="text-4xl">🥤</span>
          </div>
          <h4 className="font-semibold text-[#4A3728] mb-1 font-sans">{drink.name}</h4>
          {drink.description && (
            <p className="text-[#4A3728]/70 text-xs mb-2 line-clamp-2 font-sans">{drink.description}</p>
          )}
          <p className="text-[#4A3728] font-bold mb-3 font-sans">{price.toFixed(2)} บาท</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal(drink);
          }}
          className="absolute bottom-4 right-4 bg-[#4A3728] text-[#E8DDCB] w-8 h-8 rounded flex items-center justify-center hover:bg-[#5A3C2B] transition-colors"
          title="ดูรายละเอียด"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#E8DDCB] min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="text-4xl font-bold text-[#4A3728] mb-8 font-serif">Ready Menu</h1>

        {/* All Drinks */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#4A3728] mb-2 font-serif">All Smoothies</h2>
            <p className="text-lg text-[#4A3728]/80 font-sans">Browse our complete menu</p>
          </div>
          {loading ? (
            <div className="text-center text-[#4A3728]/60 py-8">กำลังโหลด...</div>
          ) : drinks.length === 0 ? (
            <div className="text-center text-[#4A3728]/60 py-8">ยังไม่มีเมนูน้ำปั่น</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {drinks.map(renderDrinkCard)}
            </div>
          )}
        </section>

        {/* Custom Drink Builder - เปลี่ยนเป็นลิงก์ไปหน้า build */}
        <section className="mb-12 text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-[#4A3728] mb-4 font-serif">Want to Create Your Own?</h2>
            <p className="text-lg text-[#4A3728]/70 mb-6 font-sans">
              Customize your perfect smoothie with our build tool
            </p>
            <Link
              href="/build"
              className="inline-block bg-[#4A3728] text-[#E8DDCB] px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Build Your Own Smoothie
            </Link>
          </div>
        </section>
      </div>

      {/* Product Detail Modal */}
      {showModal && selectedDrink && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#4A3728]/20 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#4A3728] font-serif">{selectedDrink.name}</h2>
              <button
                onClick={closeModal}
                className="text-[#4A3728] hover:text-[#5A3C2B] text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Image */}
              <div className="mb-6">
                {selectedDrink.imageUrl ? (
                  <img
                    src={getImageUrl(selectedDrink.imageUrl)}
                    alt={selectedDrink.name}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div className={`w-full h-64 bg-[#D4C5B0] rounded-lg flex items-center justify-center text-gray-400 ${selectedDrink.imageUrl ? "hidden" : ""}`}>
                  <span className="text-6xl">🥤</span>
                </div>
              </div>

              {/* Description */}
              {selectedDrink.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#4A3728] mb-2 font-serif">คำอธิบาย</h3>
                  <p className="text-[#4A3728]/80 font-sans whitespace-pre-wrap">{selectedDrink.description}</p>
                </div>
              )}

              {/* Ingredients */}
              {selectedDrink.ingredients && selectedDrink.ingredients.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#4A3728] mb-3 font-serif">วัถุดิบ</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedDrink.ingredients.map((ingredient, idx) => {
                      const fruit = fruits.find(f => f.id === ingredient.fruitId);
                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-[#E8DDCB]/50 rounded-lg"
                        >
                          {fruit?.imageUrl ? (
                            <img
                              src={getImageUrl(fruit.imageUrl)}
                              alt={ingredient.fruitName}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-[#D4C5B0] rounded flex items-center justify-center">
                              <span className="text-xl">🍎</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-[#4A3728] font-sans">{ingredient.fruitName}</p>
                            <p className="text-sm text-[#4A3728]/70 font-sans">จำนวน: {ingredient.quantity} หน่วย</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cup Size Selection */}
              {cupSizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#4A3728] mb-3 font-serif">เลือกขนาดแก้ว</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {cupSizes.map((size) => {
                      const isSelected = modalCupSize?.id === size.id;
                      return (
                        <button
                          key={size.id}
                          onClick={() => setModalCupSize(size)}
                          className={`p-3 rounded-lg border-2 transition-all font-sans ${
                            isSelected
                              ? "border-[#4A3728] bg-[#4A3728] text-[#E8DDCB]"
                              : "border-[#4A3728]/30 bg-white text-[#4A3728] hover:border-[#4A3728]/50"
                          }`}
                        >
                          <p className="font-semibold">{size.name}</p>
                          <p className="text-sm">{size.volumeMl} ml</p>
                          {size.priceExtra > 0 && (
                            <p className="text-xs mt-1">+{size.priceExtra.toFixed(2)} บาท</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="mb-6 p-4 bg-[#E8DDCB] rounded-lg">
                {(() => {
                  let basePrice = 100;
                  if (selectedDrink.ingredients && selectedDrink.ingredients.length > 0 && fruits.length > 0) {
                    basePrice = selectedDrink.ingredients.reduce((sum, ing) => {
                      const fruit = fruits.find(f => f.id === ing.fruitId);
                      if (fruit) {
                        return sum + (Number(fruit.pricePerUnit) * ing.quantity);
                      }
                      return sum;
                    }, 0);
                    if (basePrice > 1000) {
                      basePrice = basePrice / 100;
                    }
                  }
                  const cupSizePrice = modalCupSize?.priceExtra || 0;
                  const totalPrice = basePrice + cupSizePrice;
                  return (
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-[#4A3728] font-sans">ราคารวม:</span>
                      <span className="text-2xl font-bold text-[#4A3728] font-serif">{totalPrice.toFixed(2)} บาท</span>
                    </div>
                  );
                })()}
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => {
                  if (selectedDrink && modalCupSize) {
                    handleAddToCart(selectedDrink.id, modalCupSize);
                  }
                }}
                disabled={addingToCart || !modalCupSize || cupSizes.length === 0}
                className="w-full bg-[#4A3728] text-[#E8DDCB] px-6 py-3 rounded-lg font-semibold hover:bg-[#5A3C2B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
              >
                {addingToCart ? "กำลังเพิ่ม..." : "เพิ่มลงตะกร้า"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

