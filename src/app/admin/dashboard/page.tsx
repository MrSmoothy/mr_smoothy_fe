"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Coffee, Ruler, Image as ImageIcon } from "lucide-react";
import { adminGetFruits, adminGetDrinks, adminGetCupSizes } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    fruits: 0,
    drinks: 0,
    cupSizes: 0,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      const userData = stored ? JSON.parse(stored) : null;
      
      if (!userData) {
        router.push("/login");
        return;
      }

      if (userData.role !== "ADMIN") {
        alert("Access denied. Admin role required.");
        router.push("/");
        return;
      }

      setUser(userData);
      loadStats();
    } catch (err) {
      router.push("/login");
    }
  }, [router]);

  async function loadStats() {
    try {
      const [fruitsRes, drinksRes, cupSizesRes] = await Promise.all([
        adminGetFruits(),
        adminGetDrinks(),
        adminGetCupSizes(),
      ]);
      setStats({
        fruits: fruitsRes.data?.length || 0,
        drinks: drinksRes.data?.length || 0,
        cupSizes: cupSizesRes.data?.length || 0,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }

  if (!user) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="text-[#4A2C1B] text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5EFE6] min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#4A2C1B] mb-2">Admin Dashboard</h1>
          <p className="text-[#4A2C1B]/70">จัดการข้อมูลระบบ Mr. Smoothy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/admin/fruits"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <Package className="w-12 h-12 text-[#4A2C1B]" />
              <span className="text-3xl font-bold text-[#4A2C1B]">{stats.fruits}</span>
            </div>
            <h3 className="text-xl font-semibold text-[#4A2C1B] mb-2">จัดการผลไม้</h3>
            <p className="text-[#4A2C1B]/70 text-sm">เพิ่ม แก้ไข ลบผลไม้และผัก</p>
          </Link>

          <Link
            href="/admin/drinks"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <Coffee className="w-12 h-12 text-[#4A2C1B]" />
              <span className="text-3xl font-bold text-[#4A2C1B]">{stats.drinks}</span>
            </div>
            <h3 className="text-xl font-semibold text-[#4A2C1B] mb-2">จัดการเมนู</h3>
            <p className="text-[#4A2C1B]/70 text-sm">เพิ่ม แก้ไข ลบเมนูน้ำปั่น</p>
          </Link>

          <Link
            href="/admin/cup-sizes"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <Ruler className="w-12 h-12 text-[#4A2C1B]" />
              <span className="text-3xl font-bold text-[#4A2C1B]">{stats.cupSizes}</span>
            </div>
            <h3 className="text-xl font-semibold text-[#4A2C1B] mb-2">จัดการขนาดแก้ว</h3>
            <p className="text-[#4A2C1B]/70 text-sm">เพิ่ม แก้ไข ลบขนาดแก้ว</p>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#4A2C1B] mb-4">คำแนะนำ</h2>
          <div className="space-y-2 text-[#4A2C1B]/70">
            <p>• ใช้เมนูด้านบนเพื่อจัดการข้อมูลแต่ละหมวดหมู่</p>
            <p>• สามารถอัปโหลดรูปภาพได้ในแต่ละหน้าจัดการ</p>
            <p>• ข้อมูลที่ "active" จะแสดงให้ลูกค้าเห็น</p>
          </div>
        </div>
      </div>
    </div>
  );
}

