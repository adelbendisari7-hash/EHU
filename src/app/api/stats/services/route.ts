import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { SERVICES_EHU, serviceLabel } from "@/constants/services"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const services = SERVICES_EHU.map(serviceLabel)

  return NextResponse.json(services)
}
