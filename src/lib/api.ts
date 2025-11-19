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

export type FruitCategory = "FRUIT" | "VEGETABLE" | "ADDON";

export type Fruit = {
  id: number;
  name: string;
  description?: string;
  pricePerUnit: number;
  imageUrl?: string;
  category?: FruitCategory; // Optional เพื่อรองรับข้อมูลเก่าที่อาจจะไม่มี category
  active: boolean;
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
      
      console.error("API Error:", errorMessage, json);
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
      
      console.error("API returned success=false:", errorMessage, json);
      throw new Error(errorMessage);
  }

    console.log("API Success:", path, "data count:", Array.isArray(json.data) ? json.data.length : "N/A");
  return json;
  } catch (error: any) {
    if (error.message) {
      console.error("Fetch error:", error.message);
      
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
    console.error("Unknown fetch error:", error);
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
  createdAt: string;
  updatedAt: string;
};

export type OrderCreateRequest = {
  pickupTime: string;
  phoneNumber: string;
  notes?: string;
};

export async function createOrder(orderRequest: OrderCreateRequest) {
  return request<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(orderRequest),
  });
}

export async function getMyOrders() {
  return request<Order[]>("/api/orders");
}

export async function getOrderById(orderId: number) {
  return request<Order>("/api/orders/" + orderId);
}

// Admin APIs - Fruits
export type FruitCreateRequest = {
  name: string;
  description: string;
  pricePerUnit: number;
  imageUrl?: string;
  category?: FruitCategory;
  active?: boolean;
};

export type FruitUpdateRequest = {
  name?: string;
  description?: string;
  pricePerUnit?: number;
  imageUrl?: string;
  category?: FruitCategory;
  active?: boolean;
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


