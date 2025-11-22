export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    role?: string;
  };
  message: string;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UserUpdateRequest = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  password?: string;
};

export type FruitCategory = "FRUIT" | "VEGETABLE" | "ADDON";

export type Fruit = {
  id: number;
  name: string;
  description?: string;
  pricePerUnit: number;
  imageUrl?: string;
  category?: FruitCategory; // Optional เพื่อรองรับข้อมูลเก่าที่อาจจะไม่มี category
  active: boolean;
  seasonal?: boolean; // วัตถุดิบตามฤดูกาล
};

export type CupSize = {
  id: number;
  name: string;
  volumeMl: number;
  priceExtra: number;
  active: boolean;
};

export type PredefinedDrink = {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  ingredients: {
    fruitId: number;
    fruitName: string;
    quantity: number;
  }[];
};

export type CartItem = {
  id: number;
  type: "PREDEFINED" | "CUSTOM";
  cupSizeId: number;
  cupSizeName: string;
  quantity: number;
  predefinedDrinkId?: number;
  predefinedDrinkName?: string;
  predefinedDrinkImageUrl?: string;
  fruits?: {
    fruitId: number;
    fruitName: string;
    quantity: number;
    pricePerUnit: number;
  }[];
  unitPrice: number;
  totalPrice: number;
};

export type Cart = {
  cartId: number;
  items: CartItem[];
  totalPrice: number;
};

export type CartAddItemRequest = {
  type: "PREDEFINED" | "CUSTOM";
  cupSizeId: number;
  quantity: number;
  predefinedDrinkId?: number;
  ingredients?: {
    fruitId: number;
    quantity: number;
  }[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;
  console.log("API Request:", options.method || "GET", url);

  try {
    const res = await fetch(url, {
    ...options,
      headers,
  });

    console.log("API Response:", res.status, res.statusText, path);

  const text = await res.text();
    let json: ApiResponse<T>;
    
    try {
      json = text ? (JSON.parse(text) as ApiResponse<T>) : ({} as ApiResponse<T>);
    } catch (parseError) {
      console.error("Failed to parse response:", text);
      console.error("Parse error:", parseError);
      throw new Error(`Invalid response format: ${res.status}. Response: ${text.substring(0, 100)}`);
    }

    if (!res.ok) {
      let errorMessage = json?.message || `Request failed: ${res.status} ${res.statusText}`;
      
      // กรอง technical error messages
      if (errorMessage.includes("allowCredentials") || 
          errorMessage.includes("allowedOrigins") ||
          errorMessage.includes("CORS") ||
          errorMessage.includes("Access-Control")) {
        errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง";
      }
      
      // ไม่ log error สำหรับ /api/users/me ถ้าเป็น 400 (อาจเป็น non-critical)
      if (!(path.includes("/api/users/me") && res.status === 400)) {
        console.error("API Error:", errorMessage, json);
      }
      throw new Error(errorMessage);
    }

    if (json.success === false) {
      let errorMessage = json?.message || "Request failed";
      
      // กรอง technical error messages
      if (errorMessage.includes("allowCredentials") || 
          errorMessage.includes("allowedOrigins") ||
          errorMessage.includes("CORS") ||
          errorMessage.includes("Access-Control")) {
        errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง";
      }
      
      // ไม่ log error สำหรับ /api/users/me ถ้าเป็น non-critical error
      if (!(path.includes("/api/users/me") && errorMessage.includes("เกิดข้อผิดพลาดในการเชื่อมต่อ"))) {
        console.error("API returned success=false:", errorMessage, json);
      }
      throw new Error(errorMessage);
  }

    console.log("API Success:", path, "data count:", Array.isArray(json.data) ? json.data.length : "N/A");
  return json;
  } catch (error: any) {
    if (error.message) {
      // ไม่ log error สำหรับ /api/users/me (silent fail)
      if (!path.includes("/api/users/me")) {
        console.error("Fetch error:", error.message);
      }
      
      // กรอง technical error messages
      let userMessage = error.message;
      if (userMessage.includes("allowCredentials") || 
          userMessage.includes("allowedOrigins") ||
          userMessage.includes("CORS") ||
          userMessage.includes("Access-Control")) {
        userMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง";
      } else if (userMessage.includes("NetworkError") || 
                 userMessage.includes("Failed to fetch") ||
                 userMessage.includes("Network request failed")) {
        userMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
      }
      
      throw new Error(userMessage);
    }
    // ไม่ log error สำหรับ /api/users/me
    if (!path.includes("/api/users/me")) {
      console.error("Unknown fetch error:", error);
    }
    throw new Error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  }
}

// Auth APIs
export async function login(username: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function registerAccount(params: {
  username: string;
  password: string;
  email: string;
  fullName?: string;
}) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// User Profile APIs
export async function getCurrentUser() {
  return request<UserProfile>("/api/users/me");
}

export async function updateUserProfile(data: UserUpdateRequest) {
  return request<UserProfile>("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Public Catalog APIs
export async function getFruits() {
  return request<Fruit[]>("/api/public/fruits");
}

export async function getCupSizes() {
  return request<CupSize[]>("/api/public/cup-sizes");
}

export async function getDrinks() {
  return request<PredefinedDrink[]>("/api/public/drinks");
}

export async function getSeasonalIngredients() {
  return request<Fruit[]>("/api/public/seasonal-ingredients");
}

// Cart APIs
export async function getCart() {
  return request<Cart>("/api/cart");
}

export async function addToCart(cartRequest: CartAddItemRequest) {
  return request<Cart>("/api/cart/items", {
    method: "POST",
    body: JSON.stringify(cartRequest),
  });
}

export async function removeFromCart(itemId: number) {
  return request<Cart>("/api/cart/items/" + itemId, {
    method: "DELETE",
  });
}

export async function clearCart() {
  return request<Cart>("/api/cart/clear", {
    method: "DELETE",
  });
}

// Image Upload APIs
export async function uploadImage(file: File, folder: string = "general") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/admin/images/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as ApiResponse<{ url: string; filename: string }>) : ({} as ApiResponse<{ url: string; filename: string }>);

  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `Upload failed: ${res.status}`);
  }

  return json;
}

