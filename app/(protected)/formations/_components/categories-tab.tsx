"use client"

import { useEffect, useState } from "react"
import { Layers, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { courseCategoryService, type ICourseCategory } from "@/lib/services/course.service"
import { ImageUpload } from "./image-upload"

type FormState = {
    id?: string
    name: string
    description: string
    icon: string
    coverPath: string | null
    coverUrl: string | null
    sortOrder: string
    isActive: boolean
}

const EMPTY_FORM: FormState = { name: "", description: "", icon: "", coverPath: null, coverUrl: null, sortOrder: "0", isActive: true }

export function CategoriesTab() {
    const [categories, setCategories] = useState<ICourseCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ICourseCategory | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const res = await courseCategoryService.list()
            setCategories(res?.data ?? [])
        } catch (err) {
            console.error("[formations] categories error:", err)
            toast.error("Impossible de charger les catégories")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const openEdit = (c: ICourseCategory) => {
        setForm({
            id: c.id,
            name: c.name,
            description: c.description ?? "",
            icon: c.icon ?? "",
            coverPath: c.coverPath,
            coverUrl: c.coverUrl,
            sortOrder: String(c.sortOrder ?? 0),
            isActive: c.isActive,
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
                name: form.name.trim(),
                description: form.description.trim() || null,
                icon: form.icon.trim() || null,
                coverPath: form.coverPath,
                sortOrder: Number(form.sortOrder) || 0,
                isActive: form.isActive,
            }
            if (form.id) {
                await courseCategoryService.update(form.id, payload)
                toast.success("Catégorie mise à jour")
            } else {
                await courseCategoryService.create(payload)
                toast.success("Catégorie créée")
            }
            setFormOpen(false)
            await load()
        } catch (err: any) {
            console.error("[formations] category save error:", err)
            toast.error(err?.message || "Échec de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await courseCategoryService.remove(deleteTarget.id)
            toast.success("Catégorie supprimée")
            setDeleteTarget(null)
            await load()
        } catch (err) {
            console.error("[formations] category delete error:", err)
            toast.error("Échec de la suppression")
        }
    }

    return (
        <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
            <CardContent className="px-4 py-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-[20px] font-semibold text-[#242a38]">Catégories métiers</h2>
                        <p className="text-[12px] text-[#7f8797]">Développeur web, Data scientist, Business developer, Rédaction web…</p>
                    </div>
                    <Button
                        className="h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                        onClick={() => {
                            setForm(EMPTY_FORM)
                            setFormOpen(true)
                        }}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Nouvelle catégorie
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="py-10 text-center text-[#8a92a3]">
                        <Layers className="mx-auto mb-3 h-10 w-10 opacity-30" />
                        <p className="text-[13px]">Aucune catégorie.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {categories.map((c) => (
                            <div key={c.id} className="flex items-center gap-3 rounded-[10px] border border-[#e7ebf3] p-3">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#ff3b30] to-[#ff8a4c]">
                                    {c.coverUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={c.coverUrl} alt="" className="h-full w-full object-cover" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-semibold text-[#252c3b]">{c.name}</p>
                                    <p className="text-[11px] text-[#7f8797]">
                                        {c.coursesCount ?? 0} cours · ordre {c.sortOrder}
                                    </p>
                                    {!c.isActive && <Badge className="mt-1 rounded-full border-0 bg-[#f1f3f7] px-2 py-0.5 text-[10px] text-[#3d4354]">Masquée</Badge>}
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#c23c3c]" onClick={() => setDeleteTarget(c)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <Dialog open={formOpen} onOpenChange={setFormOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{form.id ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <ImageUpload url={form.coverUrl} onChange={(path, url) => setForm({ ...form, coverPath: path, coverUrl: url })} />
                            <div>
                                <Label className="text-[12px]">Nom *</Label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
                            </div>
                            <div>
                                <Label className="text-[12px]">Description</Label>
                                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-[12px]">Icône (nom lucide)</Label>
                                    <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="mt-1" placeholder="code, chart, pen…" />
                                </div>
                                <div>
                                    <Label className="text-[12px]">Ordre d&apos;affichage</Label>
                                    <Input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="mt-1" />
                                </div>
                            </div>
                            <label className="flex items-center justify-between rounded-lg border border-[#e7ebf3] px-3 py-2 text-[12px]">
                                Visible dans le catalogue
                                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                            </label>
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
                            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Les {deleteTarget?.coursesCount ?? 0} cours de « {deleteTarget?.name} » ne sont pas supprimés : ils se retrouvent sans catégorie.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-[#d64545] hover:bg-[#b93a3a]">Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}
