"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getFruits, getDrinks, getCupSizes, addToCart, calculateDrinkPrice, type Fruit, type PredefinedDrink, type CupSize, type FruitCategory } from "@/lib/api";
import { addToGuestCart } from "@/lib/guestCart";
import { getImageUrl } from "@/lib/image";

function MenuContent() {
  const searchParams = useSearchParams();
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
  const [quantity, setQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "SIGNATURE" | "CLASSIC" | "GREEN_BOOSTER" | "HIGH_PROTEIN" | "SUPERFRUIT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Read category from URL query parameter
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const validCategories: ("ALL" | "SIGNATURE" | "CLASSIC" | "GREEN_BOOSTER" | "HIGH_PROTEIN" | "SUPERFRUIT")[] = [
        "ALL", "SIGNATURE", "CLASSIC", "GREEN_BOOSTER", "HIGH_PROTEIN", "SUPERFRUIT"
      ];
      if (validCategories.includes(categoryParam as any)) {
        setSelectedCategory(categoryParam as "ALL" | "SIGNATURE" | "CLASSIC" | "GREEN_BOOSTER" | "HIGH_PROTEIN" | "SUPERFRUIT");
      }
    }
  }, [searchParams]);

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
        ? fruitsRes.data.filter(f => f && f.active) // แสดงวัตถุดิบทั้งหมดที่ active (รวม seasonal ด้วย)
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
        category: (f.category || "ORGANIC_FRUITS") as FruitCategory
      }));
      
      setFruits(fruitsWithCategory);
      setDrinks(filteredDrinks);
      setCupSizes(filteredCupSizes);
      
      // Set default cup size - ใช้ cup size ที่เล็กที่สุด
      if (filteredCupSizes.length > 0) {
        const sortedCupSizes = [...filteredCupSizes].sort((a, b) => 
          (a.volumeMl || 0) - (b.volumeMl || 0) || 
          (a.priceExtra || 0) - (b.priceExtra || 0)
        );
        setSelectedCupSize(sortedCupSizes[0]);
        setModalCupSize(sortedCupSizes[0]);
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
    // ใช้ cup size ที่เล็กที่สุด
    if (selectedCupSize) {
      setModalCupSize(selectedCupSize);
    } else if (cupSizes.length > 0) {
      const sortedCupSizes = [...cupSizes].sort((a, b) => 
        (a.volumeMl || 0) - (b.volumeMl || 0) || 
        (a.priceExtra || 0) - (b.priceExtra || 0)
      );
      setModalCupSize(sortedCupSizes[0]);
    } else {
      setModalCupSize(null);
    }
    setQuantity(1);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedDrink(null);
    setQuantity(1);
  }

  async function handleAddToCart(drinkId: number, cupSize?: CupSize, qty: number = 1) {
    const targetCupSize = cupSize || selectedCupSize || (cupSizes.length > 0 ? cupSizes[0] : null);
    if (!targetCupSize) {
      alert("กรุณารอสักครู่เพื่อโหลดข้อมูลขนาดแก้ว");
      return;
    }

    if (qty < 1) {
      alert("กรุณาเลือกจำนวนแก้วอย่างน้อย 1 แก้ว");
      return;
    }

    // ถ้าเป็น guest user ให้เก็บใน localStorage
    if (!user) {
      try {
        setAddingToCart(true);
        const drink = drinks.find(d => d.id === drinkId);
        if (!drink) return;

        // ใช้ฟังก์ชันคำนวณราคาร่วมกัน
        const unitPrice = calculateDrinkPrice(drink, fruits, cupSizes, targetCupSize);
        const totalPrice = unitPrice * qty;

        // เพิ่มหลายแก้วเป็นรายการแยกกัน
        for (let i = 0; i < qty; i++) {
          const guestItem = {
            type: "PREDEFINED" as const,
            cupSizeId: targetCupSize.id,
            cupSizeName: targetCupSize.name,
            quantity: 1,
            predefinedDrinkId: drinkId,
            predefinedDrinkName: drink.name,
            predefinedDrinkImageUrl: drink.imageUrl,
            unitPrice,
            totalPrice: unitPrice,
          };
          addToGuestCart(guestItem);
        }

        window.dispatchEvent(new Event("cartUpdated"));
        alert(`เพิ่ม ${qty} แก้วลงตะกร้าเรียบร้อยแล้ว! 🎉`);
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
        quantity: qty,
        predefinedDrinkId: drinkId,
      });
      window.dispatchEvent(new Event("cartUpdated"));
      alert(`เพิ่ม ${qty} แก้วลงตะกร้าเรียบร้อยแล้ว! 🎉`);
      closeModal();
    } catch (err: any) {
      alert(err.message || "ไม่สามารถเพิ่มลงตะกร้าได้");
    } finally {
      setAddingToCart(false);
    }
  }

  // Filter drinks by category (uses actual category field from backend)
  function getDrinksByCategory(category: "ALL" | "SIGNATURE" | "CLASSIC" | "GREEN_BOOSTER" | "HIGH_PROTEIN" | "SUPERFRUIT"): PredefinedDrink[] {
    if (category === "ALL") {
      return drinks;
    }

    return drinks.filter(drink => drink.category === category);
  }

  // Get filtered drinks based on selected category
  const categoryFilteredDrinks = getDrinksByCategory(selectedCategory);

  // Filter drinks by search query
  const filteredDrinks = searchQuery.trim() 
    ? categoryFilteredDrinks.filter(drink => {
        const query = searchQuery.toLowerCase();
        const nameMatch = drink.name?.toLowerCase().includes(query);
        const descMatch = drink.description?.toLowerCase().includes(query);
        
        // Search in ingredient names
        const ingredientMatch = drink.ingredients?.some(ing => 
          ing.fruitName?.toLowerCase().includes(query)
        );
        
        return nameMatch || descMatch || ingredientMatch;
      })
    : categoryFilteredDrinks;

  function renderDrinkCard(drink: PredefinedDrink) {
    // ใช้ฟังก์ชันคำนวณราคาร่วมกัน
    const price = calculateDrinkPrice(drink, fruits, cupSizes);

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
        className="bg-white rounded-lg border border-[#14433B]/20 p-4 hover:shadow-xl transition-all duration-300 relative group"
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
              <div className="absolute inset-0 bg-[#14433B]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 rounded-lg">
                <p className="text-white text-xs font-semibold mb-2 font-sans">Ingredients</p>
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
                          {ing.category === "ORGANIC_FRUITS" || ing.category === "SUPERFRUITS" ? "🍎" : ing.category === "ORGANIC_VEGETABLE" ? "🥬" : ing.category === "PROTEIN" ? "💪" : ing.category === "TOPPING" ? "🍒" : ing.category === "SWEETENER" ? "🍯" : ing.category === "BASE" ? "🥛" : "🍎"}
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
          
          <h4 className="font-semibold text-[#14433B] mb-1 font-sans">{drink.name}</h4>
          {drink.description && (
            <p className="text-[#14433B]/70 text-xs mb-2 line-clamp-2 font-sans">{drink.description}</p>
          )}
          <p className="text-[#14433B] font-bold mb-3 font-sans">{price.toFixed(2)} ฿</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal(drink);
          }}
          className="absolute bottom-4 right-4 bg-[#14433B] text-[#FFF6F0] w-8 h-8 rounded flex items-center justify-center hover:bg-[#1a5444] transition-colors z-10"
          title="View Details"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF6F0] min-h-screen py-6 sm:py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#14433B] mb-6 sm:mb-8 font-serif">Smoothies Menu</h1>

        {/* Search Bar */}
        <section className="mb-6 sm:mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search for drinks, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-[#14433B]/30 bg-white text-[#14433B] placeholder:text-[#14433B]/50 focus:outline-none focus:border-[#14433B] focus:ring-2 focus:ring-[#14433B]/20 transition-all font-sans"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#14433B]/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#14433B]/50 hover:text-[#14433B] transition-colors"
                aria-label="Clear search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </section>

        {/* Category Filter */}
        <section className="mb-6 sm:mb-8">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "ALL"
                    ? "bg-[#14433B] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory("SIGNATURE")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "SIGNATURE"
                    ? "bg-[#14433B] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                Signature
              </button>
              <button
                onClick={() => setSelectedCategory("CLASSIC")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "CLASSIC"
                    ? "bg-[#14433B] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => setSelectedCategory("GREEN_BOOSTER")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "GREEN_BOOSTER"
                    ? "bg-[#14433B] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                Green Booster
              </button>
              <button
                onClick={() => setSelectedCategory("HIGH_PROTEIN")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "HIGH_PROTEIN"
                    ? "bg-[#14433B] text-white shadow-md"
                    : "bg-[#C9A78B] text-white hover:bg-[#B8967A] shadow-sm"
                }`}
              >
                High-Protein
              </button>
              <button
                onClick={() => setSelectedCategory("SUPERFRUIT")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 font-sans text-xs sm:text-sm shadow-sm ${
                  selectedCategory === "SUPERFRUIT"
                    ? "bg-[#14433B] text-white shadow-md"
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14433B] mb-2 font-serif">
              {selectedCategory === "ALL" && "All Smoothies"}
              {selectedCategory === "SIGNATURE" && "Signature Smoothies"}
              {selectedCategory === "CLASSIC" && "Classic Smoothies"}
              {selectedCategory === "GREEN_BOOSTER" && "Green Booster Smoothies"}
              {selectedCategory === "HIGH_PROTEIN" && "High-Protein Smoothies"}
              {selectedCategory === "SUPERFRUIT" && "Superfruit Smoothies"}
            </h2>
            <p className="text-base sm:text-lg text-[#14433B]/80 font-sans">
              {searchQuery 
                ? filteredDrinks.length > 0 
                  ? `Found ${filteredDrinks.length} items matching "${searchQuery}"` 
                  : `No results found for "${searchQuery}"`
                : filteredDrinks.length > 0 
                  ? `Found ${filteredDrinks.length} items` 
                  : "No smoothies in this category"}
            </p>
          </div>
          {loading ? (
            <div className="text-center text-[#14433B]/60 py-8">Loading...</div>
          ) : filteredDrinks.length === 0 ? (
            <div className="text-center text-[#14433B]/60 py-8 bg-white rounded-lg shadow-md p-12">
              <p className="text-xl mb-4">
                {searchQuery 
                  ? `No results found for "${searchQuery}"`  
                  : "No smoothies in this category"}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="bg-[#14433B] text-[#FFF6F0] px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity mr-2"
                >
                  Clear search
                </button>
              ) : null}
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                className="bg-[#14433B] text-[#FFF6F0] px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                View all smoothies
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14433B] mb-3 sm:mb-4 font-serif">Want to Create Your Own?</h2>
            <p className="text-base sm:text-lg text-[#14433B]/70 mb-4 sm:mb-6 font-sans">
              Customize your perfect smoothie with our build tool
            </p>
            <Link
              href="/build"
              className="inline-block bg-[#14433B] text-[#FFF6F0] px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base"
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
            <div className="sticky top-0 bg-white border-b border-[#14433B]/20 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#14433B] font-sans pr-2">{selectedDrink.name}</h2>
              <button
                onClick={closeModal}
                className="text-[#14433B] hover:text-[#1a5444] text-2xl font-bold transition-colors flex-shrink-0"
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
                  <h3 className="text-lg font-semibold text-[#14433B] mb-2 font-sans">Instructions:</h3>
                  <p className="text-[#14433B]/80 font-sans whitespace-pre-wrap">{selectedDrink.description}</p>
                </div>
              )}

              {/* Ingredients */}
              {selectedDrink.ingredients && selectedDrink.ingredients.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#14433B] mb-3 font-serif"></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedDrink.ingredients.map((ingredient, idx) => {
                      const fruit = fruits.find(f => f.id === ingredient.fruitId);
                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-[#FFF6F0]/50 rounded-lg"
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
                            <p className="font-medium text-[#14433B] font-sans">{ingredient.fruitName}</p>
                            <p className="text-sm text-[#14433B]/70 font-sans">Quantity: {ingredient.quantity} units</p>
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
                  <h3 className="text-lg font-semibold text-[#14433B] mb-3 font-sans">Select Cup Size:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {cupSizes.map((size) => {
                      const isSelected = modalCupSize?.id === size.id;
                      return (
                        <button
                          key={size.id}
                          onClick={() => setModalCupSize(size)}
                          className={`p-3 rounded-lg border-2 transition-all font-sans ${
                            isSelected
                              ? "border-[#14433B] bg-[#14433B] text-[#FFF6F0]"
                              : "border-[#14433B]/30 bg-white text-[#14433B] hover:border-[#14433B]/50"
                          }`}
                        >
                          <p className="font-semibold">{size.name}</p>
                          <p className="text-sm">{size.volumeMl} ml</p>
                          {size.priceExtra > 0 && (
                            <p className="text-xs mt-1">+{size.priceExtra.toFixed(2)} ฿</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#14433B] mb-3 font-sans">Quantity:</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border-2 border-[#14433B] bg-white text-[#14433B] font-bold text-lg hover:bg-[#14433B] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, Math.min(99, val)));
                    }}
                    className="w-20 text-center text-2xl font-bold text-[#14433B] border-2 border-[#14433B]/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#14433B]/50 font-sans"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    className="w-10 h-10 rounded-lg border-2 border-[#14433B] bg-white text-[#14433B] font-bold text-lg hover:bg-[#14433B] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity >= 99}
                  >
                    +
                  </button>
                  <span className="text-[#14433B]/70 font-sans ml-2">Cup</span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 p-4 bg-[#FFF6F0] rounded-lg">
                {(() => {
                  const unitPrice = selectedDrink ? calculateDrinkPrice(selectedDrink, fruits, cupSizes, modalCupSize || undefined) : 0;
                  const totalPrice = unitPrice * quantity;
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#14433B]/70 font-sans">Price per Cup:</span>
                        <span className="text-lg font-semibold text-[#14433B] font-sans">{unitPrice.toFixed(2)}฿</span>
                      </div>
                      {quantity > 1 && (
                        <div className="flex justify-between items-center text-xs text-[#14433B]/60 font-sans">
                          <span>{quantity} cup × {unitPrice.toFixed(2)}฿</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-[#14433B]/20">
                        <span className="text-lg font-semibold text-[#14433B] font-sans">Total Price:</span>
                        <span className="text-2xl font-bold text-[#14433B] font-sans">{totalPrice.toFixed(2)}฿</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => {
                  if (selectedDrink && modalCupSize) {
                    handleAddToCart(selectedDrink.id, modalCupSize, quantity);
                  }
                }}
                disabled={addingToCart || !modalCupSize || cupSizes.length === 0 || quantity < 1}
                className="w-full bg-[#14433B] text-[#FFF6F0] px-6 py-3 rounded-lg font-semibold hover:bg-[#1a5444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
              >
                {addingToCart ? "Adding..." : `Add ${quantity} cup to Cart`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14433B] mx-auto mb-4"></div>
          <div className="text-[#14433B] text-xl">Loading...</div>
        </div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}