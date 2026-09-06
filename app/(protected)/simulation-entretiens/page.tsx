"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    Calendar,
    MessageSquare,
    Trophy,
    Clock3,
    Star,
    Brain,
    TrendingUp,
    Users,
    Mic,
    Eye,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { DetailModal } from "@/components/modals/detail-modal"
import { interviewService } from "@/lib/services/interview.service"
import type { IInterviewSession } from "@/lib/@types/entities"

function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

export default function Page() {
    const router = useRouter()
    const [detailSession, setDetailSession] = useState<IInterviewSession | null>(null)
    const [interviewStats, setInterviewStats] = useState<{
        todaySessions: number
        averageScore: number
        averageDuration: string
        satisfaction: number
    } | null>(null)
    const [activeSessions, setActiveSessions] = useState<IInterviewSession[]>([])
    const [sessionHistory, setSessionHistory] = useState<IInterviewSession[]>([])
    const [loading, setLoading] = useState(true)

    const perfRows = useMemo(() => {
        if (!interviewStats) return [
            { label: "Réussite Entretiens", value: 78 },
            { label: "Satisfaction Candidats", value: 92 },
            { label: "Taux de Complétion", value: 85 },
        ]
        const completed = sessionHistory.filter(s => s.status === "COMPLETED").length
        const completionRate = sessionHistory.length > 0
            ? Math.round(completed / sessionHistory.length * 100)
            : 85
        return [
            { label: "Réussite Entretiens", value: Math.round(interviewStats.averageScore ?? 78) },
            { label: "Satisfaction Candidats", value: Math.round((interviewStats.satisfaction ?? 4.6) * 20) },
            { label: "Taux de Complétion", value: completionRate },
        ]
    }, [interviewStats, sessionHistory])

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, activeRes, historyRes] = await Promise.all([
                    interviewService.getStats(),
                    interviewService.getActiveSessions(),
                    interviewService.getSessionHistory({ limit: 10 }),
                ])
                setInterviewStats((statsRes as any)?.data ?? statsRes)
                const activeItems = (activeRes as any)?.data ?? activeRes
                setActiveSessions(Array.isArray(activeItems) ? activeItems : [])
                const histItems = (historyRes as any)?.data ?? historyRes
                setSessionHistory(Array.isArray(histItems) ? histItems : [])
            } catch (err) {
                console.error("[simulation-entretiens] load error:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const stats = [
        { label: "Sessions Aujourd'hui", value: interviewStats ? String(interviewStats.todaySessions) : "-", icon: MessageSquare },
        { label: "Score Moyen", value: interviewStats ? String(interviewStats.averageScore) : "-", icon: Trophy },
        { label: "Durée Moyenne", value: interviewStats?.averageDuration ?? "-", icon: Clock3 },
        { label: "Satisfaction", value: interviewStats ? `${interviewStats.satisfaction}/5` : "-", icon: Star },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center p-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Simulation d'Entretiens</h1>
                <p className="mt-1 text-[14px] text-[#7f8797]">
                    Gestion et analyse des entretiens IA et sessions avec professionnels RH
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                        <CardContent className="flex items-start justify-between px-4 py-4">
                            <div>
                                <p className="text-[11px] text-[#8b92a3]">{stat.label}</p>
                                <p className="mt-3 text-[35px] leading-none font-semibold text-[#232a38]">{stat.value}</p>
                            </div>
                            <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a89ef]">
                                <stat.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 flex items-center gap-2 text-[30px] font-semibold text-[#242a38]">
                            <Brain className="h-4 w-4" />
                            Configuration IA
                        </h2>

                        <div className="space-y-5 text-[12px]">
                            <div>
                                <p className="font-medium text-[#2d3443]">Chatbot IA Avancé</p>
                                <p className="mt-1 text-[#8a92a3]">Questions adaptatives basées sur le profil</p>
                            </div>
                            <div>
                                <p className="font-medium text-[#2d3443]">Mode Premium RH</p>
                                <p className="mt-1 text-[#8a92a3]">Entretiens avec professionnels</p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => router.push("/parametres")}
                            className="mt-5 h-9 w-full rounded-lg border-[#eceff5] bg-[#f8f9fc] text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]"
                        >
                            <Mic className="h-3.5 w-3.5" />
                            Configurer Scénarios
                        </Button>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 flex items-center gap-2 text-[30px] font-semibold text-[#242a38]">
                            <TrendingUp className="h-4 w-4" />
                            Performances
                        </h2>

                        <div className="space-y-4">
                            {perfRows.map((row) => (
                                <div key={row.label} className="space-y-1">
                                    <div className="flex items-center justify-between text-[12px]">
                                        <span className="text-[#3f4657]">{row.label}</span>
                                        <span className="text-[#4a5162]">{row.value}%</span>
                                    </div>
                                    <Progress
                                        value={row.value}
                                        className="h-2 bg-[#ebeff8] [&_[data-slot=progress-indicator]]:bg-[#3f7fe8]"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 border-t border-[#eceff6] pt-3">
                            <p className="text-[11px] text-[#8a92a3]">Domaines populaires:</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {["Développement", "Marketing", "Design"].map((label) => (
                                    <Badge
                                        key={label}
                                        className="rounded-full border-0 bg-[#edf0f6] px-2 py-0.5 text-[10px] text-[#3d4354]"
                                    >
                                        {label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 flex items-center gap-2 text-[30px] font-semibold text-[#242a38]">
                            <Users className="h-4 w-4" />
                            Sessions Actives
                        </h2>

                        {activeSessions.length === 0 ? (
                            <p className="text-[12px] text-[#8a92a3]">Aucune session active.</p>
                        ) : (
                            <div className="space-y-3">
                                {activeSessions.map((session) => (
                                    <div key={session.id} className="rounded-lg border border-[#e7ebf3] bg-[#f8f9fc] px-3 py-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-[11px] font-semibold text-white">
                                                    {getInitials(session.candidateName)}
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-medium text-[#252c3b]">{session.candidateName}</p>
                                                    <p className="text-[11px] text-[#7f8797]">{session.position}</p>
                                                </div>
                                            </div>
                                            <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${session.status === "ACTIVE" ? "bg-[#edf0f6] text-[#3d4354]" : "bg-[#2f80ed] text-white"}`}>
                                                {session.status === "ACTIVE" ? "En cours" : "Programmé"}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={() => router.push("/planification")}
                            className="mt-4 h-9 w-full rounded-lg border-[#eceff5] bg-[#f8f9fc] text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]"
                        >
                            <Calendar className="h-3.5 w-3.5" />
                            Voir Planning
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[28px] font-semibold text-[#242a38]">Historique des Sessions</h2>

                    {sessionHistory.length === 0 ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucune session dans l'historique.</p>
                    ) : (
                        <div className="space-y-3">
                            {sessionHistory.map((row) => (
                                <div
                                    key={row.id}
                                    className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-[11px] font-semibold text-white">
                                            {getInitials(row.candidateName)}
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-medium text-[#252c3b]">{row.candidateName}</p>
                                            <p className="text-[11px] text-[#7f8797]">{row.position}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                                        <div className="text-right">
                                            <p className="text-[12px] text-[#4a5162]">{row.duration} min</p>
                                            <p className="text-[10px] text-[#8a92a3]">Durée</p>
                                        </div>
                                        {row.score > 0 ? (
                                            <div className="text-right">
                                                <p className="text-[25px] font-semibold text-[#232a38]">{row.score}/100</p>
                                                <p className="text-[10px] text-[#8a92a3]">Score</p>
                                            </div>
                                        ) : null}
                                        <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${row.status === "COMPLETED" ? "bg-[#2f80ed] text-white" : "bg-[#edf0f6] text-[#3d4354]"}`}>
                                            {row.status === "COMPLETED" ? "Terminé" : "En cours"}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            onClick={() => setDetailSession(row)}
                                            className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Voir Détails
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <DetailModal
                isOpen={detailSession !== null}
                onClose={() => setDetailSession(null)}
                title={detailSession?.candidateName ?? ""}
                subtitle={detailSession?.position}
                fields={
                    detailSession
                        ? [
                            {
                                label: "Statut",
                                value: detailSession.status === "COMPLETED" ? "Terminé" : detailSession.status === "ACTIVE" ? "En cours" : "Programmé",
                            },
                            { label: "Score", value: detailSession.score > 0 ? `${detailSession.score}/100` : "-" },
                            { label: "Durée", value: `${detailSession.duration} min` },
                            { label: "Email", value: detailSession.candidateEmail },
                            {
                                label: "Démarré le",
                                value: detailSession.startTime
                                    ? new Date(detailSession.startTime).toLocaleString("fr-FR")
                                    : "-",
                            },
                            { label: "Poste visé", value: detailSession.position },
                            { label: "Feedback", value: detailSession.feedback || "-", full: true },
                        ]
                        : []
                }
            />
        </div>
    )
}
