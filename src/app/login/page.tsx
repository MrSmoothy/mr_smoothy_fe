"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { Eye, EyeOff, Lock, User, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    // อ่าน redirect parameter จาก URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      setRedirectPath(redirect);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(username, password);

      if (res.data?.token) {
        localStorage.setItem("auth_token", res.data.token);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));
        window.dispatchEvent(new Event("authStateChanged"));

        // ตรวจสอบ role แบบยืดหยุ่น (รองรับหลายรูปแบบ)
        const userRole = res.data.user?.role;
        const isAdmin = userRole && (
          userRole.toUpperCase() === "ADMIN" || 
          userRole.toUpperCase() === "ROLE_ADMIN" ||
          userRole.toLowerCase() === "admin"
        );

        // ตรวจสอบ redirect parameter
        if (redirectPath) {
          router.push(redirectPath);
        } else if (isAdmin) {
          router.push("/admin/dashboard");
        } else {
          router.push("/menu");
        }
      }
    } catch (err: any) {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8DDCB] via-[#F5EFE6] to-[#D4C5B0] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #4A2C1B 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#4A2C1B]/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#C9A78B]/20 rounded-full blur-3xl"></div>

        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#4A2C1B]/10 p-8 sm:p-10">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#4A2C1B] to-[#5A3C2B] flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-[#F5EFE6]">MS</span>
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-[#4A2C1B] font-serif mb-2">ยินดีต้อนรับกลับ</h1>
            <p className="text-[#4A2C1B]/70 font-sans">เข้าสู่ระบบเพื่อใช้งานต่อ</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-[#4A2C1B] mb-2 font-sans">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4A2C1B]/50">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-[#4A2C1B]/20 bg-[#F5EFE6]/50 text-[#4A2C1B] placeholder:text-[#4A2C1B]/40 focus:outline-none focus:border-[#4A2C1B] focus:bg-white transition-all font-sans"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรุณากรอกชื่อผู้ใช้"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-[#4A2C1B] mb-2 font-sans">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4A2C1B]/50">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-12 pr-12 py-3 rounded-lg border-2 border-[#4A2C1B]/20 bg-[#F5EFE6]/50 text-[#4A2C1B] placeholder:text-[#4A2C1B]/40 focus:outline-none focus:border-[#4A2C1B] focus:bg-white transition-all font-sans"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรุณากรอกรหัสผ่าน"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#4A2C1B]/50 hover:text-[#4A2C1B] transition-colors"
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-2 animate-fadeIn">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">!</span>
                </div>
                <p className="text-sm text-red-700 font-sans">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4A2C1B] to-[#5A3C2B] text-[#F5EFE6] py-3.5 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-sans"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#F5EFE6]/30 border-t-[#F5EFE6] rounded-full animate-spin"></div>
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-[#4A2C1B]/20"></div>
            <span className="text-sm text-[#4A2C1B]/50 font-sans">หรือ</span>
            <div className="flex-1 h-px bg-[#4A2C1B]/20"></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-[#4A2C1B]/70 font-sans mb-2">
              ยังไม่มีบัญชี?
            </p>
            <Link
              href="/register"
              className="inline-block text-[#4A2C1B] font-semibold hover:text-[#5A3C2B] transition-colors underline decoration-2 underline-offset-2 font-sans"
            >
              สมัครสมาชิกเลย
            </Link>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-[#4A2C1B]/60 hover:text-[#4A2C1B] transition-colors font-sans"
            >
              ← กลับไปหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
