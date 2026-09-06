"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    Brain,
    TrendingUp,
    Heart,
    Zap,
    Users,
    Activity,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DetailModal } from "@/components/modals/detail-modal"
import { matchingService } from "@/lib/services/matching.service"
import type { IMatchingResult } from "@/lib/@types/entities"
import { MatchingStatus } from "@/lib/@types/enums"

function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

export default function Page() {
    const router = useRouter()
    const [detailMatch, setDetailMatch] = useState<IMatchingResult | null>(null)
    const [matchingStats, setMatchingStats] = useState<{
        totalMatches: number
        averageScore: number
        successRate: number
        pendingMatches: number
    } | null>(null)
    const [algorithmPerf, setAlgorithmPerf] = useState<{
        precision: number
        recall: number
        f1Score: number
        algorithms: Array<{ name: string; accuracy: number }>
    } | null>(null)
    const [recentMatches, setRecentMatches] = useState<IMatchingResult[]>([])
    const [activityFeed, setActivityFeed] = useState<Array<{ id: string; type: string; message: string; timestamp: string }>>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, perfRes, matchesRes, activityRes] = await Promise.all([
                    matchingService.getStats(),
                    matchingService.getAlgorithmPerformance(),
                    matchingService.getRecentMatches({ limit: 5 }),
                    matchingService.getActivityFeed(),
                ])
                setMatchingStats((statsRes as any)?.data ?? statsRes)
                setAlgorithmPerf((perfRes as any)?.data ?? perfRes)
                const matchItems = (matchesRes as any)?.data ?? matchesRes
                setRecentMatches(Array.isArray(matchItems) ? matchItems : [])
                const actItems = (activityRes as any)?.data ?? activityRes
                setActivityFeed(Array.isArray(actItems) ? actItems : [])
            } catch (err) {
                console.error("[matching-ai] load error:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const stats = [
        { title: "Matchings Aujourd'hui", value: matchingStats ? String(matchingStats.totalMatches) : "-", icon: Users },
        { title: "Score Moyen", value: matchingStats ? `${matchingStats.averageScore}%` : "-", icon: Brain },
        { title: "Taux de Réussite", value: matchingStats ? `${matchingStats.successRate}%` : "-", icon: TrendingUp },
        { title: "En Attente", value: matchingStats ? String(matchingStats.pendingMatches) : "-", icon: Heart },
    ]

    const perfBars = algorithmPerf
        ? [
            { label: "Précision", value: algorithmPerf.precision },
            { label: "Rappel", value: algorithmPerf.recall },
          ]
        : [
            { label: "Précision", value: 91.2 },
            { label: "Vitesse", value: 94.8 },
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
                <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Matching IA Avancé</h1>
                <p className="mt-1 text-[14px] text-[#7f8797]">
                    Algorithme intelligent de mise en relation candidats-entreprises
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                        <CardContent className="flex items-start justify-between px-4 py-4">
                            <div>
                                <p className="text-[11px] text-[#8b92a3]">{stat.title}</p>
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
                            <Zap className="h-4 w-4" />
                            Algorithme IA
                        </h2>

                        <div className="mt-5">
                            <p className="mb-2 text-[12px] font-medium text-[#4a5162]">Performance</p>
                            <div className="space-y-2">
                                {perfBars.map((item) => (
                                    <div key={item.label} className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-[#4a5162]">{item.label}</span>
                                            <span className="text-[#4a5162]">{item.value}%</span>
                                        </div>
                                        <Progress
                                            value={item.value}
                                            className="h-2 bg-[#ebeff8] [&_[data-slot=progress-indicator]]:bg-[#3f7fe8]"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 flex items-center gap-2 text-[30px] font-semibold text-[#242a38]">
                            <TrendingUp className="h-4 w-4" />
                            Algorithmes Disponibles
                        </h2>

                        <div className="space-y-2">
                            {algorithmPerf?.algorithms?.length ? (
                                algorithmPerf.algorithms.map((algo) => (
                                    <div key={algo.name} className="rounded-lg border border-[#ebeff6] bg-[#f8f9fc] px-3 py-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[12px] font-medium text-[#2f3647]">{algo.name}</p>
                                            <p className="text-[13px] font-semibold text-[#4a5162]">{algo.accuracy}%</p>
                                        </div>
                                        <p className="mt-1 text-[10px] text-[#8a92a3]">Précision</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[12px] text-[#8a92a3]">Aucun algorithme disponible.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 flex items-center gap-2 text-[30px] font-semibold text-[#242a38]">
                            <Activity className="h-4 w-4" />
                            Activité Récente
                        </h2>

                        <div className="space-y-2">
                            {activityFeed.length > 0 ? (
                                activityFeed.slice(0, 4).map((item) => (
                                    <div key={item.id} className="rounded-lg border border-[#e7ebf3] bg-[#f8f9fc] px-3 py-2">
                                        <p className="text-[11px] text-[#2f3647]">{item.message}</p>
                                        <p className="mt-1 text-[10px] text-[#8a92a3]">
                                            {new Date(item.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-center justify-between text-[12px]">
                                        <span className="text-[#4a5162]">Candidats actifs</span>
                                        <span className="font-semibold text-[#2f3647]">-</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[12px]">
                                        <span className="text-[#4a5162]">Offres ouvertes</span>
                                        <span className="font-semibold text-[#2f3647]">-</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => router.push("/analytics")}
                            className="mt-5 h-9 w-full rounded-lg border-[#eceff5] bg-[#f8f9fc] text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]"
                        >
                            <Activity className="h-3.5 w-3.5" />
                            Voir Dashboard Live
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[28px] font-semibold text-[#242a38]">Matches Récents</h2>

                    {recentMatches.length === 0 ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucun match récent.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentMatches.map((match) => (
                                <div key={match.id} className="rounded-[10px] border border-[#e7ebf3] bg-white px-4 py-3">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-[11px] font-semibold text-white">
                                                    {getInitials(match.candidateName)}
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-medium text-[#252c3b]">{match.candidateName}</p>
                                                    <p className="text-[10px] text-[#8a92a3]">Candidat</p>
                                                </div>
                                            </div>

                                            <Heart className="h-4 w-4 text-[#7f8797]" />

                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-[11px] font-semibold text-white">
                                                    {getInitials(match.company)}
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-medium text-[#252c3b]">{match.company}</p>
                                                    <p className="text-[10px] text-[#8a92a3]">{match.position}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Badge className="rounded-full border-0 bg-[#2f80ed] px-2 py-0.5 text-[10px] text-white">
                                                {match.status}
                                            </Badge>
                                            <p className="text-[32px] font-semibold leading-none text-[#232a38]">
                                                {match.matchingScore}%
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setDetailMatch(match)}
                                                className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]"
                                            >
                                                Voir Détails
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <DetailModal
                isOpen={detailMatch !== null}
                onClose={() => setDetailMatch(null)}
                title={detailMatch?.candidateName ?? ""}
                subtitle={detailMatch ? `${detailMatch.position} — ${detailMatch.company}` : undefined}
                fields={
                    detailMatch
                        ? [
                            { label: "Score de matching", value: `${detailMatch.matchingScore}%` },
                            { label: "Statut", value: detailMatch.status },
                            { label: "Email candidat", value: detailMatch.candidateEmail },
                            { label: "Entreprise", value: detailMatch.company },
                            { label: "Poste", value: detailMatch.position },
                            {
                                label: "Match du",
                                value: detailMatch.matchDate
                                    ? new Date(detailMatch.matchDate).toLocaleDateString("fr-FR")
                                    : "-",
                            },
                        ]
                        : []
                }
                footer={
                    detailMatch && detailMatch.status !== MatchingStatus.FINALISE ? (
                        <Button
                            variant="outline"
                            onClick={async () => {
                                try {
                                    await matchingService.updateMatchStatus(detailMatch.id, MatchingStatus.FINALISE)
                                    setRecentMatches((prev) =>
                                        prev.map((m) =>
                                            m.id === detailMatch.id ? { ...m, status: MatchingStatus.FINALISE } : m,
                                        ),
                                    )
                                    setDetailMatch(null)
                                    toast.success("Match finalisé")
                                } catch (err) {
                                    console.error("[matching-ai] status error:", err)
                                    toast.error("Mise à jour impossible")
                                }
                            }}
                        >
                            Finaliser le match
                        </Button>
                    ) : null
                }
            />
        </div>
    )
}
