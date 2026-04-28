import { NextRequest, NextResponse } from "next/server"

const ANALYZER_URL =
  process.env.MEDICAL_ANALYZER_URL ?? "http://localhost:5000"

/**
 * POST /api/medical-analyzer/chat
 *
 * Proxy for the Medical Analyzer Flask service (`POST /api/chat`).
 *
 * Body (JSON):
 *   { history: Array<{ role: string; content: string }>, context: object }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json()

    const upstream = await fetch(`${ANALYZER_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data: unknown = await upstream.json()

    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error"
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
