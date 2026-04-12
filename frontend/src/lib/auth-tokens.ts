export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "patient" | "assistant" | "doctor";
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
};

const ACCESS_TOKEN_KEY = "ICARE_CVD_ACCESS_TOKEN";
const REFRESH_TOKEN_KEY = "ICARE_CVD_REFRESH_TOKEN";
const USER_KEY = "ICARE_CVD_USER";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function safeGetStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function setAuthTokens(tokens: AuthTokens) {
  const storage = safeGetStorage();
  if (storage) {
    storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    if (tokens.user) {
      storage.setItem(USER_KEY, JSON.stringify(tokens.user));
    }
  }
  setCookie(ACCESS_TOKEN_KEY, tokens.accessToken, COOKIE_MAX_AGE);
}

export function getAccessToken(): string | null {
  const storage = safeGetStorage();
  if (!storage) return null;
  return storage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  const storage = safeGetStorage();
  if (!storage) return null;
  const raw = storage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthTokens() {
  const storage = safeGetStorage();
  if (storage) {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_KEY);
  }
  deleteCookie(ACCESS_TOKEN_KEY);
}
