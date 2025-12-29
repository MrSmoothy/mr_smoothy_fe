"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Upload, X, Minus } from "lucide-react";
import {
  adminGetDrinks,
  adminCreateDrink,
  adminUpdateDrink,
  adminDeleteDrink,
  adminGetFruits,
  uploadDrinkImage,
  type PredefinedDrink,
  type PredefinedDrinkCreateRequest,
  type PredefinedDrinkUpdateRequest,
  type Fruit,
  type DrinkCategory,
} from "@/lib/api";
import { getImageUrl } from "@/lib/image";

export default function AdminDrinksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [drinks, setDrinks] = useState<PredefinedDrink[]>([]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDrink, setEditingDrink] = useState<PredefinedDrink | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "SIGNATURE" | "CLASSIC" | "GREEN_BOOSTER" | "HIGH_PROTEIN" | "SUPERFRUIT">("ALL");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    category: "SIGNATURE" as DrinkCategory,
    active: true,
    ingredients: [] as { fruitId: number; quantity: number }[],
    basePrice: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
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

  async function loadData() {
    try {
      setLoading(true);
      const [drinksRes, fruitsRes] = await Promise.all([
        adminGetDrinks(),
        adminGetFruits(),
      ]);
      setDrinks(drinksRes.data || []);
      setFruits(fruitsRes.data || []);
    } catch (err: any) {
      alert(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  function openModal(drink?: PredefinedDrink) {
    if (drink) {
      console.log("Opening modal for drink:", drink);
      console.log("Drink description:", drink.description, "Type:", typeof drink.description);
      setEditingDrink(drink);
      // Always set description, even if it's null or undefined
      const descriptionValue = drink.description !== null && drink.description !== undefined 
        ? String(drink.description) 
        : "";
      // Use basePrice from backend if available
      const basePriceValue = drink.basePrice != null 
        ? String(drink.basePrice) 
        : "";
      setFormData({
        name: drink.name,
        description: descriptionValue,
        imageUrl: drink.imageUrl || "",
        category: drink.category || "SIGNATURE",
        active: drink.active,
        ingredients: drink.ingredients.map(i => ({ fruitId: i.fruitId, quantity: i.quantity })),
        basePrice: basePriceValue,
      });
      console.log("Form data set:", { description: descriptionValue, basePrice: basePriceValue });
    } else {
      setEditingDrink(null);
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        category: "SIGNATURE" as DrinkCategory,
        active: true,
        ingredients: [],
        basePrice: "",
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingDrink(null);
  }

  function getTotalQuantity(): number {
    return formData.ingredients.reduce((sum, ing) => sum + ing.quantity, 0);
  }

  function addIngredient() {
    const currentTotal = getTotalQuantity();
    if (currentTotal >= 5) {
      alert("จำนวนวัตถุดิบรวมกันต้องไม่เกิน 5");
      return;
    }
    const maxQuantity = 5 - currentTotal;
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { fruitId: fruits[0]?.id || 0, quantity: Math.min(1, maxQuantity) }],
    });
  }

  function removeIngredient(index: number) {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  }

  function updateIngredient(index: number, field: "fruitId" | "quantity", value: number) {
    if (field === "quantity") {
      const currentTotal = getTotalQuantity();
      const currentIngredientQuantity = formData.ingredients[index].quantity;
      const newTotal = currentTotal - currentIngredientQuantity + value;
      
      if (newTotal > 5) {
        const maxAllowed = 5 - (currentTotal - currentIngredientQuantity);
        alert(`จำนวนวัตถุดิบรวมกันต้องไม่เกิน 5 (จำนวนสูงสุดที่สามารถใส่ได้: ${maxAllowed})`);
        value = Math.max(1, maxAllowed);
      }
      if (value < 1) {
        value = 1;
      }
    }
    
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  }

  async function handleImageUpload(file: File) {
    try {
      setUploading(true);
      const res = await uploadDrinkImage(file);
      setFormData({ ...formData, imageUrl: res.data?.url || "" });
      alert("อัปโหลดรูปภาพสำเร็จ");
    } catch (err: any) {
      alert(err.message || "ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setUploading(false);
    }
  }

  // Filter drinks by category
  function getDrinksByCategory(category: "ALL" | "SIGNATURE" | "CLASSIC" | "GREEN_BOOSTER" | "HIGH_PROTEIN" | "SUPERFRUIT"): PredefinedDrink[] {
    if (category === "ALL") {
      return drinks;
    }

    return drinks.filter(drink => drink.category === category);
  }

  // Helper to get category display info
  function getCategoryInfo(category?: DrinkCategory): { label: string; className: string } {
    switch (category) {
      case "SIGNATURE":
        return { label: "⭐ Signature", className: "bg-amber-100 text-amber-700" };
      case "CLASSIC":
        return { label: "🍹 Classic", className: "bg-blue-100 text-blue-700" };
      case "GREEN_BOOSTER":
        return { label: "🥬 Green Booster", className: "bg-green-100 text-green-700" };
      case "HIGH_PROTEIN":
        return { label: "💪 High-Protein", className: "bg-red-100 text-red-700" };
      case "SUPERFRUIT":
        return { label: "🍇 Superfruit", className: "bg-purple-100 text-purple-700" };
      default:
        return { label: "❓ ไม่ระบุ", className: "bg-gray-100 text-gray-700" };
    }
  }

  // Get filtered drinks
  const categoryFilteredDrinks = getDrinksByCategory(selectedCategory);
  const filteredDrinks = searchQuery.trim() 
    ? categoryFilteredDrinks.filter(drink => {
        const query = searchQuery.toLowerCase();
        const nameMatch = drink.name?.toLowerCase().includes(query);
        const descMatch = drink.description?.toLowerCase().includes(query);
        const ingredientMatch = drink.ingredients?.some(ing => 
          ing.fruitName?.toLowerCase().includes(query)
        );
        return nameMatch || descMatch || ingredientMatch;
      })
    : categoryFilteredDrinks;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.ingredients.length === 0) {
      alert("กรุณาเพิ่มส่วนผสมอย่างน้อย 1 อย่าง");
      return;
    }
    const totalQuantity = getTotalQuantity();
    if (totalQuantity > 5) {
      alert("จำนวนวัตถุดิบรวมกันต้องไม่เกิน 5");
      return;
    }
    try {
      if (editingDrink) {
        // Use PredefinedDrinkUpdateRequest for update
        const trimmedDescription = formData.description.trim();
        const updateData: PredefinedDrinkUpdateRequest = {
          name: formData.name.trim(),
          description: trimmedDescription,
          imageUrl: formData.imageUrl?.trim() || undefined,
          category: formData.category,
          active: formData.active,
          ingredients: formData.ingredients,
          basePrice: formData.basePrice && formData.basePrice.trim() !== "" 
            ? parseFloat(formData.basePrice.trim()) 
            : null,
        };
        console.log("Updating drink:", editingDrink.id, "with data:", JSON.stringify(updateData, null, 2));
        const response = await adminUpdateDrink(editingDrink.id, updateData);
        console.log("Update response:", response.data);
        alert("อัปเดตข้อมูลสำเร็จ");
      } else {
        // Use PredefinedDrinkCreateRequest for create
        const createData: PredefinedDrinkCreateRequest = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          imageUrl: formData.imageUrl?.trim() || undefined,
          category: formData.category,
          active: formData.active,
          ingredients: formData.ingredients,
          basePrice: formData.basePrice && formData.basePrice.trim() !== "" 
            ? parseFloat(formData.basePrice.trim()) 
            : null,
        };
        await adminCreateDrink(createData);
        alert("เพิ่มข้อมูลสำเร็จ");
      }
      window.dispatchEvent(new Event("drinkUpdated"));

      closeModal();
      loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "ไม่สามารถบันทึกข้อมูลได้");
    }    
  }

  async function handleDelete(id: number) {
    if (!confirm("คุณต้องการลบเมนูนี้หรือไม่?")) return;
    try {
      await adminDeleteDrink(id);
      alert("ลบข้อมูลสำเร็จ");
      loadData();
    } catch (err: any) {
      alert(err.message || "ไม่สามารถลบข้อมูลได้");
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
            <h1 className="text-4xl font-bold text-[#14433B] mb-2">จัดการเมนู</h1>
            <p className="text-[#14433B]/70">เพิ่ม แก้ไข หรือลบเมนูน้ำปั่น</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-[#14433B] text-[#FFF6F0] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            เพิ่มเมนู
          </button>
        </div>

        {/* Search Bar and Category Filter */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative w-full" style={{ height: '45px' }}>
            <input
              type="text"
              placeholder="ค้นหาเมนู, คำอธิบาย, ส่วนผสม..."
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
              onClick={() => setSelectedCategory("SIGNATURE")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "SIGNATURE"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              Signature
            </button>
            <button
              onClick={() => setSelectedCategory("CLASSIC")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "CLASSIC"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              Classic
            </button>
            <button
              onClick={() => setSelectedCategory("GREEN_BOOSTER")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "GREEN_BOOSTER"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              Green Booster
            </button>
            <button
              onClick={() => setSelectedCategory("HIGH_PROTEIN")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "HIGH_PROTEIN"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              High-Protein
            </button>
            <button
              onClick={() => setSelectedCategory("SUPERFRUIT")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === "SUPERFRUIT"
                  ? "bg-[#14433B] text-white shadow-md"
                  : "bg-white text-[#14433B] border border-[#14433B]/30 hover:border-[#14433B]/50"
              }`}
            >
              Superfruit
            </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrinks.map((drink) => (
            <div
              key={drink.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {drink.imageUrl ? (
                <img
                  src={getImageUrl(drink.imageUrl)}
                  alt={drink.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-400">
                  ไม่มีรูปภาพ
                </div>
              )}
              <h3 className="text-xl font-semibold text-[#14433B] mb-2">{drink.name}</h3>
              <p className="text-[#14433B]/70 text-sm mb-2 line-clamp-2">{drink.description}</p>
              <p className="text-sm text-[#14433B] mb-3">
                <span className="font-semibold">ราคาพื้นฐาน:</span>{" "}
                {drink.basePrice != null 
                  ? `฿${Number(drink.basePrice).toFixed(2)}`
                  : "คำนวณอัตโนมัติจากส่วนผสม"
                }
              </p>
              <div className="mb-4">
                <p className="text-sm text-[#14433B]/70 mb-2">ส่วนผสม:</p>
                <div className="flex flex-wrap gap-2">
                  {drink.ingredients.slice(0, 3).map((ing, idx) => (
                    <span
                      key={idx}
                      className="bg-[#C9A78B] text-[#14433B] px-2 py-1 rounded text-xs"
                    >
                      {ing.fruitName} x{ing.quantity}
                    </span>
                  ))}
                  {drink.ingredients.length > 3 && (
                    <span className="text-xs text-[#14433B]/70">
                      +{drink.ingredients.length - 3} เพิ่มเติม
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryInfo(drink.category).className}`}>
                    {getCategoryInfo(drink.category).label}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      drink.active
                        ? "bg-[#14433B]/20 text-[#14433B]"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {drink.active ? "ใช้งาน" : "ไม่ใช้งาน"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(drink)}
                  className="flex-1 bg-[#C9A78B] text-[#14433B] px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(drink.id)}
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
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#14433B]">
                  {editingDrink ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
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
                  <label className="block text-[#14433B] font-semibold mb-2">ชื่อเมนู *</label>
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
                  <label className="block text-[#14433B] font-semibold mb-2">หมวดหมู่ *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as DrinkCategory })}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    required
                  >
                    <option value="SIGNATURE">⭐ Signature</option>
                    <option value="CLASSIC">🍹 Classic</option>
                    <option value="GREEN_BOOSTER">🥬 Green Booster</option>
                    <option value="HIGH_PROTEIN">💪 High-Protein</option>
                    <option value="SUPERFRUIT">🍇 Superfruit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">ราคาพื้นฐาน (บาท)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    placeholder="ปล่อยว่างเพื่อคำนวณอัตโนมัติจากส่วนผสม"
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                  />
                  <p className="text-sm text-[#14433B]/70 mt-1">
                    กำหนดราคาพื้นฐานของเมนู (ไม่รวมราคาแก้ว) - ถ้าปล่อยว่างจะคำนวณจากส่วนผสม
                  </p>
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
                      id="drink-image-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="drink-image-upload"
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

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                    <label className="block text-[#14433B] font-semibold">ส่วนผสม *</label>
                      <p className="text-sm text-[#14433B]/70 mt-1">
                        จำนวนรวม: {getTotalQuantity()}/5
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addIngredient}
                      disabled={getTotalQuantity() >= 5}
                      className="bg-[#14433B] text-[#FFF6F0] px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่มส่วนผสม
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.ingredients.map((ing, index) => (
                      <div key={index} className="flex gap-2">
                        <select
                          value={ing.fruitId}
                          onChange={(e) =>
                            updateIngredient(index, "fruitId", Number(e.target.value))
                          }
                          className="flex-1 rounded-md border border-[#14433B]/30 px-4 py-2 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                        >
                          <option value="">เลือกผลไม้</option>
                          {fruits.map((fruit) => (
                            <option key={fruit.id} value={fruit.id}>
                              {fruit.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          max={5 - (getTotalQuantity() - ing.quantity)}
                          value={ing.quantity}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            if (newValue >= 1) {
                              updateIngredient(index, "quantity", newValue);
                          }
                          }}
                          placeholder="จำนวน"
                          className="w-24 rounded-md border border-[#14433B]/30 px-4 py-2 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="bg-red-500 text-white px-3 py-2 rounded-md hover:opacity-90 transition-opacity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.ingredients.length === 0 && (
                      <p className="text-sm text-[#14433B]/70 text-center py-4">
                        ยังไม่มีส่วนผสม กรุณาเพิ่มส่วนผสม
                      </p>
                    )}
                  </div>
                </div>

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

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-200 text-[#14433B] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#14433B] text-[#FFF6F0] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
                  >
                    {editingDrink ? "อัปเดต" : "เพิ่ม"}
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
