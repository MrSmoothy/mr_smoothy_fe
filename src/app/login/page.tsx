"use client";

import { useState } from "react";
import LoginModal from "@/components/LoginModal";

export default function HomePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5EFE6]">
      {/* ปุ่มเปิด modal */}
      <div className="p-6">
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-[#4A2C1B] px-4 py-2 text-[#F5EFE6]"
        >
          Log in
        </button>
      </div>

      {/* เนื้อหาพื้นหลัง */}
      <div className="p-6 text-[#4A2C1B]">
        เนื้อหาหน้าเว็บของคุณอยู่ตรงนี้...
      </div>

      {/* Modal */}
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
