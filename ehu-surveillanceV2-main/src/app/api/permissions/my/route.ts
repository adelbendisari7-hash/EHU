import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  return NextResponse.json({
    role: session.user.role,
    roles: session.user.roles ?? [],
    permissions: session.user.permissions ?? [],
  })
}

