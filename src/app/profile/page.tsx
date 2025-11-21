"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, updateUserProfile, type UserProfile, type UserUpdateRequest } from "@/lib/api";
import { User, Mail, UserCircle, Calendar, Save, LogOut, ArrowLeft, Phone, Cake } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [dateParts, setDateParts] = useState({
    day: "",
    month: "",
    year: "",
  });

  // ฟังก์ชันแปลงวันที่เป็น ISO format (YYYY-MM-DD)
  function formatDateToISO(day: string, month: string, year: string): string {
    if (!day || !month || !year) return "";
    const yearAD = parseInt(year) - 543; // แปลงจาก พ.ศ. เป็น ค.ศ.
    const monthNum = parseInt(month) - 1; // JavaScript Date month is 0-indexed
    const dayNum = parseInt(day);
    
    if (isNaN(yearAD) || isNaN(monthNum) || isNaN(dayNum)) return "";
    
    const date = new Date(yearAD, monthNum, dayNum);
    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
    if (date.getFullYear() !== yearAD || date.getMonth() !== monthNum || date.getDate() !== dayNum) {
      return "";
    }
    
    const yearStr = yearAD.toString().padStart(4, '0');
    const monthStr = (monthNum + 1).toString().padStart(2, '0');
    const dayStr = dayNum.toString().padStart(2, '0');
    return `${yearStr}-${monthStr}-${dayStr}`;
  }

  // ฟังก์ชันแปลงวันที่จาก ISO format เป็นวัน/เดือน/ปี พ.ศ.
  function parseDateFromISO(dateStr: string): { day: string; month: string; year: string } {
    if (!dateStr) return { day: "", month: "", year: "" };
    
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString();
      const month = (date.getMonth() + 1).toString();
      const year = (date.getFullYear() + 543).toString(); // แปลงเป็น พ.ศ.
      return { day, month, year };
    } catch {
      return { day: "", month: "", year: "" };
    }
  }

  // ฟังก์ชันอัปเดตวันที่เกิด
  function updateDateOfBirth(day: string | null, month: string | null, year: string | null) {
    const newDateParts = {
      day: day !== null ? day : dateParts.day,
      month: month !== null ? month : dateParts.month,
      year: year !== null ? year : dateParts.year,
    };
    
    setDateParts(newDateParts);
    
    if (newDateParts.day && newDateParts.month && newDateParts.year) {
      const isoDate = formatDateToISO(newDateParts.day, newDateParts.month, newDateParts.year);
      if (isoDate) {
        setFormData({ ...formData, dateOfBirth: isoDate });
      }
    } else {
      setFormData({ ...formData, dateOfBirth: "" });
    }
  }

  // ฟังก์ชันแสดงวันที่ในรูปแบบไทย
  function formatThaiDate(dateStr: string): string {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear() + 543;
      const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                          "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
      return `${day} ${monthNames[month - 1]} ${year}`;
    } catch {
      return "";
    }
  }

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
      
      // โหลดข้อมูลจาก localStorage ก่อน (fallback)
      let hasLocalData = false;
      let localUserData: any = null;
      
      try {
        const stored = localStorage.getItem("auth_user");
        const token = localStorage.getItem("auth_token");
        
        if (stored && token) {
          localUserData = JSON.parse(stored);
          setUser(localUserData);
          const dateOfBirthLocal = localUserData.dateOfBirth ? localUserData.dateOfBirth.split('T')[0] : "";
          const parsedDateLocal = parseDateFromISO(dateOfBirthLocal);
          
          setFormData({
            fullName: localUserData.fullName || "",
            email: localUserData.email || "",
            phoneNumber: localUserData.phoneNumber || "",
            dateOfBirth: dateOfBirthLocal,
            password: "",
            confirmPassword: "",
          });
          
          setDateParts(parsedDateLocal);
          hasLocalData = true;
        }
      } catch (localErr) {
        // Silent fail สำหรับ localStorage
      }
      
      // พยายามโหลดข้อมูลใหม่จาก API (silent fail ถ้ามีข้อมูลจาก localStorage)
      try {
        const res = await getCurrentUser();
        if (res.data) {
          setUser(res.data);
        const dateOfBirth = res.data.dateOfBirth ? res.data.dateOfBirth.split('T')[0] : "";
        const parsedDate = parseDateFromISO(dateOfBirth);
        
        setFormData({
          fullName: res.data.fullName || "",
          email: res.data.email || "",
          phoneNumber: res.data.phoneNumber || "",
          dateOfBirth: dateOfBirth,
          password: "",
          confirmPassword: "",
        });
        
        setDateParts(parsedDate);
          setError(null);
        }
      } catch (apiErr: any) {
        // ถ้ามีข้อมูลจาก localStorage แล้ว ไม่ต้องแสดง error หรือ log
        if (hasLocalData) {
          // ไม่แสดง error หรือ log - ใช้ข้อมูลจาก localStorage ต่อไป
          setError(null);
          return; // ออกจาก function โดยไม่แสดง error
        }
        
        // ถ้าไม่มีข้อมูลจาก localStorage ให้ตรวจสอบ error
        const errorMessage = apiErr.message || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้";
        
        // ตรวจสอบว่ามี token หรือไม่
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setTimeout(() => {
            router.push("/login?redirect=/profile");
          }, 1000);
          return;
        }
        
        // ถ้าเป็น authentication error ให้ redirect ไป login
        const isAuthError = errorMessage.includes("Authentication") || 
                           errorMessage.includes("required") ||
                           errorMessage.includes("token") ||
                           errorMessage.includes("Invalid") ||
                           errorMessage.includes("expired") ||
                           errorMessage.includes("ไม่พบข้อมูลผู้ใช้") ||
                           errorMessage.includes("User not found");
        
        if (isAuthError) {
          setTimeout(() => {
            router.push("/login?redirect=/profile");
          }, 2000);
          return;
        }
        
        // ถ้าไม่ใช่ auth error และไม่มีข้อมูลจาก localStorage
        setError(errorMessage);
      }
    } catch (err: any) {
      // Fallback error handling
      const errorMessage = err.message || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้";
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setTimeout(() => {
          router.push("/login?redirect=/profile");
        }, 1000);
        return;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate phone number (must be 10 digits if provided)
    if (formData.phoneNumber && formData.phoneNumber.length !== 10) {
      setError("กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก");
      return;
    }

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
      // สร้าง update data โดยกรอง undefined และ empty strings
      const updateData: UserUpdateRequest = {};
      
      if (formData.fullName.trim()) {
        updateData.fullName = formData.fullName.trim();
      }
      
      if (formData.email.trim()) {
        updateData.email = formData.email.trim();
      }
      
      if (formData.phoneNumber.trim()) {
        updateData.phoneNumber = formData.phoneNumber.trim();
      }
      
      if (formData.dateOfBirth) {
        updateData.dateOfBirth = formData.dateOfBirth;
      }
      
      if (formData.password) {
        updateData.password = formData.password;
      }

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
            phoneNumber: res.data.phoneNumber,
            dateOfBirth: res.data.dateOfBirth,
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

  // ถ้าไม่มี user ให้ตรวจสอบว่ามีข้อมูลใน localStorage หรือไม่
  if (!user) {
    try {
      const stored = localStorage.getItem("auth_user");
      const token = localStorage.getItem("auth_token");
      
      if (!stored || !token) {
        // ถ้าไม่มีข้อมูลเลย ให้ redirect ไป login
        return (
          <div className="bg-[#E8DDCB] min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="text-red-600 text-xl font-bold mb-2">ต้องเข้าสู่ระบบ</div>
              <div className="text-[#4A3728] mb-4">กรุณาเข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์</div>
              <button
                onClick={() => router.push("/login?redirect=/profile")}
                className="bg-[#4A3728] text-[#E8DDCB] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                ไปที่หน้าเข้าสู่ระบบ
              </button>
            </div>
          </div>
        );
      }
      
      // ถ้ามี token แต่โหลดข้อมูลไม่ได้ แสดง error screen
      return (
        <div className="bg-[#E8DDCB] min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-xl font-bold mb-2">เกิดข้อผิดพลาด</div>
            <div className="text-[#4A3728] mb-4">{error || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้"}</div>
            <div className="space-y-2">
              <button
                onClick={loadProfile}
                className="w-full bg-[#4A3728] text-[#E8DDCB] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                ลองใหม่อีกครั้ง
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-gray-200 text-[#4A3728] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      );
    } catch (err) {
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
                {user.phoneNumber && (
                  <div className="flex items-center gap-3 text-[#4A3728]">
                    <Phone className="w-5 h-5" />
                    <span className="font-sans">{user.phoneNumber}</span>
                  </div>
                )}
                {user.dateOfBirth && (
                  <div className="flex items-center gap-3 text-[#4A3728]">
                    <Cake className="w-5 h-5" />
                    <span className="font-sans">
                      {new Date(user.dateOfBirth).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
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
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-sans">
                  <div className="font-semibold mb-1">ข้อมูล:</div>
                  <div className="text-sm">{error}</div>
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

                <div>
                  <label className="block text-[#4A3728] font-semibold mb-2 font-sans">
                    <Phone className="w-4 h-4 inline mr-2" />
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      // อนุญาตให้กรอกได้เฉพาะตัวเลขและจำกัด 10 ตัว
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, phoneNumber: value });
                    }}
                    className="w-full rounded-lg border border-[#4A3728]/30 px-4 py-3 text-[#4A3728] outline-none focus:ring-2 focus:ring-[#4A3728]/50 font-sans"
                    placeholder="0801234567"
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                  {formData.phoneNumber && formData.phoneNumber.length !== 10 && (
                    <p className="text-sm text-orange-600 mt-1 font-sans">กรุณากรอกเบอร์โทรศัพท์ 10 หลัก</p>
                  )}
                </div>

                <div>
                  <label className="block text-[#4A3728] font-semibold mb-2 font-sans">
                    <Cake className="w-4 h-4 inline mr-2" />
                    วันที่เกิด (วัน/เดือน/ปี พ.ศ.)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-[#4A3728]/70 mb-1 font-sans">วัน</label>
                      <select
                        value={dateParts.day}
                        onChange={(e) => {
                          const day = e.target.value;
                          updateDateOfBirth(day, null, null);
                        }}
                        className="w-full rounded-lg border border-[#4A3728]/30 px-3 py-2 text-[#4A3728] outline-none focus:ring-2 focus:ring-[#4A3728]/50 font-sans bg-white"
                      >
                        <option value="">เลือกวัน</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day.toString()}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#4A3728]/70 mb-1 font-sans">เดือน</label>
                      <select
                        value={dateParts.month}
                        onChange={(e) => {
                          const month = e.target.value;
                          updateDateOfBirth(null, month, null);
                        }}
                        className="w-full rounded-lg border border-[#4A3728]/30 px-3 py-2 text-[#4A3728] outline-none focus:ring-2 focus:ring-[#4A3728]/50 font-sans bg-white"
                      >
                        <option value="">เลือกเดือน</option>
                        <option value="1">มกราคม</option>
                        <option value="2">กุมภาพันธ์</option>
                        <option value="3">มีนาคม</option>
                        <option value="4">เมษายน</option>
                        <option value="5">พฤษภาคม</option>
                        <option value="6">มิถุนายน</option>
                        <option value="7">กรกฎาคม</option>
                        <option value="8">สิงหาคม</option>
                        <option value="9">กันยายน</option>
                        <option value="10">ตุลาคม</option>
                        <option value="11">พฤศจิกายน</option>
                        <option value="12">ธันวาคม</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#4A3728]/70 mb-1 font-sans">ปี พ.ศ.</label>
                      <select
                        value={dateParts.year}
                        onChange={(e) => {
                          const yearBE = e.target.value;
                          updateDateOfBirth(null, null, yearBE);
                        }}
                        className="w-full rounded-lg border border-[#4A3728]/30 px-3 py-2 text-[#4A3728] outline-none focus:ring-2 focus:ring-[#4A3728]/50 font-sans bg-white"
                      >
                        <option value="">เลือกปี พ.ศ.</option>
                        {Array.from({ length: 111 }, (_, i) => 2460 + i).map((year) => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {formData.dateOfBirth && (
                    <p className="text-sm text-[#4A3728]/70 mt-2 font-sans">
                      วันที่เลือก: {formatThaiDate(formData.dateOfBirth)}
                    </p>
                  )}
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

