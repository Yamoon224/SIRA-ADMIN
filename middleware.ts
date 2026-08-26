import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PREFIXES = ["/login", "/_next", "/favicon", "/images", "/icon", "/api"]
const PUBLIC_EXACT_PATHS = ["/"]

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (
        PUBLIC_EXACT_PATHS.includes(pathname) ||
        PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
    ) {
        return NextResponse.next()
    }

    const token = request.cookies.get("goriya_token")?.value
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
