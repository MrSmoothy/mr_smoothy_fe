"use client";

import { type Fruit } from "@/lib/api";
import { getImageUrl } from "@/lib/image";

interface SmoothyCupProps {
  selectedFruits: Map<number, { fruit: Fruit; quantity: number }>;
  maxFruits: number;
  cupSize?: { name: string; volumeMl: number };
}

export default function SmoothyCup({ selectedFruits, maxFruits, cupSize }: SmoothyCupProps) {
  const totalFruits = Array.from(selectedFruits.values()).reduce((sum, item) => sum + item.quantity, 0);
  const fillPercentage = Math.min((totalFruits / maxFruits) * 100, 100);
  const remainingSlots = maxFruits - totalFruits;
  
  // สร้าง array ของผลไม้ที่เลือกพร้อม quantity
  const fruitEntries = Array.from(selectedFruits.entries());
  
  // สีสำหรับแต่ละ layer ของ smoothy
  const getLayerColor = (index: number, total: number) => {
    const colors = [
      "#FFD700", // สีทอง
      "#FF6B6B", // สีแดง
      "#4ECDC4", // สีฟ้าเขียว
      "#95E1D3", // สีเขียวอ่อน
      "#F38181", // สีชมพู
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* แก้ว Smoothy */}
      <div className="relative w-32 h-48">
        {/* แก้ว */}
        <div className="absolute inset-0 flex flex-col">
          {/* ฝาแก้ว */}
          <div className="h-4 bg-[#14433B]/20 rounded-t-lg border-2 border-[#14433B]/30"></div>
          
          {/* ตัวแก้ว */}
          <div className="flex-1 bg-gradient-to-b from-white/30 to-white/10 rounded-b-lg border-2 border-[#14433B]/30 backdrop-blur-sm relative overflow-hidden">
            {/* Smoothy Layers */}
            {fruitEntries.length > 0 ? (
              <div className="absolute inset-0 flex flex-col-reverse">
                {fruitEntries.map(([fruitId, { fruit, quantity }], index) => {
                  const layerHeight = (quantity / maxFruits) * 100;
                  const accumulatedHeight = fruitEntries
                    .slice(0, index + 1)
                    .reduce((sum, [, item]) => sum + (item.quantity / maxFruits) * 100, 0);
                  
                  return (
                    <div
                      key={fruitId}
                      className="relative transition-all duration-700 ease-out animate-scaleIn"
                      style={{
                        height: `${layerHeight}%`,
                        backgroundColor: getLayerColor(index, fruitEntries.length),
                        opacity: 0.85,
                      }}
                    >
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                      {/* Pattern overlay */}
                      {fruit.imageUrl && (
                        <div className="absolute inset-0 opacity-20" style={{
                          backgroundImage: `url(${getImageUrl(fruit.imageUrl)})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          mixBlendMode: 'multiply',
                        }}></div>
                      )}
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[#14433B]/30 text-xs text-center">
                  เลือกผลไม้
                </div>
              </div>
            )}
            
            {/* Bubbles animation */}
            {fillPercentage > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-white/40 rounded-full animate-bounce"
                    style={{
                      left: `${20 + i * 15}%`,
                      bottom: `${10 + (i % 3) * 20}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '2s',
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="absolute -right-8 top-0 bottom-0 w-2 bg-[#14433B]/10 rounded-full overflow-hidden">
          <div
            className="absolute bottom-0 w-full bg-gradient-to-t from-[#14433B] to-[#14433B]/80 transition-all duration-500 ease-out rounded-full"
            style={{ height: `${fillPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* ข้อมูลแก้ว */}
      <div className="text-center space-y-2 min-w-[200px]">
        {cupSize && (
          <div className="text-sm text-[#14433B]/70">
            ขนาด: {cupSize.name} ({cupSize.volumeMl}ml)
          </div>
        )}
        
        <div className="text-lg font-bold text-[#14433B]">
          {totalFruits} / {maxFruits} ผลไม้
        </div>
        
        {remainingSlots > 0 ? (
          <div className="text-sm text-[#14433B] font-medium">
            สามารถเพิ่มได้อีก {remainingSlots} อย่าง
          </div>
        ) : (
          <div className="text-sm text-orange-600 font-medium">
            ✓ เต็มแล้ว
          </div>
        )}
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-[#14433B]/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#14433B]/80 via-[#14433B] to-[#14433B] transition-all duration-500 ease-out"
            style={{ width: `${fillPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* รายการผลไม้ที่เลือก */}
      {fruitEntries.length > 0 && (
        <div className="mt-4 w-full max-w-xs">
          <div className="text-sm font-semibold text-[#14433B] mb-2">ผลไม้ที่เลือก:</div>
          <div className="space-y-1">
            {fruitEntries.map(([fruitId, { fruit, quantity }]) => (
              <div
                key={fruitId}
                className="flex items-center justify-between bg-white/50 rounded-lg p-2 text-sm animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  {fruit.imageUrl && (
                    <img
                      src={getImageUrl(fruit.imageUrl)}
                      alt={fruit.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <span className="text-[#14433B]">{fruit.name}</span>
                </div>
                <span className="font-bold text-[#14433B]">x{quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

