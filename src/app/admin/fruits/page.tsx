"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Upload, X, Sparkles, Loader2 } from "lucide-react";
import {
  adminGetFruits,
  adminCreateFruit,
  adminUpdateFruit,
  adminDeleteFruit,
  adminAddIngredientWithNutrition,
  uploadFruitImage,
  type Fruit,
  type FruitCreateRequest,
  type FruitUpdateRequest,
  type IngredientAddRequest,
  type FruitCategory,
} from "@/lib/api";
import { getImageUrl } from "@/lib/image";
import { toast } from "@/app/components/Toast";

export default function AdminFruitsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FruitCategory | "ALL">("ALL");
  const [editingFruit, setEditingFruit] = useState<Fruit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pricePerUnit: "",
    imageUrl: "",
    category: "FRUIT" as FruitCategory,
    active: true,
    seasonal: false,
  });
  const [uploading, setUploading] = useState(false);
  const [fetchingNutrition, setFetchingNutrition] = useState(false);

  useEffect(() => {
    checkAuth();
    loadFruits();
  }, []);

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

  async function loadFruits() {
    try {
      setLoading(true);
      const res = await adminGetFruits();
      const fruitsData = res.data || [];
      // Ensure all fruits have category field
      const fruitsWithCategory = fruitsData.map(f => ({
        ...f,
        category: f.category || "FRUIT" as FruitCategory
      }));
      setFruits(fruitsWithCategory);
      console.log("Loaded fruits with categories:", fruitsWithCategory.map(f => ({ name: f.name, category: f.category })));
    } catch (err: any) {
      alert(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  function openModal(fruit?: Fruit) {
    if (fruit) {
      console.log("Opening modal for fruit:", fruit);
      console.log("Fruit description:", fruit.description, "Type:", typeof fruit.description);
      setEditingFruit(fruit);
      // Always set description, even if it's null or undefined
      const descriptionValue = fruit.description !== null && fruit.description !== undefined 
        ? String(fruit.description) 
        : "";
      setFormData({
        name: fruit.name,
        description: descriptionValue,
        pricePerUnit: fruit.pricePerUnit.toString(),
        imageUrl: fruit.imageUrl || "",
        category: fruit.category || "FRUIT",
        active: fruit.active !== undefined ? fruit.active : true,
        seasonal: fruit.seasonal !== undefined ? fruit.seasonal : false,
      });
      console.log("Form data set:", { description: descriptionValue });
    } else {
      setEditingFruit(null);
      setFormData({
        name: "",
        description: "",
        pricePerUnit: "",
        imageUrl: "",
        category: "FRUIT" as FruitCategory,
        active: true,
        seasonal: false,
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingFruit(null);
  }

  async function handleImageUpload(file: File) {
    try {
      setUploading(true);
      const res = await uploadFruitImage(file);
      setFormData({ ...formData, imageUrl: res.data?.url || "" });
      alert("อัปโหลดรูปภาพสำเร็จ");
    } catch (err: any) {
      alert(err.message || "ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingFruit) {
        // Use FruitUpdateRequest for update
        // Always send description field (even if empty string) to ensure it gets updated
        const trimmedDescription = formData.description.trim();
        const updateData: FruitUpdateRequest = {
          name: formData.name.trim(),
          description: trimmedDescription, // Always send description (empty string is valid)
          pricePerUnit: parseFloat(formData.pricePerUnit),
          imageUrl: formData.imageUrl?.trim() || undefined,
          category: formData.category,
          active: formData.active,
          seasonal: formData.seasonal,
        };
        console.log("Updating fruit:", editingFruit.id, "with data:", JSON.stringify(updateData, null, 2));
        const response = await adminUpdateFruit(editingFruit.id, updateData);
        console.log("Update response:", response.data);
        toast("อัปเดตข้อมูลสำเร็จ ✅", "success");
      } else {
        // Use IngredientService to add with automatic nutrition data fetch
        // ใช้หน้า add-ingredient แทน หรือใช้ API ที่ดึงข้อมูลอัตโนมัติ
        setFetchingNutrition(true);
        try {
          const createData: IngredientAddRequest = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            pricePerUnit: parseFloat(formData.pricePerUnit),
            imageUrl: formData.imageUrl?.trim() || undefined,
            category: formData.category,
            active: formData.active,
            seasonal: formData.seasonal,
          };
          
          // ใช้ adminAddIngredientWithNutrition เพื่อดึงข้อมูลโภชนาการอัตโนมัติ (รองรับทั้งไทยและอังกฤษ)
          toast("กำลังดึงข้อมูลโภชนาการ...", "info", 2000);
          await adminAddIngredientWithNutrition(createData);
          
          toast("เพิ่มข้อมูลสำเร็จ! ระบบได้ดึงข้อมูลโภชนาการอัตโนมัติแล้ว ✅", "success");
        } catch (err: any) {
          const errorMsg = err.message || "ไม่สามารถบันทึกข้อมูลได้";
          toast(errorMsg, "error", 8000);
          console.error("Error creating ingredient:", err);
          // Don't close modal on error so user can fix and retry
          setFetchingNutrition(false);
          return;
        } finally {
          setFetchingNutrition(false);
        }
      }

      closeModal();
      loadFruits();
    } catch (err: any) {
      const errorMsg = err.message || "ไม่สามารถบันทึกข้อมูลได้";
      toast(errorMsg, "error");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("คุณต้องการลบวัถุดิบนี้หรือไม่?")) return;
    try {
      await adminDeleteFruit(id);
      toast("ลบข้อมูลสำเร็จ ✅", "success");
      loadFruits();
    } catch (err: any) {
      toast(err.message || "ไม่สามารถลบข้อมูลได้", "error");
    }
  }


  if (loading) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="text-[#4A2C1B] text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5EFE6] min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#4A2C1B] mb-1">จัดการวัถุดิบ</h1>
            <p className="text-[#4A2C1B]/70 text-sm">เพิ่ม แก้ไข หรือลบวัถุดิบ (ผลไม้ ผัก และส่วนเสริม)</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-[#4A2C1B] text-[#F5EFE6] px-4 py-2 rounded-md font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            เพิ่มวัถุดิบ
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === "ALL"
                  ? "bg-[#4A2C1B] text-white shadow-md"
                  : "bg-white text-[#4A2C1B] border border-[#4A2C1B]/30 hover:border-[#4A2C1B]/50"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setSelectedCategory("FRUIT")}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === "FRUIT"
                  ? "bg-[#4A2C1B] text-white shadow-md"
                  : "bg-white text-[#4A2C1B] border border-[#4A2C1B]/30 hover:border-[#4A2C1B]/50"
              }`}
            >
              🍎 ผลไม้
            </button>
            <button
              onClick={() => setSelectedCategory("VEGETABLE")}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === "VEGETABLE"
                  ? "bg-[#4A2C1B] text-white shadow-md"
                  : "bg-white text-[#4A2C1B] border border-[#4A2C1B]/30 hover:border-[#4A2C1B]/50"
              }`}
            >
              🥬 ผัก
            </button>
            <button
              onClick={() => setSelectedCategory("ADDON")}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === "ADDON"
                  ? "bg-[#4A2C1B] text-white shadow-md"
                  : "bg-white text-[#4A2C1B] border border-[#4A2C1B]/30 hover:border-[#4A2C1B]/50"
              }`}
            >
              🥛 ส่วนเสริม
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(() => {
            const filteredFruits = selectedCategory === "ALL" 
              ? fruits 
              : fruits.filter(f => {
                  const fruitCategory = f.category || "FRUIT";
                  const matches = fruitCategory === selectedCategory;
                  if (!matches) {
                    console.log(`Fruit ${f.name} (category: ${fruitCategory}) does not match ${selectedCategory}`);
                  }
                  return matches;
                });
            console.log(`Filtering: ${selectedCategory}, Total: ${fruits.length}, Filtered: ${filteredFruits.length}`);
            return filteredFruits;
          })().map((fruit) => (
            <div
              key={fruit.id}
              className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow border border-[#4A2C1B]/10"
            >
              {fruit.imageUrl ? (
                <img
                  src={getImageUrl(fruit.imageUrl)}
                  alt={fruit.name}
                  className="w-full h-24 object-cover rounded-md mb-2"
                />
              ) : (
                <div className="w-full h-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center text-gray-400 text-xs">
                  ไม่มีรูป
                </div>
              )}
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-[#4A2C1B] mb-1 line-clamp-1">{fruit.name}</h3>
                <p className="text-[#4A2C1B]/70 text-xs mb-1.5 line-clamp-1">{fruit.description}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#4A2C1B]">
                    {Number(fruit.pricePerUnit).toFixed(2)} ฿
                </span>
                <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    fruit.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                    {fruit.active ? "✓" : "✗"}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-1 flex-wrap">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    fruit.category === "FRUIT" ? "bg-yellow-100 text-yellow-700" :
                    fruit.category === "VEGETABLE" ? "bg-green-100 text-green-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {fruit.category === "FRUIT" ? "🍎 ผลไม้" :
                     fruit.category === "VEGETABLE" ? "🥬 ผัก" :
                     "🥛 ส่วนเสริม"}
                  </span>
                  {/* Nutrition Status Badge - แสดงเฉพาะเมื่อมีข้อมูล */}
                  {fruit.calorie && fruit.protein && fruit.fiber && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      ✓ โภชนาการ
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openModal(fruit)}
                  className="flex-1 bg-[#C9A78B] text-[#4A2C1B] px-2 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(fruit.id)}
                  className="flex-1 bg-red-500 text-white px-2 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#4A2C1B]">
                  {editingFruit ? "แก้ไขวัถุดิบ" : "เพิ่มวัถุดิบใหม่"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-[#4A2C1B]/70 hover:text-[#4A2C1B]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[#4A2C1B] font-semibold mb-2">ชื่อวัถุดิบ *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border border-[#4A2C1B]/30 px-4 py-3 text-[#4A2C1B] outline-none focus:ring-2 focus:ring-[#4A2C1B]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#4A2C1B] font-semibold mb-2">คำอธิบาย *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-[#4A2C1B]/30 px-4 py-3 text-[#4A2C1B] outline-none focus:ring-2 focus:ring-[#4A2C1B]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#4A2C1B] font-semibold mb-2">ราคาต่อหน่วย (บาท) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                    className="w-full rounded-md border border-[#4A2C1B]/30 px-4 py-3 text-[#4A2C1B] outline-none focus:ring-2 focus:ring-[#4A2C1B]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#4A2C1B] font-semibold mb-2">
                    หมวดหมู่ *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as FruitCategory })}
                    className="w-full rounded-md border border-[#4A2C1B]/30 px-4 py-3 text-[#4A2C1B] outline-none focus:ring-2 focus:ring-[#4A2C1B]/50"
                    required
                  >
                    <option value="FRUIT">🍎 ผลไม้</option>
                    <option value="VEGETABLE">🥬 ผัก</option>
                    <option value="ADDON">🥛 ส่วนเสริม (โยเกิร์ต, น้ำผึ้ง, นม, ฯลฯ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#4A2C1B] font-semibold mb-2">รูปภาพ</label>
                  <div className="flex gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                      id="fruit-image-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="fruit-image-upload"
                      className="flex-1 bg-[#C9A78B] text-[#4A2C1B] px-4 py-3 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-5 h-5" />
                      {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูปภาพ"}
                    </label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="หรือใส่ URL รูปภาพ"
                      className="flex-1 rounded-md border border-[#4A2C1B]/30 px-4 py-3 text-[#4A2C1B] outline-none focus:ring-2 focus:ring-[#4A2C1B]/50"
                    />
                  </div>
                  {formData.imageUrl && (
                    <img
                      src={getImageUrl(formData.imageUrl)}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                {!editingFruit && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">💡 ข้อมูลโภชนาการจะถูกดึงอัตโนมัติ</p>
                        <p className="text-xs">ระบบจะดึงข้อมูลโภชนาการจาก USDA อัตโนมัติ (รองรับทั้งชื่อไทยและอังกฤษ)</p>
                        {fetchingNutrition && (
                          <p className="text-xs mt-2 text-blue-600">
                            <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                            กำลังดึงข้อมูลโภชนาการ...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="active" className="text-[#4A2C1B] font-semibold">
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
                    <label htmlFor="seasonal" className="text-[#4A2C1B] font-semibold">
                      วัตถุดิบตามฤดูกาล
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={fetchingNutrition}
                    className="flex-1 bg-gray-200 text-[#4A2C1B] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={fetchingNutrition}
                    className="flex-1 bg-[#4A2C1B] text-[#F5EFE6] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {fetchingNutrition ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        กำลังดึงข้อมูลโภชนาการ...
                      </>
                    ) : (
                      editingFruit ? "อัปเดต" : "เพิ่ม"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

