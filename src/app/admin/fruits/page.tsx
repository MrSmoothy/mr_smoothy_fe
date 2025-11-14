"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
import {
  adminGetFruits,
  adminCreateFruit,
  adminUpdateFruit,
  adminDeleteFruit,
  uploadFruitImage,
  type Fruit,
  type FruitCreateRequest,
  type FruitUpdateRequest,
} from "@/lib/api";
import { getImageUrl } from "@/lib/image";

export default function AdminFruitsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFruit, setEditingFruit] = useState<Fruit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pricePerUnit: "",
    imageUrl: "",
    active: true,
  });
  const [uploading, setUploading] = useState(false);

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
      setFruits(res.data || []);
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
        active: fruit.active,
      });
      console.log("Form data set:", { description: descriptionValue });
    } else {
      setEditingFruit(null);
      setFormData({
        name: "",
        description: "",
        pricePerUnit: "",
        imageUrl: "",
        active: true,
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
          active: formData.active,
        };
        console.log("Updating fruit:", editingFruit.id, "with data:", JSON.stringify(updateData, null, 2));
        const response = await adminUpdateFruit(editingFruit.id, updateData);
        console.log("Update response:", response.data);
        alert("อัปเดตข้อมูลสำเร็จ");
      } else {
        // Use FruitCreateRequest for create
        const createData: FruitCreateRequest = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          pricePerUnit: parseFloat(formData.pricePerUnit),
          imageUrl: formData.imageUrl?.trim() || undefined,
          active: formData.active,
        };
        await adminCreateFruit(createData);
        alert("เพิ่มข้อมูลสำเร็จ");
      }

      closeModal();
      loadFruits();
    } catch (err: any) {
      alert(err.message || "ไม่สามารถบันทึกข้อมูลได้");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("คุณต้องการลบผลไม้นี้หรือไม่?")) return;
    try {
      await adminDeleteFruit(id);
      alert("ลบข้อมูลสำเร็จ");
      loadFruits();
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
            <h1 className="text-4xl font-bold text-[#4A2C1B] mb-2">จัดการผลไม้</h1>
            <p className="text-[#4A2C1B]/70">เพิ่ม แก้ไข หรือลบผลไม้และผัก</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-[#4A2C1B] text-[#F5EFE6] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            เพิ่มผลไม้
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fruits.map((fruit) => (
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
              <h3 className="text-xl font-semibold text-[#4A2C1B] mb-2">{fruit.name}</h3>
              <p className="text-[#4A2C1B]/70 text-sm mb-3 line-clamp-2">{fruit.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-[#4A2C1B]">
                  {Number(fruit.pricePerUnit).toFixed(2)} บาท
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    fruit.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {fruit.active ? "ใช้งาน" : "ไม่ใช้งาน"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(fruit)}
                  className="flex-1 bg-[#C9A78B] text-[#4A2C1B] px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
                <h2 className="text-2xl font-bold text-[#4A2C1B]">
                  {editingFruit ? "แก้ไขผลไม้" : "เพิ่มผลไม้ใหม่"}
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
                  <label className="block text-[#4A2C1B] font-semibold mb-2">ชื่อผลไม้ *</label>
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
                    {editingFruit ? "อัปเดต" : "เพิ่ม"}
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

