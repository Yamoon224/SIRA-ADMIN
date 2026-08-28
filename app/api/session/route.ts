import { NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/services/auth.service"

const isProduction = process.env.NODE_ENV === "production"
const TOKEN_COOKIE = "goriya_token"

export async function POST(request: NextRequest) {
    const { email, password } = await request.json()

    if (!email || !password) {
        return NextResponse.json({ message: "Email et mot de passe requis" }, { status: 400 })
    }

    try {
        const response = await authService.login({ email, password })
        const { access_token, user } = response.data ?? ({} as { access_token?: string; user?: unknown })

        if (!access_token) {
            return NextResponse.json({ message: "Email ou mot de passe incorrect" }, { status: 401 })
        }

        if ((user as any)?.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Accès refusé. Cette interface est réservée aux administrateurs." },
                { status: 403 },
            )
        }

        const res = NextResponse.json({ user })
        res.cookies.set(TOKEN_COOKIE, access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60,
        })
        return res
    } catch (error: any) {
        // `apiRequest` relaie le corps d'erreur du backend : on remonte son
        // message quand il est exploitable (ex. "Compte bloqué…"), sinon un
        // message générique pour ne pas divulguer de détail sur les identifiants.
        const backendMessage = typeof error?.message === "string" ? error.message : null
        const message =
            backendMessage && backendMessage !== "Invalid credentials"
                ? backendMessage
                : "Email ou mot de passe incorrect"
        return NextResponse.json({ message }, { status: 401 })
    }
}

export async function DELETE() {
    try {
        await authService.logout()
    } catch {
        // Le token est peut-être déjà invalide côté backend : on nettoie quand même le cookie local.
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set(TOKEN_COOKIE, "", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    })
    return res
}
