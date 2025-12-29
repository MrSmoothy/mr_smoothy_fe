"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  adminAddIngredientWithNutrition,
  type IngredientAddRequest,
  type IngredientAddResponse,
  type FruitCategory,
} from "@/lib/api";
import { toast } from "@/app/components/Toast";

export default function AddIngredientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<IngredientAddRequest>({
    name: "",
    description: "",
    imageUrl: "",
    pricePerUnit: 0,
    category: "ORGANIC_FRUITS",
    active: true,
    seasonal: false,
    fetchNutrition: true, // Default to true
  });
  const [result, setResult] = useState<IngredientAddResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (formData.fetchNutrition) {
        toast("กำลังเพิ่มวัถุดิบและดึงข้อมูลโภชนาการ...", "info", 2000);
      } else {
        toast("กำลังเพิ่มวัถุดิบ...", "info", 2000);
      }
      const response = await adminAddIngredientWithNutrition(formData);
      if (response.data) {
        setResult(response.data);
        if (formData.fetchNutrition) {
          toast("เพิ่มวัถุดิบสำเร็จ! ระบบได้ดึงข้อมูลโภชนาการอัตโนมัติแล้ว ✅", "success");
        } else {
          toast("เพิ่มวัถุดิบสำเร็จ! ✅", "success");
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || "เกิดข้อผิดพลาดในการเพิ่มวัถุดิบ";
      setError(errorMsg);
      toast(errorMsg, "error", 8000);
      console.error("Error adding ingredient:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#FFF6F0] min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-6">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-[#14433B] hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          กลับ
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[#14433B] mb-2">
            เพิ่มวัถุดิบ
          </h1>
          <p className="text-[#14433B]/70 mb-6">
            คุณสามารถเลือกให้ระบบดึงข้อมูลโภชนาการจาก USDA FoodData Central API 
            และประมวลผลด้วย OpenAI เพื่อเพิ่มข้อมูลรสชาติและการจับคู่ หรือเพิ่มโดยไม่มีข้อมูลโภชนาการ
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#14433B] font-semibold mb-2">
                ชื่อวัถุดิบ *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                placeholder="เช่น Banana, กล้วย, Strawberry, สตรอเบอร์รี่"
                required
              />
              <p className="text-sm text-[#14433B]/60 mt-1">
                💡 ใส่ชื่อเป็นภาษาไทยหรืออังกฤษได้ ระบบจะแปลและดึงข้อมูลโภชนาการอัตโนมัติ
              </p>
            </div>

            <div>
              <label className="block text-[#14433B] font-semibold mb-2">
                คำอธิบาย (ไม่บังคับ)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
              />
            </div>

            <div>
              <label className="block text-[#14433B] font-semibold mb-2">
                ราคาต่อหน่วย (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePerUnit}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
              />
            </div>

            <div>
              <label className="block text-[#14433B] font-semibold mb-2">หมวดหมู่</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as FruitCategory })
                }
                className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
              >
                <option value="ORGANIC_FRUITS">🍎 ORGANIC FRUITS</option>
                <option value="ORGANIC_VEGETABLE">🥬 ORGANIC VEGETABLE</option>
                <option value="BASE">🥛 BASE</option>
                <option value="SUPERFRUITS">🌟 SUPERFRUITS</option>
                <option value="PROTEIN">💪 PROTEIN</option>
                <option value="TOPPING">🍒 TOPPING</option>
                <option value="SWEETENER">🍯 SWEETENER</option>
              </select>
            </div>

            <div>
              <label className="block text-[#14433B] font-semibold mb-2">URL รูปภาพ</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="fetchNutrition"
                  checked={formData.fetchNutrition ?? true}
                  onChange={(e) => setFormData({ ...formData, fetchNutrition: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="fetchNutrition" className="text-[#14433B] font-semibold cursor-pointer">
                  ดึงข้อมูลโภชนาการจาก USDA (จะใช้ AI สำหรับข้อมูลรสชาติ)
                </label>
              </div>
              <p className="text-sm text-[#14433B]/60 ml-7 -mt-2">
                💡 ถ้าไม่เลือก ระบบจะเพิ่มวัถุดิบโดยไม่มีข้อมูลโภชนาการ คุณสามารถดึงข้อมูลภายหลังได้
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="active" className="text-[#14433B] font-semibold">
                  แสดงให้ลูกค้าเห็น
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="seasonal"
                  checked={formData.seasonal}
                  onChange={(e) => setFormData({ ...formData, seasonal: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="seasonal" className="text-[#14433B] font-semibold">
                  Seasonal Ingredients
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 text-[#14433B] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#14433B] text-[#FFF6F0] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังประมวลผล...
                  </>
                ) : (
                  "เพิ่มวัถุดิบ"
                )}
              </button>
            </div>
          </form>

          {result && (
            <div className="mt-8 p-6 bg-[#14433B]/10 border border-[#14433B]/20 rounded-lg">
              <h2 className="text-xl font-bold text-[#14433B] mb-4">ผลลัพธ์</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">ชื่อ:</span> {result.name}
                </div>
                {result.calorie && (
                  <div>
                    <span className="font-semibold">แคลอรี่:</span> {result.calorie} kcal/100g
                  </div>
                )}
                {result.protein && (
                  <div>
                    <span className="font-semibold">โปรตีน:</span> {result.protein} g/100g
                  </div>
                )}
                {result.fiber && (
                  <div>
                    <span className="font-semibold">ไฟเบอร์:</span> {result.fiber} g/100g
                  </div>
                )}
                {result.flavorProfile && (
                  <div>
                    <span className="font-semibold">รสชาติ:</span> {result.flavorProfile}
                  </div>
                )}
                {result.tasteNotes && (
                  <div>
                    <span className="font-semibold">รายละเอียดรสชาติ:</span> {result.tasteNotes}
                  </div>
                )}
                {result.bestMixPairing && (
                  <div>
                    <span className="font-semibold">จับคู่ได้ดีกับ:</span>{" "}
                    {JSON.parse(result.bestMixPairing).join(", ")}
                  </div>
                )}
                {result.avoidPairing && (
                  <div>
                    <span className="font-semibold">ควรหลีกเลี่ยง:</span>{" "}
                    {JSON.parse(result.avoidPairing).join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

