"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminGetFruits, adminUpdateFruit, type Fruit, type FruitCategory } from "@/lib/api";
import { getImageUrl } from "@/lib/image";
import { Save, RefreshCw, CheckCircle } from "lucide-react";

export default function HomeEditorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [ingredients, setIngredients] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FruitCategory | "ALL">("ALL");
  const [seasonalMap, setSeasonalMap] = useState<Map<number, boolean>>(new Map());
  const [snowAnimation, setSnowAnimation] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadIngredients();
      // โหลดการตั้งค่าอนิเมชั่นหิมะ
      const snowEnabled = localStorage.getItem("snowAnimation") === "true";
      setSnowAnimation(snowEnabled);
    }
  }, [user]);

  function checkAuth() {
    try {
      const stored = localStorage.getItem("auth_user");
      const userData = stored ? JSON.parse(stored) : null;

      if (!userData || userData.role !== "ADMIN") {
        router.push("/login");
        return;
      }

      setUser(userData);
    } catch (err) {
      router.push("/login");
    }
  }

  async function loadIngredients() {
    try {
      setLoading(true);
      const res = await adminGetFruits();
      if (res.data) {
        const filtered = res.data
          .filter(f => f && f.active)
          .map(f => ({
            ...f,
            category: (f.category || "ORGANIC_FRUITS") as FruitCategory
          }));
        setIngredients(filtered);
        
        // Initialize seasonal map
        const map = new Map<number, boolean>();
        filtered.forEach(ing => {
          map.set(ing.id, ing.seasonal || false);
        });
        setSeasonalMap(map);
      }
    } catch (err: any) {
      console.error("Failed to load ingredients:", err);
      alert(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  function toggleSeasonal(ingredientId: number) {
    const newMap = new Map(seasonalMap);
    const currentValue = newMap.get(ingredientId) || false;
    newMap.set(ingredientId, !currentValue);
    setSeasonalMap(newMap);
  }

  async function handleSave() {
    try {
      setSaving(true);
      
      // Get all ingredients that need to be updated
      const updates: Array<{ id: number; seasonal: boolean }> = [];
      seasonalMap.forEach((seasonal, id) => {
        const ingredient = ingredients.find(ing => ing.id === id);
        if (ingredient && ingredient.seasonal !== seasonal) {
          updates.push({ id, seasonal });
        }
      });

      if (updates.length === 0) {
        alert("ไม่มีข้อมูลที่ต้องอัพเดต");
        return;
      }

      // Update each ingredient
      const updatePromises = updates.map(update => {
        const ingredient = ingredients.find(ing => ing.id === update.id);
        if (!ingredient) return Promise.resolve();
        
        return adminUpdateFruit(update.id, {
          seasonal: update.seasonal
        });
      });

      await Promise.all(updatePromises);
      
      alert("บันทึกข้อมูลสำเร็จ! กรุณารีเฟรชหน้าแรกเพื่อดูการเปลี่ยนแปลง");
      await loadIngredients(); // Reload to get updated data
    } catch (err: any) {
      console.error("Failed to save:", err);
      alert(err.message || "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  }

  // Filter ingredients by category
  const filteredIngredients = selectedCategory === "ALL"
    ? ingredients
    : ingredients.filter(ing => ing.category === selectedCategory);

  if (!user) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14433B] mx-auto mb-4"></div>
            <div className="text-[#14433B] text-xl">กำลังโหลด...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#FFF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#14433B] mb-2 font-serif">Home Editor</h1>
          <p className="text-[#14433B]/70 font-sans">จัดการวัตถุดิบตามฤดูกาลที่จะแสดงในหน้าแรก</p>
        </div>

        {/* Snow Animation Toggle */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#14433B] mb-1 font-sans">❄️ อนิเมชั่นหิมะตก</h3>
              <p className="text-sm text-[#14433B]/70 font-sans">เปิด/ปิดอนิเมชั่นหิมะตกในเว็บไซต์</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={snowAnimation}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setSnowAnimation(enabled);
                  localStorage.setItem("snowAnimation", enabled.toString());
                  // Trigger custom event เพื่ออัปเดต component อื่นๆ
                  window.dispatchEvent(new Event("snowAnimationChanged"));
                }}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#14433B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#14433B]"></div>
            </label>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[#14433B] font-semibold font-sans">หมวดหมู่:</span>
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                selectedCategory === "ALL"
                  ? "bg-[#14433B] text-[#FFF6F0]"
                  : "bg-white text-[#14433B] hover:bg-[#FFF6F0]"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setSelectedCategory("ORGANIC_FRUITS")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                selectedCategory === "ORGANIC_FRUITS"
                  ? "bg-[#14433B] text-[#FFF6F0]"
                  : "bg-white text-[#14433B] hover:bg-[#FFF6F0]"
              }`}
            >
              ผลไม้ออร์แกนิก
            </button>
            <button
              onClick={() => setSelectedCategory("ORGANIC_VEGETABLE")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                selectedCategory === "ORGANIC_VEGETABLE"
                  ? "bg-[#14433B] text-[#FFF6F0]"
                  : "bg-white text-[#14433B] hover:bg-[#FFF6F0]"
              }`}
            >
              ผักออร์แกนิก
            </button>
            <button
              onClick={() => setSelectedCategory("SUPERFRUITS")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                selectedCategory === "SUPERFRUITS"
                  ? "bg-[#14433B] text-[#FFF6F0]"
                  : "bg-white text-[#14433B] hover:bg-[#FFF6F0]"
              }`}
            >
              ซูเปอร์ฟรุต
            </button>
            <button
              onClick={() => setSelectedCategory("BASE")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                selectedCategory === "BASE"
                  ? "bg-[#14433B] text-[#FFF6F0]"
                  : "bg-white text-[#14433B] hover:bg-[#FFF6F0]"
              }`}
            >
              ฐาน
            </button>
            <button
              onClick={() => setSelectedCategory("PROTEIN")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                selectedCategory === "PROTEIN"
                  ? "bg-[#14433B] text-[#FFF6F0]"
                  : "bg-white text-[#14433B] hover:bg-[#FFF6F0]"
              }`}
            >
              โปรตีน
            </button>
            <button
              onClick={() => setSelectedCategory("TOPPING")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                selectedCategory === "TOPPING"
                  ? "bg-[#14433B] text-[#FFF6F0]"
                  : "bg-white text-[#14433B] hover:bg-[#FFF6F0]"
              }`}
            >
              ท็อปปิ้ง
            </button>
            <button
              onClick={() => setSelectedCategory("SWEETENER")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
                selectedCategory === "SWEETENER"
                  ? "bg-[#14433B] text-[#FFF6F0]"
                  : "bg-white text-[#14433B] hover:bg-[#FFF6F0]"
              }`}
            >
              สารให้ความหวาน
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-[#14433B]/70 font-sans">
            เลือกวัตถุดิบที่จะแสดงในหน้าแรก (สูงสุด 4 รายการ)
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadIngredients}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#14433B] rounded-lg hover:bg-[#FFF6F0] transition-colors disabled:opacity-50 font-sans"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              รีเฟรช
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-6 py-2 bg-[#14433B] text-[#FFF6F0] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-sans"
            >
              <Save className="w-4 h-4" />
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>

        {/* Ingredients Grid */}
        {loading ? (
          <div className="text-center text-[#14433B]/60 py-12 font-sans">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14433B] mx-auto mb-4"></div>
            กำลังโหลดข้อมูล...
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="text-center text-[#14433B]/60 py-12 font-sans">
            ไม่พบวัตถุดิบในหมวดหมู่นี้
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredIngredients.map((ingredient) => {
              const isSeasonal = seasonalMap.get(ingredient.id) || false;
              const seasonalCount = Array.from(seasonalMap.values()).filter(v => v).length;
              const canSelect = isSeasonal || seasonalCount < 4;

              return (
                <div
                  key={ingredient.id}
                  className={`bg-white rounded-lg border-2 p-4 transition-all ${
                    isSeasonal
                      ? "border-[#14433B] shadow-lg"
                      : "border-[#14433B]/20 hover:border-[#14433B]/40"
                  }`}
                >
                  {/* Image */}
                  <div className="relative mb-3">
                    <div className="w-full h-32 bg-[#D4C5B0] rounded-lg flex items-center justify-center overflow-hidden">
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
                        <span className="text-4xl">
                          {ingredient.category === "ORGANIC_FRUITS" || ingredient.category === "SUPERFRUITS" ? "🍎" : ingredient.category === "ORGANIC_VEGETABLE" ? "🥬" : ingredient.category === "PROTEIN" ? "💪" : ingredient.category === "TOPPING" ? "🍒" : ingredient.category === "SWEETENER" ? "🍯" : ingredient.category === "BASE" ? "🥛" : "🍎"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Seasonal Badge */}
                    {isSeasonal && (
                      <div className="absolute top-2 right-2 bg-[#14433B] text-[#FFF6F0] px-2 py-1 rounded-full text-xs font-semibold font-sans">
                        ตามฤดูกาล
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <h3 className="font-bold text-[#14433B] mb-1 font-sans line-clamp-1">
                    {ingredient.name}
                  </h3>
                  {ingredient.description && (
                    <p className="text-xs text-[#14433B]/70 mb-2 line-clamp-2 font-sans">
                      {ingredient.description}
                    </p>
                  )}
                  <p className="text-sm text-[#14433B] font-semibold mb-3 font-sans">
                    ฿{Number(ingredient.pricePerUnit).toFixed(2)}/หน่วย
                  </p>

                  {/* Checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`seasonal-${ingredient.id}`}
                      checked={isSeasonal}
                      onChange={() => toggleSeasonal(ingredient.id)}
                      disabled={!canSelect}
                      className="w-5 h-5 text-[#14433B] rounded focus:ring-[#14433B] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label
                      htmlFor={`seasonal-${ingredient.id}`}
                      className={`text-sm font-medium font-sans ${
                        canSelect ? "text-[#14433B] cursor-pointer" : "text-[#14433B]/50 cursor-not-allowed"
                      }`}
                    >
                      {isSeasonal ? "แสดงในหน้าแรก" : "ไม่แสดง"}
                    </label>
                  </div>

                  {!canSelect && !isSeasonal && (
                    <p className="text-xs text-red-500 mt-1 font-sans">
                      (เลือกได้สูงสุด 4 รายการ)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-white rounded-lg p-6 border border-[#14433B]/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#14433B] mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-[#14433B] mb-2 font-sans">คำแนะนำ</h3>
              <ul className="text-sm text-[#14433B]/70 space-y-1 font-sans">
                <li>• เลือกวัตถุดิบที่จะแสดงในหน้าแรกได้สูงสุด 4 รายการ</li>
                <li>• วัตถุดิบที่เลือกจะแสดงในส่วน "วัตถุดิบตามฤดูกาล" ในหน้าแรก</li>
                <li>• กดปุ่ม "บันทึก" เพื่อบันทึกการเปลี่ยนแปลง</li>
                <li>• สามารถกรองวัตถุดิบตามหมวดหมู่ได้</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

