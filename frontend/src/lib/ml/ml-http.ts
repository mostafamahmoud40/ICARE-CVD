export async function postFormData(url: string, formData: FormData): Promise<Response> {
  return fetch(url, { method: "POST", body: formData })
}

export async function postJson<T>(
  url: string,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...init?.headers },
    body: JSON.stringify(body),
    ...init,
  })

  const json = (await res.json().catch(() => ({}))) as T & {
    error?: string
    detail?: string
  }

  if (!res.ok) {
    const detail =
      typeof json.detail === "string"
        ? json.detail
        : typeof json.error === "string"
          ? json.error
          : `HTTP ${res.status}`
    throw new Error(detail)
  }

  if (json.error) {
    throw new Error(json.error)
  }

  return json
}

export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as T & {
    error?: string
    detail?: string
  }

  if (!res.ok) {
    const text =
      typeof json.detail === "string"
        ? json.detail
        : typeof json.error === "string"
          ? json.error
          : `HTTP ${res.status}`
    throw new Error(text)
  }

  if (typeof json === "object" && json && "error" in json && json.error) {
    throw new Error(String(json.error))
  }

  return json
}
