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

  // Debug: Log when category or data changes
  useEffect(() => {
    if (drinks.length > 0 && fruits.length > 0) {
      console.log("🔍 Category Filter Debug:", {
        selectedCategory,
        totalDrinks: drinks.length,
        totalFruits: fruits.length,
        fruitsWithCategory: fruits.filter(f => f.category).length,
        sampleFruit: fruits[0] ? { 
          id: fruits[0].id, 
          name: fruits[0].name, 
          category: fruits[0].category 
        } : null,
        sampleDrink: drinks[0] ? {
          id: drinks[0].id,
          name: drinks[0].name,
          ingredientsCount: drinks[0].ingredients?.length || 0,
          ingredients: drinks[0].ingredients?.slice(0, 3).map(ing => ({
            fruitId: ing.fruitId,
            fruitName: ing.fruitName,
            fruitCategory: fruits.find(f => f.id === ing.fruitId)?.category || "NOT_FOUND"
          }))
        } : null
      });
    }
  }, [selectedCategory, drinks, fruits]);

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
              // Ensure category is set, default to FRUIT
              category: (f.category || "FRUIT") as FruitCategory
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
              category: (f.category || "FRUIT") as FruitCategory
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
      console.warn("No fruits loaded, cannot filter by category");
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
          console.warn(`Fruit not found for ingredient ${ing.fruitId} in drink ${drink.name}`);
          return "FRUIT" as FruitCategory;
        }
        // ใช้ category จาก fruit หรือ default เป็น FRUIT
        const fruitCategory: FruitCategory = (fruit.category || "FRUIT") as FruitCategory;
        return fruitCategory;
      });

      // ตรวจสอบว่ามีประเภทอะไรบ้าง
      const hasFruit = ingredientCategories.some(cat => cat === "FRUIT");
      const hasVegetable = ingredientCategories.some(cat => cat === "VEGETABLE");
      const hasAddon = ingredientCategories.some(cat => cat === "ADDON");
      const uniqueCategories = new Set(ingredientCategories);

      let matches = false;

      if (category === "FRUIT") {
        // น้ำผลไม้ล้วน: มีเฉพาะผลไม้เท่านั้น (ไม่มีผักและส่วนเสริม)
        matches = hasFruit && !hasVegetable && !hasAddon && uniqueCategories.size === 1 && uniqueCategories.has("FRUIT");
      } else if (category === "VEGETABLE") {
        // น้ำผัก: มีเฉพาะผักเท่านั้น (ไม่มีผลไม้และส่วนเสริม)
        matches = hasVegetable && !hasFruit && !hasAddon && uniqueCategories.size === 1 && uniqueCategories.has("VEGETABLE");
      } else if (category === "MIXED") {
        // น้ำผสม: มีทั้งผลไม้และผัก หรือมีส่วนเสริม หรือมีหลายประเภท
        matches = (hasFruit && hasVegetable) || hasAddon || uniqueCategories.size > 1;
      }

      if (matches) {
        console.log(`Drink "${drink.name}" matches category "${category}":`, {
          ingredientCategories: Array.from(uniqueCategories),
          hasFruit,
          hasVegetable,
          hasAddon,
          uniqueCount: uniqueCategories.size
        });
      }

      return matches;
    });

    console.log(`Category "${category}": Found ${filtered.length} drinks out of ${drinks.length} total`);
    return filtered;
  }

  // Popular smoothies - filter by category
  const filteredDrinks = getDrinksByCategory(selectedCategory);
  // ถ้าไม่มีผลลัพธ์ในหมวดหมู่ที่เลือก ให้แสดงทั้งหมด (เพื่อไม่ให้ว่างเปล่า)
  const popularDrinks = filteredDrinks.length > 0 ? filteredDrinks : (selectedCategory === "ALL" ? drinks.slice(0, 6) : []);

  function scrollLeft() {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  }

  function scrollRight() {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  }
  
  // Seasonal ingredients - ใช้ข้อมูลจาก API
  // ถ้าไม่มี seasonal ingredients ให้แสดง 4 ตัวแรกของ fruits
  const displaySeasonalIngredients = seasonalIngredients.length > 0 
    ? seasonalIngredients.slice(0, 4)
    : fruits.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#E8DDCB]">
      {/* Hero Section */}
      <section 
        className="relative py-20 px-6 min-h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/background1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-[#4A3728]/20"></div>
        
        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 font-serif drop-shadow-lg">
            Welcome to Mr.Smoothy
          </h1>
          <p className="text-lg md:text-xl text-white mb-8 max-w-2xl mx-auto font-sans drop-shadow-md">
            Your premium destination for healthy, delicious smoothies. Choose from our signature menu or create your perfect blend.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="bg-[#4A3728] text-[#E8DDCB] px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
            >
              Explore Ready Menu
            </Link>
            <Link
              href="/build"
              className="bg-white/90 text-[#4A3728] border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white transition-colors shadow-lg"
            >
              Build Your Own
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Smoothies Section */}
      <section className="bg-[#E8DDCB] py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-2 h-8 bg-[#4A3728]"></div>
              <h2 className="text-4xl font-bold text-[#4A3728] font-serif">Popular Smoothies</h2>
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  // Reset scroll position when changing category
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = 0;
                  }
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                  selectedCategory === "ALL"
                    ? "bg-[#4A3728] text-[#E8DDCB]"
                    : "bg-white text-[#4A3728] hover:bg-[#E8DDCB]"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("FRUIT");
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = 0;
                  }
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                  selectedCategory === "FRUIT"
                    ? "bg-[#4A3728] text-[#E8DDCB]"
                    : "bg-white text-[#4A3728] hover:bg-[#E8DDCB]"
                }`}
              >
                ผลไม้
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("VEGETABLE");
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = 0;
                  }
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                  selectedCategory === "VEGETABLE"
                    ? "bg-[#4A3728] text-[#E8DDCB]"
                    : "bg-white text-[#4A3728] hover:bg-[#E8DDCB]"
                }`}
              >
                ผัก
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("MIXED");
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = 0;
                  }
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                  selectedCategory === "MIXED"
                    ? "bg-[#4A3728] text-[#E8DDCB]"
                    : "bg-white text-[#4A3728] hover:bg-[#E8DDCB]"
                }`}
              >
                น้ำผสม
              </button>
            </div>
          </div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
              aria-label="เลื่อนซ้าย"
            >
              <ChevronLeft className="w-6 h-6 text-[#4A3728]" />
            </button>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {loading ? (
                <div className="w-full text-center text-[#4A3728]/60 py-8">กำลังโหลด...</div>
              ) : popularDrinks.length === 0 ? (
                <div className="w-full text-center text-[#4A3728]/60 py-8">ยังไม่มีเมนูน้ำปั่นในหมวดหมู่นี้</div>
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
                          <div className="absolute inset-0 bg-[#4A3728]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3">
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
                      {/* Text Area - reduced padding */}
                      <div className="p-4 bg-white">
                        <h3 className="text-lg font-bold text-[#4A3728] mb-1 font-sans line-clamp-1">{drink.name}</h3>
                        <p className="text-xs text-[#4A3728]/70 mb-3 min-h-[2rem] line-clamp-2 font-sans">
                          {drink.description || "Delicious smoothie blend"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-[#4A3728] font-serif">฿{price.toFixed(2)}</span>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openModal(drink);
                            }}
                            className="bg-[#4A3728] text-[#E8DDCB] w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#5A3C2B] transition-colors font-bold text-base"
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
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
              aria-label="เลื่อนขวา"
            >
              <ChevronRight className="w-6 h-6 text-[#4A3728]" />
            </button>
          </div>
        </div>
      </section>

      {/* Seasonal Ingredients Section */}
      <section className="bg-[#E8DDCB] py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#4A3728] mb-2 font-serif">วัตถุดิบตามฤดูกาล</h2>
            <p className="text-lg text-[#4A3728]/80 font-sans">ผลไม้และผักตามฤดูกาลที่คัดสรรมาอย่างดี</p>
          </div>
          {displaySeasonalIngredients.length === 0 ? (
            <div className="text-center text-[#4A3728]/60 py-8 font-sans">
              ยังไม่มีวัตถุดิบตามฤดูกาล
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {displaySeasonalIngredients.map((ingredient) => (
                <div key={ingredient.id} className="text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md overflow-hidden">
                    {ingredient.imageUrl ? (
                      <img
                        src={getImageUrl(ingredient.imageUrl)}
                        alt={ingredient.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          const fallback = (e.target as HTMLImageElement).nextElementSibling;
                          if (fallback) (fallback as HTMLElement).classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${ingredient.imageUrl ? "hidden" : ""}`}>
                      <span className="text-5xl">
                        {ingredient.category === "FRUIT" ? "🍎" : ingredient.category === "VEGETABLE" ? "🥬" : "🥛"}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#4A3728] mb-2 font-sans">{ingredient.name}</h3>
                  <p className="text-sm text-[#4A3728]/70 font-sans line-clamp-2">
                    {ingredient.description || (ingredient.category === "FRUIT" ? "ผลไม้สดใหม่" : ingredient.category === "VEGETABLE" ? "ผักสดใหม่" : "ส่วนเสริม")}
                  </p>
                  <p className="text-sm text-[#4A3728] font-semibold mt-2 font-sans">
                    ฿{Number(ingredient.pricePerUnit).toFixed(2)}/หน่วย
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section 
        className="relative py-20 px-6 min-h-[500px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/background2.png')",
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-[#4A3728]/60"></div>
        
        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif drop-shadow-lg">
            Ready to Start Your Healthy Journey?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto font-sans drop-shadow-md">
            Join thousands of satisfied customers who have transformed their health with Mr.Smoothy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-[#4A3728] px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
            >
              Get Started Now
            </Link>
            <Link
              href="/menu"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Special Offer Banner */}
      <section className="bg-[#4A3728] py-12 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="bg-[#E8DDCB] rounded-lg p-8 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">🎉</span>
              <h3 className="text-2xl font-bold text-[#4A3728] font-sans">Special Offer This Week</h3>
            </div>
            <p className="text-lg text-[#4A3728] mb-2 font-sans">Get 20% off all High-Protein Smoothies!</p>
            <p className="text-[#4A3728] font-semibold font-sans">Use code: PROTEIN20</p>
          </div>
        </div>
      </section>

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
                      <span className="text-2xl font-bold text-[#4A3728] font-serif">${totalPrice.toFixed(2)}</span>
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
