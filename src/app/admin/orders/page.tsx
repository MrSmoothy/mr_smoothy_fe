"use client";

import { useEffect, useState } from "react";
import { adminGetAllOrders, adminUpdateOrderStatus, type OrderResponse } from "@/lib/api";
import { RefreshCw, CheckCircle, XCircle, Clock, Package } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await adminGetAllOrders();
      if (res.data) {
        // Sort by created date (newest first)
        const sorted = [...res.data].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setOrders(sorted);
      }
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      alert(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(orderId: number, newStatus: string) {
    try {
      setUpdating(orderId);
      await adminUpdateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "ไม่สามารถอัพเดตสถานะได้");
    } finally {
      setUpdating(null);
    }
  }

  function getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-gray-800 text-white";
      case "PREPARING":
        return "bg-gray-200 text-black";
      case "PENDING":
        return "bg-gray-200 text-black";
      case "CANCELLED":
        return "bg-red-500 text-white";
      case "CONFIRMED":
        return "bg-blue-200 text-blue-800";
      case "READY":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-black";
    }
  }

  function getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
      PREPARING: "Preparing",
      READY: "Ready",
      COMPLETED: "Completed",
      CANCELLED: "Canceled",
    };
    return labels[status.toUpperCase()] || status;
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728] mx-auto mb-4"></div>
            <div className="text-[#4A3728] text-xl">กำลังโหลดข้อมูล...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#E8DDCB] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#4A3728] mb-2 font-serif">Order Management</h1>
            <p className="text-[#4A3728]/70 font-sans">จัดการคำสั่งซื้อทั้งหมด</p>
          </div>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#4A3728] text-[#E8DDCB] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-sans"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-[#4A3728]/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#4A3728] text-[#E8DDCB]">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Order ID</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Item Name</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Quantity</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Price</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Status</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Date</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4A3728]/10">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#4A3728]/70 font-sans">
                      ไม่มีคำสั่งซื้อ
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-[#E8DDCB]/30">
                      <td className="px-6 py-4">
                        <span className="text-blue-600 font-semibold font-sans">
                          #{String(order.orderId).padStart(3, "0")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="text-[#4A3728] font-sans">
                              {item.predefinedDrinkName || "Custom"}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#4A3728] font-sans">
                        {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                      </td>
                      <td className="px-6 py-4 text-green-600 font-semibold font-sans">
                        ฿{Number(order.totalPrice).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold font-sans ${getStatusColor(
                            order.status || "PENDING"
                          )}`}
                        >
                          {getStatusLabel(order.status || "PENDING")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#4A3728]/70 text-sm font-sans">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status || "PENDING"}
                          onChange={(e) => handleUpdateStatus(order.orderId!, e.target.value)}
                          disabled={updating === order.orderId}
                          className="px-3 py-1 border border-[#4A3728]/30 rounded text-sm font-sans disabled:opacity-50"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PREPARING">Preparing</option>
                          <option value="READY">Ready</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

