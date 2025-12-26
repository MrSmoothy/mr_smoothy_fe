"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { getFruits, getDrinks, getCupSizes, addToCart, getSeasonalIngredients, type Fruit, type PredefinedDrink, type CupSize, type FruitCategory } from "@/lib/api";
import { addToGuestCart } from "@/lib/guestCart";
import { getImageUrl } from "@/lib/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MAX_FRUITS = 5;

export default function Home() {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [drinks, setDrinks] = useState<PredefinedDrink[]>([]);
  const [cupSizes, setCupSizes] = useState<CupSize[]>([]);
  const [seasonalIngredients, setSeasonalIngredients] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<PredefinedDrink | null>(null);
  const [modalCupSize, setModalCupSize] = useState<CupSize | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "FRUIT" | "VEGETABLE" | "MIXED">("ALL");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      
      const [fruitsRes, drinksRes, cupSizesRes, seasonalRes] = await Promise.all([
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
        getSeasonalIngredients().catch(err => {
          console.error("Error loading seasonal ingredients:", err);
          return { data: [], success: false, message: err.message };
        }),
      ]);

      const filteredFruits = Array.isArray(fruitsRes.data) 
        ? fruitsRes.data
            .filter(f => f && f.active)
            .map(f => ({
              ...f,
              // Ensure category is set, default to ORGANIC_FRUITS
              category: (f.category || "ORGANIC_FRUITS") as FruitCategory
            }))
        : [];
      const filteredDrinks = Array.isArray(drinksRes.data) 
        ? drinksRes.data.filter(d => d && d.active) 
        : [];
      const filteredCupSizes = Array.isArray(cupSizesRes.data) 
        ? cupSizesRes.data.filter(c => c && c.active) 
        : [];
      
      const filteredSeasonal = Array.isArray(seasonalRes.data) 
        ? seasonalRes.data
            .filter(f => f && f.active)
            .map(f => ({
              ...f,
              category: (f.category || "ORGANIC_FRUITS") as FruitCategory
            }))
        : [];
      
      setFruits(filteredFruits);
      setDrinks(filteredDrinks);
      setCupSizes(filteredCupSizes);
      setSeasonalIngredients(filteredSeasonal);
      
      // Set default cup size for modal
      if (filteredCupSizes.length > 0) {
        setModalCupSize(filteredCupSizes[0]);
      }
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setFruits([]);
      setDrinks([]);
      setCupSizes([]);
    } finally {
      setLoading(false);
    }
  }

  function openModal(drink: PredefinedDrink) {
    setSelectedDrink(drink);
    setModalCupSize(cupSizes.length > 0 ? cupSizes[0] : null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedDrink(null);
  }

  async function handleAddDrinkToCart(drinkId: number, cupSize?: CupSize) {
    const targetCupSize = cupSize || (cupSizes.length > 0 ? cupSizes[0] : null);
    if (!targetCupSize) {
      alert("กรุณารอสักครู่เพื่อโหลดข้อมูลขนาดแก้ว");
      return;
    }

    if (!user) {
      try {
        setAddingToCart(true);
        const drink = drinks.find(d => d.id === drinkId);
        if (!drink) return;

        // Calculate price from ingredients
        let basePrice = 100;
        if (drink.ingredients && drink.ingredients.length > 0) {
          basePrice = drink.ingredients.reduce((sum, ing) => {
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
      console.error("Error adding to cart:", err);
      alert(err.message || "ไม่สามารถเพิ่มลงตะกร้าได้");
    } finally {
      setAddingToCart(false);
    }
  }

  // Filter drinks by category
  function getDrinksByCategory(category: "ALL" | "FRUIT" | "VEGETABLE" | "MIXED"): PredefinedDrink[] {
    if (category === "ALL") {
      return drinks;
    }

    if (fruits.length === 0) {
      return drinks;
    }

    const filtered = drinks.filter(drink => {
      if (!drink.ingredients || drink.ingredients.length === 0) {
        // ถ้าไม่มี ingredients ให้เป็น MIXED
        return category === "MIXED";
      }

      // ตรวจสอบว่า ingredients เป็นผลไม้หรือผัก
      const ingredientCategories: FruitCategory[] = drink.ingredients.map(ing => {
        const fruit = fruits.find(f => f.id === ing.fruitId);
        if (!fruit) {
          return "ORGANIC_FRUITS" as FruitCategory;
        }
        // ใช้ category จาก fruit หรือ default เป็น ORGANIC_FRUITS
        const fruitCategory: FruitCategory = (fruit.category || "ORGANIC_FRUITS") as FruitCategory;
        return fruitCategory;
      });

      // ตรวจสอบว่ามีประเภทอะไรบ้าง
      const hasOrganicFruits = ingredientCategories.some(cat => cat === "ORGANIC_FRUITS" || cat === "SUPERFRUITS");
      const hasOrganicVegetable = ingredientCategories.some(cat => cat === "ORGANIC_VEGETABLE");
      const hasOther = ingredientCategories.some(cat => !["ORGANIC_FRUITS", "ORGANIC_VEGETABLE", "SUPERFRUITS"].includes(cat));
      const uniqueCategories = new Set(ingredientCategories);

      let matches = false;

      if (category === "FRUIT") {
        // น้ำผลไม้ล้วน: มีเฉพาะผลไม้ออร์แกนิกหรือซูเปอร์ฟรุตเท่านั้น
        matches = hasOrganicFruits && !hasOrganicVegetable && !hasOther && uniqueCategories.size === 1 && (uniqueCategories.has("ORGANIC_FRUITS") || uniqueCategories.has("SUPERFRUITS"));
      } else if (category === "VEGETABLE") {
        // น้ำผัก: มีเฉพาะผักออร์แกนิกเท่านั้น
        matches = hasOrganicVegetable && !hasOrganicFruits && !hasOther && uniqueCategories.size === 1 && uniqueCategories.has("ORGANIC_VEGETABLE");
      } else if (category === "MIXED") {
        // น้ำผสม: มีทั้งผลไม้และผัก หรือมีส่วนเสริม หรือมีหลายประเภท
        matches = (hasOrganicFruits && hasOrganicVegetable) || hasOther || uniqueCategories.size > 1;
      }

      return matches;
    });

    return filtered;
  }

  // Popular smoothies - filter by category
  const filteredDrinks = getDrinksByCategory(selectedCategory);
  // ถ้าไม่มีผลลัพธ์ในหมวดหมู่ที่เลือก ให้แสดงทั้งหมด (เพื่อไม่ให้ว่างเปล่า)
  const popularDrinks = filteredDrinks.length > 0 ? filteredDrinks : (selectedCategory === "ALL" ? drinks.slice(0, 6) : []);

  function scrollLeft() {
    if (scrollContainerRef.current) {
      const cardWidth = 256; // w-64 = 256px
      const gap = 24; // gap-6 = 24px
      const scrollAmount = cardWidth + gap;
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  }

  function scrollRight() {
    if (scrollContainerRef.current) {
      const cardWidth = 256; // w-64 = 256px
      const gap = 24; // gap-6 = 24px
      const scrollAmount = cardWidth + gap;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  }
  
  // Seasonal ingredients - ใช้ข้อมูลจาก API
  // ถ้าไม่มี seasonal ingredients ให้แสดง 4 ตัวแรกของ fruits
  const displaySeasonalIngredients = seasonalIngredients.length > 0 
    ? seasonalIngredients.slice(0, 4)
    : fruits.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FFF6F0]">
      {/* Hero Section */}
      <section 
        className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/background1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-[#14433B]/20"></div>
        
        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg" style={{ fontFamily: "'Cooper Black', serif" }}>
            Welcome to Mr.Smoothy
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-8 max-w-2xl mx-auto font-sans drop-shadow-md px-4">
            Your premium destination for healthy, delicious smoothies. Choose from our signature menu or create your perfect blend.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link
              href="/menu"
              className="bg-[#14433B] text-[#FFF6F0] px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg text-sm sm:text-base"
            >
              Explore Ready Menu
            </Link>
            <Link
              href="/build"
              className="bg-white/90 text-[#14433B] border-2 border-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white transition-colors shadow-lg text-sm sm:text-base"
            >
              Build Your Own
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Smoothies Section */}
      <section className="bg-[#FFF6F0] py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#14433B]" style={{ fontFamily: "'Cooper Black', serif" }}>Popular Smoothies</h2>
            </div>
          </div>

          {/* Carousel Container */}
          <div className="relative px-8 sm:px-12 md:px-16">
            {/* Left Arrow */}
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-[#14433B] text-[#14433B] hover:text-white rounded-full p-3 shadow-xl transition-all items-center justify-center hover:scale-110 active:scale-95"
              aria-label="เลื่อนซ้าย"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {loading ? (
                <div className="w-full text-center text-[#14433B]/60 py-8">กำลังโหลด...</div>
              ) : popularDrinks.length === 0 ? (
                <div className="w-full text-center text-[#14433B]/60 py-8">ยังไม่มีเมนูน้ำปั่นในหมวดหมู่นี้</div>
              ) : (
                popularDrinks.map((drink, index) => {
                  // Calculate price from ingredients if available, otherwise use mock prices
                  let price = 12.99;
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
                  } else {
                    // Mock prices matching the design
                    const prices = [12.99, 11.99, 12.49, 13.99, 11.49, 12.99];
                    price = prices[index % prices.length] || 12.99;
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
                      className="group flex-shrink-0 w-64 bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative"
                      onClick={() => openModal(drink)}
                    >
                      {/* Image Area - reduced size */}
                      <div className="h-40 bg-[#D4C5B0] flex items-center justify-center relative overflow-hidden">
                        {drink.imageUrl ? (
                          <img
                            src={getImageUrl(drink.imageUrl)}
                            alt={drink.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="text-4xl">🥤</div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="text-4xl">🥤</div>
                        )}
                        
                        {/* Ingredients Overlay on Hover */}
                        {drinkIngredients.length > 0 && (
                          <div className="absolute inset-0 bg-[#14433B]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3">
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
                      {/* Text Area - reduced padding */}
                      <div className="p-4 bg-white">
                        <h3 className="text-lg font-bold text-[#14433B] mb-1 font-sans line-clamp-1">{drink.name}</h3>
                        <p className="text-xs text-[#14433B]/70 mb-3 min-h-[2rem] line-clamp-2 font-sans">
                          {drink.description || "Delicious smoothie blend"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-[#14433B] font-serif">฿{price.toFixed(2)}</span>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openModal(drink);
                            }}
                            className="bg-[#14433B] text-[#FFF6F0] w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#1a5444] transition-colors font-bold text-base"
                            title="ดูรายละเอียด"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Arrow */}
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-[#14433B] text-[#14433B] hover:text-white rounded-full p-3 shadow-xl transition-all items-center justify-center hover:scale-110 active:scale-95"
              aria-label="เลื่อนขวา"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Seasonal Ingredients Section */}
      <section className="bg-[#FFF6F0] py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#14433B] mb-2 font-serif">วัตถุดิบตามฤดูกาล</h2>
            <p className="text-base sm:text-lg text-[#14433B]/80 font-sans px-4">ผลไม้และผักตามฤดูกาลที่คัดสรรมาอย่างดี</p>
          </div>
          {displaySeasonalIngredients.length === 0 ? (
            <div className="text-center text-[#14433B]/60 py-8 font-sans">
              ยังไม่มีวัตถุดิบตามฤดูกาล
            </div>
          ) : (
            <div className="flex justify-center items-center">
              <div className="flex flex-wrap justify-center gap-8 sm:gap-10 md:gap-12 lg:gap-16 max-w-6xl">
                {displaySeasonalIngredients.map((ingredient, index) => (
                  <div 
                    key={ingredient.id} 
                    className="text-center group animate-fadeIn"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    {/* Main Circle with Enhanced Effects */}
                    <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl group-hover:rotate-6">
                      {/* Animated Decorative Rings */}
                      <div className="absolute inset-0 rounded-full border-4 border-[#14433B]/20 group-hover:border-[#14433B]/50 transition-all duration-500 group-hover:rotate-180"></div>
                      <div className="absolute inset-2 rounded-full border-2 border-[#14433B]/10 group-hover:border-[#14433B]/30 transition-all duration-500 group-hover:rotate-[-180deg]"></div>
                      
                      {/* Pulsing Glow Effect */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#14433B]/20 via-[#14433B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                      
                      {/* Sparkle Effect */}
                      <div className="absolute top-2 right-2 w-2 h-2 bg-[#14433B] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-ping"></div>
                      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-[#14433B] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-ping" style={{ animationDelay: '0.2s' }}></div>
                      
                      {/* Image */}
                      {ingredient.imageUrl ? (
                        <img
                          src={getImageUrl(ingredient.imageUrl)}
                          alt={ingredient.name}
                          className="w-full h-full object-cover relative z-10 group-hover:scale-125 transition-transform duration-500 rounded-full p-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            const fallback = (e.target as HTMLImageElement).nextElementSibling;
                            if (fallback) (fallback as HTMLElement).classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center relative z-10 ${ingredient.imageUrl ? "hidden" : ""}`}>
                        <span className="text-5xl sm:text-6xl md:text-7xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                          {ingredient.category === "ORGANIC_FRUITS" || ingredient.category === "SUPERFRUITS" ? "🍎" : ingredient.category === "ORGANIC_VEGETABLE" ? "🥬" : ingredient.category === "PROTEIN" ? "💪" : ingredient.category === "TOPPING" ? "🍒" : ingredient.category === "SWEETENER" ? "🍯" : ingredient.category === "BASE" ? "🥛" : "🍎"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content with Hover Effects */}
                    <div className="transition-all duration-300 group-hover:translate-y-[-4px]">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#14433B] mb-2 font-sans group-hover:text-[#1a5444] transition-colors">
                        {ingredient.name}
                      </h3>
                      <p className="text-sm sm:text-base text-[#14433B]/70 font-sans line-clamp-2 max-w-[180px] mx-auto mb-2">
                        {ingredient.description || (ingredient.category === "ORGANIC_FRUITS" ? "ผลไม้ออร์แกนิก" : ingredient.category === "ORGANIC_VEGETABLE" ? "ผักออร์แกนิก" : ingredient.category === "SUPERFRUITS" ? "ซูเปอร์ฟรุต" : ingredient.category === "BASE" ? "ฐาน" : ingredient.category === "PROTEIN" ? "โปรตีน" : ingredient.category === "TOPPING" ? "ท็อปปิ้ง" : ingredient.category === "SWEETENER" ? "สารให้ความหวาน" : "ผลไม้สดใหม่")}
                      </p>
                      <div className="inline-block px-4 py-2 bg-[#14433B]/10 rounded-full group-hover:bg-[#14433B]/20 transition-colors duration-300">
                        <p className="text-base sm:text-lg md:text-xl text-[#14433B] font-bold font-sans group-hover:text-[#1a5444] transition-colors">
                          ฿{Number(ingredient.pricePerUnit).toFixed(2)}/หน่วย
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section 
        className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/background2.png')",
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-[#14433B]/60"></div>
        
        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg" style={{ fontFamily: "'Cooper Black', serif" }}>
            Ready to Start Your Healthy Journey?
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto font-sans drop-shadow-md">
            Join thousands of satisfied customers who have transformed their health with Mr.Smoothy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-[#14433B] px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg text-sm sm:text-base"
            >
              Get Started Now
            </Link>
            <Link
              href="/menu"
              className="bg-transparent border-2 border-white text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm sm:text-base"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Special Offer Banner */}
      <section className="bg-[#FFFFFF] py-8 sm:py-10 md:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="bg-[#FFF6F0] rounded-lg p-6 sm:p-8 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl">🎉</span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#14433B] font-sans">Special Offer This Week</h3>
            </div>
            <p className="text-base sm:text-lg text-[#14433B] mb-2 font-sans">Get 20% off all High-Protein Smoothies!</p>
            <p className="text-sm sm:text-base text-[#14433B] font-semibold font-sans">Use code: PROTEIN20</p>
          </div>
        </div>
      </section>

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
              <h2 className="text-xl sm:text-2xl font-bold text-[#14433B] font-serif pr-2">{selectedDrink.name}</h2>
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
                  <h3 className="text-lg font-semibold text-[#14433B] mb-2 font-serif">คำอธิบาย</h3>
                  <p className="text-[#14433B]/80 font-sans whitespace-pre-wrap">{selectedDrink.description}</p>
                </div>
              )}

              {/* Ingredients */}
              {selectedDrink.ingredients && selectedDrink.ingredients.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#14433B] mb-3 font-serif">วัถุดิบ</h3>
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
                            <p className="text-sm text-[#14433B]/70 font-sans">จำนวน: {ingredient.quantity} หน่วย</p>
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
                  <h3 className="text-lg font-semibold text-[#14433B] mb-3 font-serif">เลือกขนาดแก้ว</h3>
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
                            <p className="text-xs mt-1">+{size.priceExtra.toFixed(2)} บาท</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="mb-6 p-4 bg-[#FFF6F0] rounded-lg">
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
                      <span className="text-lg font-semibold text-[#14433B] font-sans">ราคารวม:</span>
                      <span className="text-2xl font-bold text-[#14433B] font-serif">${totalPrice.toFixed(2)}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => {
                  if (selectedDrink && modalCupSize) {
                    handleAddDrinkToCart(selectedDrink.id, modalCupSize);
                  }
                }}
                disabled={addingToCart || !modalCupSize || cupSizes.length === 0}
                className="w-full bg-[#14433B] text-[#FFF6F0] px-6 py-3 rounded-lg font-semibold hover:bg-[#1a5444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
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
