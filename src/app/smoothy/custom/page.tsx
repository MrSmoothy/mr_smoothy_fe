"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X, ArrowUpDown } from "lucide-react";
import {
  getFruits,
  calculateSmoothy,
  type Fruit,
  type SmoothyCalcRequest,
  type SmoothyCalcResponse,
} from "@/lib/api";
import { getImageUrl } from "@/lib/image";

export default function SmoothyCustomPage() {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<
    Array<{ ingredientId: number; name: string; amount: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<SmoothyCalcResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"none" | "price-asc" | "price-desc">("none");

  useEffect(() => {
    loadFruits();
  }, []);

  async function loadFruits() {
    try {
      setLoading(true);
      const res = await getFruits();
      setFruits(res.data || []);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  function addIngredient(fruit: Fruit) {
    const exists = selectedIngredients.find((i) => i.ingredientId === fruit.id);
    if (exists) {
      setSelectedIngredients(
        selectedIngredients.map((i) =>
          i.ingredientId === fruit.id ? { ...i, amount: i.amount + 50 } : i
        )
      );
    } else {
      setSelectedIngredients([
        ...selectedIngredients,
        { ingredientId: fruit.id, name: fruit.name, amount: 50 },
      ]);
    }
  }

  function removeIngredient(ingredientId: number) {
    setSelectedIngredients(selectedIngredients.filter((i) => i.ingredientId !== ingredientId));
  }

  function updateAmount(ingredientId: number, amount: number) {
    setSelectedIngredients(
      selectedIngredients.map((i) =>
        i.ingredientId === ingredientId ? { ...i, amount } : i
      )
    );
  }

  async function handleCalculate() {
    if (selectedIngredients.length === 0) {
      alert("กรุณาเลือกวัตถุดิบอย่างน้อย 1 ชนิด");
      return;
    }

    setCalculating(true);
    setError(null);
    setResult(null);

    try {
      const request: SmoothyCalcRequest = {
        ingredients: selectedIngredients.map((i) => ({
          ingredientId: i.ingredientId,
          amount: i.amount,
        })),
      };

      const response = await calculateSmoothy(request);
      if (response.data) {
        setResult(response.data);
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการคำนวณ");
      console.error("Error calculating smoothy:", err);
    } finally {
      setCalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-[#14433B] text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF6F0] min-h-screen py-12">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="text-3xl font-bold text-[#14433B] mb-8">สร้าง Smoothy แบบกำหนดเอง</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Ingredient Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-[#14433B]">เลือกวัตถุดิบ</h2>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-[#14433B]" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "none" | "price-asc" | "price-desc")}
                  className="bg-white border-2 border-[#14433B]/30 rounded-lg px-4 py-2 text-[#14433B] font-semibold focus:outline-none focus:border-[#14433B] focus:ring-2 focus:ring-[#14433B]/20 transition-all cursor-pointer text-sm"
                >
                  <option value="none">เรียงตามค่าเริ่มต้น</option>
                  <option value="price-asc">ราคา: น้อย → มาก</option>
                  <option value="price-desc">ราคา: มาก → น้อย</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {(() => {
                // Sort fruits based on sortOrder
                let sortedFruits = [...fruits];
                if (sortOrder === "price-asc") {
                  sortedFruits.sort((a, b) => Number(a.pricePerUnit) - Number(b.pricePerUnit));
                } else if (sortOrder === "price-desc") {
                  sortedFruits.sort((a, b) => Number(b.pricePerUnit) - Number(a.pricePerUnit));
                }
                return sortedFruits.map((fruit) => (
                  <button
                    key={fruit.id}
                    onClick={() => addIngredient(fruit)}
                    className="bg-[#FFF6F0] rounded-lg p-3 hover:bg-[#C9A78B] transition-colors text-left"
                  >
                    {fruit.imageUrl && (
                      <img
                        src={getImageUrl(fruit.imageUrl)}
                        alt={fruit.name}
                        className="w-full h-20 object-cover rounded mb-2"
                      />
                    )}
                    <div className="text-sm font-semibold text-[#14433B]">{fruit.name}</div>
                    <div className="text-xs text-[#14433B]/70">
                      {Number(fruit.pricePerUnit).toFixed(2)} ฿
                    </div>
                  </button>
                ));
              })()}
            </div>

            {/* Selected Ingredients */}
            {selectedIngredients.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-[#14433B] mb-3">วัตถุดิบที่เลือก</h3>
                <div className="space-y-2">
                  {selectedIngredients.map((ingredient) => (
                    <div
                      key={ingredient.ingredientId}
                      className="flex items-center justify-between bg-[#FFF6F0] rounded-lg p-3"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-[#14433B]">{ingredient.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            min="1"
                            step="10"
                            value={ingredient.amount}
                            onChange={(e) =>
                              updateAmount(ingredient.ingredientId, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 rounded border border-[#14433B]/30 text-sm"
                          />
                          <span className="text-sm text-[#14433B]/70">กรัม</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeIngredient(ingredient.ingredientId)}
                        className="text-red-500 hover:text-red-700 ml-4"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="w-full mt-4 bg-[#14433B] text-[#FFF6F0] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {calculating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      กำลังคำนวณ...
                    </>
                  ) : (
                    "คำนวณโภชนาการและรสชาติ"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-[#14433B] mb-4">ผลลัพธ์</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {result ? (
              <div className="space-y-6">
                {/* Nutrition Summary */}
                <div className="bg-[#FFF6F0] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#14433B] mb-3">ข้อมูลโภชนาการ</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#14433B]">แคลอรี่:</span>
                      <span className="font-semibold text-[#14433B]">
                        {result.totalNutrition.totalCalorie.toFixed(2)} kcal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#14433B]">โปรตีน:</span>
                      <span className="font-semibold text-[#14433B]">
                        {result.totalNutrition.totalProtein.toFixed(2)} g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#14433B]">ไฟเบอร์:</span>
                      <span className="font-semibold text-[#14433B]">
                        {result.totalNutrition.totalFiber.toFixed(2)} g
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flavor Description */}
                {result.flavorDescription && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[#14433B] mb-2">คำอธิบายรสชาติ</h3>
                    <p className="text-[#14433B]">{result.flavorDescription}</p>
                  </div>
                )}

                {/* Synergy */}
                {result.synergy && result.synergy.length > 0 && (
                  <div className="bg-[#14433B]/10 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[#14433B] mb-2">
                      💚 การทำงานร่วมกันที่ดี
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-[#14433B]">
                      {result.synergy.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cancellation */}
                {result.cancellation && result.cancellation.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[#14433B] mb-2">
                      ⚠️ ข้อควรระวัง
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-[#14433B]">
                      {result.cancellation.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-[#14433B]/70 py-12">
                เลือกวัตถุดิบและกดคำนวณเพื่อดูผลลัพธ์
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

