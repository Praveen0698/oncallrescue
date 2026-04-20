import { verifyToken, apiError } from "./utils";
import { cookies } from "next/headers";

// ─── Get token from request (cookie or Authorization header) ─────
function getTokenFromRequest(request) {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try cookie
  const cookieStore = cookies();
  const token = cookieStore.get("oncallrescue_token")?.value;
  return token || null;
}

// ─── Verify Agent Auth ───────────────────────────────────────────
export async function verifyAgentAuth(request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { error: apiError("Authentication required. Please login.", 401) };
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "agent") {
    return { error: apiError("Invalid or expired token. Please login again.", 401) };
  }

  return { agent: decoded };
}

// ─── Verify Admin Auth ───────────────────────────────────────────
export async function verifyAdminAuth(request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { error: apiError("Admin authentication required.", 401) };
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") {
    return { error: apiError("Invalid admin token.", 401) };
  }

  return { admin: decoded };
}

// ─── Client-side auth helpers ────────────────────────────────────
// These are used in client components
export const clientAuth = {
  setToken: (token, role) => {
    document.cookie = `oncallrescue_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    document.cookie = `oncallrescue_role=${role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  },

  getToken: () => {
    const match = document.cookie.match(/oncallrescue_token=([^;]+)/);
    return match ? match[1] : null;
  },

  getRole: () => {
    const match = document.cookie.match(/oncallrescue_role=([^;]+)/);
    return match ? match[1] : null;
  },

  clear: () => {
    document.cookie = "oncallrescue_token=; path=/; max-age=0";
    document.cookie = "oncallrescue_role=; path=/; max-age=0";
  },

  isLoggedIn: () => {
    return !!document.cookie.match(/oncallrescue_token=([^;]+)/);
  },
};
