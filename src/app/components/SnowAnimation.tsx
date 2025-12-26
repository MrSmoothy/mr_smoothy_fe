"use client";

import { useEffect, useState } from "react";

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  size: number;
  opacity: number;
  delay: number;
}

export default function SnowAnimation() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // ฟังก์ชันสร้างหิมะ
    const createSnowflakes = (): Snowflake[] => {
      return Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDuration: 7 + Math.random() * 7, // 3-7 วินาที
        size: 12 + Math.random() * 10, // 5-15px
        opacity: 0.3 + Math.random() * 0.7, // 0.3-1.0
        delay: Math.random() * 2, // 0-2 วินาที
      }));
    };

    // ตรวจสอบการตั้งค่าจาก localStorage
    const snowEnabled = localStorage.getItem("snowAnimation") === "true";
    setEnabled(snowEnabled);

    if (snowEnabled) {
      setSnowflakes(createSnowflakes());
    }

    // ฟังการเปลี่ยนแปลงจาก localStorage
    const handleStorageChange = () => {
      const newEnabled = localStorage.getItem("snowAnimation") === "true";
      setEnabled(newEnabled);
      if (newEnabled) {
        setSnowflakes(createSnowflakes());
      } else {
        setSnowflakes([]);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Custom event สำหรับอัปเดตภายใน tab เดียวกัน
    window.addEventListener("snowAnimationChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("snowAnimationChanged", handleStorageChange);
    };
  }, []);

  if (!enabled || snowflakes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute top-0 text-white snowflake"
            style={{
              left: `${flake.left}%`,
              fontSize: `${flake.size}px`,
              opacity: flake.opacity,
              animation: `snowfall ${flake.animationDuration}s linear infinite`,
              animationDelay: `${flake.delay}s`,
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </>
  );
}

