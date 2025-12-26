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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "ORGANIC_FRUITS" | "ORGANIC_VEGETABLE" | "BASE" | "SUPERFRUITS" | "PROTEIN" | "TOPPING" | "SWEETENER">("ALL");
  const [editingFruit, setEditingFruit] = useState<Fruit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pricePerUnit: "",
    imageUrl: "",
    category: "ORGANIC_FRUITS" as FruitCategory,
    active: true,
    seasonal: false,
    fetchNutrition: true, // Default to true
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
        category: f.category || "ORGANIC_FRUITS" as FruitCategory
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
        category: fruit.category || "ORGANIC_FRUITS",
        active: fruit.active !== undefined ? fruit.active : true,
        seasonal: fruit.seasonal !== undefined ? fruit.seasonal : false,
        fetchNutrition: true, // Not applicable for editing
      });
      console.log("Form data set:", { description: descriptionValue });
    } else {
      setEditingFruit(null);
      setFormData({
        name: "",
        description: "",
        pricePerUnit: "",
        imageUrl: "",
        category: "ORGANIC_FRUITS" as FruitCategory,
        active: true,
        seasonal: false,
        fetchNutrition: true, // Default to true
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
          // ไม่ส่งค่า seasonal ตอนแก้ไข - จัดการผ่านหน้า Home Editor เท่านั้น
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
            fetchNutrition: formData.fetchNutrition,
          };
          
          // ใช้ adminAddIngredientWithNutrition เพื่อดึงข้อมูลโภชนาการอัตโนมัติ (รองรับทั้งไทยและอังกฤษ)
          if (formData.fetchNutrition) {
            toast("กำลังดึงข้อมูลโภชนาการ...", "info", 2000);
          } else {
            toast("กำลังเพิ่มวัตถุดิบ...", "info", 2000);
          }
          await adminAddIngredientWithNutrition(createData);
          
          if (formData.fetchNutrition) {
            toast("เพิ่มข้อมูลสำเร็จ! ระบบได้ดึงข้อมูลโภชนาการอัตโนมัติแล้ว ✅", "success");
          } else {
            toast("เพิ่มข้อมูลสำเร็จ! ✅", "success");
          }
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
    if (!confirm("คุณต้องการลบวัตถุดิบนี้หรือไม่?")) return;
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
      <div className="bg-[#FFF6F0] min-h-screen flex items-center justify-center">
        <div className="text-[#14433B] text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF6F0] min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#14433B] mb-2">จัดการวัตถุดิบ</h1>
            <p className="text-[#14433B]/70">เพิ่ม แก้ไข หรือลบวัตถุดิบ (ผลไม้ ผัก และส่วนเสริม)</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-[#14433B] text-[#FFF6F0] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            เพิ่มวัตถุดิบ
          </button>
        </div>

        {/* Search Bar and Category Filter */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative w-full" style={{ height: '45px' }}>
            <input
              type="text"
              placeholder="ค้นหาวัตถุดิบ, คำอธิบาย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full px-4 pl-12 rounded-lg border-2 border-[#14433B]/30 bg-white text-[#14433B] placeholder:text-[#14433B]/50 focus:outline-none focus:border-[#14433B] focus:ring-2 focus:ring-[#14433B]/20 transition-all"
              style={{ height: '45px' }}
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#14433B]/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#14433B]/50 hover:text-[#14433B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category Filter - Horizontal Scrollable */}
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "ALL"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory("ORGANIC_FRUITS")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "ORGANIC_FRUITS"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              Organic Fruits
            </button>
            <button
              onClick={() => setSelectedCategory("ORGANIC_VEGETABLE")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "ORGANIC_VEGETABLE"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              Organic Vegetable
            </button>
            <button
              onClick={() => setSelectedCategory("BASE")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "BASE"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              Base
            </button>
            <button
              onClick={() => setSelectedCategory("SUPERFRUITS")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "SUPERFRUITS"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              SuperFruits
            </button>
            <button
              onClick={() => setSelectedCategory("PROTEIN")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "PROTEIN"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              Protein
            </button>
            <button
              onClick={() => setSelectedCategory("TOPPING")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "TOPPING"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              Topping
            </button>
            <button
              onClick={() => setSelectedCategory("SWEETENER")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "SWEETENER"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              Sweetener
            </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            // Filter by category
            let categoryFiltered = fruits;
            if (selectedCategory !== "ALL") {
              categoryFiltered = fruits.filter(f => {
                const name = (f.name || "").toLowerCase();
                const desc = (f.description || "").toLowerCase();
                const searchText = `${name} ${desc}`;
                const fruitCategory = f.category || "ORGANIC_FRUITS";

                switch (selectedCategory) {
                  case "ORGANIC_FRUITS":
                    return fruitCategory === "ORGANIC_FRUITS";
                  case "ORGANIC_VEGETABLE":
                    return fruitCategory === "ORGANIC_VEGETABLE";
                  case "BASE":
                    return fruitCategory === "BASE";
                  case "SUPERFRUITS":
                    return fruitCategory === "SUPERFRUITS";
                  case "PROTEIN":
                    return fruitCategory === "PROTEIN";
                  case "TOPPING":
                    return fruitCategory === "TOPPING";
                  case "SWEETENER":
                    return fruitCategory === "SWEETENER";
                  default:
                    return true;
                }
              });
            }

            // Filter by search query
            const filteredFruits = searchQuery.trim() 
              ? categoryFiltered.filter(f => {
                  const query = searchQuery.toLowerCase();
                  const nameMatch = f.name?.toLowerCase().includes(query);
                  const descMatch = f.description?.toLowerCase().includes(query);
                  return nameMatch || descMatch;
                })
              : categoryFiltered;

            return filteredFruits;
          })().map((fruit) => (
            <div
              key={fruit.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {fruit.imageUrl ? (
                <img
                  src={getImageUrl(fruit.imageUrl)}
                  alt={fruit.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-400">
                  ไม่มีรูปภาพ
                </div>
              )}
              <h3 className="text-xl font-semibold text-[#14433B] mb-2">{fruit.name}</h3>
              <p className="text-[#14433B]/70 text-sm mb-3 line-clamp-2">{fruit.description}</p>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-[#14433B]">
                    {Number(fruit.pricePerUnit).toFixed(2)} ฿
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      fruit.active
                        ? "bg-[#14433B]/20 text-[#14433B]"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {fruit.active ? "ใช้งาน" : "ไม่ใช้งาน"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    fruit.category === "ORGANIC_FRUITS" ? "bg-yellow-100 text-yellow-700" :
                    fruit.category === "ORGANIC_VEGETABLE" ? "bg-[#14433B]/20 text-[#14433B]" :
                    fruit.category === "SUPERFRUITS" ? "bg-purple-100 text-purple-700" :
                    fruit.category === "BASE" ? "bg-blue-100 text-blue-700" :
                    fruit.category === "PROTEIN" ? "bg-red-100 text-red-700" :
                    fruit.category === "TOPPING" ? "bg-pink-100 text-pink-700" :
                    fruit.category === "SWEETENER" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {fruit.category === "ORGANIC_FRUITS" ? "🍎 ผลไม้ออร์แกนิก" :
                     fruit.category === "ORGANIC_VEGETABLE" ? "🥬 ผักออร์แกนิก" :
                     fruit.category === "SUPERFRUITS" ? "🌟 ซูเปอร์ฟรุต" :
                     fruit.category === "BASE" ? "🥛 ฐาน" :
                     fruit.category === "PROTEIN" ? "💪 โปรตีน" :
                     fruit.category === "TOPPING" ? "🍒 ท็อปปิ้ง" :
                     fruit.category === "SWEETENER" ? "🍯 สารให้ความหวาน" :
                     "❓ ไม่ระบุ"}
                  </span>
                  {/* Nutrition Status Badge - แสดงเฉพาะเมื่อมีข้อมูล */}
                  {fruit.calorie && fruit.protein && fruit.fiber && (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-[#14433B]/20 text-[#14433B]">
                      ✓ โภชนาการ
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(fruit)}
                  className="flex-1 bg-[#C9A78B] text-[#14433B] px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(fruit.id)}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
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
                <h2 className="text-2xl font-bold text-[#14433B]">
                  {editingFruit ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบใหม่"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-[#14433B]/70 hover:text-[#14433B]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">ชื่อวัตถุดิบ *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">คำอธิบาย *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">ราคาต่อหน่วย (บาท) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">
                    หมวดหมู่ *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as FruitCategory })}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    required
                  >
                    <option value="ORGANIC_FRUITS">🍎 ผลไม้ออร์แกนิก</option>
                    <option value="ORGANIC_VEGETABLE">🥬 ผักออร์แกนิก</option>
                    <option value="BASE">🥛 ฐาน</option>
                    <option value="SUPERFRUITS">🌟 ซูเปอร์ฟรุต</option>
                    <option value="PROTEIN">💪 โปรตีน</option>
                    <option value="TOPPING">🍒 ท็อปปิ้ง</option>
                    <option value="SWEETENER">🍯 สารให้ความหวาน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">รูปภาพ</label>
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
                      className="flex-1 bg-[#C9A78B] text-[#14433B] px-4 py-3 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-5 h-5" />
                      {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูปภาพ"}
                    </label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="หรือใส่ URL รูปภาพ"
                      className="flex-1 rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
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
                      <input
                        type="checkbox"
                        id="fetchNutrition"
                        checked={formData.fetchNutrition ?? true}
                        onChange={(e) => setFormData({ ...formData, fetchNutrition: e.target.checked })}
                        className="w-5 h-5 mt-0.5"
                      />
                      <div className="text-sm text-blue-800 flex-1">
                        <label htmlFor="fetchNutrition" className="font-semibold mb-1 block cursor-pointer">
                          ดึงข้อมูลโภชนาการจาก USDA (จะใช้ AI สำหรับข้อมูลรสชาติ)
                        </label>
                        <p className="text-xs">💡 ถ้าไม่เลือก ระบบจะเพิ่มวัตถุดิบโดยไม่มีข้อมูลโภชนาการ คุณสามารถดึงข้อมูลภายหลังได้</p>
                        {fetchingNutrition && formData.fetchNutrition && (
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
                  <label htmlFor="active" className="text-[#14433B] font-semibold">
                    แสดงให้ลูกค้าเห็น
                  </label>
                  </div>
                  
                  {/* แสดง checkbox seasonal เฉพาะตอนเพิ่มวัตถุดิบใหม่ ไม่แสดงตอนแก้ไข */}
                  {!editingFruit && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="seasonal"
                        checked={formData.seasonal}
                        onChange={(e) => setFormData({ ...formData, seasonal: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <label htmlFor="seasonal" className="text-[#14433B] font-semibold">
                        วัตถุดิบตามฤดูกาล
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={fetchingNutrition}
                    className="flex-1 bg-gray-200 text-[#14433B] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={fetchingNutrition}
                    className="flex-1 bg-[#14433B] text-[#FFF6F0] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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

