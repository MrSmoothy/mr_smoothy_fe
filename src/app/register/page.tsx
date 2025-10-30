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
    setLoading(true);
    try {
      const res = await registerAccount(form);
      if (res.data?.token) {
        localStorage.setItem("auth_token", res.data.token);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold">สมัครสมาชิก</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">Username</label>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input
              type="email"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">ชื่อ-นามสกุล (ถ้ามี)</label>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>
        <p className="mt-4 text-sm">
          มีบัญชีอยู่แล้ว? <Link className="underline" href="/login">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}


