"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Building2, Briefcase, TrendingUp, FileText, Award, ExternalLink, Binary } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { PerformanceChart, type AiToolUsage } from "@/components/dashboard/performance-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { dashboardService } from "@/lib/services/dashboard.service"

type MonthlyStats = {
    newCandidates: number
    newCompanies: number
    cvAnalyzed: number
    newJobOffers: number
    applications: number
}

type DashboardStats = {
    activeStudents: number
    partnerCompanies: number
    analyzedCVs: number
    jobOffers: number
    monthly: MonthlyStats | null
    aiTools: AiToolUsage[]
}

const fmt = (value: number) => value.toLocaleString("fr-FR")
/** Volume créé depuis le 1er du mois ; rien tant que les chiffres ne sont pas chargés. */
const thisMonth = (value: number | undefined) => (value === undefined ? undefined : `+${fmt(value)} ce mois-ci`)

export default function Page() {
    const router = useRouter()
    // `null` tant que l'API n'a pas répondu : on affiche « - » plutôt qu'un
    // chiffre inventé, et un message si le chargement échoue.
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loadError, setLoadError] = useState(false)

    useEffect(() => {
        dashboardService
            .getAdminStats()
            .then((data) => {
                const payload = (data as any)?.data ?? data
                if (payload?.activeStudents === undefined) throw new Error("Réponse inattendue")
                setStats({
                    activeStudents: payload.activeStudents ?? 0,
                    partnerCompanies: payload.partnerCompanies ?? 0,
                    analyzedCVs: payload.analyzedCVs ?? 0,
                    jobOffers: payload.jobOffers ?? 0,
                    monthly: payload.monthly ?? null,
                    aiTools: Array.isArray(payload.aiTools) ? payload.aiTools : [],
                })
            })
            .catch((error) => {
                console.error("Error fetching stats:", error)
                setLoadError(true)
            })
    }, [])

    const value = (n: number | undefined) => (n === undefined ? "-" : fmt(n))
    const monthly = stats?.monthly ?? undefined

    const quickActions = [
        { icon: Binary, label: "Analyser un CV", href: "/analyze-ai" },
        { icon: Briefcase, label: "Nouvelle Offre", href: "/offres-emploi" },
        { icon: FileText, label: "Simulation Entretien", href: "/simulation-entretiens" },
        { icon: Award, label: "Ajouter Formation", href: "/formations" },
    ]

    // Portails partenaires : le bouton « Gérer » ouvre la console du partenaire.
    const partners = [
        { name: "Coursera", url: "https://www.coursera.org/business" },
        { name: "Meta Blueprint", url: "https://www.facebook.com/business/learn" },
        { name: "Google Cours", url: "https://grow.google/certificates/" },
        { name: "IBM SkillsBuild", url: "https://skillsbuild.org/" },
    ]

    return (
        <div className="space-y-4">
            <div className="rounded-[10px] bg-gradient-to-r from-[#1f69d8] via-[#0f3e92] to-[#071c3a] px-5 py-4 text-white">
                <h1 className="text-[28px] font-semibold leading-tight sm:text-[33px] lg:text-[39px]">Tableau de Bord Goriya</h1>
                <p className="max-w-[760px] text-[14px] text-[#cfe0ff]">
                    Gère ta plateforme d'emploi IA, analyse les performances et optimise l'expérience utilisateur pour
                    étudiants et entreprises.
                </p>
                <div className="pointer-events-none absolute" />
            </div>

            {loadError && (
                <p role="alert" className="rounded-[10px] border border-[#f3c7c7] bg-[#fdf3f3] px-4 py-3 text-[12px] text-[#b42318]">
                    Les statistiques n'ont pas pu être chargées. Recharge la page pour réessayer.
                </p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                    title="Utilisateurs Actifs"
                    value={value(stats?.activeStudents)}
                    subtitle="Étudiants et candidats"
                    growth={thisMonth(monthly?.newCandidates)}
                    icon={Users}
                    accentClass="border-[#67a1ff]"
                    iconClass="bg-[#4a89ef]"
                />
                <StatsCard
                    title="Entreprises Partenaires"
                    value={value(stats?.partnerCompanies)}
                    subtitle="Recruteurs actifs"
                    growth={thisMonth(monthly?.newCompanies)}
                    icon={Building2}
                    accentClass="border-[#55d5ac]"
                    iconClass="bg-[#2db77f]"
                />
                <StatsCard
                    title="CV Analysés (IA)"
                    value={value(stats?.analyzedCVs)}
                    subtitle="Analyses terminées, au total"
                    growth={thisMonth(monthly?.cvAnalyzed)}
                    icon={FileText}
                    accentClass="border-[#a777ff]"
                    iconClass="bg-[#8550e9]"
                />
                <StatsCard
                    title="Offres d'Emploi"
                    value={value(stats?.jobOffers)}
                    subtitle="Annonces actives"
                    growth={thisMonth(monthly?.newJobOffers)}
                    icon={Briefcase}
                    accentClass="border-[#f0b475]"
                    iconClass="bg-[#ee9b3b]"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <PerformanceChart tools={loadError ? [] : (stats?.aiTools ?? null)} />
                </div>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-2 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[31px] font-semibold text-[#242a38]">Actions Rapides</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 px-4 pb-4">
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                variant="ghost"
                                onClick={() => router.push(action.href)}
                                className="h-10 w-full justify-start rounded-lg border border-[#ebeef6] bg-[#f7f8fc] px-3 text-[11px] text-[#3d4456] hover:bg-[#eef2ff]"
                            >
                                <action.icon className="h-3.5 w-3.5 text-[#4a5162]" />
                                {action.label}
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-2 shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[31px] font-semibold text-[#242a38]">
                            <TrendingUp className="h-4 w-4 text-[#1abf7a]" />
                            Ce Mois-ci
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-6">
                        <div className="space-y-4">
                            {[
                                { label: "Nouveaux Candidats", value: monthly?.newCandidates },
                                { label: "Entreprises Inscrites", value: monthly?.newCompanies },
                                { label: "CV Traités IA", value: monthly?.cvAnalyzed },
                                { label: "Candidatures", value: monthly?.applications },
                            ].map((row) => (
                                <div key={row.label} className="flex justify-between items-center">
                                    <span className="text-[11px] text-[#3f4555]">{row.label}</span>
                                    <span className="text-[11px] text-[#1abf7a]">
                                        {row.value === undefined ? "-" : `+${fmt(row.value)}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-2 shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[31px] font-semibold text-[#242a38]">
                            <Award className="h-4 w-4 text-[#f49b33]" />
                            Partenariats Formation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4">
                        <div className="space-y-4">
                            {partners.map((partner) => (
                                <div key={partner.name} className="flex items-center justify-between rounded-lg border border-[#eceff6] bg-[#f7f8fc] px-3 py-2">
                                    <span className="text-[11px] text-[#323847]">{partner.name}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(partner.url, "_blank", "noopener,noreferrer")}
                                        className="h-7 rounded-md border-[#d5dae8] px-2 text-[11px] text-[#4a5060]"
                                    >
                                        Gérer
                                        <ExternalLink className="ml-1 h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
