"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res.data?.token) {
        localStorage.setItem("auth_token", res.data.token);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));
        // Dispatch event to notify other components about login
        window.dispatchEvent(new Event("authStateChanged"));
        
        // Redirect based on user role
        if (res.data.user?.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/menu");
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5EFE6] p-4 sm:p-6">
      <div className="w-full max-w-md rounded-lg bg-[#4A2C1B] p-6 sm:p-8 shadow-lg">
        <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-[#F5EFE6] text-center">Log in</h1>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-[#F5EFE6]">Username</label>
            <input
              className="w-full rounded-md bg-[#C9A78B] px-4 py-3 text-[#4A2C1B] placeholder:text-[#4A2C1B]/60 outline-none focus:ring-2 focus:ring-[#F5EFE6]/50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[#F5EFE6]">Password</label>
            <input
              type="password"
              className="w-full rounded-md bg-[#C9A78B] px-4 py-3 text-[#4A2C1B] placeholder:text-[#4A2C1B]/60 outline-none focus:ring-2 focus:ring-[#F5EFE6]/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-3 text-[#F5EFE6] font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "Log in"}
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-[#F5EFE6]">
          ยังไม่มีบัญชี? <Link className="underline hover:opacity-80" href="/register">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  );
}


