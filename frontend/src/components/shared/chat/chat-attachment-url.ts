import { getAccessToken } from "@/lib/auth-tokens"

function apiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!raw) return ""
  return raw.replace(/\/$/, "")
}

/** Builds an authenticated URL usable in <img src> and download links. */
export function resolveChatAttachmentUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return ""
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl
  }

  const base = apiBaseUrl()
  const token = getAccessToken()
  if (!base) return pathOrUrl

  const url = new URL(`${base}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`)
  if (token) {
    url.searchParams.set("access_token", token)
  }
  return url.toString()
}
