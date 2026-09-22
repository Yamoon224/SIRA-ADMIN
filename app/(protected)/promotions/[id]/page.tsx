"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Dices, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { promoCodeService } from "@/lib/services/promo-code.service"
import { influencerService } from "@/lib/services/influencer.service"
import type { IInfluencer, IPromoCampaign, IPromoCode } from "@/lib/@types/entities"

type FormState = {
    id?: string
    code: string
    influencerId: string
    maxUses: string
    maxUsesPerUser: string
    isActive: boolean
}

const EMPTY_FORM: FormState = {
    code: "",
    influencerId: "",
    maxUses: "",
    maxUsesPerUser: "1",
    isActive: true,
}

export default function PromoCampaignDetailPage() {
    const params = useParams<{ id: string }>()
    const campaignId = params.id

    const [campaign, setCampaign] = useState<IPromoCampaign | null>(null)
    const [codes, setCodes] = useState<IPromoCode[]>([])
    const [influencers, setInfluencers] = useState<IInfluencer[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<IPromoCode | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const [campaignRes, codesRes, influencersRes]: any[] = await Promise.all([
                promoCampaignService.getCampaignById(campaignId),
                promoCodeService.getCodes({ campaignId, page, limit: pageSize }),
                influencerService.getInfluencers({ limit: 100 }),
            ])
            setCampaign(campaignRes?.data ?? null)
            setCodes(Array.isArray(codesRes?.data) ? codesRes.data : [])
            setTotalPages(codesRes?.meta?.totalPages ?? 1)
            setTotal(codesRes?.meta?.total ?? 0)
            setInfluencers(Array.isArray(influencersRes?.data) ? influencersRes.data : [])
        } catch (err) {
            console.error("[promotions/id] load error:", err)
            toast.error("Impossible de charger la campagne")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId, page, pageSize])

    const openCreate = () => {
        setForm(EMPTY_FORM)
        setFormOpen(true)
    }

    const openEdit = (code: IPromoCode) => {
        setForm({
            id: code.id,
            code: code.code,
            influencerId: code.influencerId ?? "",
            maxUses: code.maxUses !== null ? String(code.maxUses) : "",
            maxUsesPerUser: String(code.maxUsesPerUser),
            isActive: code.isActive,
        })
        setFormOpen(true)
    }

    const handleGenerate = async () => {
        try {
            const res: any = await promoCodeService.generateCode()
            setForm((f) => ({ ...f, code: res?.data?.code ?? f.code }))
        } catch (err: any) {
            toast.error(err?.message || "Échec de la génération du code")
        }
    }

    const handleSave = async () => {
        if (!form.code.trim()) {
            toast.error("Le code est requis")
            return
        }
        setSaving(true)
        try {
            if (form.id) {
                await promoCodeService.updateCode(form.id, {
                    influencerId: form.influencerId || null,
                    maxUses: form.maxUses ? Number(form.maxUses) : null,
                    maxUsesPerUser: Number(form.maxUsesPerUser) || 1,
                    isActive: form.isActive,
                })
                toast.success("Code mis à jour")
            } else {
                await promoCodeService.createCode({
                    campaignId,
                    code: form.code.trim(),
                    influencerId: form.influencerId || undefined,
                    maxUses: form.maxUses ? Number(form.maxUses) : undefined,
                    maxUsesPerUser: Number(form.maxUsesPerUser) || 1,
                })
                toast.success("Code créé")
            }
            setFormOpen(false)
            await load()
        } catch (err: any) {
            console.error("[promotions/id] save error:", err)
            toast.error(err?.message || "Échec de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActive = async (code: IPromoCode) => {
        try {
            await promoCodeService.updateCode(code.id, { isActive: !code.isActive })
            await load()
        } catch (err: any) {
            toast.error(err?.message || "Échec de la mise à jour")
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await promoCodeService.deleteCode(deleteTarget.id)
            toast.success("Code supprimé")
            setDeleteTarget(null)
            await load()
        } catch (err: any) {
            toast.error(err?.message || "Échec de la suppression")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link href="/promotions" className="mb-1 flex items-center gap-1 text-[12px] text-[#7f8797] hover:text-[#3f4657]">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Promotions
                    </Link>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px]">{campaign?.name ?? "Campagne"}</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">{campaign?.description || "Codes promo de cette campagne"}</p>
                </div>
                <Button className="h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]" onClick={openCreate}>
                    <Plus className="h-3.5 w-3.5" />
                    Nouveau code
                </Button>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[24px] font-semibold text-[#242a38]">Codes</h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : codes.length === 0 ? (
                        <p className="py-6 text-center text-[13px] text-[#8a92a3]">Aucun code pour cette campagne.</p>
                    ) : (
                        <div className="space-y-3">
                            {codes.map((code) => (
                                <div key={code.id} className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-[13px] font-semibold text-[#252c3b]">{code.code}</p>
                                            {code.influencerName && (
                                                <Badge className="rounded-full border-0 bg-[#fff1e8] px-2 py-0.5 text-[10px] font-medium text-[#c26a1f]">
                                                    {code.influencerName}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-[#7f8797]">
                                            {code.usedCount} utilisation{code.usedCount > 1 ? "s" : ""}
                                            {code.maxUses !== null ? ` / ${code.maxUses}` : " (illimité)"}
                                            {" · "}max {code.maxUsesPerUser}/utilisateur
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <label className="flex items-center gap-2 text-[11px] text-[#3f4657]">
                                            <Switch checked={code.isActive} onCheckedChange={() => handleToggleActive(code)} />
                                            {code.isActive ? "Actif" : "Inactif"}
                                        </label>
                                        <Button variant="outline" className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657]" onClick={() => openEdit(code)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                            Modifier
                                        </Button>
                                        <Button variant="outline" className="h-8 rounded-lg border-[#f3d9d9] bg-[#fdf4f4] px-3 text-[11px] text-[#c23c3c]" onClick={() => setDeleteTarget(code)}>
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
                        currentCount={codes.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
                        disabled={loading}
                        className="mt-4"
                    />
                </CardContent>
            </Card>

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{form.id ? "Modifier le code" : "Nouveau code"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-[12px]">Code *</Label>
                            <div className="mt-1 flex gap-2">
                                <Input
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    className="font-mono uppercase"
                                    placeholder="GORIYA20"
                                    disabled={!!form.id}
                                />
                                {!form.id && (
                                    <Button type="button" variant="outline" onClick={handleGenerate}>
                                        <Dices className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div>
                            <Label className="text-[12px]">Influenceur lié (optionnel)</Label>
                            <select
                                value={form.influencerId}
                                onChange={(e) => setForm({ ...form, influencerId: e.target.value })}
                                className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-[13px]"
                            >
                                <option value="">Aucun (code générique)</option>
                                {influencers.map((inf) => (
                                    <option key={inf.id} value={inf.id}>{inf.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[12px]">Quota global</Label>
                                <Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="mt-1" placeholder="Illimité" />
                            </div>
                            <div>
                                <Label className="text-[12px]">Max par utilisateur</Label>
                                <Input type="number" value={form.maxUsesPerUser} onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })} className="mt-1" />
                            </div>
                        </div>
                        {form.id && (
                            <label className="flex items-center gap-2 text-[12px] text-[#3f4657]">
                                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                                Code actif
                            </label>
                        )}
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
                        <AlertDialogTitle>Supprimer ce code ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Le code « {deleteTarget?.code} » sera définitivement supprimé.
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
