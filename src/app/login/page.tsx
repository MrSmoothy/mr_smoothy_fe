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
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold">เข้าสู่ระบบ</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">Username</label>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
        <p className="mt-4 text-sm">
          ยังไม่มีบัญชี? <Link className="underline" href="/register">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  );
}


