"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/sonner"

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [ready, setReady] = useState(false)

    useEffect(() => {
        // Le token vit dans un cookie httpOnly (illisible en JS) et la vraie garde d'accès est le
        // middleware serveur ; ce check ne sert qu'à éviter un flash de contenu protégé.
        const user = localStorage.getItem("goriya_user")
        if (!user) {
            router.replace("/login")
        } else {
            setReady(true)
        }
    }, [router])

    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="flex h-full bg-gray-50">
            <Sidebar className="hidden lg:flex lg:flex-shrink-0" />

            <div className="flex-1 flex flex-col min-h-0">
                <Header />

                <main className="flex-1 overflow-auto min-h-0 p-4">
                    {children}
                </main>
            </div>

            <Toaster position="top-right" richColors />
        </div>
    )
}
