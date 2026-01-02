"use client";

import { useState, useEffect } from "react";
import { type Fruit } from "@/lib/api";
import { getImageUrl } from "@/lib/image";
import { Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";

interface FruitSelectorProps {
  fruits: Fruit[];
  selectedFruits: Map<number, { fruit: Fruit; quantity: number }>;
  maxFruits: number;
  onFruitChange: (fruitId: number, delta: number) => void;
}

const ITEMS_PER_PAGE = 16;

export default function FruitSelector({
  fruits,
  selectedFruits,
  maxFruits,
  onFruitChange,
}: FruitSelectorProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when fruits array changes (category filter change or search)
  useEffect(() => {
    setCurrentPage(1);
  }, [fruits.length]);

  const totalFruits = Array.from(selectedFruits.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const remainingSlots = maxFruits - totalFruits;

  // Calculate pagination
  const totalPages = Math.ceil(fruits.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentFruits = fruits.slice(startIndex, endIndex);

  function handleAddFruit(fruitId: number) {
    if (totalFruits < maxFruits) {
      onFruitChange(fruitId, 1);
    }
  }

  function handleRemoveFruit(fruitId: number) {
    const current = selectedFruits.get(fruitId);
    if (current && current.quantity > 0) {
      onFruitChange(fruitId, -1);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#14433B]">Select Ingredients</h3>
        <div className="text-sm text-[#14433B]/70">
          {totalFruits} / {maxFruits} Ingredients
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentFruits.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-[#14433B]/40 text-6xl mb-4">🔍</div>
            <div className="text-[#14433B]/60 text-lg mb-2">
              ไม่มีในหมวดหมู่นี้
            </div>
          </div>
        ) : (
          currentFruits.map((fruit) => {
            const selected = selectedFruits.get(fruit.id);
            const quantity = selected?.quantity || 0;
            const isSelected = quantity > 0;
            const canAdd = totalFruits < maxFruits;

            return (
              <div
                key={fruit.id}
                className={`relative group transition-all duration-300 ${isSelected
                  ? "scale-105 shadow-lg"
                  : "hover:scale-102"
                  }`}
              >
                <div
                  className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${isSelected
                    ? "border-[#14433B] bg-[#C9A78B]/20 shadow-md"
                    : "border-[#14433B]/20 bg-white hover:border-[#14433B]/50"
                    }`}
                >
                  {/* รูปภาพผลไม้ */}
                  <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    {fruit.imageUrl ? (
                      <img
                        src={getImageUrl(fruit.imageUrl)}
                        alt={fruit.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${isSelected ? "scale-110" : "group-hover:scale-105"
                          }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🍎
                      </div>
                    )}

                    {/* Overlay เมื่อเลือก */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#14433B]/10 flex items-center justify-center">
                        <div className="bg-white/90 rounded-full px-3 py-1 text-[#14433B] font-bold text-lg shadow-lg animate-bounce">
                          {quantity}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ข้อมูลผลไม้ */}
                  <div className="p-3 space-y-1">
                    <h4 className="font-semibold text-[#14433B] text-sm line-clamp-1">
                      {fruit.name}
                    </h4>
                    <p className="text-xs text-[#14433B]/70">
                      {Number(fruit.pricePerUnit).toFixed(2)} บาท
                    </p>
                  </div>

                  {/* ปุ่มควบคุม */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    {isSelected ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFruit(fruit.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          aria-label="ลดจำนวน"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="bg-white/95 rounded-full px-3 py-1 text-[#14433B] font-bold text-sm shadow-md min-w-[2rem] text-center">
                          {quantity}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canAdd) handleAddFruit(fruit.id);
                          }}
                          disabled={!canAdd}
                          className={`rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${canAdd
                            ? "bg-[#14433B] hover:bg-[#1a5444] text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          aria-label="เพิ่มจำนวน"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canAdd) handleAddFruit(fruit.id);
                        }}
                        disabled={!canAdd}
                        className={`rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${canAdd
                          ? "bg-[#14433B] hover:bg-[#1a5444] text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        aria-label="เพิ่มผลไม้"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Badge เมื่อเลือก */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 bg-[#14433B] text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg animate-pulse">
                      ✓
                    </div>
                  )}
                </div>

                {/* Tooltip เมื่อไม่สามารถเพิ่มได้ */}
                {!canAdd && !isSelected && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    เต็มแล้ว (สูงสุด {maxFruits} อย่าง)
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#14433B] text-white hover:bg-[#1a5444] shadow-md hover:shadow-lg active:scale-95"
              }`}
            aria-label="หน้าก่อนหน้า"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page Numbers */}
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[2.5rem] h-10 rounded-lg font-semibold transition-all duration-200 ${currentPage === page
                  ? "bg-[#14433B] text-white shadow-lg scale-110"
                  : "bg-white text-[#14433B] border-2 border-[#14433B]/20 hover:border-[#14433B]/50 hover:shadow-md active:scale-95"
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#14433B] text-white hover:bg-[#1a5444] shadow-md hover:shadow-lg active:scale-95"
              }`}
            aria-label="หน้าถัดไป"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* สรุปผลไม้ที่เลือก */}
      {selectedFruits.size > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-[#C9A78B]/20 to-[#C9A78B]/10 rounded-lg border border-[#14433B]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#14433B]">Selected Ingredients:</span>
            <span className="text-sm text-[#14433B]/70">
              {totalFruits} / {maxFruits} Ingredients
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedFruits.entries()).map(([fruitId, { fruit, quantity }]) => (
              <div
                key={fruitId}
                className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-[#14433B]/20"
              >
                {fruit.imageUrl && (
                  <img
                    src={getImageUrl(fruit.imageUrl)}
                    alt={fruit.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="text-sm text-[#14433B] font-medium">{fruit.name}</span>
                <span className="text-sm font-bold text-[#14433B]">x{quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

