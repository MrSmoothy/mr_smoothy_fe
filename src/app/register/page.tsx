"use client";

import { useState } from "react";
import Link from "next/link";
import { registerAccount } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    
    setLoading(true);
    try {
      const res = await registerAccount({
        username: form.username,
        password: form.password,
        email: form.email,
        fullName: form.fullName,
      });
      if (res.data?.token) {
        localStorage.setItem("auth_token", res.data.token);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));
        // Dispatch event to notify other components about login
        window.dispatchEvent(new Event("authStateChanged"));
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF6F0] p-4 sm:p-6">
      <div className="w-full max-w-md rounded-lg bg-[#14433B] p-6 sm:p-8 shadow-lg">
        <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-[#FFF6F0] text-center">Sign up</h1>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-[#FFF6F0]">Username</label>
            <input
              className="w-full rounded-md bg-[#C9A78B] px-4 py-3 text-[#14433B] placeholder:text-[#14433B]/60 outline-none focus:ring-2 focus:ring-[#FFF6F0]/50"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[#FFF6F0]">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-[#C9A78B] px-4 py-3 text-[#14433B] placeholder:text-[#14433B]/60 outline-none focus:ring-2 focus:ring-[#FFF6F0]/50"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[#FFF6F0]">Password</label>
            <input
              type="password"
              className="w-full rounded-md bg-[#C9A78B] px-4 py-3 text-[#14433B] placeholder:text-[#14433B]/60 outline-none focus:ring-2 focus:ring-[#FFF6F0]/50"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[#FFF6F0]">Password</label>
            <input
              type="password"
              className="w-full rounded-md bg-[#C9A78B] px-4 py-3 text-[#14433B] placeholder:text-[#14433B]/60 outline-none focus:ring-2 focus:ring-[#FFF6F0]/50"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-3 text-[#FFF6F0] font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "กำลังสมัครสมาชิก..." : "Signup"}
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-[#FFF6F0]">
          มีบัญชีอยู่แล้ว? <Link className="underline hover:opacity-80" href="/login">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}


