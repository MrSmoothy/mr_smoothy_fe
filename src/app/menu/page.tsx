"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getFruits, getDrinks, getCupSizes, addToCart, type Fruit, type PredefinedDrink, type CupSize } from "@/lib/api";
import { getImageUrl } from "@/lib/image";

export default function MenuPage() {
  const router = useRouter();
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [drinks, setDrinks] = useState<PredefinedDrink[]>([]);
  const [cupSizes, setCupSizes] = useState<CupSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrink, setSelectedDrink] = useState<PredefinedDrink | null>(null);
  const [selectedCupSize, setSelectedCupSize] = useState<CupSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedFruits, setSelectedFruits] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadData();
  }, [router]);

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

  function toggleFruitSelection(fruitId: number) {
    setSelectedFruits(prev => {
      const newMap = new Map(prev);
      if (newMap.has(fruitId)) {
        const currentQty = newMap.get(fruitId) || 0;
        if (currentQty <= 1) {
          newMap.delete(fruitId);
        } else {
          newMap.set(fruitId, currentQty - 1);
        }
      } else {
        newMap.set(fruitId, 1);
      }
      return newMap;
    });
  }

  function increaseFruitQuantity(fruitId: number) {
    setSelectedFruits(prev => {
      const newMap = new Map(prev);
      newMap.set(fruitId, (newMap.get(fruitId) || 0) + 1);
      return newMap;
    });
  }

  async function handleAddToCart(type: "PREDEFINED" | "CUSTOM", drinkId?: number) {
    if (!selectedCupSize) {
      alert("กรุณาเลือกขนาดแก้ว");
      return;
    }

    if (type === "CUSTOM" && selectedFruits.size === 0) {
      alert("กรุณาเลือกผลไม้/ผักอย่างน้อย 1 ชนิด");
      return;
    }

    try {
      setAddingToCart(true);
      const ingredients = type === "CUSTOM" 
        ? Array.from(selectedFruits.entries()).map(([fruitId, qty]) => ({ fruitId, quantity: qty }))
        : undefined;
      
      await addToCart({
        type,
        cupSizeId: selectedCupSize.id,
        quantity,
        predefinedDrinkId: drinkId,
        ingredients,
      });
      // Notify header to refresh cart count
      window.dispatchEvent(new Event("cartUpdated"));
      alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว!");
      setQuantity(1);
      setSelectedDrink(null);
      setSelectedFruits(new Map());
    } catch (err: any) {
      alert(err.message || "ไม่สามารถเพิ่มลงตะกร้าได้");
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="text-[#4A2C1B] text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  // Group drinks by category (คุณสามารถเพิ่ม category field ใน backend ได้)
  // สำหรับตอนนี้เราจะใช้การจัดกลุ่มแบบง่ายๆ
  const signatureDrinks = drinks.slice(0, 4);
  const classicDrinks = drinks.slice(4, 8);
  const greenBoosterDrinks = drinks.slice(8, 12);
  const highProteinDrinks = drinks.slice(12, 16);
  const superfruitsDrinks = drinks.slice(16, 20);

  function renderDrinkCard(drink: PredefinedDrink) {
    const price = 25; // ราคาพื้นฐาน
    return (
      <Link
        href={`/drinks/${drink.id}`}
        key={drink.id}
        className="bg-[#F5EFE6] rounded-lg border border-[#4A2C1B]/20 p-4 hover:shadow-lg transition-all relative group"
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
        <div className={`w-full h-48 bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-gray-400 ${drink.imageUrl ? "hidden" : ""}`}>
          ไม่มีรูปภาพ
        </div>
        <h4 className="font-semibold text-[#4A2C1B] mb-1">{drink.name}</h4>
        {drink.description && (
          <p className="text-[#4A2C1B]/70 text-xs mb-2 line-clamp-2">{drink.description}</p>
        )}
        <p className="text-[#4A2C1B] font-bold mb-3">{price} บาท</p>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectedCupSize) {
              handleAddToCart("PREDEFINED", drink.id);
            }
          }}
          className="absolute bottom-4 right-4 bg-[#4A2C1B] text-[#F5EFE6] w-8 h-8 rounded flex items-center justify-center hover:bg-[#5A3C2B] transition-colors"
        >
          +
        </button>
      </Link>
    );
  }

  return (
    <div className="bg-[#F5EFE6] min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="text-4xl font-bold text-[#4A2C1B] mb-8">เมนูน้ำปั่น</h1>

        {/* Signature Drinks */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#4A2C1B] mb-6">Signature</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {signatureDrinks.length > 0 ? (
              signatureDrinks.map(renderDrinkCard)
            ) : (
              <div className="col-span-4 text-center text-[#4A2C1B]/60 py-8">
                ยังไม่มีเมนูในหมวดนี้
              </div>
            )}
          </div>
        </section>

        {/* Classic Drinks */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#4A2C1B] mb-6">Classic</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {classicDrinks.length > 0 ? (
              classicDrinks.map(renderDrinkCard)
            ) : (
              <div className="col-span-4 text-center text-[#4A2C1B]/60 py-8">
                ยังไม่มีเมนูในหมวดนี้
              </div>
            )}
          </div>
        </section>

        {/* Green Booster */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#4A2C1B] mb-6">Green Booster</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {greenBoosterDrinks.length > 0 ? (
              greenBoosterDrinks.map(renderDrinkCard)
            ) : (
              <div className="col-span-4 text-center text-[#4A2C1B]/60 py-8">
                ยังไม่มีเมนูในหมวดนี้
              </div>
            )}
          </div>
        </section>

        {/* High-Protein Smoothies */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#4A2C1B] mb-6">High-Protein Smoothies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {highProteinDrinks.length > 0 ? (
              highProteinDrinks.map(renderDrinkCard)
            ) : (
              <div className="col-span-4 text-center text-[#4A2C1B]/60 py-8">
                ยังไม่มีเมนูในหมวดนี้
              </div>
            )}
          </div>
        </section>

        {/* Superfruits */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#4A2C1B] mb-6">Superfruits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {superfruitsDrinks.length > 0 ? (
              superfruitsDrinks.map(renderDrinkCard)
            ) : (
              <div className="col-span-4 text-center text-[#4A2C1B]/60 py-8">
                ยังไม่มีเมนูในหมวดนี้
              </div>
            )}
          </div>
        </section>

        {/* Custom Drink Builder */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#4A2C1B] mb-6">สร้างเมนูของคุณเอง</h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <label className="block text-[#4A2C1B] font-semibold mb-3">เลือกผลไม้/ผัก</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {fruits.map((fruit) => {
                  const quantity = selectedFruits.get(fruit.id) || 0;
                  const isSelected = quantity > 0;
                  return (
                    <div
                      key={fruit.id}
                      className={`border rounded-lg p-4 transition-all cursor-pointer ${
                        isSelected 
                          ? "border-[#4A2C1B] bg-[#C9A78B]/30" 
                          : "border-[#4A2C1B]/20 hover:border-[#4A2C1B]"
                      }`}
                      onClick={() => toggleFruitSelection(fruit.id)}
                    >
                      {fruit.imageUrl ? (
                        <img
                          src={getImageUrl(fruit.imageUrl)}
                          alt={fruit.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-400 text-sm ${fruit.imageUrl ? "hidden" : ""}`}>
                        ไม่มีรูปภาพ
                      </div>
                      <p className="font-semibold text-[#4A2C1B] text-sm mb-1">{fruit.name}</p>
                      {fruit.description && (
                        <p className="text-[#4A2C1B]/70 text-xs mb-1 line-clamp-1">{fruit.description}</p>
                      )}
                      <p className="text-[#4A2C1B]/70 text-xs mb-2">{Number(fruit.pricePerUnit).toFixed(2)} บาท</p>
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFruitSelection(fruit.id);
                            }}
                            className="bg-[#4A2C1B] text-[#F5EFE6] w-6 h-6 rounded flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="text-[#4A2C1B] font-bold">{quantity}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              increaseFruitQuantity(fruit.id);
                            }}
                            className="bg-[#4A2C1B] text-[#F5EFE6] w-6 h-6 rounded flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedFruits.size > 0 && (
                <div className="mt-4 p-3 bg-[#C9A78B]/30 rounded-lg">
                  <p className="text-sm text-[#4A2C1B] font-medium mb-2">สินค้าที่เลือก:</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedFruits.entries()).map(([fruitId, qty]) => {
                      const fruit = fruits.find(f => f.id === fruitId);
                      return fruit ? (
                        <span
                          key={fruitId}
                          className="bg-[#4A2C1B] text-[#F5EFE6] px-3 py-1 rounded-full text-sm"
                        >
                          {fruit.name} x{qty}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="mb-6">
              <label className="block text-[#4A2C1B] font-semibold mb-3">เลือกขนาดแก้ว</label>
              <select
                className="w-full rounded-md border border-[#4A2C1B]/30 px-4 py-3 text-[#4A2C1B] outline-none"
                value={selectedCupSize?.id}
                onChange={(e) => {
                  const size = cupSizes.find(c => c.id === Number(e.target.value));
                  if (size) setSelectedCupSize(size);
                }}
              >
                {cupSizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name} ({size.volumeMl}ml) - เพิ่ม {size.priceExtra.toFixed(2)} บาท
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-[#4A2C1B] font-semibold mb-3">จำนวน</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-md border border-[#4A2C1B]/30 px-4 py-3 text-[#4A2C1B] outline-none"
              />
            </div>
            <button
              onClick={() => handleAddToCart("CUSTOM")}
              disabled={addingToCart || selectedFruits.size === 0}
              className="w-full bg-[#4A2C1B] text-[#F5EFE6] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {addingToCart ? "กำลังเพิ่ม..." : "เพิ่มลงตะกร้า"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

