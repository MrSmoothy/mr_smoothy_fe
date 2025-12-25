"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getDrinks, getCupSizes, addToCart, type PredefinedDrink, type CupSize } from "@/lib/api";
import { getImageUrl } from "@/lib/image";
import { Minus, Plus, ShoppingCart } from "lucide-react";

export default function DrinkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const drinkId = Number(params.id);

  const [drink, setDrink] = useState<PredefinedDrink | null>(null);
  const [cupSizes, setCupSizes] = useState<CupSize[]>([]);
  const [selectedCupSize, setSelectedCupSize] = useState<CupSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadData();
  }, [router, drinkId]);

  async function loadData() {
    try {
      setLoading(true);
      const [drinksRes, cupSizesRes] = await Promise.all([
        getDrinks(),
        getCupSizes(),
      ]);
      
      const foundDrink = drinksRes.data?.find(d => d.id === drinkId);
      setDrink(foundDrink || null);
      
      const activeCupSizes = cupSizesRes.data?.filter(c => c.active) || [];
      setCupSizes(activeCupSizes);
      if (activeCupSizes.length > 0) {
        setSelectedCupSize(activeCupSizes[0]);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!selectedCupSize || !drink) return;

    try {
      setAddingToCart(true);
      await addToCart({
        type: "PREDEFINED",
        cupSizeId: selectedCupSize.id,
        quantity,
        predefinedDrinkId: drink.id,
      });
      window.dispatchEvent(new Event("cartUpdated"));
      alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว!");
      router.push("/cart");
    } catch (err: any) {
      alert(err.message || "ไม่สามารถเพิ่มลงตะกร้าได้");
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-[#14433B] text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  if (!drink) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#14433B] text-xl mb-4">ไม่พบสินค้า</p>
          <button
            onClick={() => router.push("/menu")}
            className="bg-[#14433B] text-[#FFF6F0] px-6 py-2 rounded-md"
          >
            กลับไปหน้าเมนู
          </button>
        </div>
      </div>
    );
  }

  const price = 25; // ราคาพื้นฐาน - สามารถดึงจาก API ได้ในอนาคต

  return (
    <div className="bg-[#FFF6F0] min-h-screen py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Image */}
          <div className="bg-[#FFF6F0] rounded-lg border border-[#14433B]/20 p-8">
            <div className="bg-gradient-to-b from-blue-200 to-blue-600 rounded-lg p-8 min-h-[500px] flex items-center justify-center relative overflow-hidden">
              {drink.imageUrl ? (
                <img
                  src={getImageUrl(drink.imageUrl)}
                  alt={drink.name}
                  className="max-w-full max-h-[400px] object-contain z-10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div className={`text-white text-2xl font-bold z-10 ${drink.imageUrl ? "hidden" : ""}`}>
                {drink.name}
              </div>
              {/* Decorative elements */}
              <div className="absolute bottom-0 left-0 w-full h-32 bg-white/20 backdrop-blur-sm" />
            </div>
            
            {/* Product Name and Ingredients below image */}
            <div className="mt-6">
              <h1 className="text-3xl font-bold text-[#14433B] mb-4">{drink.name.toUpperCase()}</h1>
              <div className="space-y-2">
                <p className="text-[#14433B] font-medium">ส่วนผสมหลัก:</p>
                {drink.ingredients && drink.ingredients.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {drink.ingredients.map((ing, idx) => (
                      <span key={idx} className="text-[#14433B]">
                        {ing.fruitName}
                        {idx < drink.ingredients.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#14433B]/70">ไม่มีข้อมูลส่วนผสม</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-[#14433B] mb-2">{drink.name}</h1>
              <p className="text-3xl font-bold text-[#14433B]">{price} บาท</p>
            </div>

            {/* Main Ingredients */}
            <div className="border-t border-[#14433B]/20 pt-6">
              <h2 className="text-xl font-bold text-[#14433B] mb-4">Main Ingredients</h2>
              {drink.ingredients && drink.ingredients.length > 0 ? (
                <ul className="space-y-2">
                  {drink.ingredients.map((ing, idx) => (
                    <li key={idx} className="text-[#14433B]">
                      • {ing.fruitName} ({ing.quantity} ชิ้น)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#14433B]/70">ไม่มีข้อมูลส่วนผสม</p>
              )}
            </div>

            {/* Nutrition */}
            <div className="border-t border-[#14433B]/20 pt-6">
              <h2 className="text-xl font-bold text-[#14433B] mb-4">Nutrition</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#14433B]/70">Calories</p>
                  <p className="text-[#14433B] font-semibold">290 kcal</p>
                </div>
                <div>
                  <p className="text-[#14433B]/70">Protein</p>
                  <p className="text-[#14433B] font-semibold">12 g</p>
                </div>
                <div>
                  <p className="text-[#14433B]/70">Fiber</p>
                  <p className="text-[#14433B] font-semibold">6 g</p>
                </div>
                <div>
                  <p className="text-[#14433B]/70">Sugar</p>
                  <p className="text-[#14433B] font-semibold">10 g</p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            {drink.description && (
              <div className="border-t border-[#14433B]/20 pt-6">
                <p className="text-[#14433B]/70 text-sm mb-2">Allergens</p>
                <p className="text-[#14433B]">{drink.description}</p>
              </div>
            )}

            {/* Add to Cart Section */}
            <div className="border-t border-[#14433B]/20 pt-6 space-y-4">
              <div>
                <label className="block text-[#14433B] font-semibold mb-2">เลือกขนาดแก้ว</label>
                <select
                  className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none bg-[#FFF6F0]"
                  value={selectedCupSize?.id}
                  onChange={(e) => {
                    const size = cupSizes.find(c => c.id === Number(e.target.value));
                    if (size) setSelectedCupSize(size);
                  }}
                >
                  {cupSizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.name} ({size.volumeMl}ml) - เพิ่ม {Number(size.priceExtra).toFixed(2)} บาท
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-[#14433B] font-semibold">จำนวน:</label>
                <div className="flex items-center border border-[#14433B]/30 rounded-md bg-[#FFF6F0]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-[#14433B] hover:bg-[#C9A78B] rounded-l-md transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-6 py-3 text-[#14433B] font-semibold min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-[#14433B] hover:bg-[#C9A78B] rounded-r-md transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedCupSize}
                className="w-full bg-black text-[#FFF6F0] px-6 py-4 rounded-md font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {addingToCart ? "กำลังเพิ่ม..." : "Add To Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

