import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://goriya-backend-production.up.railway.app"

// Types autorisés à s'afficher inline (ex: <img src=...>). Tout le reste - notamment
// text/html et image/svg+xml, qui peuvent contenir du script exécutable - est neutralisé
// en application/octet-stream et forcé en téléchargement, pour empêcher le navigateur de
// rendre un fichier uploadé (avatar, CV...) avec un Content-Type forgé sur cette origine
// authentifiée (XSS via same-origin file serving).
// application/json est la très grande majorité du trafic (toutes les réponses API CRUD) :
// ce n'est pas un vecteur XSS et ne doit jamais être coercé, sous peine de casser axios
// côté client (qui parse le JSON selon ce header).
const INLINE_SAFE_CONTENT_TYPES = new Set(["application/json", "image/png", "image/jpeg", "image/webp", "image/gif"])
const DOWNLOAD_CONTENT_TYPES = new Set(["application/pdf", "text/csv"])

async function forward(request: NextRequest, path: string[]) {
    const cookieStore = await cookies()
    const token = cookieStore.get("goriya_token")?.value

    const targetUrl = `${BACKEND_URL}/${path.join("/")}${request.nextUrl.search}`

    const headers: HeadersInit = {}
    const contentType = request.headers.get("content-type")
    if (contentType) headers["content-type"] = contentType
    if (token) headers["authorization"] = `Bearer ${token}`

    const hasBody = !["GET", "HEAD"].includes(request.method)
    const body = hasBody ? await request.arrayBuffer() : undefined

    let backendResponse: Response
    try {
        backendResponse = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: body && body.byteLength > 0 ? body : undefined,
        })
    } catch {
        return NextResponse.json({ message: "Service backend indisponible" }, { status: 502 })
    }

    const respContentType = (backendResponse.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
    const isInlineSafe = INLINE_SAFE_CONTENT_TYPES.has(respContentType)
    const isDownload = DOWNLOAD_CONTENT_TYPES.has(respContentType)
    const safeContentType = isInlineSafe || isDownload ? respContentType : "application/octet-stream"

    const responseHeaders = new Headers()
    responseHeaders.set("content-type", safeContentType)
    responseHeaders.set("x-content-type-options", "nosniff")
    if (!isInlineSafe) {
        responseHeaders.set("content-disposition", "attachment")
        responseHeaders.set("content-security-policy", "sandbox; default-src 'none'")
    }

    const buffer = await backendResponse.arrayBuffer()
    return new NextResponse(buffer, { status: backendResponse.status, headers: responseHeaders })
}

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
    return forward(request, (await params).path)
}
export async function POST(request: NextRequest, { params }: RouteContext) {
    return forward(request, (await params).path)
}
export async function PUT(request: NextRequest, { params }: RouteContext) {
    return forward(request, (await params).path)
}
export async function PATCH(request: NextRequest, { params }: RouteContext) {
    return forward(request, (await params).path)
}
export async function DELETE(request: NextRequest, { params }: RouteContext) {
    return forward(request, (await params).path)
}
