"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFruits, getDrinks, getCupSizes, addToCart, type Fruit, type PredefinedDrink, type CupSize, type FruitCategory } from "@/lib/api";
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
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "SIGNATURE" | "CLASSIC" | "GREEN_BOOSTER" | "HIGH_PROTEIN" | "SUPERFRUIT">("ALL");

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
    
    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const [fruitsRes, drinksRes, cupSizesRes] = await Promise.all([
        getFruits().catch(err => {
          return { data: [], success: false, message: err.message };
        }),
        getDrinks().catch(err => {
          return { data: [], success: false, message: err.message };
        }),
        getCupSizes().catch(err => {
          return { data: [], success: false, message: err.message };
        }),
      ]);

      const filteredFruits = Array.isArray(fruitsRes.data) 
        ? fruitsRes.data.filter(f => f && f.active) 
        : [];
      const filteredDrinks = Array.isArray(drinksRes.data) 
        ? drinksRes.data.filter(d => d && d.active) 
        : [];
      const filteredCupSizes = Array.isArray(cupSizesRes.data) 
        ? cupSizesRes.data.filter(c => c && c.active) 
        : [];
      
      // Ensure all fruits have category field
      const fruitsWithCategory = filteredFruits.map(f => ({
        ...f,
        category: (f.category || "FRUIT") as FruitCategory
      }));
      
      setFruits(fruitsWithCategory);
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

  // Filter drinks by category
  function getDrinksByCategory(category: "ALL" | "SIGNATURE" | "CLASSIC" | "GREEN_BOOSTER" | "HIGH_PROTEIN" | "SUPERFRUIT"): PredefinedDrink[] {
    if (category === "ALL") {
      return drinks;
    }

    // Filter by category keywords in name or description
    const filtered = drinks.filter(drink => {
      const name = (drink.name || "").toLowerCase();
      const description = (drink.description || "").toLowerCase();
      const searchText = `${name} ${description}`;

      switch (category) {
        case "SIGNATURE":
          // Signature drinks - typically premium or special drinks
          return searchText.includes("signature") || 
                 searchText.includes("พิเศษ") || 
                 searchText.includes("premium");
        case "CLASSIC":
          // Classic drinks - traditional or standard recipes
          return searchText.includes("classic") || 
                 searchText.includes("คลาสสิก") || 
                 searchText.includes("ดั้งเดิม");
        case "GREEN_BOOSTER":
          // Green Booster - drinks with vegetables or green ingredients
          return searchText.includes("green") || 
                 searchText.includes("booster") || 
                 searchText.includes("ผัก") ||
                 searchText.includes("เขียว");
        case "HIGH_PROTEIN":
          // High-Protein drinks
          return searchText.includes("protein") || 
                 searchText.includes("โปรตีน") || 
                 searchText.includes("high") ||
                 searchText.includes("whey");
        case "SUPERFRUIT":
          // Superfruit - drinks with superfoods or exotic fruits
          return searchText.includes("superfruit") || 
                 searchText.includes("super") || 
                 searchText.includes("superfood") ||
                 searchText.includes("เบอร์รี่") ||
                 searchText.includes("berry");
        default:
          return true;
      }
    });

    return filtered;
  }

  // Get filtered drinks based on selected category
  const filteredDrinks = getDrinksByCategory(selectedCategory);

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

    // Get ingredients with images for hover display
    const drinkIngredients = drink.ingredients
      ? drink.ingredients
          .map(ing => {
            const fruit = fruits.find(f => f.id === ing.fruitId);
            return fruit ? {
              id: fruit.id,
              name: fruit.name,
              imageUrl: fruit.imageUrl,
              quantity: ing.quantity,
              category: fruit.category
            } : null;
          })
          .filter(Boolean)
          .slice(0, 6) // Show max 6 ingredients
      : [];
    
    return (
      <div
        key={drink.id}
        className="bg-white rounded-lg border border-[#4A3728]/20 p-4 hover:shadow-xl transition-all duration-300 relative group"
      >
        <div 
          onClick={() => openModal(drink)}
          className="cursor-pointer"
        >
          {/* Image Container with Hover Overlay */}
          <div className="relative w-full h-48 rounded-lg mb-3 overflow-hidden">
            {drink.imageUrl ? (
              <img
                src={getImageUrl(drink.imageUrl)}
                alt={drink.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.fallback-image');
                    if (fallback) (fallback as HTMLElement).classList.remove("hidden");
                  }
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-[#D4C5B0] rounded-lg flex items-center justify-center text-gray-400 ${drink.imageUrl ? "hidden fallback-image" : ""}`}>
              <span className="text-4xl">🥤</span>
            </div>
            
            {/* Ingredients Overlay on Hover */}
            {drinkIngredients.length > 0 && (
              <div className="absolute inset-0 bg-[#4A3728]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 rounded-lg">
                <p className="text-white text-xs font-semibold mb-2 font-sans">ส่วนผสม</p>
                <div className="grid grid-cols-3 gap-2 w-full max-h-32 overflow-y-auto">
                  {drinkIngredients.map((ing: any) => (
                    <div
                      key={ing.id}
                      className="flex flex-col items-center bg-white/10 rounded-lg p-1.5 backdrop-blur-sm"
                      title={`${ing.name} x${ing.quantity}`}
                    >
                      {ing.imageUrl ? (
                        <img
                          src={getImageUrl(ing.imageUrl)}
                          alt={ing.name}
                          className="w-10 h-10 object-cover rounded-full border-2 border-white/30"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            const fallback = (e.target as HTMLImageElement).nextElementSibling;
                            if (fallback) (fallback as HTMLElement).classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 ${ing.imageUrl ? "hidden" : ""}`}>
                        <span className="text-lg">
                          {ing.category === "FRUIT" ? "🍎" : ing.category === "VEGETABLE" ? "🥬" : "🥛"}
                        </span>
                      </div>
                      <span className="text-[10px] text-white font-medium mt-1 text-center line-clamp-1 font-sans">
                        {ing.name}
                      </span>
                      {ing.quantity > 1 && (
                        <span className="text-[9px] text-white/80 font-sans">x{ing.quantity}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          className="absolute bottom-4 right-4 bg-[#4A3728] text-[#E8DDCB] w-8 h-8 rounded flex items-center justify-center hover:bg-[#5A3C2B] transition-colors z-10"
          title="ดูรายละเอียด"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#E8DDCB] min-h-screen py-6 sm:py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#4A3728] mb-6 sm:mb-8 font-serif">smoothies menu</h1>

        {/* Category Filter */}
        <section className="mb-6 sm:mb-8">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "ALL"
                    ? "bg-[#4A3728] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory("SIGNATURE")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "SIGNATURE"
                    ? "bg-[#4A3728] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                Signature
              </button>
              <button
                onClick={() => setSelectedCategory("CLASSIC")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "CLASSIC"
                    ? "bg-[#4A3728] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => setSelectedCategory("GREEN_BOOSTER")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "GREEN_BOOSTER"
                    ? "bg-[#4A3728] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                Green Booster
              </button>
              <button
                onClick={() => setSelectedCategory("HIGH_PROTEIN")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "HIGH_PROTEIN"
                    ? "bg-[#4A3728] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                High-Protein
              </button>
              <button
                onClick={() => setSelectedCategory("SUPERFRUIT")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "SUPERFRUIT"
                    ? "bg-[#4A3728] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                Superfruit
              </button>
          </div>
        </section>

        {/* All Drinks */}
        <section className="mb-8 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#4A3728] mb-2 font-serif">
              {selectedCategory === "ALL" && "All Smoothies"}
              {selectedCategory === "SIGNATURE" && "Signature Smoothies"}
              {selectedCategory === "CLASSIC" && "Classic Smoothies"}
              {selectedCategory === "GREEN_BOOSTER" && "Green Booster Smoothies"}
              {selectedCategory === "HIGH_PROTEIN" && "High-Protein Smoothies"}
              {selectedCategory === "SUPERFRUIT" && "Superfruit Smoothies"}
            </h2>
            <p className="text-base sm:text-lg text-[#4A3728]/80 font-sans">
              {filteredDrinks.length > 0 
                ? `พบ ${filteredDrinks.length} รายการ` 
                : "ยังไม่มีเมนูในหมวดหมู่นี้"}
            </p>
          </div>
          {loading ? (
            <div className="text-center text-[#4A3728]/60 py-8">กำลังโหลด...</div>
          ) : filteredDrinks.length === 0 ? (
            <div className="text-center text-[#4A3728]/60 py-8 bg-white rounded-lg shadow-md p-12">
              <p className="text-xl mb-4">ยังไม่มีเมนูในหมวดหมู่นี้</p>
              <button
                onClick={() => setSelectedCategory("ALL")}
                className="bg-[#4A3728] text-[#E8DDCB] px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                ดูเมนูทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredDrinks.map(renderDrinkCard)}
            </div>
          )}
        </section>

        {/* Custom Drink Builder - เปลี่ยนเป็นลิงก์ไปหน้า build */}
        <section className="mb-8 sm:mb-12 text-center">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#4A3728] mb-3 sm:mb-4 font-serif">Want to Create Your Own?</h2>
            <p className="text-base sm:text-lg text-[#4A3728]/70 mb-4 sm:mb-6 font-sans">
              Customize your perfect smoothie with our build tool
            </p>
            <Link
              href="/build"
              className="inline-block bg-[#4A3728] text-[#E8DDCB] px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              Build Your Own Smoothie
            </Link>
          </div>
        </section>
      </div>

      {/* Product Detail Modal */}
      {showModal && selectedDrink && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#4A3728]/20 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#4A3728] font-serif pr-2">{selectedDrink.name}</h2>
              <button
                onClick={closeModal}
                className="text-[#4A3728] hover:text-[#5A3C2B] text-2xl font-bold transition-colors flex-shrink-0"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
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

