// Guest Cart Management - เก็บตะกร้าใน localStorage สำหรับ guest user

export type GuestCartItem = {
  id: string; // unique ID สำหรับ guest cart item
  type: "PREDEFINED" | "CUSTOM";
  cupSizeId: number;
  cupSizeName: string;
  quantity: number;
  predefinedDrinkId?: number;
  predefinedDrinkName?: string;
  fruits?: {
    fruitId: number;
    fruitName: string;
    quantity: number;
    pricePerUnit: number;
  }[];
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
};

export type GuestCart = {
  items: GuestCartItem[];
  totalPrice: number;
};

const GUEST_CART_KEY = "guest_cart";

// สร้าง unique ID สำหรับ guest cart item
function generateGuestItemId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// โหลด guest cart จาก localStorage
export function getGuestCart(): GuestCart {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    if (stored) {
      const cart = JSON.parse(stored) as GuestCart;
      // คำนวณ totalPrice ใหม่
      cart.totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      return cart;
    }
  } catch (err) {
    console.error("Error loading guest cart:", err);
  }
  return { items: [], totalPrice: 0 };
}

// บันทึก guest cart ลง localStorage
export function saveGuestCart(cart: GuestCart): void {
  try {
    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    // Notify header to update cart count
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (err) {
    console.error("Error saving guest cart:", err);
  }
}

// เพิ่ม item ลง guest cart
export function addToGuestCart(item: Omit<GuestCartItem, "id" | "createdAt">): GuestCart {
  const cart = getGuestCart();
  const newItem: GuestCartItem = {
    ...item,
    id: generateGuestItemId(),
    createdAt: new Date().toISOString(),
  };
  cart.items.push(newItem);
  saveGuestCart(cart);
  return cart;
}

// ลบ item จาก guest cart
export function removeFromGuestCart(itemId: string): GuestCart {
  const cart = getGuestCart();
  cart.items = cart.items.filter(item => item.id !== itemId);
  saveGuestCart(cart);
  return cart;
}

// ล้าง guest cart
export function clearGuestCart(): GuestCart {
  const cart: GuestCart = { items: [], totalPrice: 0 };
  saveGuestCart(cart);
  return cart;
}

// นับจำนวน items ใน guest cart
export function getGuestCartCount(): number {
  const cart = getGuestCart();
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

// ย้าย guest cart ไปยัง server cart (เมื่อ login แล้ว)
export function getGuestCartForMigration(): GuestCart {
  return getGuestCart();
}

// ล้าง guest cart หลังจาก migrate แล้ว
export function clearGuestCartAfterMigration(): void {
  localStorage.removeItem(GUEST_CART_KEY);
  window.dispatchEvent(new Event("cartUpdated"));
}

// Guest Orders Management
export type GuestOrder = {
  id: string;
  items: GuestCartItem[];
  totalPrice: number;
  customerName: string;
  phoneNumber: string;
  email?: string;
  pickupTime: string;
  pickupTimeDisplay: string;
  notes?: string;
  paymentMethod: "cash" | "card" | "promptpay";
  status: string;
  createdAt: string;
};

const GUEST_ORDERS_KEY = "guest_orders";

// โหลด guest orders
export function getGuestOrders(): GuestOrder[] {
  try {
    const stored = localStorage.getItem(GUEST_ORDERS_KEY);
    if (stored) {
      return JSON.parse(stored) as GuestOrder[];
    }
  } catch (err) {
    console.error("Error loading guest orders:", err);
  }
  return [];
}

// บันทึก guest orders
export function saveGuestOrders(orders: GuestOrder[]): void {
  try {
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error("Error saving guest orders:", err);
  }
}

// เพิ่ม guest order
export function addGuestOrder(order: GuestOrder): void {
  const orders = getGuestOrders();
  orders.push(order);
  saveGuestOrders(orders);
}

