"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-[#4A2C1B] w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-[#F5EFE6]">
          Mr. Smoothy
        </Link>
        <nav className="flex items-center gap-4">
          <ShoppingCart className="text-[#F5EFE6] w-6 h-6 cursor-pointer" />
          <Link
            href="/login"
            className="rounded-md bg-black px-6 py-2 text-[#F5EFE6] font-medium hover:opacity-90 transition-opacity"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-[#F5EFE6] px-6 py-2 text-[#4A2C1B] font-medium hover:opacity-90 transition-opacity"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}

