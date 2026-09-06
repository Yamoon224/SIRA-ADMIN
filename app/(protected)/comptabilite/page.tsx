"use client"

import React, { useEffect, useState } from "react"
import {
    Line,
    LineChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import {
    DollarSign,
    Users,
    UserPlus,
    AlertTriangle,
    MoreHorizontal,
    Download,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DetailModal } from "@/components/modals/detail-modal"
import { exportToCSV } from "@/lib/export-utils"
import { subscriptionService, type SubscriptionStats, type SubscriptionRow } from "@/lib/services/subscription.service"

const FALLBACK_REVENUE_DATA = [
    { month: "Jan", value: 34000 },
    { month: "Fev", value: 42000 },
    { month: "Mar", value: 38500 },
    { month: "Avr", value: 45500 },
    { month: "Mai", value: 48200 },
    { month: "Juin", value: 52230 },
]

const FALLBACK_SUBSCRIPTIONS_DATA = [
    { month: "Jan", value: 1140 },
    { month: "Fev", value: 1200 },
    { month: "Mar", value: 1180 },
    { month: "Avr", value: 1240 },
    { month: "Mai", value: 1300 },
    { month: "Juin", value: 1350 },
]

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: "Actif", cls: "bg-[#e1f8e8] text-[#33b06b]" },
    EXPIRED: { label: "Expiré", cls: "bg-[#fff3cd] text-[#996b00]" },
    CANCELLED: { label: "Annulé", cls: "bg-[#ffe1e1] text-[#ff6b6b]" },
}


