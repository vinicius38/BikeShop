import { ApiResponse } from '../types/api';

const TOKEN_KEY = 'oficinabike_token';
const USER_KEY = 'oficinabike_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: any): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): any | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized and we have a token, it might be expired
    // Only clear if on protected endpoint
    if (!endpoint.includes('/Auth/login')) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
  }

  // Check if response is empty (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  // If response is not JSON
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json') || contentType.includes('+json');
  if (!isJson) {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return (await response.text()) as unknown as T;
  }

  const json: any = await response.json();

  if (!response.ok || json.success === false) {
    let errorMsg = `Erro na requisição (${response.status}): ${response.statusText}`;
    if (json.errors) {
      if (Array.isArray(json.errors)) {
        errorMsg = json.errors.join(', ');
      } else if (typeof json.errors === 'object') {
        errorMsg = Object.values(json.errors).flat().join(', ');
      }
    } else if (json.message) {
      errorMsg = json.message;
    } else if (json.title) {
      errorMsg = json.title;
    }

    const error = new Error(errorMsg);
    (error as any).status = response.status;
    (error as any).apiResponse = json;
    throw error;
  }

  return (json.data !== undefined ? json.data : json) as T;
}

export const api = {
  get: <T>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: 'DELETE' }),
};
