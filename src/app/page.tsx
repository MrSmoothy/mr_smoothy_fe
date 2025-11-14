"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getFruits, getDrinks, getCupSizes, addToCart, type Fruit, type PredefinedDrink, type CupSize } from "@/lib/api";
import { addToGuestCart } from "@/lib/guestCart";
import { getImageUrl } from "@/lib/image";

const MAX_FRUITS = 5;

export default function Home() {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [drinks, setDrinks] = useState<PredefinedDrink[]>([]);
  const [cupSizes, setCupSizes] = useState<CupSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

      const filteredFruits = Array.isArray(fruitsRes.data) 
        ? fruitsRes.data.filter(f => f && f.active) 
        : [];
      const filteredDrinks = Array.isArray(drinksRes.data) 
        ? drinksRes.data.filter(d => d && d.active) 
        : [];
      const filteredCupSizes = Array.isArray(cupSizesRes.data) 
        ? cupSizesRes.data.filter(c => c && c.active) 
        : [];
      
      setFruits(filteredFruits);
      setDrinks(filteredDrinks);
      setCupSizes(filteredCupSizes);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setFruits([]);
      setDrinks([]);
      setCupSizes([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDrinkToCart(drinkId: number) {
    if (!cupSizes || cupSizes.length === 0) {
      alert("กรุณารอสักครู่เพื่อโหลดข้อมูลขนาดแก้ว");
      return;
    }

    const selectedCupSize = cupSizes[0];

    if (!user) {
      try {
        const drink = drinks.find(d => d.id === drinkId);
        if (!drink) return;

        const cupSizePrice = selectedCupSize.priceExtra || 0;
        const unitPrice = 100 + cupSizePrice;
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
      }
      return;
    }

    try {
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
    }
  }

  // Popular smoothies - ใช้ 3 smoothies แรก
  const popularDrinks = drinks.slice(0, 3);
  
  // Premium ingredients - ใช้ 4 fruits แรก
  const premiumIngredients = fruits.slice(0, 4);

  // Mock data for ingredients display
  const ingredientsData = [
    {
      name: "Organic Spinach",
      benefit: "Rich in iron and vitamins",
      icon: "🥬",
    },
    {
      name: "Fresh Berries",
      benefit: "Antioxidant powerhouse",
      icon: "🫐",
    },
    {
      name: "Almond Milk",
      benefit: "Dairy-free calcium source",
      icon: "🥛",
    },
    {
      name: "Chia Seeds",
      benefit: "Omega-3 fatty acids",
      icon: "🌱",
    },
  ];

  return (
    <div className="min-h-screen bg-[#E8DDCB]">
      {/* Hero Section */}
      <section className="bg-[#E8DDCB] py-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-[#4A3728] mb-6 font-serif">
            Welcome to Mr.Smoothy
          </h1>
          <p className="text-lg md:text-xl text-[#4A3728] mb-8 max-w-2xl mx-auto font-sans">
            Your premium destination for healthy, delicious smoothies. Choose from our signature menu or create your perfect blend.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="bg-[#4A3728] text-[#E8DDCB] px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Explore Ready Menu
            </Link>
            <Link
              href="/build"
              className="bg-[#E8DDCB] text-[#4A3728] border-2 border-[#4A3728] px-8 py-3 rounded-lg font-semibold hover:bg-[#D4C5B0] transition-colors"
            >
              Build Your Own
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Smoothies Section */}
      <section className="bg-[#E8DDCB] py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#4A3728] mb-2 font-serif">Popular Smoothies</h2>
            <p className="text-lg text-[#4A3728]/80 font-sans">Customer favorites you'll love</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-3 text-center text-[#4A3728]/60 py-8">กำลังโหลด...</div>
            ) : popularDrinks.length === 0 ? (
              <div className="col-span-3 text-center text-[#4A3728]/60 py-8">ยังไม่มีเมนูน้ำปั่น</div>
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
                  price = basePrice + cupPrice; // Price is already in the base currency
                  // If prices seem too high, they might be in cents - divide by 100
                  if (price > 1000) {
                    price = price / 100;
                  }
                } else {
                  // Mock prices matching the design
                  const prices = [12.99, 11.99, 12.49];
                  price = prices[index] || 12.99;
                }
                
                return (
                  <div
                    key={drink.id}
                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  >
                    {/* Image Area - light brown background */}
                    <div className="h-64 bg-[#D4C5B0] flex items-center justify-center relative">
                      {drink.imageUrl ? (
                        <img
                          src={getImageUrl(drink.imageUrl)}
                          alt={drink.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="text-6xl">🥤</div>';
                            }
                          }}
                        />
                      ) : (
                        <div className="text-6xl">🥤</div>
                      )}
                    </div>
                    {/* Text Area - white background */}
                    <div className="p-6 bg-white">
                      <h3 className="text-xl font-bold text-[#4A3728] mb-2 font-sans">{drink.name}</h3>
                      <p className="text-sm text-[#4A3728]/70 mb-4 min-h-[2.5rem] font-sans">
                        {drink.description || "Delicious smoothie blend"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-[#4A3728]">${price.toFixed(2)}</span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddDrinkToCart(drink.id);
                          }}
                          className="bg-[#D4C5B0] text-[#4A3728] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#C4B5A0] transition-colors"
                        >
                          Signature
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Premium Ingredients Section */}
      <section className="bg-[#E8DDCB] py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#4A3728] mb-2 font-serif">Premium Ingredients.</h2>
            <p className="text-lg text-[#4A3728]/80 font-sans">Only the finest for your health.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {ingredientsData.map((ingredient, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="text-5xl">{ingredient.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-[#4A3728] mb-2 font-sans">{ingredient.name}</h3>
                <p className="text-sm text-[#4A3728]/70 font-sans">{ingredient.benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-[#4A3728] py-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">
            Ready to Start Your Healthy Journey?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto font-sans">
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
    </div>
  );
}
