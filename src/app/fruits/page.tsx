"use client";

import { useEffect, useState } from "react";
import { getFruits, type Fruit } from "@/lib/api";
import { getImageUrl } from "@/lib/image";

export default function FruitsPage() {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadFruits();
  }, []);

  async function loadFruits() {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      console.log("กำลังโหลดข้อมูลผลไม้...");
      
      // ตรวจสอบ API_BASE_URL
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      console.log("API_BASE_URL:", API_BASE_URL);
      
      const response = await getFruits();
      console.log("Response จาก API:", response);
      console.log("Response type:", typeof response);
      console.log("Response.data:", response.data);
      console.log("Response.data type:", typeof response.data);
      console.log("Is array?", Array.isArray(response.data));
      
      // เก็บ debug info
      setDebugInfo({
        apiBaseUrl: API_BASE_URL,
        fullResponse: response,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : "N/A",
        rawData: response.data,
      });

      if (response && response.success !== false) {
        // ตรวจสอบว่า data เป็น array หรือไม่
        let fruitsData: Fruit[] = [];
        
        if (Array.isArray(response.data)) {
          fruitsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // ถ้า data เป็น object อาจจะต้องดึง array จาก property อื่น
          console.warn("Response.data is not an array, trying to find array...");
          fruitsData = [];
        }
        
        console.log("Fruits data before filter:", fruitsData);
        
        // กรองเฉพาะผลไม้ที่ active (ถ้ามี field active)
        const activeFruits = fruitsData.filter(f => {
          if (!f) return false;
          // ถ้าไม่มี field active ให้แสดงทั้งหมด
          if (f.active === undefined || f.active === null) {
            console.warn("Fruit missing active field:", f);
            return true; // แสดงผลไม้ที่ไม่มี active field
          }
          return f.active === true;
        });
        
        console.log("ผลไม้ที่โหลดได้:", activeFruits.length, "รายการ");
        console.log("รายละเอียดผลไม้:", activeFruits);
        setFruits(activeFruits);
        
        if (activeFruits.length === 0 && fruitsData.length > 0) {
          setError(`พบผลไม้ ${fruitsData.length} รายการ แต่ไม่มีรายการที่ active. กรุณาตรวจสอบค่า active ใน database`);
        } else if (activeFruits.length === 0) {
          setError("ไม่พบข้อมูลผลไม้ในระบบ");
        }
      } else {
        console.error("รูปแบบข้อมูลไม่ถูกต้อง:", response);
        setError(response?.message || "ไม่สามารถโหลดข้อมูลผลไม้ได้ - API returned success=false");
        setFruits([]);
      }
    } catch (err: any) {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผลไม้:", err);
      console.error("Error stack:", err.stack);
      setError(err.message || "ไม่สามารถโหลดข้อมูลผลไม้ได้");
      setFruits([]);
      setDebugInfo({
        error: err.message,
        stack: err.stack,
        name: err.name,
      });
    } finally {
      setLoading(false);
    }
  }

  // Filter fruits by search query
  const filteredFruits = searchQuery.trim()
    ? fruits.filter(fruit => {
        const query = searchQuery.toLowerCase();
        const nameMatch = fruit.name?.toLowerCase().includes(query);
        const descMatch = fruit.description?.toLowerCase().includes(query);
        const categoryMatch = fruit.category?.toLowerCase().includes(query);
        return nameMatch || descMatch || categoryMatch;
      })
    : fruits;

  if (loading) {
    return (
      <div className="bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#4A2C1B] text-xl mb-4">กำลังโหลดข้อมูลผลไม้...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A2C1B] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5EFE6] min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#4A2C1B] mb-2">ผลไม้ทั้งหมด</h1>
            <p className="text-[#4A2C1B]/70">
              เลือกผลไม้ที่คุณชื่นชอบสำหรับทำน้ำปั่นของคุณ ({filteredFruits.length} {searchQuery ? "รายการที่พบ" : `จาก ${fruits.length} รายการ`})
            </p>
          </div>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-600"
          >
            {showDebug ? "ซ่อน" : "แสดง"} Debug
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="ค้นหาวัตถุดิบ, ผลไม้, ผัก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-[#4A2C1B]/30 bg-white text-[#4A2C1B] placeholder:text-[#4A2C1B]/50 focus:outline-none focus:border-[#4A2C1B] focus:ring-2 focus:ring-[#4A2C1B]/20 transition-all font-sans"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4A2C1B]/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#4A2C1B]/50 hover:text-[#4A2C1B] transition-colors"
                aria-label="Clear search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-[#4A2C1B]/70 font-sans">
              {filteredFruits.length > 0 
                ? `พบ ${filteredFruits.length} รายการที่ตรงกับ "${searchQuery}"` 
                : `ไม่พบผลลัพธ์สำหรับ "${searchQuery}"`}
            </p>
          )}
        </div>

        {/* Debug Panel */}
        {showDebug && debugInfo && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold text-[#4A2C1B] mb-2">Debug Information:</h3>
            <div className="text-sm space-y-1 font-mono">
              <p><strong>API Base URL:</strong> {debugInfo.apiBaseUrl}</p>
              <p><strong>Data Type:</strong> {debugInfo.dataType}</p>
              <p><strong>Is Array:</strong> {String(debugInfo.isArray)}</p>
              <p><strong>Data Length:</strong> {debugInfo.dataLength}</p>
              {debugInfo.error && (
                <>
                  <p><strong>Error:</strong> {debugInfo.error}</p>
                  <p><strong>Stack:</strong> {debugInfo.stack}</p>
                </>
              )}
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-semibold text-[#4A2C1B]">
                ดู Raw Response
              </summary>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(debugInfo.fullResponse || debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 font-semibold mb-2">⚠️ เกิดข้อผิดพลาด:</div>
            <div className="text-red-700">{error}</div>
            <button
              onClick={loadFruits}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
            >
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {fruits.length === 0 && !loading && !error ? (
          <div className="text-center py-16">
            <div className="text-[#4A2C1B]/60 text-xl mb-4">ยังไม่มีผลไม้ในระบบ</div>
            <p className="text-[#4A2C1B]/50 mb-4">กรุณาตรวจสอบ:</p>
            <ul className="text-[#4A2C1B]/50 text-left max-w-md mx-auto space-y-2">
              <li>1. ตรวจสอบว่า backend API ทำงานอยู่ที่ {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}</li>
              <li>2. ตรวจสอบว่ามีข้อมูลผลไม้ใน database table `fruit`</li>
              <li>3. ตรวจสอบว่าผลไม้มีค่า `active = true` หรือ `active = 1`</li>
              <li>4. เปิด Browser DevTools → Console เพื่อดู error messages</li>
              <li>5. เปิด Browser DevTools → Network เพื่อดู API requests</li>
            </ul>
            <button
              onClick={loadFruits}
              className="mt-6 bg-[#4A2C1B] text-[#F5EFE6] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
            >
              ลองโหลดอีกครั้ง
            </button>
          </div>
        ) : filteredFruits.length === 0 && searchQuery ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md p-12">
            <div className="text-[#4A2C1B]/60 text-xl mb-4">ไม่พบผลลัพธ์สำหรับ "{searchQuery}"</div>
            <button
              onClick={() => setSearchQuery("")}
              className="bg-[#4A2C1B] text-[#F5EFE6] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
            >
              ล้างการค้นหา
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFruits.map((fruit) => (
              <div
                key={fruit.id}
                className="bg-white rounded-lg border border-[#4A2C1B]/20 p-4 hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
              >
                {/* รูปภาพผลไม้ */}
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100">
                  {fruit.imageUrl ? (
                    <img
                      src={getImageUrl(fruit.imageUrl)}
                      alt={fruit.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                        if (placeholder) {
                          placeholder.classList.remove("hidden");
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center text-gray-400 ${
                      fruit.imageUrl ? "hidden" : ""
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">🍎</div>
                      <div className="text-sm">ไม่มีรูปภาพ</div>
                    </div>
                  </div>
                </div>

                {/* ข้อมูลผลไม้ */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-[#4A2C1B] line-clamp-1">
                    {fruit.name}
                  </h3>
                  
                  {fruit.description && (
                    <p className="text-[#4A2C1B]/70 text-sm line-clamp-2 min-h-[2.5rem]">
                      {fruit.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#4A2C1B]/10">
                    <div>
                      <p className="text-xs text-[#4A2C1B]/50">ราคาต่อหน่วย</p>
                      <p className="text-xl font-bold text-[#4A2C1B]">
                        {Number(fruit.pricePerUnit).toFixed(2)} บาท
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        ✓ พร้อมใช้งาน
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-[#4A2C1B]/0 group-hover:bg-[#4A2C1B]/5 transition-colors duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}

        {/* ข้อมูลเพิ่มเติม */}
        {filteredFruits.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-[#4A2C1B]/60 text-sm">
              ต้องการสร้างน้ำปั่นด้วยผลไม้เหล่านี้?{" "}
              <a
                href="/menu"
                className="text-[#4A2C1B] font-semibold hover:underline"
              >
                ไปที่หน้าเมนู
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
