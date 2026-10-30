import { supabase } from './supabase';

// In development (npm run dev), default to local FastAPI on port 8000.
// In production builds (Vercel), default to the live Render backend.
// Supports both API_BASE_URL and VITE_API_BASE_URL.
const normalizeApiBaseUrl = (url: string): string => {
  let clean = (url || '').trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api/v1')) {
    clean = `${clean}/api/v1`;
  }
  return clean;
};

const rawBaseUrl =
  (import.meta.env as any).API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api/v1' : 'https://nexus-ai-u8bu.onrender.com/api/v1');

export const API_BASE_URL = normalizeApiBaseUrl(rawBaseUrl);

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Check local auth token first (for username auth), fallback to supabase session
  let token = localStorage.getItem('nexus_auth_token');
  if (!token) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    } catch {
      // Supabase unavailable or not signed in
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = 'API request failed';
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.message || errorDetail;
      } catch {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorDetail);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.toLowerCase().includes('failed to fetch')) {
      throw new Error(
        `Unable to connect to Nexus AI backend at ${API_BASE_URL}. Please check your network connection.`
      );
    }
    throw err;
  }
}
