"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginModal({ open, onClose }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ปิดด้วยปุ่ม ESC + ล็อกสกอลล์ตอน modal เปิด
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

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

        onClose(); // ปิด modal ก่อน redirect

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

  if (!open) return null;

  return (
    // Overlay (คลิกพื้นหลังเพื่อปิด)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      {/* พื้นหลังเบล + ดำโปร่ง */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* กล่อง Modal (กันไม่ให้คลิกแล้วปิดตอนคลิกในกล่อง) */}
      <div
        className="relative w-full max-w-md rounded-lg bg-[#4A2C1B] p-6 sm:p-8 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5EFE6]">Log in</h1>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-2 text-[#F5EFE6] hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-[#F5EFE6]">Username</label>
            <input
              className="w-full rounded-md bg-[#C9A78B] px-4 py-3 text-[#4A2C1B] placeholder:text-[#4A2C1B]/60 outline-none focus:ring-2 focus:ring-[#F5EFE6]/50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
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
          ยังไม่มีบัญชี?{" "}
          <Link className="underline hover:opacity-80" href="/register">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}
