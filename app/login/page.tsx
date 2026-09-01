"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Phone, Globe, Eye, EyeOff } from "lucide-react"
import { AppLogo } from "@/components/app-logo"
import { toast } from "sonner"

export default function Page() {
    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
    })
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            })
            const body = await res.json()

            if (!res.ok) {
                toast.error(body?.message ?? "Email ou mot de passe incorrect")
                return
            }

            localStorage.setItem("goriya_user", JSON.stringify(body.user))

            toast.success("Connexion réussie")
            router.push("/dashboard")
        } catch (error) {
            console.error("Login error:", error)
            toast.error("Une erreur est survenue. Réessaie.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-dvh overflow-x-hidden overflow-y-auto md:overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/images/bg-auth.png)" }} />
            <div className="absolute inset-0 bg-[#1f4ea6]/35" />

            <div className="relative z-10 min-h-dvh px-4 py-6 sm:py-8 md:px-0 md:py-0">
                <div className="mx-auto flex min-h-dvh w-full max-w-[1365px] items-start justify-center md:items-center md:justify-between">
                    <div className="hidden md:flex min-h-screen w-full items-end pb-[190px] pl-[20px]">
                        <div className="w-[780px]">
                            <h1 className="text-[38px] leading-none font-light text-white">Bienvenue</h1>
                        </div>
                    </div>

                    <div className="relative w-full max-w-[450px] md:mr-[95px] md:-mt-[120px] md:w-auto">
                        <div className="mx-auto w-full rounded-t-[28px] rounded-b-none bg-white/95 p-5 shadow-2xl backdrop-blur-[1px] sm:p-6 md:mx-0 md:w-[450px] md:p-8">
                            <div className="mb-4 text-center">
                                <div className="mb-2 flex items-center justify-center">
                                    <AppLogo width={172} />
                                </div>
                                <p className="text-[15px] text-gray-600 sm:text-[16px] md:text-[18px]">Portail Goriya Admin</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-[14px] text-[#5c5f66]">Adresse administrateur</label>
                                    <Input
                                        type="email"
                                        value={credentials.email}
                                        placeholder="Adresse e-mail administrateur"
                                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                        required
                                        className="h-[44px] rounded-xl border-0 bg-[#eef0f4] px-4 text-[16px] shadow-none focus-visible:ring-2 focus-visible:ring-blue-300 md:h-[40px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[14px] text-[#5c5f66]">Mot de passe</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={credentials.password}
                                            placeholder="Mot de passe"
                                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                            required
                                            className="h-[44px] rounded-xl border-0 bg-[#eef0f4] px-4 pr-11 text-[16px] shadow-none focus-visible:ring-2 focus-visible:ring-blue-300 md:h-[40px]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-[#5c5f66] hover:text-[#2f3136]"
                                            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-2 md:flex md:justify-end">
                                    <Button
                                        type="submit"
                                        className="h-[44px] w-full rounded-full bg-gradient-to-r from-[#2680ff] to-[#0037bd] text-[16px] font-semibold text-white hover:from-[#2d87ff] hover:to-[#0034ad] md:h-[40px] md:w-1/2"
                                        disabled={loading}
                                    >
                                        {loading ? "Connexion..." : "Connexion"}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <div className="mx-auto mt-0 w-full rounded-[0_0_26px_26px] bg-black/45 px-5 py-3 text-white backdrop-blur-sm sm:px-6 md:absolute md:left-0 md:top-full md:mt-0 md:w-[450px] md:px-8 md:py-2">
                            <div className="space-y-2 text-[14px] leading-tight font-light sm:text-[15px] md:space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 shrink-0" />
                                    <p>Courriel: <a href="mailto:support@goriya.net" className="hover:underline">support@goriya.net</a></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 shrink-0" />
                                    <p>Téléphone: <a href="tel:+2250758700692" className="hover:underline">+225 07 58 70 06 92</a></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Globe className="h-5 w-5 shrink-0" />
                                    <p>Site internet: <a href="https://goriya.net" target="_blank" rel="noopener noreferrer" className="hover:underline">www.goriya.net</a></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-none absolute left-0 right-0 top-[440px] hidden border-t-8 border-white/60 md:block" />
            </div>
        </div>
    )
}
