"use client";

import { useEffect, useState } from "react";
import { adminGetDashboardStats, type DashboardStats } from "@/lib/api";
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, TrendingDown } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Order" | "Popular Smoothie" | "Analyze">("Order");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const res = await adminGetDashboardStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load dashboard stats:", err);
      alert(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `฿${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `฿${(amount / 1000).toFixed(0)}k`;
    }
    return `฿${amount.toFixed(0)}`;
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    return num.toString();
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14433B] mx-auto mb-4"></div>
            <div className="text-[#14433B] text-xl">กำลังโหลดข้อมูล...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">ไม่สามารถโหลดข้อมูลได้</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#FFF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#14433B] mb-2 font-sans">Dashboard</h1>
          <p className="text-[#14433B]/70 font-sans">ภาพรวมการขายและข้อมูลระบบ</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-[#14433B]/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#14433B]/70 font-semibold font-sans">Total Orders</h3>
              <ShoppingCart className="w-5 h-5 text-[#14433B]" />
            </div>
            <div className="text-4xl font-bold text-[#14433B] mb-2 font-sans">
              {formatNumber(stats.totalOrders)}
            </div>
            <div className="flex items-center gap-1 text-[#14433B] text-sm font-sans">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.ordersChangePercent} from last month</span>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-[#14433B]/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#14433B]/70 font-semibold font-sans">Revenue</h3>
              <DollarSign className="w-5 h-5 text-[#14433B]" />
            </div>
            <div className="text-4xl font-bold text-[#14433B] mb-2 font-sans">
              {formatCurrency(stats.revenue)}
            </div>
            <div className="flex items-center gap-1 text-[#14433B] text-sm font-sans">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.revenueChangePercent} from last month</span>
            </div>
          </div>

          {/* Best-Sell */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-[#14433B]/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#14433B]/70 font-semibold font-sans">Best-Sell</h3>
              <Package className="w-5 h-5 text-[#14433B]" />
            </div>
            <div className="text-4xl font-bold text-[#14433B] mb-2 font-sans">
              {stats.bestSellingDrink || "N/A"}
            </div>
            <div className="flex items-center gap-1 text-[#14433B] text-sm font-sans">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.bestSellChangePercent} from last month</span>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 border border-[#14433B]/10">
            <div className="text-sm text-[#14433B]/70 mb-1 font-sans">Total Users</div>
            <div className="text-2xl font-bold text-[#14433B] font-sans">{stats.totalUsers}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-[#14433B]/10">
            <div className="text-sm text-[#14433B]/70 mb-1 font-sans">Active Users</div>
            <div className="text-2xl font-bold text-[#14433B] font-sans">{stats.activeUsers}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-[#14433B]/10">
            <div className="text-sm text-[#14433B]/70 mb-1 font-sans">Total Cost</div>
            <div className="text-2xl font-bold text-[#14433B] font-sans">
              {formatCurrency(stats.totalCost)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-[#14433B]/10">
            <div className="text-sm text-[#14433B]/70 mb-1 font-sans">Profit</div>
            <div className={`text-2xl font-bold font-sans ${
              stats.profit >= 0 ? "text-[#14433B]" : "text-red-600"
            }`}>
              {formatCurrency(stats.profit)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-[#14433B]/10 mb-6">
          <div className="flex gap-4 border-b border-[#14433B]/20 mb-6">
            {(["Order", "Popular Smoothie", "Analyze"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold font-sans transition-colors ${
                  activeTab === tab
                    ? "text-[#14433B] border-b-2 border-[#14433B]"
                    : "text-[#14433B]/50 hover:text-[#14433B]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="text-[#14433B]/70 font-sans">
            {activeTab === "Order" && (
              <p>ข้อมูลคำสั่งซื้อจะแสดงที่นี่ (ดูรายละเอียดในหน้า Order)</p>
            )}
            {activeTab === "Popular Smoothie" && (
              <p>ข้อมูลเมนูยอดนิยมจะแสดงที่นี่</p>
            )}
            {activeTab === "Analyze" && (
              <p>การวิเคราะห์ข้อมูลจะแสดงที่นี่</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
