"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { influencerService } from "@/lib/services/influencer.service"
import type { IInfluencer } from "@/lib/@types/entities"

type FormState = {
    id?: string
    name: string
    email: string
    phone: string
    defaultCommissionRate: string
    notes: string
}

const EMPTY_FORM: FormState = { name: "", email: "", phone: "", defaultCommissionRate: "", notes: "" }

export default function InfluencersPage() {
    const [influencers, setInfluencers] = useState<IInfluencer[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<IInfluencer | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const res: any = await influencerService.getInfluencers({ page, limit: pageSize })
            setInfluencers(Array.isArray(res?.data) ? res.data : [])
            setTotalPages(res?.meta?.totalPages ?? 1)
            setTotal(res?.meta?.total ?? 0)
        } catch (err) {
            console.error("[influenceurs] load error:", err)
            toast.error("Impossible de charger les influenceurs")
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

    const openEdit = (influencer: IInfluencer) => {
        setForm({
            id: influencer.id,
            name: influencer.name,
            email: influencer.email ?? "",
            phone: influencer.phone ?? "",
            defaultCommissionRate: influencer.defaultCommissionRate !== null ? String(influencer.defaultCommissionRate) : "",
            notes: influencer.notes ?? "",
        })
        setFormOpen(true)
    }

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error("Le nom est requis")
            return
        }
        setSaving(true)
        try {
            const payload = {
                name: form.name,
                email: form.email || undefined,
                phone: form.phone || undefined,
                defaultCommissionRate: form.defaultCommissionRate ? Number(form.defaultCommissionRate) : undefined,
                notes: form.notes || undefined,
            }
            if (form.id) {
                await influencerService.updateInfluencer(form.id, payload)
                toast.success("Influenceur mis à jour")
            } else {
                await influencerService.createInfluencer(payload)
                toast.success("Influenceur créé")
            }
            setFormOpen(false)
            await load()
        } catch (err: any) {
            console.error("[influenceurs] save error:", err)
            toast.error(err?.message || "Échec de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await influencerService.deleteInfluencer(deleteTarget.id)
            toast.success("Influenceur supprimé")
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
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px]">Influenceurs</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">Promoteurs rattachés à des codes promo, et leurs commissions</p>
                </div>
                <Button className="h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]" onClick={openCreate}>
                    <Plus className="h-3.5 w-3.5" />
                    Nouvel influenceur
                </Button>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : influencers.length === 0 ? (
                        <p className="py-6 text-center text-[13px] text-[#8a92a3]">Aucun influenceur pour le moment.</p>
                    ) : (
                        <div className="space-y-3">
                            {influencers.map((influencer) => (
                                <div key={influencer.id} className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-medium text-[#252c3b]">{influencer.name}</p>
                                            {influencer.unpaidBalance > 0 && (
                                                <Badge className="rounded-full border-0 bg-[#fff6e0] px-2 py-0.5 text-[10px] font-medium text-[#9a6b00]">
                                                    {influencer.unpaidBalance.toLocaleString("fr-FR")} FCFA dus
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-[#7f8797]">
                                            {influencer.email || "—"} {influencer.phone ? `· ${influencer.phone}` : ""}
                                            {influencer.defaultCommissionRate !== null ? ` · ${influencer.defaultCommissionRate}% de commission` : ""}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link href={`/promotions/influenceurs/${influencer.id}`}>
                                            <Button variant="outline" className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657]">
                                                Détail
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                        <Button variant="outline" className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657]" onClick={() => openEdit(influencer)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                            Modifier
                                        </Button>
                                        <Button variant="outline" className="h-8 rounded-lg border-[#f3d9d9] bg-[#fdf4f4] px-3 text-[11px] text-[#c23c3c]" onClick={() => setDeleteTarget(influencer)}>
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
                        currentCount={influencers.length}
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
                        <DialogTitle>{form.id ? "Modifier l'influenceur" : "Nouvel influenceur"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-[12px]">Nom *</Label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[12px]">Email</Label>
                                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
                            </div>
                            <div>
                                <Label className="text-[12px]">Téléphone</Label>
                                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-[12px]">Taux de commission par défaut (%)</Label>
                            <Input type="number" value={form.defaultCommissionRate} onChange={(e) => setForm({ ...form, defaultCommissionRate: e.target.value })} className="mt-1" placeholder="10" />
                        </div>
                        <div>
                            <Label className="text-[12px]">Notes</Label>
                            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} />
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
                        <AlertDialogTitle>Supprimer cet influenceur ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            « {deleteTarget?.name} » sera définitivement supprimé. Ses codes promo perdront leur rattachement.
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
