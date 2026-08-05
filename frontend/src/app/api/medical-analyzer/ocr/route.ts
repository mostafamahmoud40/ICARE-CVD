import { NextRequest, NextResponse } from "next/server"

const ANALYZER_URL =
  process.env.MEDICAL_ANALYZER_URL ?? "http://localhost:5000"

/**
 * POST /api/medical-analyzer/ocr
 *
 * Proxy for the Medical Analyzer Flask service (`POST /api/ocr`).
 * The browser never talks to the Python server directly — all traffic
 * goes through this Next.js route handler.
 *
 * Body: multipart/form-data with a `file` field (PDF / PNG / JPEG).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData()

    const upstream = await fetch(`${ANALYZER_URL}/api/ocr`, {
      method: "POST",
      body: formData,
    })

    const data: unknown = await upstream.json()

    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error"
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
