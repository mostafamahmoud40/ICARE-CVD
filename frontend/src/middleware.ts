import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type TokenPayload = {
  sub?: number;
  role?: string;
  email?: string;
};

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/otp",
];

const GROUP_PREFIXES = new Set(["admin", "assistant", "doctor", "patient", "auth"]);

const SEGMENT_ALIASES: Record<string, string> = {
  addstaff: "add-staff",
};

const LEGACY_TO_CANONICAL: Record<string, string> = {
  "/login": "/auth/login",
  "/register": "/auth/register/account",
  "/forgot-password": "/auth/forgot-password",
  "/reset-password": "/auth/reset-password",
  "/otp": "/auth/otp",
  "/dashboard": "/patient/dashboard",
  "/add-staff": "/admin/addstaff",
  "/admin-dashboard": "/admin/admin-dashboard",
  "/doctor-dashboard": "/doctor/doctor-dashboard",
};

const PREFIX_ALLOWED_ROUTES: Record<string, string[]> = {
  auth: [
    "/login",
    "/register",
    "/register/account",
    "/register/profile",
    "/register/medical",
    "/register/documents",
    "/register/review",
    "/forgot-password",
    "/reset-password",
    "/otp",
  ],
  patient: ["/dashboard"],
  doctor: ["/doctor-dashboard"],
  admin: ["/add-staff", "/addstaff", "/admin-dashboard"],
  assistant: [],
};

const DEFAULT_REDIRECT: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/doctor-dashboard",
  admin: "/admin/addstaff",
};

function normalizePathSegments(pathname: string): string {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => SEGMENT_ALIASES[segment] ?? segment);

  return segments.length > 0 ? `/${segments.join("/")}` : "/";
}

function stripGroupPrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return pathname;

  const [prefix, ...rest] = segments;
  if (!GROUP_PREFIXES.has(prefix)) {
    return pathname;
  }

  if (rest.length === 0) return "/";
  return `/${rest.join("/")}`;
}

function toCanonicalPath(pathname: string): string | null {
  for (const [legacyPath, canonicalPath] of Object.entries(LEGACY_TO_CANONICAL)) {
    if (pathname === legacyPath || pathname.startsWith(`${legacyPath}/`)) {
      return pathname.replace(legacyPath, canonicalPath);
    }
  }

  return null;
}

function getPrefixAndRest(pathname: string): { prefix: string; rest: string } | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const [prefix, ...rest] = segments;
  if (!GROUP_PREFIXES.has(prefix)) return null;

  return {
    prefix,
    rest: rest.length > 0 ? `/${rest.join("/")}` : "/",
  };
}

function isAllowedPrefixedPath(pathname: string): boolean {
  const prefixedPath = getPrefixAndRest(pathname);
  if (!prefixedPath) return true;

  const allowedRoutes = PREFIX_ALLOWED_ROUTES[prefixedPath.prefix] ?? [];
  return allowedRoutes.some(
    (route) =>
      prefixedPath.rest === route || prefixedPath.rest.startsWith(`${route}/`),
  );
}

function mapRegisterStepRewrite(pathname: string): string | null {
  if (pathname === "/auth/register") {
    return "/register?step=account";
  }

  const match = pathname.match(/^\/auth\/register\/([^/]+)$/);
  if (!match) return null;

  const step = match[1];
  const allowed = new Set(["account", "profile", "medical", "documents", "review"]);
  if (!allowed.has(step)) {
    return "/auth/register/account";
  }

  return `/register?step=${step}`;
}

function decodeJwtPayload(token: string): TokenPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const registerStepRewrite = mapRegisterStepRewrite(pathname);
  if (registerStepRewrite) {
    if (registerStepRewrite.startsWith("/auth/")) {
      return NextResponse.redirect(new URL(registerStepRewrite, request.url));
    }

    const rewriteUrl = request.nextUrl.clone();
    const [nextPathname, nextQuery] = registerStepRewrite.split("?");
    rewriteUrl.pathname = nextPathname ?? "/register";
    rewriteUrl.search = nextQuery ?? "";
    return NextResponse.rewrite(rewriteUrl);
  }

  const prefixedPath = getPrefixAndRest(pathname);
  if (prefixedPath && !isAllowedPrefixedPath(pathname)) {
    const fallbackPath =
      DEFAULT_REDIRECT[prefixedPath.prefix] ?? `/${prefixedPath.prefix}`;
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }

  const canonicalPath = toCanonicalPath(pathname);
  if (canonicalPath && canonicalPath !== pathname) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = canonicalPath;
    return NextResponse.redirect(redirectUrl);
  }

  const normalizedPathname = normalizePathSegments(stripGroupPrefix(pathname));
  const token = request.cookies.get("ICARE_CVD_ACCESS_TOKEN")?.value;

  const payload = token ? decodeJwtPayload(token) : null;
  const role = payload?.role ?? null;
  const isAuthenticated = !!token && !!payload;

  if (isAuthRoute(normalizedPathname) && isAuthenticated && role) {
    const destination = DEFAULT_REDIRECT[role] || "/";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (normalizedPathname !== pathname) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = normalizedPathname;
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/assistant/:path*",
    "/doctor/:path*",
    "/patient/:path*",
    "/auth/:path*",
    "/dashboard/:path*",
    "/doctor-dashboard/:path*",
    "/add-staff/:path*",
    "/admin-dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/otp",
  ],
};
