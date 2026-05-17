import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api/auth")) return NextResponse.next()

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  // NextAuth v5 uses "authjs.session-token" (v4 used "next-auth.session-token")
  const isHttps = req.headers.get("x-forwarded-proto") === "https"
  const cookieName = isHttps
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName,
  })

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
