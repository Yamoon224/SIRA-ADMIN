"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    Brain,
    Target,
    Zap,
    TrendingUp,
    Settings,
    CircleCheck,
    TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"
import { DetailModal } from "@/components/modals/detail-modal"
import { ScoringWeightsModal } from "@/components/modals/scoring-weights-modal"
import { exportToPDF } from "@/lib/export-utils"
import { scoringService, type IScoringCriteria } from "@/lib/services/scoring.service"
import type { IScoringResult } from "@/lib/@types/entities"

export default function Page() {
    const [scoringStats, setScoringStats] = useState<{
        generatedScores: number
        averageScore: number
        accuracy: number
        averageTime: string
    } | null>(null)
    const [criteria, setCriteria] = useState<IScoringCriteria[]>([])
    const [performance, setPerformance] = useState<{
        precision: number
        recall: number
        f1Score: number
    } | null>(null)
    const [recentAnalyses, setRecentAnalyses] = useState<IScoringResult[]>([])
    const [loading, setLoading] = useState(true)
    const [isWeightsOpen, setIsWeightsOpen] = useState(false)
    const [detailResult, setDetailResult] = useState<IScoringResult | null>(null)

    const load = async () => {
        try {
            const [statsRes, criteriaRes, perfRes, recentRes] = await Promise.all([
                scoringService.getStats(),
                scoringService.getScoringCriteria(),
                scoringService.getAlgorithmPerformance(),
                scoringService.getRecentAnalyses({ limit: 5 }),
            ])
            setScoringStats((statsRes as any)?.data ?? statsRes)
            const crit = (criteriaRes as any)?.data ?? criteriaRes
            setCriteria(Array.isArray(crit) ? crit : [])
            setPerformance((perfRes as any)?.data ?? perfRes)
            const items = (recentRes as any)?.data ?? recentRes
            setRecentAnalyses(Array.isArray(items) ? items : [])
        } catch (err) {
            console.error("[scoring-ai] load error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    /** Ouvre la fiche détaillée, en récupérant le découpage par critère. */
    const handleOpenDetail = async (row: IScoringResult) => {
        setDetailResult(row)
        try {
            const res = await scoringService.getScoringById(row.id)
            const full = ((res as any)?.data ?? res) as IScoringResult
            if (full?.id) setDetailResult(full)
        } catch (err) {
            console.error("[scoring-ai] detail error:", err)
        }
    }

    const handleGenerateReport = async (row: IScoringResult) => {
        const detail = Array.isArray(row.criteria)
            ? (row.criteria as Array<{ name?: string; score?: number; maxScore?: number }>)
            : []
        await exportToPDF(
            [
                {
                    Candidat: row.candidateName,
                    Email: row.candidateEmail,
                    Poste: row.position,
                    "Score global": `${row.overallScore}/100`,
                    Statut: row.status === "COMPLETED" ? "Terminé" : "En cours",
                    "Analysé le": new Date(row.analysisDate).toLocaleDateString("fr-FR"),
                    Détail:
                        detail
                            .map((c) => `${c.name ?? "-"}: ${c.score ?? 0}/${c.maxScore ?? 100}`)
                            .join(" | ") || "-",
                },
            ],
            `scoring-${row.candidateName.replace(/\s+/g, "-").toLowerCase()}`,
            `Rapport de scoring — ${row.candidateName}`,
        )
        toast.success("Rapport prêt à imprimer / enregistrer en PDF")
    }

    const stats = [
        { label: "Scores Générés", value: scoringStats ? scoringStats.generatedScores.toLocaleString("fr-FR") : "-", icon: Brain },
        { label: "Score Moyen Global", value: scoringStats ? String(scoringStats.averageScore) : "-", icon: Target },
        { label: "Précision IA", value: scoringStats ? `${scoringStats.accuracy}%` : "-", icon: CircleCheck },
        { label: "Temps Traitement", value: scoringStats?.averageTime ?? "-", icon: Zap },
    ]

    const displayedCriteria = criteria.length > 0
        ? criteria
        : [
            { name: "Compétences Techniques", weight: 30, score: 82, maxScore: 100 },
            { name: "Expérience Professionnelle", weight: 25, score: 78, maxScore: 100 },
            { name: "Formation & Certifications", weight: 20, score: 88, maxScore: 100 },
            { name: "Soft Skills", weight: 15, score: 75, maxScore: 100 },
            { name: "Présentation CV", weight: 10, score: 91, maxScore: 100 },
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
                <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Scoring IA Avancé</h1>
                <p className="mt-1 text-[14px] text-[#7f8797]">
                    Algorithmes d'évaluation et scoring intelligent des profils candidats
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 flex items-center gap-2 text-[30px] font-semibold text-[#242a38]">
                            <Target className="h-4 w-4" />
                            Critères de Scoring
                        </h2>

                        <div className="space-y-3">
                            {displayedCriteria.map((row) => (
                                <div key={row.name} className="space-y-1">
                                    <div className="flex items-center justify-between text-[12px]">
                                        <span className="text-[#3f4657]">{row.name}</span>
                                        <div className="flex items-center gap-3 text-[#8b92a3]">
                                            <span>Poids: {row.weight}%</span>
                                            <span className="text-[#4a5162]">{row.score}/{row.maxScore}</span>
                                        </div>
                                    </div>
                                    <Progress
                                        value={(row.score / row.maxScore) * 100}
                                        className="h-2 bg-[#ebeff8] [&_[data-slot=progress-indicator]]:bg-[#3f7fe8]"
                                    />
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => setIsWeightsOpen(true)}
                            className="mt-5 h-9 w-full rounded-lg border-[#eceff5] bg-[#f8f9fc] text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]"
                        >
                            <Settings className="h-3.5 w-3.5" />
                            Ajuster les Pondérations
                        </Button>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 flex items-center gap-2 text-[30px] font-semibold text-[#242a38]">
                            <TrendingUp className="h-4 w-4" />
                            Performance Algorithme
                        </h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="flex items-center gap-1 text-[12px] font-semibold text-[#24b36f]">
                                    <CircleCheck className="h-3.5 w-3.5" />
                                    Précision
                                </p>
                                <p className="mt-1 text-[34px] font-semibold leading-none text-[#232a38]">
                                    {performance ? `${performance.precision}%` : "-"}
                                </p>
                                <p className="mt-1 text-[10px] text-[#8a92a3]">F1 Score: {performance?.f1Score ?? "-"}</p>
                            </div>
                            <div>
                                <p className="flex items-center gap-1 text-[12px] font-semibold text-[#f0a04b]">
                                    <TriangleAlert className="h-3.5 w-3.5" />
                                    Rappel
                                </p>
                                <p className="mt-1 text-[34px] font-semibold leading-none text-[#232a38]">
                                    {performance ? `${performance.recall}%` : "-"}
                                </p>
                                <p className="mt-1 text-[10px] text-[#8a92a3]">Taux de détection</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[28px] font-semibold text-[#242a38]">Analyses Récentes</h2>

                    {recentAnalyses.length === 0 ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucune analyse récente.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentAnalyses.map((row) => (
                                <div key={row.id} className="rounded-[10px] border border-[#e7ebf3] bg-white px-4 py-3">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <p className="text-[12px] font-medium text-[#252c3b]">{row.candidateName}</p>
                                            <p className="text-[11px] text-[#7f8797]">{row.position}</p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <p className="text-[31px] font-semibold text-[#232a38]">{row.overallScore}/100</p>
                                            <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${row.status === "COMPLETED" ? "bg-[#2f80ed] text-white" : "bg-[#edf0f6] text-[#3d4354]"}`}>
                                                {row.status === "COMPLETED" ? "Terminé" : "En cours"}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleOpenDetail(row)}
                                                className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]"
                                            >
                                                Voir Détail
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t border-[#edf0f6] pt-2">
                                        <p className="text-[10px] text-[#8a92a3]">
                                            Analysé le {new Date(row.analysisDate).toLocaleDateString("fr-FR")}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleGenerateReport(row)}
                                            className="h-7 rounded-md px-2 text-[11px] text-[#4d5567] hover:bg-[#f5f7fc]"
                                        >
                                            Générer Rapport
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ScoringWeightsModal
                isOpen={isWeightsOpen}
                onClose={() => setIsWeightsOpen(false)}
                criteria={displayedCriteria}
                onSaved={load}
            />

            <DetailModal
                isOpen={detailResult !== null}
                onClose={() => setDetailResult(null)}
                title={detailResult?.candidateName ?? ""}
                subtitle={detailResult?.position}
                fields={
                    detailResult
                        ? [
                            { label: "Score global", value: `${detailResult.overallScore}/100` },
                            {
                                label: "Statut",
                                value: detailResult.status === "COMPLETED" ? "Terminé" : "En cours",
                            },
                            { label: "Email", value: detailResult.candidateEmail },
                            {
                                label: "Analysé le",
                                value: new Date(detailResult.analysisDate).toLocaleDateString("fr-FR"),
                            },
                            {
                                label: "Détail par critère",
                                value: Array.isArray(detailResult.criteria)
                                    ? (detailResult.criteria as Array<{ name?: string; score?: number; maxScore?: number }>)
                                        .map((c) => `${c.name ?? "-"} : ${c.score ?? 0}/${c.maxScore ?? 100}`)
                                        .join(" — ") || "-"
                                    : "-",
                                full: true,
                            },
                        ]
                        : []
                }
                footer={
                    detailResult ? (
                        <Button variant="outline" onClick={() => handleGenerateReport(detailResult)}>
                            Générer le rapport
                        </Button>
                    ) : null
                }
            />
        </div>
    )
}
