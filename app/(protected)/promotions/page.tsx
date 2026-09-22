"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Pencil, Plus, Ticket, Trash2, Users2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { DataPagination, DEFAULT_PAGE_SIZE } from "@/components/ui/data-pagination"
import { promoCampaignService } from "@/lib/services/promo-campaign.service"
import type { IPromoCampaign } from "@/lib/@types/entities"
import { PromoCampaignStatus, PromoDiscountType } from "@/lib/@types/enums"

const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Brouillon",
    ACTIVE: "Active",
    PAUSED: "En pause",
    ENDED: "Terminée",
}

const STATUS_BADGE_CLASS: Record<string, string> = {
    DRAFT: "bg-[#f1f3f7] text-[#3d4354]",
    ACTIVE: "bg-[#e8f9f1] text-[#1f9d64]",
    PAUSED: "bg-[#fff6e0] text-[#9a6b00]",
    ENDED: "bg-[#fdeceb] text-[#d64545]",
}

type FormState = {
    id?: string
    name: string
    description: string
    discountType: PromoDiscountType
    discountValue: string
    applicableUserTypes: ("USER" | "ENTREPRISE")[]
    status: PromoCampaignStatus
}

const EMPTY_FORM: FormState = {
    name: "",
    description: "",
    discountType: PromoDiscountType.PERCENTAGE,
    discountValue: "",
    applicableUserTypes: ["USER"],
    status: PromoCampaignStatus.DRAFT,
}

function formatDiscount(campaign: IPromoCampaign): string {
    return campaign.discountType === PromoDiscountType.PERCENTAGE
        ? `-${campaign.discountValue}%`
        : `-${Number(campaign.discountValue).toLocaleString("fr-FR")} FCFA`
}

