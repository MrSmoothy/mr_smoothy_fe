"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/app/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  function checkAuth() {
    try {
      const stored = localStorage.getItem("auth_user");
      const userData = stored ? JSON.parse(stored) : null;

      if (!userData) {
        router.push("/login?redirect=" + encodeURIComponent(pathname || "/admin/dashboard"));
        return;
      }

      if (userData.role !== "ADMIN") {
        alert("Access denied. Admin role required.");
        router.push("/");
        return;
      }

      setUser(userData);
    } catch (err) {
      router.push("/login?redirect=" + encodeURIComponent(pathname || "/admin/dashboard"));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#E8DDCB] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728] mx-auto mb-4"></div>
          <div className="text-[#4A3728] text-xl">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#E8DDCB]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

