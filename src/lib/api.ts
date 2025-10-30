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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as ApiResponse<T>) : ({} as ApiResponse<T>);

  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `Request failed: ${res.status}`);
  }

  return json;
}

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