export async function uploadFruitImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/admin/images/upload/fruit`, {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as ApiResponse<{ url: string; filename: string }>) : ({} as ApiResponse<{ url: string; filename: string }>);

  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `Upload failed: ${res.status}`);
  }

  return json;
}

export async function uploadDrinkImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/admin/images/upload/drink`, {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as ApiResponse<{ url: string; filename: string }>) : ({} as ApiResponse<{ url: string; filename: string }>);

  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `Upload failed: ${res.status}`);
  }

  return json;
}

// Order APIs
export type Order = {
  orderId: number;
  items: CartItem[];
  totalPrice: number;
  status: string;
  pickupTime: string;
  phoneNumber: string;
  notes?: string;
  customerName?: string; // สำหรับ guest orders
  customerEmail?: string; // สำหรับ guest orders
  username?: string; // สำหรับ logged-in users
  userEmail?: string; // สำหรับ logged-in users
  userFullName?: string; // สำหรับ logged-in users
  createdAt: string;
  updatedAt: string;
};

export type OrderResponse = {
  orderId: number;
  items: {
    id: number;
    type: string;
    cupSizeName: string;
    quantity: number;
    predefinedDrinkName?: string;
    fruits?: {
      fruitId: number;
      fruitName: string;
      quantity: number;
      pricePerUnit: number;
    }[];
    unitPrice: number;
    totalPrice: number;
  }[];
  totalPrice: number;
  status: string;
  pickupTime?: string;
  phoneNumber: string;
  notes?: string;
  customerName?: string; // สำหรับ guest orders
  customerEmail?: string; // สำหรับ guest orders
  username?: string; // สำหรับ logged-in users
  userEmail?: string; // สำหรับ logged-in users
  userFullName?: string; // สำหรับ logged-in users
  createdAt?: string;
  updatedAt?: string;
};

export type OrderCreateRequest = {
  pickupTime: string;
  phoneNumber: string;
  notes?: string;
};

export type GuestOrderItemRequest = {
  type: "PREDEFINED" | "CUSTOM";
  cupSizeId: number;
  quantity: number;
  predefinedDrinkId?: number;
  fruits?: {
    fruitId: number;
    quantity: number;
  }[];
  unitPrice: number;
  totalPrice: number;
};

export type GuestOrderCreateRequest = {
  pickupTime: string;
  phoneNumber: string;
  customerName: string;
  customerEmail?: string;
  notes?: string;
  items: GuestOrderItemRequest[];
};

export async function createOrder(orderRequest: OrderCreateRequest) {
  // แปลง pickupTime ให้แน่ใจว่าเป็น format ที่ถูกต้อง (yyyy-MM-ddTHH:mm:ss)
  const formattedRequest = {
    ...orderRequest,
    pickupTime: orderRequest.pickupTime ? (() => {
      let time = orderRequest.pickupTime;
      // ถ้าเป็น ISO string (มี Z หรือ timezone) ให้แปลงเป็น LocalDateTime
      if (time.includes('Z') || time.includes('+') || (time.includes('-') && time.length > 19)) {
        const date = new Date(time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      }
      // ลบ milliseconds ถ้ามี
      time = time.replace(/\.\d{3}$/, '');
      // เพิ่ม seconds ถ้ายังไม่มี
      if (!time.match(/:\d{2}$/)) {
        time = `${time}:00`;
      }
      return time;
    })() : orderRequest.pickupTime,
  };
  
  return request<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(formattedRequest),
  });
}

