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

  async function handleAddToCart(drinkId: number) {
    if (!selectedCupSize && cupSizes.length > 0) {
      setSelectedCupSize(cupSizes[0]);
    }
    
    const cupSize = selectedCupSize || (cupSizes.length > 0 ? cupSizes[0] : null);
    if (!cupSize) {
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

        const cupSizePrice = cupSize.priceExtra || 0;
        const unitPrice = basePrice + cupSizePrice;
        const totalPrice = unitPrice;

        const guestItem = {
          type: "PREDEFINED" as const,
          cupSizeId: cupSize.id,
          cupSizeName: cupSize.name,
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

    // Logged in user
    try {
      setAddingToCart(true);
      await addToCart({
        type: "PREDEFINED",
        cupSizeId: cupSize.id,
        quantity: 1,
        predefinedDrinkId: drinkId,
      });
      window.dispatchEvent(new Event("cartUpdated"));
      alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว! 🎉");
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
        <Link href={`/drinks/${drink.id}`} className="block">
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
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddToCart(drink.id);
          }}
          disabled={addingToCart || cupSizes.length === 0}
          className="absolute bottom-4 right-4 bg-[#4A3728] text-[#E8DDCB] w-8 h-8 rounded flex items-center justify-center hover:bg-[#5A3C2B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

