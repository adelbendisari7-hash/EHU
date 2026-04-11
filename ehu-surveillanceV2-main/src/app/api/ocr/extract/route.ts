import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || "http://localhost:8001"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    // Forward raw body to preserve multipart boundaries
    const contentType = req.headers.get("content-type") || ""
    const body = await req.blob()
    const response = await fetch(`${OCR_SERVICE_URL}/ocr/extract`, {
      method: "POST",
      body,
      headers: { "content-type": contentType },
      signal: AbortSignal.timeout(30000), // 30s timeout
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => "")
      let detail = "Erreur OCR"
      try {
        const parsed = JSON.parse(errBody)
        detail = parsed.detail ?? parsed.message ?? parsed.error ?? `Erreur OCR (${response.status})`
      } catch {
        detail = errBody || `Erreur OCR (${response.status})`
      }
      return NextResponse.json({ error: detail }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ error: "Le service OCR a mis trop de temps à répondre" }, { status: 504 })
    }
    console.error("[OCR proxy error]", err)
    return NextResponse.json(
      { error: "Service OCR indisponible. Vérifiez que le microservice Python est lancé." },
      { status: 503 }
    )
  }
}

export async function GET() {
  try {
    const res = await fetch(`${OCR_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 })
  }
}

