"use client"

import { useEffect, useState } from "react"
import { analyticsService } from "@/lib/services/analytics.service"
import { BarChart3, Users, Target, Send, TrendingUp, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts"

type AnalyticsData = {
    analyzedCVs: number
    successfulInterviews: number
    matchingRate: number
    totalApplications: number
}

type Slice = { name: string; value: number; color: string }

const fmt = (value: number) => value.toLocaleString("fr-FR")
const unwrap = (res: unknown) => (res as any)?.data ?? res
const asArray = <T,>(res: unknown): T[] => {
    const value = unwrap(res)
    return Array.isArray(value) ? (value as T[]) : []
}

/**
 * Tous les chiffres viennent du backend. Aucune valeur de démonstration : un
 * indicateur non chargé affiche « - », un graphique sans donnée le dit.
 */
export default function Page() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [evolutionData, setEvolutionData] = useState<{ month: string; value: number }[]>([])
    const [activityData, setActivityData] = useState<Slice[]>([])
    const [monthlyActivity, setMonthlyActivity] = useState<{ month: string; cv: number; entretiens: number }[]>([])
    const [userDistribution, setUserDistribution] = useState<Slice[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [mainData, evolutionRes, activityRes, monthlyRes, userDistRes] = await Promise.all([
                    analyticsService.getAnalytics(),
                    // "year" = 12 derniers mois ; "month" renvoie les semaines du mois en cours.
                    analyticsService.getEvolutionData("year"),
                    analyticsService.getActivityDistribution(),
                    analyticsService.getMonthlyActivity().catch(() => null),
                    analyticsService.getUserTypeDistribution().catch(() => null),
                ])
                const payload = unwrap(mainData) as any
                if (payload?.analyzedCVs === undefined) throw new Error("Réponse inattendue")
                setAnalytics({
                    analyzedCVs: payload.analyzedCVs ?? 0,
                    successfulInterviews: payload.successfulInterviews ?? 0,
                    matchingRate: payload.matchingRate ?? 0,
                    totalApplications: payload.totalApplications ?? 0,
                })
                setEvolutionData(asArray(evolutionRes))
                setActivityData(asArray(activityRes))
                setMonthlyActivity(asArray(monthlyRes))
                setUserDistribution(asArray(userDistRes))
            } catch (error) {
                console.error("Error fetching analytics:", error)
                setLoadError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [])

    const kpi = (value: number | undefined, suffix = "") => (value === undefined ? "-" : `${fmt(value)}${suffix}`)
    const emptyLabel = loading ? "Chargement…" : "Aucune donnée pour le moment."
    const hasEvolution = evolutionData.some((d) => d.value > 0)
    const hasMonthly = monthlyActivity.some((d) => d.cv > 0 || d.entretiens > 0)
    const activitySlices = activityData.filter((d) => d.value > 0)
    const userSlices = userDistribution.filter((d) => d.value > 0)
    const userTotal = userSlices.reduce((sum, d) => sum + d.value, 0)

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[34px] lg:text-[40px]">Analytics & Rapports</h1>
                <p className="mt-1 text-[14px] text-[#7f8797]">Analyse détaillée des performances de la plateforme Goriya</p>
            </div>

            {loadError && (
                <p role="alert" className="rounded-[10px] border border-[#f3c7c7] bg-[#fdf3f3] px-4 py-3 text-[12px] text-[#b42318]">
                    Les statistiques n'ont pas pu être chargées. Recharge la page pour réessayer.
                </p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard title="CV Analysés Total" value={kpi(analytics?.analyzedCVs)} icon={BarChart3} />
                <KpiCard title="Entretiens Simulés Terminés" value={kpi(analytics?.successfulInterviews)} icon={Users} />
                <KpiCard title="Taux de Matching Moyen" value={kpi(analytics?.matchingRate, "%")} icon={Target} />
                <KpiCard title="Candidatures Total" value={kpi(analytics?.totalApplications)} icon={Send} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-2 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-[33px] font-semibold text-[#242a38]">
                            <TrendingUp className="h-4 w-4 text-[#1f2533]" />
                            Évolution des Analyses de CV
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-5">
                        <div className="h-[300px] w-full">
                            {hasEvolution ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={evolutionData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="evolutionGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#1f53cc" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#1f53cc" stopOpacity={0.16} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="#e8ebf2" strokeDasharray="3 3" />
                                        <XAxis dataKey="month" tick={{ fill: "#72809a", fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: "#72809a", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip formatter={(value: number) => [fmt(value), "CV analysés"]} />
                                        <Area type="monotone" dataKey="value" stroke="#1241bd" strokeWidth={2} fill="url(#evolutionGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChart label={emptyLabel} />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-2 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-[33px] font-semibold text-[#242a38]">
                            <Eye className="h-4 w-4 text-[#1f2533]" />
                            Répartition des Activités
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-5">
                        <div className="h-[260px] w-full">
                            {activitySlices.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={activitySlices}
                                            cx="50%"
                                            cy="52%"
                                            innerRadius={52}
                                            outerRadius={88}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {activitySlices.map((entry) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number, name: string) => [fmt(value), name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChart label={emptyLabel} />
                            )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#1f2533]">
                            {activityData.map((entry) => (
                                <LegendDot key={entry.name} color={entry.color} label={`${entry.name} : ${fmt(entry.value)}`} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-2 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[33px] font-semibold text-[#242a38]">Activité Mensuelle</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-5">
                        <div className="h-[300px] w-full">
                            {hasMonthly ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid stroke="#eceff5" strokeDasharray="3 3" />
                                        <XAxis dataKey="month" tick={{ fill: "#72809a", fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: "#72809a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="cv" name="CV analysés" fill="#23b27e" maxBarSize={26} />
                                        <Bar dataKey="entretiens" name="Entretiens simulés" fill="#f39c12" maxBarSize={26} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChart label={emptyLabel} />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-2 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[33px] font-semibold text-[#242a38]">Répartition des Utilisateurs</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-5">
                        <div className="h-[260px] w-full">
                            {userSlices.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={userSlices} cx="50%" cy="52%" outerRadius={68} dataKey="value" stroke="none">
                                            {userSlices.map((entry) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number, name: string) => [fmt(value), name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChart label={emptyLabel} />
                            )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#1f2533]">
                            {userDistribution.map((entry) => (
                                <LegendDot
                                    key={entry.name}
                                    color={entry.color}
                                    label={`${entry.name} : ${fmt(entry.value)}${userTotal > 0 ? ` (${Math.round((entry.value / userTotal) * 100)}%)` : ""}`}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function EmptyChart({ label }: { label: string }) {
    return <div className="flex h-full items-center justify-center text-[12px] text-[#8b92a3]">{label}</div>
}

type KpiCardProps = {
    title: string
    value: string
    icon: React.ComponentType<{ className?: string }>
}

function KpiCard({ title, value, icon: Icon }: KpiCardProps) {
    return (
        <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
            <CardContent className="flex items-start justify-between px-4 py-4">
                <div>
                    <p className="text-[11px] text-[#8b92a3]">{title}</p>
                    <p className="mt-3 text-[35px] leading-none font-semibold text-[#232a38]">{value}</p>
                </div>
                <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a89ef]">
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardContent>
        </Card>
    )
}

type LegendDotProps = {
    color: string
    label: string
}

function LegendDot({ color, label }: LegendDotProps) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5" style={{ backgroundColor: color }} />
            <span>{label}</span>
        </div>
    )
}