export default function PromotionsPage() {
    const [campaigns, setCampaigns] = useState<IPromoCampaign[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<IPromoCampaign | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const res: any = await promoCampaignService.getCampaigns({ page, limit: pageSize })
            setCampaigns(Array.isArray(res?.data) ? res.data : [])
            setTotalPages(res?.meta?.totalPages ?? 1)
            setTotal(res?.meta?.total ?? 0)
        } catch (err) {
            console.error("[promotions] load error:", err)
            toast.error("Impossible de charger les campagnes")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize])

    const openCreate = () => {
        setForm(EMPTY_FORM)
        setFormOpen(true)
    }

    const openEdit = (campaign: IPromoCampaign) => {
        setForm({
            id: campaign.id,
            name: campaign.name,
            description: campaign.description ?? "",
            discountType: campaign.discountType,
            discountValue: String(campaign.discountValue),
            applicableUserTypes: campaign.applicableUserTypes,
            status: campaign.status,
        })
        setFormOpen(true)
    }

    const toggleUserType = (type: "USER" | "ENTREPRISE") => {
        setForm((f) => ({
            ...f,
            applicableUserTypes: f.applicableUserTypes.includes(type)
                ? f.applicableUserTypes.filter((t) => t !== type)
                : [...f.applicableUserTypes, type],
        }))
    }

    const handleSave = async () => {
        if (!form.name.trim() || !form.discountValue || form.applicableUserTypes.length === 0) {
            toast.error("Nom, réduction et au moins un type de compte ciblé sont requis")
            return
        }
        setSaving(true)
        try {
            const payload = {
                name: form.name,
                description: form.description || undefined,
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                applicableUserTypes: form.applicableUserTypes,
                status: form.status,
            }
            if (form.id) {
                await promoCampaignService.updateCampaign(form.id, payload)
                toast.success("Campagne mise à jour")
            } else {
                await promoCampaignService.createCampaign(payload)
                toast.success("Campagne créée")
            }
            setFormOpen(false)
            await load()
        } catch (err: any) {
            console.error("[promotions] save error:", err)
            toast.error(err?.message || "Échec de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await promoCampaignService.deleteCampaign(deleteTarget.id)
            toast.success("Campagne supprimée")
            setDeleteTarget(null)
            await load()
        } catch (err: any) {
            console.error("[promotions] delete error:", err)
            toast.error(err?.message || "Échec de la suppression")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Promotions</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">Campagnes de codes promo pour les inscriptions standard et entreprise</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/promotions/influenceurs">
                        <Button variant="outline" className="h-9 rounded-full px-5 text-[12px] font-semibold">
                            <Users2 className="h-3.5 w-3.5" />
                            Influenceurs
                        </Button>
                    </Link>
                    <Button className="h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]" onClick={openCreate}>
                        <Plus className="h-3.5 w-3.5" />
                        Nouvelle campagne
                    </Button>
                </div>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[24px] font-semibold text-[#242a38]">Campagnes</h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <p className="py-6 text-center text-[13px] text-[#8a92a3]">Aucune campagne pour le moment.</p>
                    ) : (
                        <div className="space-y-3">
                            {campaigns.map((campaign) => (
                                <div key={campaign.id} className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-medium text-[#252c3b]">{campaign.name}</p>
                                            <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE_CLASS[campaign.status] ?? ""}`}>
                                                {STATUS_LABELS[campaign.status] ?? campaign.status}
                                            </Badge>
                                            <Badge className="rounded-full border-0 bg-[#eef2ff] px-2 py-0.5 text-[10px] font-medium text-[#3350c7]">
                                                {formatDiscount(campaign)}
                                            </Badge>
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-[#7f8797]">
                                            {campaign.applicableUserTypes.map((t) => (t === "USER" ? "Standard" : "Entreprise")).join(" · ")}
                                            {" · "}
                                            {campaign.codesCount ?? 0} code{(campaign.codesCount ?? 0) > 1 ? "s" : ""}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link href={`/promotions/${campaign.id}`}>
                                            <Button variant="outline" className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657]">
                                                <Ticket className="h-3.5 w-3.5" />
                                                Codes
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                        <Button variant="outline" className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657]" onClick={() => openEdit(campaign)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                            Modifier
                                        </Button>
                                        <Button variant="outline" className="h-8 rounded-lg border-[#f3d9d9] bg-[#fdf4f4] px-3 text-[11px] text-[#c23c3c]" onClick={() => setDeleteTarget(campaign)}>
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
                        currentCount={campaigns.length}
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
                        <DialogTitle>{form.id ? "Modifier la campagne" : "Nouvelle campagne"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-[12px]">Nom de la campagne *</Label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Ex. Rentrée 2026" />
                        </div>
                        <div>
                            <Label className="text-[12px]">Description</Label>
                            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[12px]">Type de réduction *</Label>
                                <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v as PromoDiscountType })}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={PromoDiscountType.PERCENTAGE}>Pourcentage (%)</SelectItem>
                                        <SelectItem value={PromoDiscountType.FIXED}>Montant fixe (FCFA)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-[12px]">Valeur *</Label>
                                <Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="mt-1" placeholder={form.discountType === PromoDiscountType.PERCENTAGE ? "20" : "2000"} />
                            </div>
                        </div>
                        <div>
                            <Label className="text-[12px]">Comptes ciblés *</Label>
                            <div className="mt-1.5 flex items-center gap-4">
                                <label className="flex items-center gap-2 text-[12px] text-[#3f4657]">
                                    <Checkbox checked={form.applicableUserTypes.includes("USER")} onCheckedChange={() => toggleUserType("USER")} />
                                    Standard (candidats)
                                </label>
                                <label className="flex items-center gap-2 text-[12px] text-[#3f4657]">
                                    <Checkbox checked={form.applicableUserTypes.includes("ENTREPRISE")} onCheckedChange={() => toggleUserType("ENTREPRISE")} />
                                    Entreprise
                                </label>
                            </div>
                        </div>
                        <div>
                            <Label className="text-[12px]">Statut</Label>
                            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PromoCampaignStatus })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={PromoCampaignStatus.DRAFT}>Brouillon</SelectItem>
                                    <SelectItem value={PromoCampaignStatus.ACTIVE}>Active</SelectItem>
                                    <SelectItem value={PromoCampaignStatus.PAUSED}>En pause</SelectItem>
                                    <SelectItem value={PromoCampaignStatus.ENDED}>Terminée</SelectItem>
                                </SelectContent>
                            </Select>
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
                        <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            « {deleteTarget?.name} » et tous ses codes promo seront définitivement supprimés.
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