export async function createGuestOrder(orderRequest: GuestOrderCreateRequest) {
  // แปลง pickupTime ให้แน่ใจว่าเป็น format ที่ถูกต้อง (yyyy-MM-ddTHH:mm:ss)
  const formattedRequest = {
    ...orderRequest,
    pickupTime: orderRequest.pickupTime ? (() => {
      let time = orderRequest.pickupTime;
      // ถ้าเป็น ISO string (มี Z หรือ timezone) ให้แปลงเป็น LocalDateTime
      if (time.includes('Z') || time.includes('+') || (time.includes('-') && time.length > 19)) {
        const date = new Date(time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      }
      // ลบ milliseconds ถ้ามี
      time = time.replace(/\.\d{3}$/, '');
      // เพิ่ม seconds ถ้ายังไม่มี
      if (!time.match(/:\d{2}$/)) {
        time = `${time}:00`;
      }
      return time;
    })() : orderRequest.pickupTime,
  };
  
  return request<Order>("/api/public/guest-orders", {
    method: "POST",
    body: JSON.stringify(formattedRequest),
  });
}

export async function getMyOrders() {
  return request<Order[]>("/api/orders");
}

export async function getOrderById(orderId: number) {
  return request<Order>("/api/orders/" + orderId);
}

// Public APIs for guest orders
export async function getGuestOrdersByPhoneNumber(phoneNumber: string) {
  return request<Order[]>("/api/public/guest-orders?phoneNumber=" + encodeURIComponent(phoneNumber));
}

export async function getGuestOrderById(orderId: number) {
  return request<Order>("/api/public/guest-orders/" + orderId);
}

// Admin APIs - Fruits
export type FruitCreateRequest = {
  name: string;
  description: string;
  pricePerUnit: number;
  imageUrl?: string;
  category?: FruitCategory;
  active?: boolean;
  seasonal?: boolean;
};

export type FruitUpdateRequest = {
  name?: string;
  description?: string;
  pricePerUnit?: number;
  imageUrl?: string;
  category?: FruitCategory;
  active?: boolean;
  seasonal?: boolean;
};

export async function adminGetFruits() {
  return request<Fruit[]>("/api/admin/fruits");
}

export async function adminGetFruit(id: number) {
  return request<Fruit>("/api/admin/fruits/" + id);
}

export async function adminCreateFruit(data: FruitCreateRequest) {
  return request<Fruit>("/api/admin/fruits", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateFruit(id: number, data: FruitUpdateRequest) {
  return request<Fruit>("/api/admin/fruits/" + id, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteFruit(id: number) {
  return request<string>("/api/admin/fruits/" + id, {
    method: "DELETE",
  });
}

// Admin APIs - Cup Sizes
export type CupSizeCreateRequest = {
  name: string;
  volumeMl: number;
  priceExtra: number;
  active?: boolean;
};

export type CupSizeUpdateRequest = {
  name?: string;
  volumeMl?: number;
  priceExtra?: number;
  active?: boolean;
};

export async function adminGetCupSizes() {
  return request<CupSize[]>("/api/admin/cup-sizes");
}

export async function adminGetCupSize(id: number) {
  return request<CupSize>("/api/admin/cup-sizes/" + id);
}

export async function adminCreateCupSize(data: CupSizeCreateRequest) {
  return request<CupSize>("/api/admin/cup-sizes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCupSize(id: number, data: CupSizeUpdateRequest) {
  return request<CupSize>("/api/admin/cup-sizes/" + id, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCupSize(id: number) {
  return request<string>("/api/admin/cup-sizes/" + id, {
    method: "DELETE",
  });
}

// Admin APIs - Predefined Drinks
export type PredefinedDrinkCreateRequest = {
  name: string;
  description: string;
  imageUrl?: string;
  active?: boolean;
  ingredients: {
    fruitId: number;
    quantity: number;
  }[];
};

export type PredefinedDrinkUpdateRequest = {
  name?: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
  ingredients?: {
    fruitId: number;
    quantity: number;
  }[];
};

export async function adminGetDrinks() {
  return request<PredefinedDrink[]>("/api/admin/drinks");
}

export async function adminGetDrink(id: number) {
  return request<PredefinedDrink>("/api/admin/drinks/" + id);
}

export async function adminCreateDrink(data: PredefinedDrinkCreateRequest) {
  return request<PredefinedDrink>("/api/admin/drinks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateDrink(id: number, data: PredefinedDrinkUpdateRequest) {
  return request<PredefinedDrink>("/api/admin/drinks/" + id, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteDrink(id: number) {
  return request<string>("/api/admin/drinks/" + id, {
    method: "DELETE",
  });
}

// Admin Dashboard APIs
export type DashboardStats = {
  totalOrders: number;
  revenue: number;
  bestSellingDrink: string;
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  totalCost: number;
  profit: number;
  revenueChangePercent: string;
  ordersChangePercent: string;
  bestSellChangePercent: string;
};

export async function adminGetDashboardStats() {
  return request<DashboardStats>("/api/admin/dashboard/stats");
}

// Admin Order APIs
export async function adminGetAllOrders() {
  return request<OrderResponse[]>("/api/admin/orders");
}

export async function adminGetOrder(orderId: number) {
  return request<OrderResponse>("/api/admin/orders/" + orderId);
}

export async function adminUpdateOrderStatus(orderId: number, status: string) {
  return request<OrderResponse>("/api/admin/orders/" + orderId + "/status", {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}


