import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const wilayas = await prisma.wilaya.findMany({ orderBy: { code: "asc" } })
  return NextResponse.json(wilayas)
}
