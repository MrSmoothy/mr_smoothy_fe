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
    <div className="mx-auto max-w-3xl p-6 bg-[#F5EFE6] min-h-screen">
      <h1 className="mb-2 text-3xl font-semibold text-[#4A2C1B]">Mr Smoothy</h1>
      <p className="mb-6 text-[#4A2C1B]/70">เว็บร้านสมูทตี้ (เดโม Login/Register)</p>

      <div className="rounded-xl bg-[#4A2C1B] p-6 shadow-lg">
        {user ? (
          <div className="space-y-3">
            <p className="text-[#F5EFE6]">
              สวัสดี, <span className="font-medium">{user.fullName || user.username}</span>
            </p>
            <button
              onClick={logout}
              className="rounded-md bg-black px-4 py-2 text-[#F5EFE6] font-medium hover:opacity-90 transition-opacity"
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link 
              href="/login" 
              className="rounded-md bg-black px-4 py-2 text-[#F5EFE6] font-medium hover:opacity-90 transition-opacity"
            >
              เข้าสู่ระบบ
            </Link>
            <Link 
              href="/register" 
              className="rounded-md bg-[#F5EFE6] px-4 py-2 text-[#4A2C1B] font-medium hover:opacity-90 transition-opacity"
            >
              สมัครสมาชิก
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
