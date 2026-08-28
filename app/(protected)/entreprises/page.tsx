"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Briefcase,
    Building2,
    Eye,
    Filter,
    MapPin,
    Plus,
    Search,
    TrendingUp,
    Users,
    Workflow,
    ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AddCompanyModal } from "@/components/modals/add-company-modal"
import { companyService } from "@/lib/services/company.service"
import type { ICompany } from "@/lib/@types/entities"

const BAR_COLORS = ["bg-[#635bff]", "bg-[#29c587]", "bg-[#635bff]", "bg-[#ef9435]", "bg-[#2b78f6]"]

export default function EntreprisesPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [companies, setCompanies] = useState<ICompany[]>([])
    const [sectors, setSectors] = useState<Array<{ name: string; count: number; percentage: number }>>([])
    const [stats, setStats] = useState<{ total: number; active: number; inactive: number; newThisMonth: number } | null>(null)
    const [loading, setLoading] = useState(true)

    const loadData = async () => {
        try {
            const [statsRes, sectorsRes, listRes] = await Promise.all([
                companyService.getStats(),
                companyService.getSectorDistribution(),
                companyService.getCompanies({ page: 1, limit: 20 }),
            ])
            setStats((statsRes as any)?.data ?? statsRes)
            const sectorsPayload = (sectorsRes as any)?.data ?? sectorsRes
            setSectors(Array.isArray(sectorsPayload) ? sectorsPayload : [])
            const items = (listRes as any)?.data ?? listRes
            setCompanies(Array.isArray(items) ? items : [])
        } catch (err) {
            console.error("[entreprises] load error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredCompanies = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase()
        if (!normalized) return companies
        return companies.filter((c) =>
            [c.name, c.email ?? "", c.sector, c.location ?? ""].some((v) =>
                v.toLowerCase().includes(normalized)
            )
        )
    }, [searchTerm, companies])

    const handleAddCompany = async () => {
        setIsAddModalOpen(false)
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
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Entreprises Partenaires</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">Gère les comptes des entreprises recruteuses</p>
                </div>

                <Button
                    className="mt-1 h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus className="h-3.5 w-3.5" />
                    Nouvelle Entreprise
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Total Entreprises"
                    value={stats ? stats.total.toLocaleString("fr-FR") : "-"}
                    note="+8% par rapport au mois dernier"
                    noteClass="text-[#23b26f]"
                    icon={Building2}
                    borderClass="border-[#d9dce6]"
                    iconBoxClass="bg-[#4a89ef]"
                />
                <KpiCard
                    title="Actives"
                    value={stats ? String(stats.active) : "-"}
                    note="+12% par rapport au mois dernier"
                    noteClass="text-[#23b26f]"
                    icon={TrendingUp}
                    borderClass="border-[#55d5ac]"
                    iconBoxClass="bg-[#2db77f]"
                />
                <KpiCard
                    title="Inactives"
                    value={stats ? String(stats.inactive) : "-"}
                    note="+5% par rapport au mois dernier"
                    noteClass="text-[#23b26f]"
                    icon={Briefcase}
                    borderClass="border-[#f0b475]"
                    iconBoxClass="bg-[#ee9b3b]"
                />
                <KpiCard
                    title="Nouvelles ce mois"
                    value={stats ? String(stats.newThisMonth) : "-"}
                    note="+18% par rapport au mois dernier"
                    noteClass="text-[#23b26f]"
                    icon={Users}
                    borderClass="border-[#a777ff]"
                    iconBoxClass="bg-[#8550e9]"
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
                                placeholder="Rechercher par nom, secteur, location..."
                                className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] pl-9 text-[12px] text-[#313847] shadow-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="h-10 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-4 text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]">
                                <Filter className="h-3.5 w-3.5" />
                                Secteur
                            </Button>
                            <Button variant="outline" className="h-10 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-4 text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]">
                                <MapPin className="h-3.5 w-3.5" />
                                Location
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 text-[24px] font-semibold text-[#242a38]">Répartition par Secteur</h2>
                        {sectors.length === 0 ? (
                            <p className="text-[12px] text-[#8a92a3]">Aucune donnée disponible.</p>
                        ) : (
                            <div className="space-y-3">
                                {sectors.slice(0, 6).map((sector, i) => (
                                    <div key={sector.name} className="flex items-center justify-between gap-4">
                                        <span className="w-28 text-[12px] text-[#2a3140]">{sector.name}</span>
                                        <div className="flex flex-1 items-center justify-end gap-3">
                                            <div
                                                className={`h-1.5 rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                                                style={{ width: `${Math.round((sector.count / maxSectorCount) * 80)}px` }}
                                            />
                                            <span className="w-8 text-right text-[11px] text-[#6c7588]">{sector.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 text-[24px] font-semibold text-[#242a38]">Actions Rapides</h2>
                        <div className="space-y-3">
                            {[
                                "Gérer les Offres d'Emploi",
                                "Rapport de Candidatures",
                                "Statistiques de Performance",
                            ].map((label) => (
                                <Button
                                    key={label}
                                    variant="outline"
                                    className="h-10 w-full justify-start rounded-lg border-[#eceff5] bg-[#f8f9fc] px-3 text-[12px] text-[#41495a] hover:bg-[#f1f4fa]"
                                >
                                    <Workflow className="h-3.5 w-3.5" />
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[24px] font-semibold text-[#242a38]">Liste des Entreprises</h2>

                    {filteredCompanies.length === 0 ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucune entreprise trouvée.</p>
                    ) : (
                        <div className="space-y-3">
                            {filteredCompanies.map((company) => (
                                <div
                                    key={company.id}
                                    className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-white">
                                            {company.logo ? (
                                                <img src={company.logo} alt={company.name} className="h-8 w-8 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = "none" }} />
                                            ) : (
                                                <Building2 className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-[12px] font-medium text-[#252c3b]">{company.name}</p>
                                                <ExternalLink className="h-3 w-3 text-[#50586a]" />
                                            </div>
                                            <p className="text-[11px] text-[#7f8797]">{company.email ?? "-"}</p>
                                            <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8a92a3]">
                                                <Badge className="rounded-full border-0 bg-[#f1f3f7] px-2 py-0.5 text-[10px] font-medium text-[#202737]">
                                                    {company.sector}
                                                </Badge>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {company.location ?? company.headquarters ?? "-"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                                        <div className="text-right">
                                            <p className="text-[13px] font-semibold text-[#ef9435]">-</p>
                                            <p className="text-[10px] text-[#8a92a3]">Offres actives</p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[13px] font-semibold text-[#2b78f6]">-</p>
                                            <p className="text-[10px] text-[#8a92a3]">Candidatures</p>
                                        </div>

                                        <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${company.status === "ACTIVE" ? "bg-[#24bf7e] text-white" : "bg-[#edf0f6] text-[#3d4354]"}`}>
                                            {company.status}
                                        </Badge>

                                        <Button variant="outline" className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]">
                                            <Eye className="h-3.5 w-3.5" />
                                            Voir Profil
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddCompanyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddCompany} />
        </div>
    )
}

type KpiCardProps = {
    title: string
    value: string
    note: string
    noteClass: string
    icon: React.ComponentType<{ className?: string }>
    borderClass: string
    iconBoxClass: string
}

function KpiCard({ title, value, note, noteClass, icon: Icon, borderClass, iconBoxClass }: KpiCardProps) {
    return (
        <Card className={`rounded-[10px] border bg-white py-0 shadow-none ${borderClass}`}>
            <CardContent className="flex items-start justify-between px-4 py-4">
                <div>
                    <p className="text-[11px] text-[#8b92a3]">{title}</p>
                    <p className="mt-3 text-[35px] leading-none font-semibold text-[#232a38]">{value}</p>
                    <p className={`mt-2 text-[10px] ${noteClass}`}>{note}</p>
                </div>
                <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-lg ${iconBoxClass}`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardContent>
        </Card>
    )
}
