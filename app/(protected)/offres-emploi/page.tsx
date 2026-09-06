"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
    Briefcase,
    Calendar,
    Eye,
    Filter,
    MapPin,
    Plus,
    Search,
    Users,
    TrendingUp,
    Building2,
    CircleAlert,
    Workflow,
    Sparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FilterMenu, PERIOD_OPTIONS, matchesPeriod, optionsFrom } from "@/components/ui/filter-menu"
import { AddJobModal } from "@/components/modals/add-job-modal"
import { DetailModal } from "@/components/modals/detail-modal"
import { jobService } from "@/lib/services/job.service"
import type { IJobOffer } from "@/lib/@types/entities"
import { JobStatus } from "@/lib/@types/enums"

const STATUS_CLASSES: Record<JobStatus, string> = {
    [JobStatus.ACTIVE]: "bg-[#24bf7e] text-white",
    [JobStatus.CLOSED]: "bg-[#ff5a5a] text-white",
    [JobStatus.DRAFT]: "bg-[#f4f5f8] text-[#4a5162]",
}

const STATUS_LABELS: Record<JobStatus, string> = {
    [JobStatus.ACTIVE]: "Active",
    [JobStatus.CLOSED]: "Fermée",
    [JobStatus.DRAFT]: "Brouillon",
}

const BAR_COLORS = ["bg-[#6366f1]", "bg-[#6366f1]", "bg-[#27c48f]", "bg-[#ef9435]", "bg-[#2b78f6]"]

