"use client";

import { useEffect, useState } from "react";
import { adminGetAllOrders, adminUpdateOrderStatus, adminDeleteOrder, type OrderResponse } from "@/lib/api";
import { RefreshCw, CheckCircle, XCircle, Clock, Package, ChevronDown, ChevronUp, User, Trash2 } from "lucide-react";

type FilterStatus = "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<number | null>(null);

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
        return "bg-[#14433B]/20 text-[#14433B]";
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

  // Filter orders by status
  const filteredOrders = filterStatus === "ALL"
    ? orders
    : orders.filter(order => {
        const status = (order.status || "PENDING").toUpperCase();
        if (filterStatus === "PENDING") return status === "PENDING";
        if (filterStatus === "CONFIRMED") return status === "CONFIRMED";
        if (filterStatus === "CANCELLED") return status === "CANCELLED";
        return true;
      });

  // Count orders by status
  const statusCounts = {
    ALL: orders.length,
    PENDING: orders.filter(o => (o.status || "PENDING").toUpperCase() === "PENDING").length,
    CONFIRMED: orders.filter(o => (o.status || "PENDING").toUpperCase() === "CONFIRMED").length,
    CANCELLED: orders.filter(o => (o.status || "PENDING").toUpperCase() === "CANCELLED").length,
  };

  // Handle select/deselect order
  function toggleSelectOrder(orderId: number) {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  }

  // Handle select all
  function toggleSelectAll() {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.orderId!)));
    }
  }

  // Handle delete order(s)
  async function handleDeleteOrder(orderId: number) {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบออเดอร์นี้?")) {
      return;
    }
    try {
      setDeleting(orderId);
      await adminDeleteOrder(orderId);
      await loadOrders();
      setSelectedOrders(new Set());
    } catch (err: any) {
      alert(err.message || "ไม่สามารถลบออเดอร์ได้");
    } finally {
      setDeleting(null);
    }
  }

  // Handle delete selected orders
  async function handleDeleteSelected() {
    if (selectedOrders.size === 0) {
      alert("กรุณาเลือกออเดอร์ที่ต้องการลบ");
      return;
    }
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${selectedOrders.size} ออเดอร์?`)) {
      return;
    }
    try {
      const deletePromises = Array.from(selectedOrders).map(orderId => adminDeleteOrder(orderId));
      await Promise.all(deletePromises);
      await loadOrders();
      setSelectedOrders(new Set());
    } catch (err: any) {
      alert(err.message || "ไม่สามารถลบออเดอร์ได้");
    }
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

  return (
    <div className="p-8 bg-[#FFF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#14433B] mb-2 font-sans">Order Management</h1>
            <p className="text-[#14433B]/70 font-sans">จัดการคำสั่งซื้อทั้งหมด</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedOrders.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:opacity-90 transition-opacity font-sans"
              >
                <Trash2 className="w-4 h-4" />
                ลบที่เลือก ({selectedOrders.size})
              </button>
            )}
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#14433B] text-[#FFF6F0] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-sans"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
              filterStatus === "ALL"
                ? "bg-white text-[#14433B] shadow-md"
                : "bg-gray-200 text-[#14433B] hover:bg-gray-300"
            }`}
          >
            ทั้งหมด ({statusCounts.ALL})
          </button>
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
              filterStatus === "PENDING"
                ? "bg-white text-[#14433B] shadow-md"
                : "bg-gray-200 text-[#14433B] hover:bg-gray-300"
            }`}
          >
            รออนุมัติ ({statusCounts.PENDING})
          </button>
          <button
            onClick={() => setFilterStatus("CONFIRMED")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
              filterStatus === "CONFIRMED"
                ? "bg-white text-[#14433B] shadow-md"
                : "bg-gray-200 text-[#14433B] hover:bg-gray-300"
            }`}
          >
            อนุมัติแล้ว ({statusCounts.CONFIRMED})
          </button>
          <button
            onClick={() => setFilterStatus("CANCELLED")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors font-sans ${
              filterStatus === "CANCELLED"
                ? "bg-white text-[#14433B] shadow-md"
                : "bg-gray-200 text-[#14433B] hover:bg-gray-300"
            }`}
          >
            ปฏิเสธ ({statusCounts.CANCELLED})
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-[#14433B]/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#14433B] text-[#FFF6F0]">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold font-sans">
                    <input
                      type="checkbox"
                      checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-[#14433B] rounded focus:ring-[#14433B] cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Order ID</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Item Name</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Quantity</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Price</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Status</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Date</th>
                  <th className="px-6 py-4 text-left font-semibold font-sans">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14433B]/10">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#14433B]/70 font-sans">
                      ไม่มีคำสั่งซื้อ
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <>
                      <tr key={order.orderId} className="hover:bg-[#FFF6F0]/30">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order.orderId!)}
                            onChange={() => toggleSelectOrder(order.orderId!)}
                            className="w-4 h-4 text-[#14433B] rounded focus:ring-[#14433B] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-blue-600 font-semibold font-sans">
                            #{String(order.orderId).padStart(3, "0")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {order.items && order.items.length > 0 ? (
                              <>
                                <div className="text-[#14433B] font-sans font-semibold">
                                  {order.items[0].predefinedDrinkName || "Custom"} ({order.items[0].quantity} แก้ว)
                                </div>
                                {order.items.length > 1 && (
                                  <button
                                    onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId!)}
                                    className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 font-sans"
                                  >
                                    {expandedOrderId === order.orderId ? (
                                      <>
                                        <ChevronUp className="w-3 h-3" />
                                        ซ่อนเมนู ({order.items.length - 1} รายการ)
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3" />
                                        ดูเมนูทั้งหมด ({order.items.length} รายการ)
                                      </>
                                    )}
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[#14433B]/50 font-sans">ไม่มีรายการ</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#14433B] font-sans">
                          {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                        </td>
                        <td className="px-6 py-4 text-[#14433B] font-semibold font-sans">
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
                        <td className="px-6 py-4 text-[#14433B]/70 text-sm font-sans">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <select
                              value={order.status || "PENDING"}
                              onChange={(e) => handleUpdateStatus(order.orderId!, e.target.value)}
                              disabled={updating === order.orderId}
                              className="px-3 py-1 border border-[#14433B]/30 rounded text-sm font-sans disabled:opacity-50"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="PREPARING">Preparing</option>
                              <option value="READY">Ready</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                            <div className="flex gap-1">
                            <button
                              onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId!)}
                                className="flex-1 px-3 py-1 bg-[#14433B] text-[#FFF6F0] rounded text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 font-sans"
                            >
                              {expandedOrderId === order.orderId ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                    ซ่อน
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                    ดู
                                </>
                              )}
                            </button>
                              <button
                                onClick={() => handleDeleteOrder(order.orderId!)}
                                disabled={deleting === order.orderId}
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center font-sans"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row with Order Details */}
                      {expandedOrderId === order.orderId && (
                        <tr className="bg-[#FFF6F0]">
                          <td colSpan={8} className="px-6 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Customer/User Information */}
                              <div className="bg-white rounded-lg p-4 border border-[#14433B]/20">
                                <h3 className="text-lg font-bold text-[#14433B] mb-4 flex items-center gap-2 font-sans">
                                  <User className="w-5 h-5" />
                                  ข้อมูลผู้สั่งซื้อ
                                </h3>
                                <div className="space-y-2">
                                  {/* Logged-in User */}
                                  {order.username && (
                                    <>
                                      <div>
                                        <p className="text-xs text-[#14433B]/70 font-sans">ชื่อผู้ใช้:</p>
                                        <p className="font-semibold text-[#14433B] font-sans">{order.username}</p>
                                      </div>
                                      {order.userFullName && (
                                        <div>
                                          <p className="text-xs text-[#14433B]/70 font-sans">ชื่อ-นามสกุล:</p>
                                          <p className="font-semibold text-[#14433B] font-sans">{order.userFullName}</p>
                                        </div>
                                      )}
                                      {order.userEmail && (
                                        <div>
                                          <p className="text-xs text-[#14433B]/70 font-sans">อีเมล:</p>
                                          <p className="font-semibold text-[#14433B] font-sans">{order.userEmail}</p>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {/* Guest User */}
                                  {order.customerName && !order.username && (
                                    <>
                                      <div>
                                        <p className="text-xs text-[#14433B]/70 font-sans">ชื่อลูกค้า (Guest):</p>
                                        <p className="font-semibold text-[#14433B] font-sans">{order.customerName}</p>
                                      </div>
                                      {order.customerEmail && (
                                        <div>
                                          <p className="text-xs text-[#14433B]/70 font-sans">อีเมล:</p>
                                          <p className="font-semibold text-[#14433B] font-sans">{order.customerEmail}</p>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  <div>
                                    <p className="text-xs text-[#14433B]/70 font-sans">เบอร์โทรติดต่อ:</p>
                                    <p className="font-semibold text-[#14433B] font-sans">{order.phoneNumber}</p>
                                  </div>
                                  {order.pickupTime && (
                                    <div>
                                      <p className="text-xs text-[#14433B]/70 font-sans">เวลารับสินค้า:</p>
                                      <p className="font-semibold text-[#14433B] font-sans">
                                        {formatDate(order.pickupTime)}
                                      </p>
                                    </div>
                                  )}
                                  {order.notes && (
                                    <div>
                                      <p className="text-xs text-[#14433B]/70 font-sans">หมายเหตุ:</p>
                                      <p className="font-semibold text-[#14433B] font-sans">{order.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Order Items Details */}
                              <div className="bg-white rounded-lg p-4 border border-[#14433B]/20">
                                <h3 className="text-lg font-bold text-[#14433B] mb-4 font-sans">รายการเมนูทั้งหมด</h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {order.items && order.items.length > 0 ? (
                                    order.items.map((item, idx) => (
                                      <div key={idx} className="border-b border-[#14433B]/10 pb-3 last:border-b-0 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="flex-1">
                                            <p className="font-semibold text-[#14433B] font-sans">
                                              {item.predefinedDrinkName || "น้ำปั่นแบบกำหนดเอง"}
                                            </p>
                                            <p className="text-sm text-[#14433B]/70 font-sans">
                                              ขนาด: {item.cupSizeName} | จำนวน: {item.quantity} แก้ว
                                            </p>
                                            {item.fruits && item.fruits.length > 0 && (
                                              <div className="mt-2">
                                                <p className="text-xs text-[#14433B]/60 font-sans mb-1">ส่วนผสม:</p>
                                                <div className="flex flex-wrap gap-1">
                                                  {item.fruits.map((fruit, fruitIdx) => (
                                                    <span
                                                      key={fruitIdx}
                                                      className="bg-[#FFF6F0] text-[#14433B] px-2 py-0.5 rounded text-xs font-sans"
                                                    >
                                                      {fruit.fruitName} x{fruit.quantity}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-right ml-4">
                                            <p className="text-sm text-[#14433B]/70 font-sans">ราคาต่อหน่วย</p>
                                            <p className="font-semibold text-[#14433B] font-sans">
                                              ฿{Number(item.unitPrice).toFixed(2)}
                                            </p>
                                            <p className="text-lg font-bold text-[#14433B] font-sans mt-1">
                                              ฿{Number(item.totalPrice).toFixed(2)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[#14433B]/50 font-sans">ไม่มีรายการ</p>
                                  )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-[#14433B]/20">
                                  <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-[#14433B] font-sans">ยอดรวม:</span>
                                    <span className="text-xl font-bold text-[#14433B] font-sans">
                                      ฿{Number(order.totalPrice).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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

