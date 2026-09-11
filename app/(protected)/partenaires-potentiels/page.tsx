"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Building2,
    Filter,
    Mail,
    MailCheck,
    MapPin,
    Megaphone,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    UserCheck,
    Users,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FilterMenu, type FilterOption } from "@/components/ui/filter-menu"
import { DataPagination, DEFAULT_PAGE_SIZE } from "@/components/ui/data-pagination"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { potentialPartnerService } from "@/lib/services/potential-partner.service"
import type { IPotentialPartner } from "@/lib/@types/entities"
import { PotentialPartnerStatus } from "@/lib/@types/enums"

const STATUS_LABELS: Record<string, string> = {
    new: "Nouveau",
    contacted: "Contacté",
    responded: "A répondu",
    interested: "Intéressé",
    not_interested: "Pas intéressé",
    converted: "Converti",
    do_not_contact: "Ne pas contacter",
}

const STATUS_BADGE_CLASS: Record<string, string> = {
    new: "bg-[#f1f3f7] text-[#3d4354]",
    contacted: "bg-[#eaf1ff] text-[#1a5fd9]",
    responded: "bg-[#fff6e0] text-[#9a6b00]",
    interested: "bg-[#e8f9f1] text-[#1f9d64]",
    not_interested: "bg-[#fdeceb] text-[#d64545]",
    converted: "bg-[#0f56d9] text-white",
    do_not_contact: "bg-[#2a3140] text-white",
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))

type FormState = {
    id?: string
    companyName: string
    email: string
    contactName: string
    contactPhone: string
    sector: string
    city: string
    address: string
    notes: string
}

const EMPTY_FORM: FormState = {
    companyName: "",
    email: "",
    contactName: "",
    contactPhone: "",
    sector: "",
    city: "",
    address: "",
    notes: "",
}

