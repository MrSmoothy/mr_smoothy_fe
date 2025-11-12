"use client";

import { type Fruit } from "@/lib/api";
import { getImageUrl } from "@/lib/image";
import { Plus, Minus } from "lucide-react";

interface FruitSelectorProps {
  fruits: Fruit[];
  selectedFruits: Map<number, { fruit: Fruit; quantity: number }>;
  maxFruits: number;
  onFruitChange: (fruitId: number, delta: number) => void;
}

export default function FruitSelector({
  fruits,
  selectedFruits,
  maxFruits,
  onFruitChange,
}: FruitSelectorProps) {
  const totalFruits = Array.from(selectedFruits.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const remainingSlots = maxFruits - totalFruits;

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
        <h3 className="text-xl font-bold text-[#4A2C1B]">เลือกผลไม้</h3>
        <div className="text-sm text-[#4A2C1B]/70">
          {totalFruits} / {maxFruits} ผลไม้
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fruits.map((fruit) => {
          const selected = selectedFruits.get(fruit.id);
          const quantity = selected?.quantity || 0;
          const isSelected = quantity > 0;
          const canAdd = totalFruits < maxFruits;

          return (
            <div
              key={fruit.id}
              className={`relative group transition-all duration-300 ${
                isSelected
                  ? "scale-105 shadow-lg"
                  : "hover:scale-102"
              }`}
            >
              <div
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  isSelected
                    ? "border-[#4A2C1B] bg-[#C9A78B]/20 shadow-md"
                    : "border-[#4A2C1B]/20 bg-white hover:border-[#4A2C1B]/50"
                }`}
              >
                {/* รูปภาพผลไม้ */}
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  {fruit.imageUrl ? (
                    <img
                      src={getImageUrl(fruit.imageUrl)}
                      alt={fruit.name}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        isSelected ? "scale-110" : "group-hover:scale-105"
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
                    <div className="absolute inset-0 bg-[#4A2C1B]/10 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full px-3 py-1 text-[#4A2C1B] font-bold text-lg shadow-lg animate-bounce">
                        {quantity}
                      </div>
                    </div>
                  )}
                </div>

                {/* ข้อมูลผลไม้ */}
                <div className="p-3 space-y-1">
                  <h4 className="font-semibold text-[#4A2C1B] text-sm line-clamp-1">
                    {fruit.name}
                  </h4>
                  <p className="text-xs text-[#4A2C1B]/70">
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
                      <div className="bg-white/95 rounded-full px-3 py-1 text-[#4A2C1B] font-bold text-sm shadow-md min-w-[2rem] text-center">
                        {quantity}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canAdd) handleAddFruit(fruit.id);
                        }}
                        disabled={!canAdd}
                        className={`rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                          canAdd
                            ? "bg-green-500 hover:bg-green-600 text-white"
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
                      className={`rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                        canAdd
                          ? "bg-[#4A2C1B] hover:bg-[#5A3C2B] text-white"
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
                  <div className="absolute top-2 left-2 bg-[#4A2C1B] text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg animate-pulse">
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
        })}
      </div>

      {/* สรุปผลไม้ที่เลือก */}
      {selectedFruits.size > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-[#C9A78B]/20 to-[#C9A78B]/10 rounded-lg border border-[#4A2C1B]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#4A2C1B]">ผลไม้ที่เลือก:</span>
            <span className="text-sm text-[#4A2C1B]/70">
              {totalFruits} / {maxFruits} ผลไม้
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedFruits.entries()).map(([fruitId, { fruit, quantity }]) => (
              <div
                key={fruitId}
                className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-[#4A2C1B]/20"
              >
                {fruit.imageUrl && (
                  <img
                    src={getImageUrl(fruit.imageUrl)}
                    alt={fruit.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="text-sm text-[#4A2C1B] font-medium">{fruit.name}</span>
                <span className="text-sm font-bold text-[#4A2C1B]">x{quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

