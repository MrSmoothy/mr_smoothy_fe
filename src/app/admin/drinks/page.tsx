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
  type Fruit,
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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    active: true,
    ingredients: [] as { fruitId: number; quantity: number }[],
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
      setEditingDrink(drink);
      setFormData({
        name: drink.name,
        description: drink.description || "",
        imageUrl: drink.imageUrl || "",
        active: drink.active,
        ingredients: drink.ingredients.map(i => ({ fruitId: i.fruitId, quantity: i.quantity })),
      });
    } else {
      setEditingDrink(null);
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        active: true,
        ingredients: [],
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingDrink(null);
  }

  function addIngredient() {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { fruitId: fruits[0]?.id || 0, quantity: 1 }],
    });
  }

  function removeIngredient(index: number) {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  }

  function updateIngredient(index: number, field: "fruitId" | "quantity", value: number) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.ingredients.length === 0) {
      alert("กรุณาเพิ่มส่วนผสมอย่างน้อย 1 อย่าง");
      return;
    }
    try {
      const data: PredefinedDrinkCreateRequest = {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl || undefined,
        active: formData.active,
        ingredients: formData.ingredients,
      };

      if (editingDrink) {
        await adminUpdateDrink(editingDrink.id, data);
        alert("อัปเดตข้อมูลสำเร็จ");
      } else {
        await adminCreateDrink(data);
        alert("เพิ่มข้อมูลสำเร็จ");
      }

      closeModal();
      loadData();
    } catch (err: any) {
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
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="text-[#4A2C1B] text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5EFE6] min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#4A2C1B] mb-2">จัดการเมนู</h1>
            <p className="text-[#4A2C1B]/70">เพิ่ม แก้ไข หรือลบเมนูน้ำปั่น</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-[#4A2C1B] text-[#F5EFE6] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            เพิ่มเมนู
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drinks.map((drink) => (
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
              <h3 className="text-xl font-semibold text-[#4A2C1B] mb-2">{drink.name}</h3>
              <p className="text-[#4A2C1B]/70 text-sm mb-3 line-clamp-2">{drink.description}</p>
              <div className="mb-4">
                <p className="text-sm text-[#4A2C1B]/70 mb-2">ส่วนผสม:</p>
                <div className="flex flex-wrap gap-2">
                  {drink.ingredients.slice(0, 3).map((ing, idx) => (
                    <span
                      key={idx}
                      className="bg-[#C9A78B] text-[#4A2C1B] px-2 py-1 rounded text-xs"
                    >
                      {ing.fruitName} x{ing.quantity}
                    </span>
                  ))}
                  {drink.ingredients.length > 3 && (
                    <span className="text-xs text-[#4A2C1B]/70">
                      +{drink.ingredients.length - 3} เพิ่มเติม
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    drink.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {drink.active ? "ใช้งาน" : "ไม่ใช้งาน"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(drink)}
                  className="flex-1 bg-[#C9A78B] text-[#4A2C1B] px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
                <h2 className="text-2xl font-bold text-[#4A2C1B]">
                  {editingDrink ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
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
                  <label className="block text-[#4A2C1B] font-semibold mb-2">ชื่อเมนู *</label>
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
                      id="drink-image-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="drink-image-upload"
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

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-[#4A2C1B] font-semibold">ส่วนผสม *</label>
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="bg-[#4A2C1B] text-[#F5EFE6] px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
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
                          className="flex-1 rounded-md border border-[#4A2C1B]/30 px-4 py-2 text-[#4A2C1B] outline-none focus:ring-2 focus:ring-[#4A2C1B]/50"
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
                          value={ing.quantity}
                          onChange={(e) =>
                            updateIngredient(index, "quantity", Number(e.target.value))
                          }
                          placeholder="จำนวน"
                          className="w-24 rounded-md border border-[#4A2C1B]/30 px-4 py-2 text-[#4A2C1B] outline-none focus:ring-2 focus:ring-[#4A2C1B]/50"
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
                      <p className="text-sm text-[#4A2C1B]/70 text-center py-4">
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
                  <label htmlFor="active" className="text-[#4A2C1B] font-semibold">
                    แสดงให้ลูกค้าเห็น
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-200 text-[#4A2C1B] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#4A2C1B] text-[#F5EFE6] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
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

