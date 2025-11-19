"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, updateUserProfile, type UserProfile, type UserUpdateRequest } from "@/lib/api";
import { User, Mail, UserCircle, Calendar, Save, LogOut, ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadProfile();
  }, []);

  function checkAuth() {
    try {
      const stored = localStorage.getItem("auth_user");
      if (!stored) {
        router.push("/login?redirect=/profile");
        return;
      }
    } catch (err) {
      router.push("/login?redirect=/profile");
    }
  }

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      const res = await getCurrentUser();
      if (res.data) {
        setUser(res.data);
        setFormData({
          fullName: res.data.fullName || "",
          email: res.data.email || "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(err.message || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
      if (err.message?.includes("Authentication")) {
        router.push("/login?redirect=/profile");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate password if provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      setSaving(true);
      const updateData: UserUpdateRequest = {
        fullName: formData.fullName.trim() || undefined,
        email: formData.email.trim() || undefined,
        password: formData.password || undefined,
      };

      const res = await updateUserProfile(updateData);
      if (res.data) {
        // Update localStorage
        const stored = localStorage.getItem("auth_user");
        if (stored) {
          const userData = JSON.parse(stored);
          const updatedUser = {
            ...userData,
            fullName: res.data.fullName,
            email: res.data.email,
          };
          localStorage.setItem("auth_user", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("authStateChanged"));
        }

        setUser(res.data);
        setFormData({
          ...formData,
          password: "",
          confirmPassword: "",
        });
        alert("อัปเดตข้อมูลสำเร็จ! ✅");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "ไม่สามารถอัปเดตข้อมูลได้");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.dispatchEvent(new Event("authStateChanged"));
      router.push("/");
    }
  }

  if (loading) {
    return (
      <div className="bg-[#E8DDCB] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728] mx-auto mb-4"></div>
          <div className="text-[#4A3728] text-xl">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[#E8DDCB] min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl font-bold mb-2">เกิดข้อผิดพลาด</div>
          <div className="text-[#4A3728] mb-4">{error || "ไม่พบข้อมูลผู้ใช้"}</div>
          <button
            onClick={() => router.push("/")}
            className="bg-[#4A3728] text-[#E8DDCB] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#E8DDCB] min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#4A3728] hover:opacity-80 transition-opacity mb-4 font-sans"
          >
            <ArrowLeft className="w-5 h-5" />
            กลับ
          </button>
          <h1 className="text-4xl font-bold text-[#4A3728] mb-2 font-serif">โปรไฟล์ของฉัน</h1>
          <p className="text-[#4A3728]/70 font-sans">จัดการข้อมูลส่วนตัวของคุณ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-[#4A3728]/20">
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-[#4A3728] flex items-center justify-center mx-auto mb-4">
                  <UserCircle className="w-16 h-16 text-[#E8DDCB]" />
                </div>
                <h2 className="text-2xl font-bold text-[#4A3728] mb-1 font-serif">
                  {user.fullName || user.username}
                </h2>
                <p className="text-[#4A3728]/70 font-sans">@{user.username}</p>
                {user.role === "ADMIN" && (
                  <span className="inline-block mt-2 px-3 py-1 bg-[#4A3728] text-[#E8DDCB] rounded-full text-xs font-semibold">
                    ผู้ดูแลระบบ
                  </span>
                )}
              </div>

              <div className="space-y-4 border-t border-[#4A3728]/20 pt-4">
                <div className="flex items-center gap-3 text-[#4A3728]">
                  <Mail className="w-5 h-5" />
                  <span className="font-sans">{user.email}</span>
                </div>
                {user.createdAt && (
                  <div className="flex items-center gap-3 text-[#4A3728]/70">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-sans">
                      สมาชิกตั้งแต่ {new Date(user.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-6 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-sans"
              >
                <LogOut className="w-5 h-5" />
                ออกจากระบบ
              </button>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-[#4A3728]/20">
              <h3 className="text-2xl font-bold text-[#4A3728] mb-6 font-serif">แก้ไขข้อมูลส่วนตัว</h3>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-sans">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[#4A3728] font-semibold mb-2 font-sans">
                    <User className="w-4 h-4 inline mr-2" />
                    ชื่อ-นามสกุล
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-lg border border-[#4A3728]/30 px-4 py-3 text-[#4A3728] outline-none focus:ring-2 focus:ring-[#4A3728]/50 font-sans"
                    placeholder="กรุณากรอกชื่อ-นามสกุล"
                  />
                </div>

                <div>
                  <label className="block text-[#4A3728] font-semibold mb-2 font-sans">
                    <Mail className="w-4 h-4 inline mr-2" />
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-[#4A3728]/30 px-4 py-3 text-[#4A3728] outline-none focus:ring-2 focus:ring-[#4A3728]/50 font-sans"
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div className="border-t border-[#4A3728]/20 pt-6">
                  <h4 className="text-lg font-semibold text-[#4A3728] mb-4 font-serif">เปลี่ยนรหัสผ่าน</h4>
                  <p className="text-sm text-[#4A3728]/70 mb-4 font-sans">
                    ปล่อยว่างไว้ถ้าไม่ต้องการเปลี่ยนรหัสผ่าน
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#4A3728] font-semibold mb-2 font-sans">รหัสผ่านใหม่</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full rounded-lg border border-[#4A3728]/30 px-4 py-3 text-[#4A3728] outline-none focus:ring-2 focus:ring-[#4A3728]/50 font-sans"
                        placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className="block text-[#4A3728] font-semibold mb-2 font-sans">ยืนยันรหัสผ่าน</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full rounded-lg border border-[#4A3728]/30 px-4 py-3 text-[#4A3728] outline-none focus:ring-2 focus:ring-[#4A3728]/50 font-sans"
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 bg-gray-200 text-[#4A3728] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity font-sans"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#4A3728] text-[#E8DDCB] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-sans"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>บันทึกการเปลี่ยนแปลง</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