export default function Page() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState("all")
    const [locationFilter, setLocationFilter] = useState("all")
    const [periodFilter, setPeriodFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [detailJob, setDetailJob] = useState<IJobOffer | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [jobs, setJobs] = useState<IJobOffer[]>([])
    const [sectors, setSectors] = useState<Array<{ name: string; count: number; percentage: number }>>([])
    const [jobStats, setJobStats] = useState<{
        total: number
        active: number
        closed: number
        draft: number
        totalApplicants: number
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const jobListRef = useRef<HTMLDivElement>(null)

    const loadData = async () => {
        try {
            const [statsRes, sectorsRes, listRes] = await Promise.all([
                jobService.getStats(),
                jobService.getSectorDistribution(),
                jobService.getJobs({ page: 1, limit: 20 }),
            ])
            setJobStats((statsRes as any)?.data ?? statsRes)
            const sectorsPayload = (sectorsRes as any)?.data ?? sectorsRes
            setSectors(Array.isArray(sectorsPayload) ? sectorsPayload : [])
            const items = (listRes as any)?.data ?? listRes
            setJobs(Array.isArray(items) ? items : [])
        } catch (err) {
            console.error("[offres-emploi] load error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // Lien « Voir ses offres » depuis la fiche entreprise.
        const company = new URLSearchParams(window.location.search).get("entreprise")
        if (company) setSearchTerm(company)
    }, [])

    const typeOptions = useMemo(() => optionsFrom(jobs, (job) => job.type, "Tous les contrats"), [jobs])
    const locationOptions = useMemo(
        () => optionsFrom(jobs, (job) => job.location, "Toutes les localisations"),
        [jobs],
    )

    const filteredJobs = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase()
        return jobs.filter((job) => {
            const matchesSearch =
                !normalized ||
                [job.title, job.company?.name ?? "", job.location].some((v) =>
                    v.toLowerCase().includes(normalized),
                )
            const matchesType = typeFilter === "all" || job.type === typeFilter
            const matchesLocation = locationFilter === "all" || job.location === locationFilter
            const matchesStatus = statusFilter === "all" || job.status === statusFilter
            return (
                matchesSearch &&
                matchesType &&
                matchesLocation &&
                matchesStatus &&
                matchesPeriod(job.publishDate, periodFilter)
            )
        })
    }, [searchTerm, typeFilter, locationFilter, periodFilter, statusFilter, jobs])

    /** « Offres Expirantes » : bascule la liste sur les annonces fermées. */
    const showExpiringJobs = () => {
        setStatusFilter(JobStatus.CLOSED)
        setSearchTerm("")
        setTypeFilter("all")
        setLocationFilter("all")
        setPeriodFilter("all")
        jobListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        toast.info("Filtre appliqué : offres fermées")
    }

    const managementActions = [
        { label: "Créer une Nouvelle Offre", run: () => setIsAddModalOpen(true) },
        { label: "Offres Expirantes", run: showExpiringJobs },
        { label: "Rapport de Performance", run: () => router.push("/analytics") },
        { label: "Gérer les Candidatures", run: () => router.push("/candidatures") },
    ]

    const handleAddJob = async () => {
        setIsAddModalOpen(false)
        toast.success("Offre enregistrée")
        await loadData()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
            </div>
        )
    }

    const maxSectorCount = Math.max(...sectors.map((s) => s.count), 1)

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Offres d'Emploi</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">Gère toutes les annonces d'emploi sur la plateforme</p>
                </div>

                <Button
                    className="mt-1 h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus className="h-3.5 w-3.5" />
                    Nouvelle Offre
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Offres Actives"
                    value={jobStats ? String(jobStats.active) : "-"}
                    subtitle="Annonces publiées"
                    note="+5% par rapport au mois dernier"
                    borderClass="border-[#f0b475]"
                    iconClass="bg-[#ee9b3b]"
                    icon={Briefcase}
                />
                <KpiCard
                    title="Candidatures Totales"
                    value={jobStats ? jobStats.totalApplicants.toLocaleString("fr-FR") : "-"}
                    subtitle="Ce mois"
                    note="+18% par rapport au mois dernier"
                    borderClass="border-[#a777ff]"
                    iconClass="bg-[#8550e9]"
                    icon={Users}
                />
                <KpiCard
                    title="Total Offres"
                    value={jobStats ? jobStats.total.toLocaleString("fr-FR") : "-"}
                    subtitle="Toutes catégories"
                    note="+12% par rapport au mois dernier"
                    borderClass="border-[#55d5ac]"
                    iconClass="bg-[#2db77f]"
                    icon={TrendingUp}
                />
                <KpiCard
                    title="Brouillons"
                    value={jobStats ? String(jobStats.draft) : "-"}
                    subtitle="En attente de publication"
                    note="+8% par rapport au mois dernier"
                    borderClass="border-[#d9dce6]"
                    iconClass="bg-[#4a89ef]"
                    icon={Building2}
                />
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f96a7]" />
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Rechercher par titre, entreprise, localisation..."
                                className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] pl-9 text-[12px] text-[#313847] shadow-none"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <FilterMenu
                                label="Type de contrat"
                                icon={Filter}
                                value={typeFilter}
                                options={typeOptions}
                                onChange={setTypeFilter}
                            />
                            <FilterMenu
                                label="Localisation"
                                icon={MapPin}
                                value={locationFilter}
                                options={locationOptions}
                                onChange={setLocationFilter}
                            />
                            <FilterMenu
                                label="Date de publication"
                                icon={Calendar}
                                value={periodFilter}
                                options={PERIOD_OPTIONS}
                                onChange={setPeriodFilter}
                                align="end"
                            />
                            <FilterMenu
                                label="Statut"
                                value={statusFilter}
                                options={[
                                    { value: "all", label: "Tous les statuts" },
                                    { value: JobStatus.ACTIVE, label: "Active" },
                                    { value: JobStatus.CLOSED, label: "Fermée" },
                                    { value: JobStatus.DRAFT, label: "Brouillon" },
                                ]}
                                onChange={setStatusFilter}
                                align="end"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card ref={jobListRef} className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[24px] font-semibold text-[#242a38]">Liste des Offres d'Emploi</h2>

                    {filteredJobs.length === 0 ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucune offre trouvée.</p>
                    ) : (
                        <div className="space-y-3">
                            {filteredJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-white">
                                            <Briefcase className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-medium text-[#252c3b]">{job.title}</p>
                                            <p className="text-[11px] text-[#7f8797]">{job.company?.name ?? "-"}</p>
                                            <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8a92a3]">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {job.location}
                                                </span>
                                                <Badge className="rounded-full border-0 bg-[#f1f3f7] px-2 py-0.5 text-[10px] text-[#202737]">
                                                    {job.type}
                                                </Badge>
                                                <span className="text-[#24b36f]">{job.salary}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                                        <div className="text-right">
                                            <p className="text-[13px] font-semibold text-[#2b78f6]">{job.applicants}</p>
                                            <p className="text-[10px] text-[#8a92a3]">Candidatures</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] text-[#4a5162]">
                                                {new Date(job.publishDate).toLocaleDateString("fr-FR")}
                                            </p>
                                            <p className="text-[10px] text-[#8a92a3]">Publié le</p>
                                        </div>
                                        <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${STATUS_CLASSES[job.status] ?? ""}`}>
                                            {STATUS_LABELS[job.status] ?? job.status}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]"
                                            onClick={() => setDetailJob(job)}
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 text-[24px] font-semibold text-[#242a38]">Statistiques par Secteur</h2>
                        {sectors.length === 0 ? (
                            <p className="text-[12px] text-[#8a92a3]">Aucune donnée disponible.</p>
                        ) : (
                            <div className="space-y-3">
                                {sectors.slice(0, 6).map((item, i) => (
                                    <div key={item.name} className="flex items-center justify-between gap-4">
                                        <span className="w-28 text-[12px] text-[#2a3140]">{item.name}</span>
                                        <div className="flex flex-1 items-center justify-end gap-3">
                                            <div
                                                className={`h-1.5 rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                                                style={{ width: `${Math.round((item.count / maxSectorCount) * 80)}px` }}
                                            />
                                            <span className="w-10 text-right text-[11px] text-[#6c7588]">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 text-[24px] font-semibold text-[#242a38]">Actions de Gestion</h2>
                        <div className="space-y-2">
                            {managementActions.map((action) => (
                                <Button
                                    key={action.label}
                                    variant="outline"
                                    onClick={action.run}
                                    className="h-9 w-full justify-start rounded-lg border-[#eceff5] bg-[#f8f9fc] px-3 text-[12px] text-[#41495a] hover:bg-[#f1f4fa]"
                                >
                                    <Workflow className="h-3.5 w-3.5" />
                                    {action.label}
                                </Button>
                            ))}
                            <Button
                                onClick={() => router.push("/matching-ai")}
                                className="h-9 w-full justify-start rounded-lg border border-[#2f80ed] bg-white px-3 text-[12px] text-[#2f80ed] hover:bg-[#eef5ff]"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                Matching IA Automatique
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[10px] border border-[#f6d7b8] bg-[#fff9f2] py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <div className="flex items-start gap-2">
                        <CircleAlert className="mt-0.5 h-4 w-4 text-[#f0a04b]" />
                        <div>
                            <p className="text-[13px] font-semibold text-[#f0a04b]">Offres Urgentes</p>
                            <p className="mt-1 text-[11px] text-[#8a7b69]">
                                {jobStats?.closed ?? 0} offres fermées. Contacte les entreprises pour renouveler ou prolonger.
                            </p>
                            <Button
                                variant="outline"
                                onClick={showExpiringJobs}
                                className="mt-2 h-7 rounded-full border-[#f0c28e] bg-white px-3 text-[10px] text-[#cb7b1b] hover:bg-[#fff5e8]"
                            >
                                Voir les Offres Expirantes
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AddJobModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddJob} />

            <DetailModal
                isOpen={detailJob !== null}
                onClose={() => setDetailJob(null)}
                title={detailJob?.title ?? ""}
                subtitle={detailJob?.company?.name ?? undefined}
                fields={
                    detailJob
                        ? [
                            { label: "Statut", value: STATUS_LABELS[detailJob.status] ?? detailJob.status },
                            { label: "Type de contrat", value: detailJob.type },
                            { label: "Expérience", value: detailJob.experience },
                            { label: "Localisation", value: detailJob.location },
                            { label: "Salaire", value: detailJob.salary },
                            { label: "Candidatures", value: detailJob.applicants },
                            {
                                label: "Publiée le",
                                value: new Date(detailJob.publishDate).toLocaleDateString("fr-FR"),
                            },
                            {
                                label: "Clôture",
                                value: detailJob.endDate
                                    ? new Date(detailJob.endDate).toLocaleDateString("fr-FR")
                                    : "-",
                            },
                            { label: "Description", value: detailJob.description, full: true },
                            {
                                label: "Prérequis",
                                value: (detailJob.requirements ?? []).join(", ") || "-",
                                full: true,
                            },
                            { label: "Avantages", value: detailJob.benefits || "-", full: true },
                        ]
                        : []
                }
                footer={
                    detailJob ? (
                        <Button variant="outline" onClick={() => router.push("/candidatures")}>
                            Voir les candidatures
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
    subtitle: string
    note: string
    borderClass: string
    iconClass: string
    icon: React.ComponentType<{ className?: string }>
}

function KpiCard({ title, value, subtitle, note, borderClass, iconClass, icon: Icon }: KpiCardProps) {
    return (
        <Card className={`rounded-[10px] border bg-white py-0 shadow-none ${borderClass}`}>
            <CardContent className="flex items-start justify-between px-4 py-4">
                <div>
                    <p className="text-[11px] text-[#8b92a3]">{title}</p>
                    <p className="mt-3 text-[35px] leading-none font-semibold text-[#232a38]">{value}</p>
                    <p className="mt-1 text-[10px] text-[#8b92a3]">{subtitle}</p>
                    <p className="mt-1 text-[10px] text-[#23b26f]">{note}</p>
                </div>
                <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardContent>
        </Card>
    )
}