export default function PartenairesPotentielsPage() {
    const [partners, setPartners] = useState<IPotentialPartner[]>([])
    const [stats, setStats] = useState<{ total: number; new: number; contacted: number; interested: number; converted: number; withValidEmail: number } | null>(null)
    const [sectorOptions, setSectorOptions] = useState<FilterOption[]>([{ value: "all", label: "Tous les secteurs" }])
    const [cityOptions, setCityOptions] = useState<FilterOption[]>([{ value: "all", label: "Toutes les villes" }])
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState("")
    const [sectorFilter, setSectorFilter] = useState("all")
    const [cityFilter, setCityFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<IPotentialPartner | null>(null)
    const [importing, setImporting] = useState(false)

    const loadList = async () => {
        setLoading(true)
        try {
            const res: any = await potentialPartnerService.getPartners({
                page,
                limit: pageSize,
                search: search || undefined,
                sector: sectorFilter === "all" ? undefined : sectorFilter,
                city: cityFilter === "all" ? undefined : cityFilter,
                status: statusFilter === "all" ? undefined : statusFilter,
            })
            setPartners(Array.isArray(res?.data) ? res.data : [])
            setTotalPages(res?.meta?.totalPages ?? 1)
            setTotal(res?.meta?.total ?? 0)
        } catch (err) {
            console.error("[partenaires-potentiels] load error:", err)
            toast.error("Impossible de charger les partenaires potentiels")
        } finally {
            setLoading(false)
        }
    }

    const loadAsides = async () => {
        try {
            const [statsRes, filtersRes]: any[] = await Promise.all([
                potentialPartnerService.getStats(),
                potentialPartnerService.getFilters(),
            ])
            setStats(statsRes?.data ?? null)
            const sectors: string[] = filtersRes?.data?.sectors ?? []
            const cities: string[] = filtersRes?.data?.cities ?? []
            setSectorOptions([{ value: "all", label: "Tous les secteurs" }, ...sectors.map((s) => ({ value: s, label: s }))])
            setCityOptions([{ value: "all", label: "Toutes les villes" }, ...cities.map((c) => ({ value: c, label: c }))])
        } catch (err) {
            console.error("[partenaires-potentiels] aside load error:", err)
        }
    }

    useEffect(() => {
        loadAsides()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        loadList()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, sectorFilter, cityFilter, statusFilter])

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        loadList()
    }

    const openCreate = () => {
        setForm(EMPTY_FORM)
        setFormOpen(true)
    }

    const openEdit = (partner: IPotentialPartner) => {
        setForm({
            id: partner.id,
            companyName: partner.companyName,
            email: partner.email ?? "",
            contactName: partner.contactName ?? "",
            contactPhone: partner.contactPhone ?? "",
            sector: partner.sector ?? "",
            city: partner.city ?? "",
            address: partner.address ?? "",
            notes: partner.notes ?? "",
        })
        setFormOpen(true)
    }

    const handleSave = async () => {
        if (!form.companyName.trim()) {
            toast.error("Le nom de l'entreprise est requis")
            return
        }
        setSaving(true)
        try {
            const payload = {
                companyName: form.companyName,
                email: form.email || null,
                contactName: form.contactName || null,
                contactPhone: form.contactPhone || null,
                sector: form.sector || null,
                city: form.city || null,
                address: form.address || null,
                notes: form.notes || null,
            }
            if (form.id) {
                await potentialPartnerService.updatePartner(form.id, payload as any)
                toast.success("Fiche mise à jour")
            } else {
                await potentialPartnerService.createPartner(payload as any)
                toast.success("Partenaire potentiel ajouté")
            }
            setFormOpen(false)
            await Promise.all([loadList(), loadAsides()])
        } catch (err) {
            console.error("[partenaires-potentiels] save error:", err)
            toast.error("Échec de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const handleStatusChange = async (partner: IPotentialPartner, status: string) => {
        try {
            await potentialPartnerService.updatePartnerStatus(partner.id, status as PotentialPartnerStatus)
            setPartners((prev) => prev.map((p) => (p.id === partner.id ? { ...p, status: status as PotentialPartnerStatus } : p)))
            await loadAsides()
        } catch (err) {
            console.error("[partenaires-potentiels] status error:", err)
            toast.error("Échec de la mise à jour du statut")
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await potentialPartnerService.deletePartner(deleteTarget.id)
            toast.success("Fiche supprimée")
            setDeleteTarget(null)
            await Promise.all([loadList(), loadAsides()])
        } catch (err) {
            console.error("[partenaires-potentiels] delete error:", err)
            toast.error("Échec de la suppression")
        }
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        setImporting(true)
        try {
            const res: any = await potentialPartnerService.importCsv(file)
            const s = res?.data
            toast.success(`Import terminé : ${s?.inserted ?? 0} créées, ${s?.updated ?? 0} mises à jour, ${s?.skipped ?? 0} ignorées`)
            await Promise.all([loadList(), loadAsides()])
        } catch (err: any) {
            console.error("[partenaires-potentiels] import error:", err)
            toast.error(err?.message || "Échec de l'import CSV")
        } finally {
            setImporting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Potentiels Partenaires</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">Entreprises ciblées pour les campagnes de mailing partenariat</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link href="/partenaires-potentiels/campagnes">
                        <Button variant="outline" className="h-9 rounded-full border-[#d9dce6] px-4 text-[12px] font-semibold text-[#3f4657]">
                            <Megaphone className="h-3.5 w-3.5" />
                            Campagnes de mailing
                        </Button>
                    </Link>
                    <label className="inline-flex">
                        <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} disabled={importing} />
                        <Button asChild variant="outline" className="h-9 cursor-pointer rounded-full border-[#d9dce6] px-4 text-[12px] font-semibold text-[#3f4657]" disabled={importing}>
                            <span>
                                <Upload className="h-3.5 w-3.5" />
                                {importing ? "Import en cours..." : "Importer un CSV"}
                            </span>
                        </Button>
                    </label>
                    <Button
                        className="h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                        onClick={openCreate}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Nouveau partenaire
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard title="Total" value={stats ? stats.total.toLocaleString("fr-FR") : "-"} icon={Building2} iconBoxClass="bg-[#4a89ef]" />
                <KpiCard title="Nouveaux" value={stats ? String(stats.new) : "-"} icon={Users} iconBoxClass="bg-[#8550e9]" />
                <KpiCard title="Intéressés" value={stats ? String(stats.interested) : "-"} icon={UserCheck} iconBoxClass="bg-[#2db77f]" />
                <KpiCard title="Emails valides" value={stats ? stats.withValidEmail.toLocaleString("fr-FR") : "-"} icon={MailCheck} iconBoxClass="bg-[#2b78f6]" />
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f96a7]" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Rechercher par nom, email, contact, NCC..."
                                className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] pl-9 text-[12px] text-[#313847] shadow-none"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <FilterMenu label="Secteur" icon={Filter} value={sectorFilter} options={sectorOptions} onChange={(v) => { setSectorFilter(v); setPage(1) }} />
                            <FilterMenu label="Ville" icon={MapPin} value={cityFilter} options={cityOptions} onChange={(v) => { setCityFilter(v); setPage(1) }} />
                            <FilterMenu label="Statut" icon={Filter} value={statusFilter} options={[{ value: "all", label: "Tous les statuts" }, ...STATUS_OPTIONS]} onChange={(v) => { setStatusFilter(v); setPage(1) }} align="end" />
                        </div>
                        <Button type="submit" className="h-10 rounded-lg bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]">
                            Rechercher
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[24px] font-semibold text-[#242a38]">
                        Liste des partenaires potentiels
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : partners.length === 0 ? (
                        <p className="py-6 text-center text-[13px] text-[#8a92a3]">Aucun partenaire potentiel trouvé.</p>
                    ) : (
                        <div className="space-y-3">
                            {partners.map((partner) => (
                                <div
                                    key={partner.id}
                                    className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-white">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-medium text-[#252c3b]">{partner.companyName}</p>
                                            <p className="flex items-center gap-1 text-[11px] text-[#7f8797]">
                                                <Mail className="h-3 w-3" />
                                                {partner.email ?? "-"}
                                                {partner.email && !partner.emailValid && (
                                                    <span className="ml-1 text-[#d64545]">(format invalide)</span>
                                                )}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#8a92a3]">
                                                {partner.sector && (
                                                    <Badge className="rounded-full border-0 bg-[#f1f3f7] px-2 py-0.5 text-[10px] font-medium text-[#202737]">
                                                        {partner.sector}
                                                    </Badge>
                                                )}
                                                {partner.city && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {partner.city}
                                                    </span>
                                                )}
                                                {partner.companySize && <span>{partner.companySize}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                                        <Select value={partner.status} onValueChange={(v) => handleStatusChange(partner, v)}>
                                            <SelectTrigger className={`h-8 w-[150px] rounded-full border-0 px-3 text-[10px] font-medium ${STATUS_BADGE_CLASS[partner.status] ?? "bg-[#f1f3f7] text-[#3d4354]"}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STATUS_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="outline"
                                            className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]"
                                            onClick={() => openEdit(partner)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-8 rounded-lg border-[#f3d9d9] bg-[#fdf4f4] px-3 text-[11px] text-[#c23c3c] hover:bg-[#fbeaea]"
                                            onClick={() => setDeleteTarget(partner)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <DataPagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        currentCount={partners.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
                        disabled={loading}
                        className="mt-4"
                    />
                </CardContent>
            </Card>

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{form.id ? "Modifier le partenaire" : "Nouveau partenaire potentiel"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label className="text-[12px]">Nom de l'entreprise *</Label>
                            <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-[12px]">Email</Label>
                            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-[12px]">Secteur</Label>
                            <Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-[12px]">Nom du contact</Label>
                            <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-[12px]">Téléphone du contact</Label>
                            <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-[12px]">Ville</Label>
                            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1" />
                        </div>
                        <div className="sm:col-span-2">
                            <Label className="text-[12px]">Adresse</Label>
                            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" />
                        </div>
                        <div className="sm:col-span-2">
                            <Label className="text-[12px]">Notes</Label>
                            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-[#0f56d9] text-white hover:bg-[#0a4cc5]">
                            {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce partenaire potentiel ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La fiche « {deleteTarget?.companyName} » sera définitivement supprimée. Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-[#d64545] hover:bg-[#b93a3a]">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function KpiCard({ title, value, icon: Icon, iconBoxClass }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; iconBoxClass: string }) {
    return (
        <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
            <CardContent className="flex items-start justify-between px-4 py-4">
                <div>
                    <p className="text-[11px] text-[#8b92a3]">{title}</p>
                    <p className="mt-3 text-[30px] leading-none font-semibold text-[#232a38]">{value}</p>
                </div>
                <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-lg ${iconBoxClass}`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardContent>
        </Card>
    )
}
