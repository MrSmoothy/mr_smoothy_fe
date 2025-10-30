"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = { id: number; username: string; email: string; fullName?: string };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {}
  }, []);

  function logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-3xl font-semibold">Mr Smoothy</h1>
      <p className="mb-6 text-zinc-600">เว็บร้านสมูทตี้ (เดโม Login/Register)</p>

      <div className="rounded-xl border p-6">
        {user ? (
          <div className="space-y-3">
            <p>
              สวัสดี, <span className="font-medium">{user.fullName || user.username}</span>
            </p>
            <button
              onClick={logout}
              className="rounded-md bg-black px-4 py-2 text-white"
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link href="/login" className="rounded-md bg-black px-4 py-2 text-white">
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="rounded-md border px-4 py-2">
              สมัครสมาชิก
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
