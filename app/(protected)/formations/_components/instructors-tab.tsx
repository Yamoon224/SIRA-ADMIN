"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { instructorService, type IInstructor } from "@/lib/services/course.service"
import { ImageUpload } from "./image-upload"

type FormState = {
    id?: string
    name: string
    headline: string
    bio: string
    country: string
    linkedinUrl: string
    photoPath: string | null
    photoUrl: string | null
    isActive: boolean
}

const EMPTY_FORM: FormState = { name: "", headline: "", bio: "", country: "Côte d'Ivoire", linkedinUrl: "", photoPath: null, photoUrl: null, isActive: true }

export function InstructorsTab() {
    const [instructors, setInstructors] = useState<IInstructor[]>([])
    const [loading, setLoading] = useState(true)
    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<IInstructor | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const res = await instructorService.list()
            setInstructors(res?.data ?? [])
        } catch (err) {
            console.error("[formations] instructors error:", err)
            toast.error("Impossible de charger les instructeurs")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const openEdit = (i: IInstructor) => {
        setForm({
            id: i.id,
            name: i.name,
            headline: i.headline ?? "",
            bio: i.bio ?? "",
            country: i.country ?? "",
            linkedinUrl: i.linkedinUrl ?? "",
            photoPath: i.photoPath,
            photoUrl: i.photoUrl,
            isActive: i.isActive,
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
                headline: form.headline.trim() || null,
                bio: form.bio.trim() || null,
                country: form.country.trim() || null,
                linkedinUrl: form.linkedinUrl.trim() || null,
                photoPath: form.photoPath,
                isActive: form.isActive,
            }
            if (form.id) {
                await instructorService.update(form.id, payload)
                toast.success("Instructeur mis à jour")
            } else {
                await instructorService.create(payload)
                toast.success("Instructeur ajouté")
            }
            setFormOpen(false)
            await load()
        } catch (err: any) {
            console.error("[formations] instructor save error:", err)
            toast.error(err?.message || "Échec de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await instructorService.remove(deleteTarget.id)
            toast.success("Instructeur supprimé")
            setDeleteTarget(null)
            await load()
        } catch (err) {
            console.error("[formations] instructor delete error:", err)
            toast.error("Échec de la suppression")
        }
    }

    return (
        <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
            <CardContent className="px-4 py-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-[20px] font-semibold text-[#242a38]">Instructeurs</h2>
                        <p className="text-[12px] text-[#7f8797]">Les professionnels qui donnent les cours</p>
                    </div>
                    <Button
                        className="h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                        onClick={() => {
                            setForm(EMPTY_FORM)
                            setFormOpen(true)
                        }}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Nouvel instructeur
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                    </div>
                ) : instructors.length === 0 ? (
                    <div className="py-10 text-center text-[#8a92a3]">
                        <UserRound className="mx-auto mb-3 h-10 w-10 opacity-30" />
                        <p className="text-[13px]">Aucun instructeur.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {instructors.map((i) => (
                            <div key={i.id} className="flex items-center gap-3 rounded-[10px] border border-[#e7ebf3] p-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f1f3f7]">
                                    {i.photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={i.photoUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserRound className="h-5 w-5 text-[#8a92a3]" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-semibold text-[#252c3b]">
                                        {i.name}
                                        {!i.isActive && <span className="ml-1 text-[10px] font-normal text-[#8a92a3]">(inactif)</span>}
                                    </p>
                                    <p className="truncate text-[11px] text-[#7f8797]">{i.headline ?? "-"}</p>
                                    <p className="text-[10px] text-[#8a92a3]">{i.coursesCount ?? 0} cours</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(i)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#c23c3c]" onClick={() => setDeleteTarget(i)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <Dialog open={formOpen} onOpenChange={setFormOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{form.id ? "Modifier l'instructeur" : "Nouvel instructeur"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <ImageUpload
                                    url={form.photoUrl}
                                    onChange={(path, url) => setForm({ ...form, photoPath: path, photoUrl: url })}
                                    className="h-20 w-20 shrink-0"
                                    rounded="rounded-full"
                                />
                                <div className="flex-1">
                                    <Label className="text-[12px]">Nom complet *</Label>
                                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
                                </div>
                            </div>
                            <div>
                                <Label className="text-[12px]">Titre professionnel</Label>
                                <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="mt-1" placeholder="Ex. Professionnelle des médias" />
                            </div>
                            <div>
                                <Label className="text-[12px]">Biographie</Label>
                                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1" rows={3} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-[12px]">Pays</Label>
                                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-[12px]">LinkedIn</Label>
                                    <Input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className="mt-1" placeholder="https://..." />
                                </div>
                            </div>
                            <label className="flex items-center justify-between rounded-lg border border-[#e7ebf3] px-3 py-2 text-[12px]">
                                Actif
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
                            <AlertDialogTitle>Supprimer cet instructeur ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Ses {deleteTarget?.coursesCount ?? 0} cours restent en ligne mais n&apos;afficheront plus d&apos;instructeur.
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
