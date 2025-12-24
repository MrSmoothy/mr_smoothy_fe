"use client";

import { useState, useEffect } from "react";
import LoginModal from "@/app/components/LoginModal";

export default function LoginPage() {
  const [open, setOpen] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    // อ่าน redirect parameter จาก URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      setRedirectPath(redirect);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center p-4">
      <LoginModal 
        open={open} 
        onClose={() => setOpen(false)} 
        redirectPath={redirectPath}
      />
    </div>
  );
}
