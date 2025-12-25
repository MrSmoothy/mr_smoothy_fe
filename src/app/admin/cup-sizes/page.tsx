"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, X } from "lucide-react";
import {
  adminGetCupSizes,
  adminCreateCupSize,
  adminUpdateCupSize,
  adminDeleteCupSize,
  type CupSize,
  type CupSizeCreateRequest,
} from "@/lib/api";

export default function AdminCupSizesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cupSizes, setCupSizes] = useState<CupSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCupSize, setEditingCupSize] = useState<CupSize | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    volumeMl: "",
    priceExtra: "",
    active: true,
  });

  useEffect(() => {
    checkAuth();
    loadCupSizes();
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

  async function loadCupSizes() {
    try {
      setLoading(true);
      const res = await adminGetCupSizes();
      setCupSizes(res.data || []);
    } catch (err: any) {
      alert(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  function openModal(cupSize?: CupSize) {
    if (cupSize) {
      setEditingCupSize(cupSize);
      setFormData({
        name: cupSize.name,
        volumeMl: cupSize.volumeMl.toString(),
        priceExtra: cupSize.priceExtra.toString(),
        active: cupSize.active,
      });
    } else {
      setEditingCupSize(null);
      setFormData({
        name: "",
        volumeMl: "",
        priceExtra: "",
        active: true,
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCupSize(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data: CupSizeCreateRequest = {
        name: formData.name,
        volumeMl: parseInt(formData.volumeMl),
        priceExtra: parseFloat(formData.priceExtra),
        active: formData.active,
      };

      if (editingCupSize) {
        await adminUpdateCupSize(editingCupSize.id, data);
        alert("อัปเดตข้อมูลสำเร็จ");
      } else {
        await adminCreateCupSize(data);
        alert("เพิ่มข้อมูลสำเร็จ");
      }

      closeModal();
      loadCupSizes();
    } catch (err: any) {
      alert(err.message || "ไม่สามารถบันทึกข้อมูลได้");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("คุณต้องการลบขนาดแก้วนี้หรือไม่?")) return;
    try {
      await adminDeleteCupSize(id);
      alert("ลบข้อมูลสำเร็จ");
      loadCupSizes();
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
            <h1 className="text-4xl font-bold text-[#14433B] mb-2">จัดการขนาดแก้ว</h1>
            <p className="text-[#14433B]/70">เพิ่ม แก้ไข หรือลบขนาดแก้ว</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-[#14433B] text-[#FFF6F0] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            เพิ่มขนาดแก้ว
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cupSizes.map((cupSize) => (
            <div
              key={cupSize.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-[#14433B] mb-4">{cupSize.name}</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-[#14433B]/70">ปริมาณ:</span>
                  <span className="text-[#14433B] font-semibold">{cupSize.volumeMl} ml</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#14433B]/70">ราคาเพิ่มเติม:</span>
                  <span className="text-[#14433B] font-semibold">
                    {Number(cupSize.priceExtra).toFixed(2)} บาท
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    cupSize.active
                      ? "bg-[#14433B]/20 text-[#14433B]"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {cupSize.active ? "ใช้งาน" : "ไม่ใช้งาน"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(cupSize)}
                  className="flex-1 bg-[#C9A78B] text-[#14433B] px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(cupSize.id)}
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
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#14433B]">
                  {editingCupSize ? "แก้ไขขนาดแก้ว" : "เพิ่มขนาดแก้วใหม่"}
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
                  <label className="block text-[#14433B] font-semibold mb-2">ชื่อขนาดแก้ว *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    placeholder="เช่น Small, Medium, Large"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">ปริมาณ (ml) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.volumeMl}
                    onChange={(e) => setFormData({ ...formData, volumeMl: e.target.value })}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    placeholder="เช่น 300, 500, 700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#14433B] font-semibold mb-2">ราคาเพิ่มเติม (บาท) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceExtra}
                    onChange={(e) => setFormData({ ...formData, priceExtra: e.target.value })}
                    className="w-full rounded-md border border-[#14433B]/30 px-4 py-3 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
                    placeholder="เช่น 0, 5, 10"
                    required
                  />
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
                    {editingCupSize ? "อัปเดต" : "เพิ่ม"}
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

