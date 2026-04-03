export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

const ACCESS_TOKEN_KEY = "ICARE_CVD_ACCESS_TOKEN";
const REFRESH_TOKEN_KEY = "ICARE_CVD_REFRESH_TOKEN";

function safeGetStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function setAuthTokens(tokens: AuthTokens) {
  const storage = safeGetStorage();
  if (!storage) return;

  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

export function getAccessToken(): string | null {
  const storage = safeGetStorage();
  if (!storage) return null;
  return storage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAuthTokens() {
  const storage = safeGetStorage();
  if (!storage) return;
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}

