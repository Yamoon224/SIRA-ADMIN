"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Clock3,
    FileText,
    Filter,
    Eye,
    MessageSquare,
    Plus,
    Search,
    Sparkles,
    TrendingUp,
    Users,
    Download,
    CheckCircle2,
    Brain,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { candidatureService } from "@/lib/services/candidature.service"
import type { ICandidature } from "@/lib/@types/entities"
import { CandidatureStatus } from "@/lib/@types/enums"

const STATUS_CLASSES: Record<CandidatureStatus, string> = {
    [CandidatureStatus.EN_ATTENTE]: "bg-[#fff3dd] text-[#cb8b25] border-[#cb8b25]",
    [CandidatureStatus.EN_COURS]: "bg-[#e7f0ff] text-[#2f80ed] border-[#2f80ed]",
    [CandidatureStatus.APPROUVEE]: "bg-[#dff7e9] text-[#23b26f] border-[#23b26f]",
    [CandidatureStatus.REJETEE]: "bg-[#ffe7e7] text-[#e84b4b] border-[#e84b4b]",
}

const STATUS_LABELS: Record<CandidatureStatus, string> = {
    [CandidatureStatus.EN_ATTENTE]: "En attente",
    [CandidatureStatus.EN_COURS]: "En cours d'examen",
    [CandidatureStatus.APPROUVEE]: "Approuvé",
    [CandidatureStatus.REJETEE]: "Rejetée",
}

function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

