"use client"

import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { courseService, type ICourseLesson, type ILessonResource, type ISubtitleTrack } from "@/lib/services/course.service"

type FormState = {
    title: string
    section: string
    description: string
    videoUrl: string
    minutes: string
    seconds: string
    isFreePreview: boolean
    subtitles: ISubtitleTrack[]
    resources: ILessonResource[]
}

function detectProvider(url: string): string {
    if (/youtu\.?be/i.test(url)) return "YouTube"
    if (/vimeo\.com/i.test(url)) return "Vimeo"
    return url ? "Fichier direct (MP4/WebM)" : ""
}

export function LessonDialog({
    open,
    courseId,
    lesson,
    lastSection,
    onOpenChange,
    onSaved,
}: {
    open: boolean
    courseId: string
    lesson: ICourseLesson | null
    lastSection: string
    onOpenChange: (open: boolean) => void
    onSaved: () => void | Promise<void>
}) {
    const [form, setForm] = useState<FormState | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        setForm(
            lesson
                ? {
                      title: lesson.title,
                      section: lesson.section ?? "",
                      description: lesson.description ?? "",
                      videoUrl: lesson.videoUrl ?? "",
                      minutes: String(Math.floor(lesson.durationSeconds / 60)),
                      seconds: String(lesson.durationSeconds % 60),
                      isFreePreview: lesson.isFreePreview,
                      subtitles: lesson.subtitles ?? [],
                      resources: lesson.resources ?? [],
                  }
                : { title: "", section: lastSection, description: "", videoUrl: "", minutes: "", seconds: "", isFreePreview: false, subtitles: [], resources: [] },
        )
    }, [open, lesson, lastSection])

    if (!form) return null

    const provider = detectProvider(form.videoUrl)
    const isDirectFile = !!form.videoUrl && provider.startsWith("Fichier")

    const handleSave = async () => {
        if (!form.title.trim()) {
            toast.error("Le titre est requis")
            return
        }
        setSaving(true)
        try {
            const payload = {
                title: form.title.trim(),
                section: form.section.trim() || null,
                description: form.description.trim() || null,
                videoUrl: form.videoUrl.trim() || null,
                durationSeconds: (Number(form.minutes) || 0) * 60 + (Number(form.seconds) || 0),
                isFreePreview: form.isFreePreview,
                subtitles: form.subtitles.filter((s) => s.lang.trim() && s.url.trim()),
                resources: form.resources.filter((r) => r.title.trim() && r.url.trim()),
            }
            if (lesson) {
                await courseService.updateLesson(lesson.id, payload)
                toast.success("Leçon mise à jour")
            } else {
                await courseService.createLesson(courseId, payload)
                toast.success("Leçon ajoutée")
            }
            onOpenChange(false)
            await onSaved()
        } catch (err: any) {
            console.error("[formations] lesson save error:", err)
            toast.error(err?.message || "Échec de l'enregistrement (vérifiez les URLs)")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{lesson ? "Modifier la leçon" : "Nouvelle leçon"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label className="text-[12px]">Titre *</Label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
                        </div>
                        <div className="sm:col-span-2">
                            <Label className="text-[12px]">Section / chapitre</Label>
                            <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="mt-1" placeholder="Ex. Les bases" />
                        </div>
                    </div>
                    <div>
                        <Label className="text-[12px]">URL de la vidéo</Label>
                        <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className="mt-1" placeholder="https://youtu.be/... ou https://vimeo.com/... ou https://.../video.mp4" />
                        {provider && <p className="mt-1 text-[10px] text-[#8a92a3]">Détecté : {provider}{isDirectFile ? " — sous-titres .vtt et téléchargement hors-ligne possibles" : ""}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-[12px]">Durée — minutes</Label>
                            <Input type="number" min={0} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-[12px]">secondes</Label>
                            <Input type="number" min={0} max={59} value={form.seconds} onChange={(e) => setForm({ ...form, seconds: e.target.value })} className="mt-1" />
                        </div>
                    </div>
                    <div>
                        <Label className="text-[12px]">Description / notes</Label>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} />
                    </div>
                    <label className="flex items-center justify-between rounded-lg border border-[#e7ebf3] px-3 py-2">
                        <span>
                            <span className="block text-[12px] font-medium">Aperçu gratuit</span>
                            <span className="block text-[11px] text-[#8a92a3]">Visible par tous, même sans forfait.</span>
                        </span>
                        <Switch checked={form.isFreePreview} onCheckedChange={(v) => setForm({ ...form, isFreePreview: v })} />
                    </label>

                    <div>
                        <div className="flex items-center justify-between">
                            <Label className="text-[12px]">Sous-titres (.vtt)</Label>
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setForm({ ...form, subtitles: [...form.subtitles, { lang: "en", label: "English", url: "" }] })}>
                                <Plus className="h-3 w-3" /> Ajouter
                            </Button>
                        </div>
                        {!isDirectFile && form.subtitles.length > 0 && (
                            <p className="text-[10px] text-[#9a6b00]">Les sous-titres ne s&apos;appliquent qu&apos;aux vidéos en lien direct (YouTube/Vimeo gèrent les leurs).</p>
                        )}
                        <div className="mt-1 space-y-2">
                            {form.subtitles.map((s, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input value={s.lang} onChange={(e) => setForm({ ...form, subtitles: form.subtitles.map((x, j) => (j === i ? { ...x, lang: e.target.value } : x)) })} className="w-16" placeholder="en" />
                                    <Input value={s.label ?? ""} onChange={(e) => setForm({ ...form, subtitles: form.subtitles.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className="w-28" placeholder="English" />
                                    <Input value={s.url} onChange={(e) => setForm({ ...form, subtitles: form.subtitles.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} placeholder="https://.../en.vtt" />
                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setForm({ ...form, subtitles: form.subtitles.filter((_, j) => j !== i) })}>
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <Label className="text-[12px]">Ressources (PDF, liens)</Label>
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setForm({ ...form, resources: [...form.resources, { title: "", url: "" }] })}>
                                <Plus className="h-3 w-3" /> Ajouter
                            </Button>
                        </div>
                        <div className="mt-1 space-y-2">
                            {form.resources.map((r, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input value={r.title} onChange={(e) => setForm({ ...form, resources: form.resources.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} className="w-40" placeholder="Support de cours" />
                                    <Input value={r.url} onChange={(e) => setForm({ ...form, resources: form.resources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} placeholder="https://..." />
                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setForm({ ...form, resources: form.resources.filter((_, j) => j !== i) })}>
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-[#0f56d9] text-white hover:bg-[#0a4cc5]">
                        {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
