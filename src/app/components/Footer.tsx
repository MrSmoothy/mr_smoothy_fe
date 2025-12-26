"use client";

import Link from "next/link";
import { Mail, Phone, Clock, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#14433B] w-full mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Branding Section */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-white mb-2 font-serif flex items-center gap-1">
                <span>Mr. Sm</span>
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>thy</span>
              </h2>
            </div>
            <p className="text-white text-sm font-sans">
              "Healthy Smoothies for Your Everyday Energy"
            </p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base font-sans">Quick Links</h3>
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="text-white hover:text-white/90 transition-colors text-sm font-sans"
              >
                Home
              </Link>
              <Link
                href="/menu"
                className="text-white hover:text-white/90 transition-colors text-sm font-sans"
              >
                Menu
              </Link>
              <Link
                href="/build"
                className="text-white hover:text-white/90 transition-colors text-sm font-sans"
              >
                Custom Menu
              </Link>
              <Link
                href="/contact"
                className="text-white hover:text-white/90 transition-colors text-sm font-sans"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Categories Section */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base font-sans">Categories</h3>
            <div className="flex flex-col gap-3">
              <Link
                href="/menu?category=SIGNATURE"
                className="text-white hover:text-white/90 transition-colors text-sm font-sans"
              >
                Signature
              </Link>
              <Link
                href="/menu?category=CLASSIC"
                className="text-white hover:text-white/90 transition-colors text-sm font-sans"
              >
                Classic
              </Link>
              <Link
                href="/menu?category=GREEN_BOOSTER"
                className="text-white hover:text-white/90 transition-colors text-sm font-sans"
              >
                Green Booster
              </Link>
              <Link
                href="/menu?category=HIGH_PROTEIN"
                className="text-white hover:text-white/90 transition-colors text-sm font-sans"
              >
                High-Protein
              </Link>
              <Link
                href="/menu?category=SUPERFRUIT"
                className="text-white hover:text-white/90 transition-colors text-sm font-sans"
              >
                Superfruits
              </Link>
            </div>
          </div>

          {/* Get in Touch Section */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base font-sans">Get in Touch</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:Mr.Smoothy@gmail.com"
                  className="text-white hover:text-white/90 transition-colors text-sm font-sans"
                >
                  Mr.Smoothy@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <a
                  href="tel:1-2666-222-44"
                  className="text-white hover:text-white/90 transition-colors text-sm font-sans"
                >
                  1-2666-222-44
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-white text-sm font-sans">Mon-Fri: 8AM - 8PM</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-white text-sm font-sans leading-relaxed">
                  123 Healthy Street<br />Wellness City
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/20 text-center">
          <p className="text-white/70 text-sm font-sans">© 2024 Mr. Smoothy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