export default function Page() {
    const [searchTerm, setSearchTerm] = useState("")
    const [status, setStatus] = useState("all")
    const [candidates, setCandidates] = useState<ICandidature[]>([])
    const [statsData, setStatsData] = useState<{
        total: number
        enAttente: number
        enCours: number
        approuvees: number
        rejetees: number
    } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, listRes] = await Promise.all([
                    candidatureService.getStats(),
                    candidatureService.getCandidatures({ page: 1, limit: 20 }),
                ])
                setStatsData((statsRes as any)?.data ?? statsRes)
                const items = (listRes as any)?.data ?? listRes
                setCandidates(Array.isArray(items) ? items : [])
            } catch (err) {
                console.error("[candidatures] load error:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const avgScore = candidates.length > 0
        ? `${Math.round(candidates.reduce((s, c) => s + (c.score ?? 0), 0) / candidates.length)}%`
        : "-"

    const tauxConversion = statsData && statsData.total > 0
        ? `${(statsData.approuvees / statsData.total * 100).toFixed(1)}%`
        : "-"

    const metrics = [
        {
            title: statsData ? String(statsData.total) : "-",
            subtitle: "Total candidatures",
            context: "Ce mois",
            growth: "+12%",
            icon: FileText,
            iconClass: "bg-[#edf3ff] text-[#3f7fe8]",
            growthClass: "bg-[#dff7e9] text-[#23b26f]",
        },
        {
            title: statsData ? String(statsData.enAttente) : "-",
            subtitle: "En attente",
            context: "À traiter",
            growth: "+5%",
            icon: Clock3,
            iconClass: "bg-[#f4f5f8] text-[#4a5162]",
            growthClass: "bg-[#fff3dd] text-[#f0a04b]",
        },
        {
            title: statsData ? String(statsData.enCours) : "-",
            subtitle: "En cours d'examen",
            context: "En processus",
            growth: "+18%",
            icon: Users,
            iconClass: "bg-[#edf3ff] text-[#3f7fe8]",
            growthClass: "bg-[#dff7e9] text-[#23b26f]",
        },
        {
            title: statsData ? String(statsData.approuvees) : "-",
            subtitle: "Approuvées",
            context: "Validées",
            growth: "+22%",
            icon: CheckCircle2,
            iconClass: "bg-[#edf3ff] text-[#3f7fe8]",
            growthClass: "bg-[#dff7e9] text-[#23b26f]",
        },
        {
            title: avgScore,
            subtitle: "Score IA moyen",
            context: "Compatibilité",
            growth: "+3%",
            icon: Brain,
            iconClass: "bg-[#edf3ff] text-[#3f7fe8]",
            growthClass: "bg-[#dff7e9] text-[#23b26f]",
        },
        {
            title: tauxConversion,
            subtitle: "Taux de conversion",
            context: "Recrutement",
            growth: "+7%",
            icon: TrendingUp,
            iconClass: "bg-[#edf3ff] text-[#3f7fe8]",
            growthClass: "bg-[#dff7e9] text-[#23b26f]",
        },
    ]

    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        return candidates.filter((c) => {
            const inSearch =
                !term ||
                [c.candidateName, c.candidateEmail, c.jobOffer?.title ?? "", c.jobOffer?.company?.name ?? ""]
                    .join(" ")
                    .toLowerCase()
                    .includes(term)
            const inStatus =
                status === "all" ||
                STATUS_LABELS[c.status].toLowerCase().includes(status)
            return inSearch && inStatus
        })
    }, [searchTerm, status, candidates])

    const handleStatusUpdate = async (id: string, newStatus: CandidatureStatus) => {
        try {
            await candidatureService.updateCandidatureStatus(id, newStatus)
            setCandidates((prev) =>
                prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
            )
        } catch (err) {
            console.error("[candidatures] status update error:", err)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await candidatureService.withdrawCandidature(id)
            setCandidates((prev) => prev.filter((c) => c.id !== id))
        } catch (err) {
            console.error("[candidatures] delete error:", err)
        }
    }

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
                <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Candidatures</h1>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {metrics.map((metric) => (
                    <Card key={metric.subtitle} className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                        <CardContent className="px-4 py-4">
                            <div className="mb-4 flex items-center justify-between">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${metric.iconClass}`}>
                                    <metric.icon className="h-4 w-4" />
                                </div>
                                <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${metric.growthClass}`}>
                                    {metric.growth}
                                </Badge>
                            </div>
                            <p className="text-[37px] font-semibold leading-none text-[#232a38]">{metric.title}</p>
                            <p className="mt-2 text-[14px] font-medium text-[#2f3647]">{metric.subtitle}</p>
                            <p className="text-[12px] text-[#8a92a3]">{metric.context}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f96a7]" />
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Rechercher un candidat..."
                                className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] pl-9 text-[12px] text-[#313847] shadow-none"
                            />
                        </div>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-10 w-full rounded-lg border-[#eceff5] bg-[#f8f9fc] text-[12px] text-[#4d5567] lg:w-[130px]">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Statut</SelectItem>
                                <SelectItem value="en cours">En cours</SelectItem>
                                <SelectItem value="attente">En attente</SelectItem>
                                <SelectItem value="approuvé">Approuvé</SelectItem>
                                <SelectItem value="rejetée">Rejetée</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" className="h-10 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-4 text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]">
                            <Filter className="h-3.5 w-3.5" />
                            Filtres
                        </Button>
                        <Button variant="outline" className="h-10 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-4 text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]">
                            <Download className="h-3.5 w-3.5" />
                            Exporter
                        </Button>
                        <Button className="h-10 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]">
                            <Plus className="h-3.5 w-3.5" />
                            Nouvelle candidature
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {filtered.length === 0 && (
                <p className="text-center text-[13px] text-[#8a92a3] py-8">Aucune candidature trouvée.</p>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filtered.map((candidate) => (
                    <Card key={candidate.id} className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                        <CardContent className="px-4 py-4">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f7af5] text-[11px] font-semibold text-white">
                                        {getInitials(candidate.candidateName)}
                                    </div>
                                    <div>
                                        <p className="text-[33px] font-semibold leading-none text-[#232a38]">{candidate.candidateName}</p>
                                        <p className="text-[12px] text-[#7f8797]">{candidate.candidateEmail}</p>
                                    </div>
                                </div>
                                <Badge className={`rounded-full border px-2 py-0.5 text-[10px] ${STATUS_CLASSES[candidate.status] ?? ""}`}>
                                    {STATUS_LABELS[candidate.status] ?? candidate.status}
                                </Badge>
                            </div>

                            <p className="text-[17px] font-medium text-[#2c3343]">{candidate.jobOffer?.title ?? "-"}</p>
                            <p className="text-[14px] text-[#7f8797]">{candidate.jobOffer?.company?.name ?? "-"}</p>

                            <div className="mt-3 flex items-center justify-between text-[12px]">
                                <p className="text-[#7f8797]">
                                    Candidature reçue le{" "}
                                    {new Date(candidate.appliedDate).toLocaleDateString("fr-FR")}
                                </p>
                                <p className="text-[#7f8797]">
                                    Score IA:
                                    <span className="ml-2 rounded-full bg-[#e7f0ff] px-2 py-0.5 text-[10px] font-medium text-[#2f80ed]">
                                        {candidate.score}%
                                    </span>
                                </p>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                                <Button variant="outline" className="h-8 flex-1 rounded-lg border-[#eceff5] bg-[#f8f9fc] text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]">
                                    <Eye className="h-3.5 w-3.5" />
                                    Voir le profil
                                </Button>
                                <Button variant="outline" className="h-8 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-4 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]">
                                    CV
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-4 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]"
                                    onClick={() => handleDelete(candidate.id)}
                                >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Retirer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Button className="hidden" variant="ghost">
                <Sparkles className="h-3.5 w-3.5" />
            </Button>
        </div>
    )
}
