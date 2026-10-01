"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import {
    ArrowUpFromLine,
    FileText,
    Sparkles,
    BarChart3,
    Brain,
    Award,
    ClipboardList,
    Upload,
    Layers3,
    Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { DetailModal } from "@/components/modals/detail-modal"
import { exportToPDF } from "@/lib/export-utils"
import { cvService } from "@/lib/services/cv.service"
import type { ICVAnalysis } from "@/lib/@types/entities"

const SECTION_SCORES = [
    { label: "En-tête & Contact", value: 85 },
    { label: "Expérience Professionnelle", value: 87 },
    { label: "Compétences", value: 82 },
    { label: "Formation", value: 80 },
]

function initials(name: string) {
    return name.split(/[\s.\-_]/).map((p) => p[0]).filter(Boolean).join("").toUpperCase().slice(0, 2)
}

function baseName(fileName: string | null | undefined) {
    return (fileName ?? "").replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")
}

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    } catch { return iso }
}

export default function Page() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const batchInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [detailAnalysis, setDetailAnalysis] = useState<ICVAnalysis | null>(null)
    const [cvStats, setCvStats] = useState<{ totalAnalyzed: number; averageScore: number; completed: number; analyzing: number; failed: number } | null>(null)
    const [recentList, setRecentList] = useState<ICVAnalysis[]>([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        try {
            const [statsRes, recentRes] = await Promise.all([
                cvService.getStats(),
                cvService.getRecentAnalyses({ limit: 5 }),
            ])
            setCvStats((statsRes as any)?.data ?? statsRes)
            const items = (recentRes as any)?.data ?? recentRes ?? []
            // Les analyses journalisées depuis le site public peuvent n'avoir
            // aucune recommandation (null côté API) : on normalise ici.
            setRecentList(
                (Array.isArray(items) ? items : []).map((item: ICVAnalysis) => ({
                    ...item,
                    fileName: item.fileName ?? "",
                    recommendations: Array.isArray(item.recommendations) ? item.recommendations : [],
                })),
            )
        } catch (err) {
            console.error("[analyze-ai] load error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    /** Le backend lit le fichier sous la clé `cv` d'un envoi multipart. */
    const analyzeOne = async (file: File) => {
        const formData = new FormData()
        formData.append("cv", file)
        await cvService.analyzeCV(formData)
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        setIsUploading(true)
        try {
            await analyzeOne(file)
            toast.success(`${file.name} analysé`)
            await load()
        } catch (error) {
            console.error("Erreur lors de l'analyse:", error)
            toast.error("Analyse impossible")
        } finally {
            setIsUploading(false)
            event.target.value = ""
        }
    }

    const handleBatchUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])
        if (files.length === 0) return

        setIsUploading(true)
        let done = 0
        const failed: string[] = []
        for (const file of files) {
            try {
                await analyzeOne(file)
                done += 1
            } catch (error) {
                console.error("[analyze-ai] batch error:", error)
                failed.push(file.name)
            }
        }
        setIsUploading(false)
        event.target.value = ""

        if (done > 0) toast.success(`${done} CV analysé(s)`)
        if (failed.length > 0) toast.error(`Échec : ${failed.join(", ")}`)
        await load()
    }

    const handleReport = async (analysis: ICVAnalysis | undefined) => {
        if (!analysis) {
            toast.error("Aucune analyse à exporter")
            return
        }
        await exportToPDF(
            [
                {
                    Fichier: analysis.fileName,
                    Score: `${analysis.analysisScore}%`,
                    Statut: analysis.status === "COMPLETED" ? "Complète" : "En cours",
                    "Analysé le": formatDate(String(analysis.uploadDate)),
                    Recommandations: (analysis.recommendations ?? []).join(" | ") || "-",
                },
            ],
            `analyse-cv-${baseName(analysis.fileName).replace(/\s+/g, "-").toLowerCase()}`,
            `Rapport d'analyse — ${baseName(analysis.fileName)}`,
        )
        toast.success("Rapport prêt à imprimer / enregistrer en PDF")
    }

    const totalAnalyzed = cvStats?.totalAnalyzed ?? 0
    const avgScore = cvStats?.averageScore ?? 0
    const successRate = totalAnalyzed > 0 && cvStats ? Math.round((cvStats.completed / totalAnalyzed) * 100) : 0

    const kpiCards = [
        {
            label: "CV Analysés",
            value: loading ? "-" : totalAnalyzed.toLocaleString(),
            note: "Ce mois",
            growth: "",
            icon: FileText,
            iconClass: "bg-[#8e5df5]",
            borderClass: "border-[#dcd4ff]",
        },
        {
            label: "Score Moyen",
            value: loading ? "-" : `${avgScore}%`,
            note: "Performance globale",
            growth: "",
            icon: Award,
            iconClass: "bg-[#27c48f]",
            borderClass: "border-[#a9ebcf]",
        },
        {
            label: "Taux de Réussite",
            value: loading ? "-" : `${successRate}%`,
            note: "Analyses réussies",
            growth: "",
            icon: BarChart3,
            iconClass: "bg-[#4c8df6]",
            borderClass: "border-[#c8d9ff]",
        },
        {
            label: "En cours d'analyse",
            value: loading ? "-" : String(cvStats?.analyzing ?? 0),
            note: "Traitement en cours",
            growth: "",
            icon: Sparkles,
            iconClass: "bg-[#f0a04b]",
            borderClass: "border-[#ffd6ad]",
        },
    ]

    const lastCV = recentList[0]

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Analyse IA des CV</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">Analyse et évalue les CV avec l'intelligence artificielle</p>
                </div>
                <Button
                    className="mt-1 h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    Nouvelle Analyse
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {kpiCards.map((stat) => (
                    <KpiCard key={stat.label} {...stat} />
                ))}
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <div className="rounded-[10px] border-2 border-dashed border-[#d9cdfd] bg-[#fbf9ff] px-4 py-16 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2f6ff0] text-white shadow-sm">
                            <ArrowUpFromLine className="h-6 w-6" />
                        </div>
                        <h2 className="text-[18px] font-semibold text-[#232939]">Analyser un nouveau CV</h2>
                        <p className="mt-2 text-[12px] text-[#7f8797]">
                            Glisse-dépose un fichier PDF ou Word, ou clique pour sélectionner
                        </p>
                        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="h-9 rounded-full bg-[#2f6ff0] px-5 text-[12px] font-semibold text-white hover:bg-[#1f5be2]"
                            >
                                <Upload className="h-3.5 w-3.5" />
                                {isUploading ? "Analyse en cours..." : "Sélectionner un fichier"}
                            </Button>
                            <input
                                ref={batchInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                multiple
                                className="hidden"
                                onChange={handleBatchUpload}
                            />
                            <Button
                                variant="outline"
                                onClick={() => batchInputRef.current?.click()}
                                disabled={isUploading}
                                className="h-9 rounded-full border-[#e4e7f0] bg-white px-5 text-[12px] text-[#4c5466] hover:bg-[#f5f7fc]"
                            >
                                Analyser par lot
                            </Button>
                        </div>
                        <p className="mt-4 text-[11px] text-[#8a92a3]">Formats acceptés: PDF, DOC, DOCX - Taille max: 10MB</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-[#242a38]">
                            <Brain className="h-4 w-4 text-[#7a5af8]" />
                            {lastCV ? `Dernier CV Analysé: ${baseName(lastCV.fileName)}` : "Dernier CV Analysé"}
                        </div>

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#242a38]">Score Global</p>
                                        <p className="text-[12px] text-[#7f8797]">Évaluation générale du profil</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[18px] font-semibold text-[#2f6ff0]">{lastCV ? `${lastCV.analysisScore}%` : "-"}</p>
                                        <Progress value={lastCV?.analysisScore ?? 0} className="mt-1 h-2 w-24 bg-[#ebeff8]" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="mb-2 text-[12px] font-semibold text-[#24b36f]">
                                            Recommandations ({lastCV?.recommendations?.length ?? 0})
                                        </p>
                                        <ul className="space-y-1 text-[11px] text-[#4a5162]">
                                            {lastCV?.recommendations?.slice(0, 4).map((rec, i) => (
                                                <li key={i}>• {rec}</li>
                                            )) ?? (
                                                <li className="text-[#8a92a3]">Aucune recommandation.</li>
                                            )}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="mb-2 text-[12px] font-semibold text-[#f0a04b]">Score global</p>
                                        <div className="text-[28px] font-semibold text-[#2f6ff0]">
                                            {lastCV ? `${lastCV.analysisScore}%` : "-"}
                                        </div>
                                        <p className="text-[11px] text-[#8a92a3] mt-1">
                                            Statut: {lastCV?.status ?? "-"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <p className="mb-2 text-[12px] font-semibold text-[#242a38]">Analyse par Section</p>
                                    <div className="space-y-2">
                                        {SECTION_SCORES.map((section) => (
                                            <div key={section.label} className="flex items-center justify-between gap-3 text-[11px]">
                                                <span className="w-44 text-[#4a5162]">{section.label}</span>
                                                <Progress value={section.value} className="h-2 flex-1 bg-[#ebeff8]" />
                                                <span className="w-8 text-right text-[#8b92a3]">{section.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start justify-end">
                                <div className="w-full max-w-[220px] rounded-[10px] bg-[#fbfcff] p-4">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[13px] font-semibold text-[#242a38]">Points Clés</p>
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { label: "Présentation", value: "92%", icon: ClipboardList, color: "text-[#2f6ff0]" },
                                                { label: "Structure", value: "89%", icon: Layers3, color: "text-[#27c48f]" },
                                                { label: "Lisibilité", value: "85%", icon: Eye, color: "text-[#f0a04b]" },
                                            ].map((item) => (
                                                <div key={item.label} className="flex items-center justify-between rounded-lg border border-[#eef1f7] bg-white px-3 py-2 text-[11px]">
                                                    <div className="flex items-center gap-2 text-[#4a5162]">
                                                        <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                                                        {item.label}
                                                    </div>
                                                    <span className="font-semibold text-[#2d3443]">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleReport(lastCV)}
                                            className="mt-2 h-9 w-full rounded-lg border-[#e4e7f0] bg-white px-3 text-[11px] text-[#4c5466] hover:bg-[#f5f7fc]"
                                        >
                                            Rapport Complet PDF
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <div className="mb-3 text-[14px] font-semibold text-[#242a38]">Recommandations IA</div>
                        <div className="space-y-3">
                            <RecommendationCard
                                title="Optimisation Immédiate"
                                titleClass="text-[#9b5cf8]"
                                bgClass="bg-[#f6efff]"
                                borderClass="border-[#eadcff]"
                                description="Ajouter des métriques de performance dans la section expérience pour augmenter le score de 12 points."
                            />
                            <RecommendationCard
                                title="Adaptation Sectorielle"
                                titleClass="text-[#26b887]"
                                bgClass="bg-[#eefaf4]"
                                borderClass="border-[#d7f3e6]"
                                description="CV bien adapté pour le secteur marketing digital. Excellente cohérence."
                            />
                            <RecommendationCard
                                title="Suggestion Formation"
                                titleClass="text-[#f0a04b]"
                                bgClass="bg-[#fff6ea]"
                                borderClass="border-[#ffe5c4]"
                                description="Considérer une certification Google Analytics pour renforcer le profil."
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => handleReport(lastCV)}
                            className="mt-4 h-9 w-full rounded-lg border-[#e4e7f0] bg-white px-3 text-[11px] text-[#4c5466] hover:bg-[#f5f7fc]"
                        >
                            <ArrowUpFromLine className="h-3.5 w-3.5" />
                            Rapport Complet PDF
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[18px] font-semibold text-[#242a38]">Analyses Récentes</h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : recentList.length === 0 ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucune analyse récente.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentList.map((analysis) => {
                                const name = baseName(analysis.fileName)
                                const isCompleted = analysis.status === "COMPLETED"
                                return (
                                    <div
                                        key={analysis.id}
                                        className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5f55ff] text-[11px] font-semibold text-white">
                                                {initials(name)}
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-medium text-[#252c3b]">{name}</p>
                                                <p className="text-[11px] text-[#7f8797]">{analysis.fileName}</p>
                                                <p className="text-[10px] text-[#a1a7b6]">{formatDate(String(analysis.uploadDate))}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                                            <div className="text-right">
                                                <p className="text-[13px] font-semibold text-[#9b5cf8]">{analysis.analysisScore}%</p>
                                                <p className="text-[10px] text-[#8a92a3]">Score</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[13px] font-semibold text-[#24b36f]">{analysis.recommendations?.length ?? 0}</p>
                                                <p className="text-[10px] text-[#8a92a3]">Recommandations</p>
                                            </div>
                                            <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${isCompleted ? "bg-[#24bf7e] text-white" : "bg-[#edf0f6] text-[#3d4354]"}`}>
                                                {isCompleted ? "Complète" : "En cours"}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                onClick={() => setDetailAnalysis(analysis)}
                                                className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]"
                                            >
                                                Détails
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <DetailModal
                isOpen={detailAnalysis !== null}
                onClose={() => setDetailAnalysis(null)}
                title={detailAnalysis ? baseName(detailAnalysis.fileName) : ""}
                subtitle={detailAnalysis?.fileName}
                fields={
                    detailAnalysis
                        ? [
                            { label: "Score", value: `${detailAnalysis.analysisScore}%` },
                            {
                                label: "Statut",
                                value: detailAnalysis.status === "COMPLETED" ? "Complète" : "En cours",
                            },
                            { label: "Fichier", value: detailAnalysis.fileName },
                            { label: "Analysé le", value: formatDate(String(detailAnalysis.uploadDate)) },
                            {
                                label: `Recommandations (${detailAnalysis.recommendations?.length ?? 0})`,
                                value:
                                    (detailAnalysis.recommendations ?? []).length > 0 ? (
                                        <ul className="space-y-1">
                                            {(detailAnalysis.recommendations ?? []).map((rec, i) => (
                                                <li key={i}>• {rec}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        "-"
                                    ),
                                full: true,
                            },
                        ]
                        : []
                }
                footer={
                    detailAnalysis ? (
                        <>
                            <Button variant="outline" onClick={() => handleReport(detailAnalysis)}>
                                Rapport PDF
                            </Button>
                            <Button
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                    if (!window.confirm(`Supprimer l'analyse de ${detailAnalysis.fileName} ?`)) return
                                    try {
                                        await cvService.deleteAnalysis(detailAnalysis.id)
                                        toast.success("Analyse supprimée")
                                        setDetailAnalysis(null)
                                        await load()
                                    } catch (err) {
                                        console.error("[analyze-ai] delete error:", err)
                                        toast.error("Suppression impossible")
                                    }
                                }}
                            >
                                Supprimer
                            </Button>
                        </>
                    ) : null
                }
            />
        </div>
    )
}

type KpiCardProps = {
    label: string; value: string; note: string; growth: string
    icon: React.ComponentType<{ className?: string }>; iconClass: string; borderClass: string
}
function KpiCard({ label, value, note, growth, icon: Icon, iconClass, borderClass }: KpiCardProps) {
    return (
        <Card className={`rounded-[10px] border bg-white py-0 shadow-none ${borderClass}`}>
            <CardContent className="flex items-start justify-between px-4 py-4">
                <div>
                    <p className="text-[11px] text-[#8b92a3]">{label}</p>
                    <p className="mt-3 text-[35px] leading-none font-semibold text-[#232a38]">{value}</p>
                    <p className="mt-1 text-[10px] text-[#8b92a3]">{note}</p>
                    <p className="mt-1 text-[10px] text-[#23b26f]">{growth}</p>
                </div>
                <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardContent>
        </Card>
    )
}

type RecommendationCardProps = { title: string; description: string; titleClass: string; bgClass: string; borderClass: string }
function RecommendationCard({ title, description, titleClass, bgClass, borderClass }: RecommendationCardProps) {
    return (
        <div className={`rounded-[10px] border px-3 py-3 ${bgClass} ${borderClass}`}>
            <p className={`text-[12px] font-semibold ${titleClass}`}>{title}</p>
            <p className="mt-1 text-[11px] text-[#6c7383]">{description}</p>
        </div>
    )
}