export default function Page() {
    const router = useRouter()
    const [detailSub, setDetailSub] = useState<SubscriptionRow | null>(null)
    const [subStats, setSubStats] = useState<SubscriptionStats | null>(null)
    const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([])
    const [revenueData, setRevenueData] = useState(FALLBACK_REVENUE_DATA)
    const [subscriptionsData, setSubscriptionsData] = useState(FALLBACK_SUBSCRIPTIONS_DATA)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, subsRes, revRes, subTrendRes] = await Promise.all([
                    subscriptionService.getAdminStats(),
                    subscriptionService.getAllSubscriptions(1, 10),
                    subscriptionService.getRevenueTrend().catch(() => null),
                    subscriptionService.getSubscriptionsTrend().catch(() => null),
                ])
                setSubStats((statsRes as any)?.data ?? statsRes)
                const subsData = (subsRes as any)?.data ?? subsRes
                const items = Array.isArray(subsData) ? subsData : (subsData as any)?.data ?? []
                setSubscriptions(items)
                const rev = (revRes as any)?.data ?? revRes
                if (Array.isArray(rev) && rev.length > 0) setRevenueData(rev)
                const subTrend = (subTrendRes as any)?.data ?? subTrendRes
                if (Array.isArray(subTrend) && subTrend.length > 0) setSubscriptionsData(subTrend)
            } catch (err) {
                console.error("[comptabilite] load error:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleExport = () => {
        if (subscriptions.length === 0) {
            toast.error("Aucun abonnement à exporter")
            return
        }
        exportToCSV(
            subscriptions.map((sub) => ({
                utilisateur: sub.user?.name ?? "",
                email: sub.user?.email ?? "",
                plan: sub.plan?.name ?? "",
                statut: STATUS_MAP[sub.status]?.label ?? sub.status,
                montant_fcfa: sub.plan?.price ?? "",
                periode: sub.plan?.billingPeriod ?? "",
                debut: sub.startDate ? new Date(sub.startDate).toLocaleDateString("fr-FR") : "",
                expiration: sub.endDate ? new Date(sub.endDate).toLocaleDateString("fr-FR") : "",
                renouvellement_auto: sub.autoRenew ? "oui" : "non",
            })),
            "abonnements",
        )
        toast.success("Export CSV généré")
    }

    const total = subStats?.total ?? 0
    const active = subStats?.active ?? 0
    const expired = subStats?.expired ?? 0
    const revenue = subStats?.revenue ?? 0

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Comptabilite</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">Gestion des abonnements et facturation des utilisateurs</p>
                </div>

                <Button
                    className="mt-1 h-9 rounded-full bg-[#0f56d9] px-6 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                    onClick={handleExport}
                    disabled={loading}
                >
                    Exporter
                    <Download className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Revenus totaux (FCFA)"
                    value={loading ? "-" : Number(revenue).toLocaleString("fr-FR")}
                    note="Abonnements cumulés"
                    noteClass="text-[#23b26f]"
                    icon={DollarSign}
                />
                <KpiCard
                    title="Abonnements actifs"
                    value={loading ? "-" : active.toLocaleString()}
                    note={`sur ${total} total`}
                    noteClass="text-[#23b26f]"
                    icon={Users}
                />
                <KpiCard
                    title="Total abonnements"
                    value={loading ? "-" : total.toLocaleString()}
                    note="Tous statuts confondus"
                    noteClass="text-[#23b26f]"
                    icon={UserPlus}
                />
                <KpiCard
                    title="Abonnements expirés"
                    value={loading ? "-" : expired.toLocaleString()}
                    note="À renouveler"
                    noteClass="text-[#99a1b4]"
                    icon={AlertTriangle}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-2 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[21px] font-semibold text-[#242a38]">Évolution des revenus</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-5">
                        <div className="h-[170px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData} margin={{ top: 8, right: 6, left: 4, bottom: 0 }}>
                                    <CartesianGrid stroke="#e8ebf2" strokeDasharray="3 3" vertical />
                                    <XAxis dataKey="month" tick={{ fill: "#7f8797", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tick={{ fill: "#7f8797", fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        ticks={[0, 15000, 30000, 45000, 60000]}
                                        tickFormatter={(value) => `€${value.toLocaleString()}`}
                                        domain={[0, 60000]}
                                    />
                                    <Tooltip formatter={(value: number) => [`€${value.toLocaleString()}`, "Revenus"]} />
                                    <Line type="monotone" dataKey="value" stroke="#2b78f6" strokeWidth={2.4} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-2 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[21px] font-semibold text-[#242a38]">Nombre d'abonnements</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-5">
                        <div className="h-[170px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subscriptionsData} margin={{ top: 8, right: 6, left: 4, bottom: 0 }}>
                                    <CartesianGrid stroke="#e8ebf2" strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fill: "#7f8797", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tick={{ fill: "#7f8797", fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        ticks={[0, 350, 700, 1050, 1400]}
                                        domain={[0, 1400]}
                                    />
                                    <Tooltip formatter={(value: number) => [value, "Abonnements"]} />
                                    <Bar dataKey="value" fill="#3b7ddd" radius={[2, 2, 0, 0]} maxBarSize={56} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-full bg-[#eef3fb] p-1">
                <div className="grid grid-cols-4 gap-1 text-center text-[10px] text-[#7e8799]">
                    <div className="rounded-full bg-[#2f80ed] px-3 py-1.5 text-white">
                        Tous <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-[#2f80ed]">{loading ? "-" : total}</span>
                    </div>
                    <div className="px-3 py-1.5">Actifs <span className="ml-1 text-[#4d5567]">{loading ? "-" : active}</span></div>
                    <div className="px-3 py-1.5">Expirés <span className="ml-1 text-[#4d5567]">{loading ? "-" : expired}</span></div>
                    <div className="px-3 py-1.5">Annulés <span className="ml-1 text-[#4d5567]">{loading ? "-" : Math.max(0, total - active - expired)}</span></div>
                </div>
            </div>

            <div>
                <h2 className="text-[24px] font-semibold text-[#242a38]">Gestion des abonnements</h2>
                <p className="mt-1 text-[12px] text-[#8a92a3]">Vue d'ensemble de tous les utilisateurs et leur statut d'abonnement</p>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-0 pb-0 pt-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-[#e3e7f0] hover:bg-transparent">
                                    <TableHead className="px-4 text-[11px] font-medium text-[#9aa2b2]">Utilisateur</TableHead>
                                    <TableHead className="text-[11px] font-medium text-[#9aa2b2]">Plan</TableHead>
                                    <TableHead className="text-[11px] font-medium text-[#9aa2b2]">Statut</TableHead>
                                    <TableHead className="text-[11px] font-medium text-[#9aa2b2]">Montant (FCFA)</TableHead>
                                    <TableHead className="text-[11px] font-medium text-[#9aa2b2]">Expiration</TableHead>
                                    <TableHead className="w-10 px-4" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-[13px] text-[#8a92a3]">
                                            Aucun abonnement trouvé.
                                        </TableCell>
                                    </TableRow>
                                ) : subscriptions.map((sub) => {
                                    const name = sub.user?.name ?? "-"
                                    const email = sub.user?.email ?? "-"
                                    const initials = name.split(" ").map((w: string) => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2)
                                    const planName = sub.plan?.name ?? "-"
                                    const amount = sub.plan?.price != null ? Number(sub.plan.price).toLocaleString("fr-FR") : "-"
                                    const statusInfo = STATUS_MAP[sub.status] ?? { label: sub.status, cls: "bg-[#f0f2f6] text-[#4a5162]" }
                                    const endDate = sub.endDate ? new Date(sub.endDate).toLocaleDateString("fr-FR") : "-"
                                    return (
                                        <TableRow key={sub.id} className="border-b border-[#e9edf5] hover:bg-[#fbfcff]">
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf4ff] text-[10px] font-medium text-[#5a8df1]">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-medium text-[#2d3443]">{name}</p>
                                                        <p className="text-[11px] text-[#8e96a8]">{email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-[12px] text-[#4a5162]">{planName}</TableCell>
                                            <TableCell className="py-3 text-[11px]">
                                                <span className={`rounded-full px-2 py-0.5 ${statusInfo.cls}`}>{statusInfo.label}</span>
                                            </TableCell>
                                            <TableCell className="py-3 text-[12px] text-[#4a5162]">{amount}</TableCell>
                                            <TableCell className="py-3 text-[12px] text-[#7d8698]">{endDate}</TableCell>
                                            <TableCell className="px-4 py-3 text-right text-[#3d4455]">
                                                <Button
                                                    variant="ghost"
                                                    className="ml-auto h-7 w-7 p-0 hover:bg-[#f1f4fa]"
                                                    title="Voir le détail de l'abonnement"
                                                    onClick={() => setDetailSub(sub)}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <DetailModal
                isOpen={detailSub !== null}
                onClose={() => setDetailSub(null)}
                title={detailSub?.user?.name ?? "Abonnement"}
                subtitle={detailSub?.user?.email}
                fields={
                    detailSub
                        ? [
                            { label: "Plan", value: detailSub.plan?.name ?? "-" },
                            {
                                label: "Statut",
                                value: STATUS_MAP[detailSub.status]?.label ?? detailSub.status,
                            },
                            {
                                label: "Montant (FCFA)",
                                value:
                                    detailSub.plan?.price != null
                                        ? Number(detailSub.plan.price).toLocaleString("fr-FR")
                                        : "-",
                            },
                            { label: "Périodicité", value: detailSub.plan?.billingPeriod ?? "-" },
                            {
                                label: "Début",
                                value: detailSub.startDate
                                    ? new Date(detailSub.startDate).toLocaleDateString("fr-FR")
                                    : "-",
                            },
                            {
                                label: "Expiration",
                                value: detailSub.endDate
                                    ? new Date(detailSub.endDate).toLocaleDateString("fr-FR")
                                    : "-",
                            },
                            { label: "Renouvellement auto", value: detailSub.autoRenew ? "Oui" : "Non" },
                            { label: "Type de compte", value: detailSub.user?.role ?? "-" },
                            { label: "Identifiant", value: detailSub.id, full: true },
                        ]
                        : []
                }
                footer={
                    detailSub ? (
                        <Button variant="outline" onClick={() => router.push("/gestion-utilisateurs")}>
                            Voir le compte
                        </Button>
                    ) : null
                }
            />
        </div>
    )
}

type KpiCardProps = {
    title: string
    value: string
    note: string
    noteClass: string
    icon: React.ComponentType<{ className?: string }>
}

function KpiCard({ title, value, note, noteClass, icon: Icon }: KpiCardProps) {
    return (
        <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
            <CardContent className="flex items-start justify-between px-4 py-3.5">
                <div>
                    <p className="text-[11px] text-[#8b92a3]">{title}</p>
                    <p className="mt-2 text-[35px] leading-none font-semibold text-[#232a38]">{value}</p>
                    <p className={`mt-1 text-[10px] ${noteClass}`}>{note}</p>
                </div>
                <Icon className="mt-1 h-4 w-4 text-[#697286]" />
            </CardContent>
        </Card>
    )
}
