"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Pencil, PlayCircle, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    courseCategoryService,
    courseService,
    formatMinutes,
    instructorService,
    LANGUAGE_OPTIONS,
    LEVEL_LABELS,
    type CourseLevel,
    type ICourseCategory,
    type ICourseDetail,
    type ICourseLesson,
    type IInstructor,
} from "@/lib/services/course.service"
import { ImageUpload } from "../_components/image-upload"
import { LessonDialog } from "../_components/lesson-dialog"

const NONE = "none"

type FormState = {
    title: string
    subtitle: string
    description: string
    categoryId: string
    instructorId: string
    level: CourseLevel
    language: string
    subtitleLanguages: string[]
    learningOutcomes: string[]
    thumbnailPath: string | null
    thumbnailUrl: string | null
    trailerUrl: string
    isFree: boolean
    isPublished: boolean
}

function toForm(c: ICourseDetail): FormState {
    return {
        title: c.title,
        subtitle: c.subtitle ?? "",
        description: c.description ?? "",
        categoryId: c.categoryId ?? NONE,
        instructorId: c.instructorId ?? NONE,
        level: c.level ?? "BEGINNER",
        language: c.language ?? "fr",
        subtitleLanguages: c.subtitleLanguages ?? [],
        learningOutcomes: c.learningOutcomes ?? [],
        thumbnailPath: c.thumbnailPath,
        thumbnailUrl: c.thumbnailUrl,
        trailerUrl: c.trailerUrl ?? "",
        isFree: c.isFree,
        isPublished: c.isPublished,
    }
}

export default function CourseEditorPage() {
    const { id } = useParams<{ id: string }>()
    const [course, setCourse] = useState<ICourseDetail | null>(null)
    const [form, setForm] = useState<FormState | null>(null)
    const [categories, setCategories] = useState<ICourseCategory[]>([])
    const [instructors, setInstructors] = useState<IInstructor[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [newOutcome, setNewOutcome] = useState("")
    const [lessonDialog, setLessonDialog] = useState<{ open: boolean; lesson: ICourseLesson | null }>({ open: false, lesson: null })
    const [deleteLesson, setDeleteLesson] = useState<ICourseLesson | null>(null)

    const load = async () => {
        try {
            const res = await courseService.get(id)
            setCourse(res.data)
            setForm(toForm(res.data))
        } catch (err) {
            console.error("[formations] course load error:", err)
            toast.error("Formation introuvable")
        } finally {
            setLoading(false)
        }
    }

    const reloadLessons = async () => {
        const res = await courseService.get(id)
        setCourse(res.data)
    }

    useEffect(() => {
        load()
        Promise.all([courseCategoryService.list(), instructorService.list()])
            .then(([cats, instr]) => {
                setCategories(cats?.data ?? [])
                setInstructors(instr?.data ?? [])
            })
            .catch((err) => console.error("[formations] referentials error:", err))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    if (loading || !form || !course) {
        return (
            <div className="flex items-center justify-center p-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
            </div>
        )
    }

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => (f ? { ...f, [key]: value } : f))

    const handleSave = async (overrides: Partial<FormState> = {}) => {
        const f = { ...form, ...overrides }
        if (!f.title.trim()) {
            toast.error("Le titre est requis")
            return
        }
        if (f.isPublished && course.lessons.length === 0) {
            toast.error("Ajoutez au moins une leçon avant de publier")
            return
        }
        setSaving(true)
        try {
            await courseService.update(course.id, {
                title: f.title.trim(),
                subtitle: f.subtitle.trim() || null,
                description: f.description.trim() || null,
                categoryId: f.categoryId === NONE ? null : f.categoryId,
                instructorId: f.instructorId === NONE ? null : f.instructorId,
                level: f.level,
                language: f.language,
                subtitleLanguages: f.subtitleLanguages,
                learningOutcomes: f.learningOutcomes,
                thumbnailPath: f.thumbnailPath,
                trailerUrl: f.trailerUrl.trim() || null,
                isFree: f.isFree,
                isPublished: f.isPublished,
            })
            setForm(f)
            setCourse({ ...course, isPublished: f.isPublished })
            toast.success(overrides.isPublished === true ? "Formation publiée" : overrides.isPublished === false ? "Formation dépubliée" : "Formation enregistrée")
        } catch (err: any) {
            console.error("[formations] save error:", err)
            toast.error(err?.message || "Échec de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const moveLesson = async (index: number, direction: -1 | 1) => {
        const lessons = [...course.lessons]
        const target = index + direction
        if (target < 0 || target >= lessons.length) return
        ;[lessons[index], lessons[target]] = [lessons[target], lessons[index]]
        setCourse({ ...course, lessons })
        try {
            await courseService.reorderLessons(course.id, lessons.map((l) => l.id))
        } catch (err) {
            console.error("[formations] reorder error:", err)
            toast.error("Échec du réordonnancement")
            await reloadLessons()
        }
    }

    const handleDeleteLesson = async () => {
        if (!deleteLesson) return
        try {
            await courseService.deleteLesson(deleteLesson.id)
            toast.success("Leçon supprimée")
            setDeleteLesson(null)
            await reloadLessons()
        } catch (err) {
            console.error("[formations] lesson delete error:", err)
            toast.error("Échec de la suppression")
        }
    }

    const toggleSubtitleLang = (lang: string) =>
        set("subtitleLanguages", form.subtitleLanguages.includes(lang) ? form.subtitleLanguages.filter((l) => l !== lang) : [...form.subtitleLanguages, lang])

    const totalMinutes = Math.ceil(course.lessons.reduce((sum, l) => sum + (l.durationSeconds || 0), 0) / 60)

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/formations">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-[24px] font-semibold leading-tight text-[#242a38]">{form.title || "Formation"}</h1>
                        <div className="mt-1 flex items-center gap-2 text-[12px] text-[#7f8797]">
                            {!course.isActive ? (
                                <Badge className="rounded-full border-0 bg-[#2a3140] px-2 py-0.5 text-[10px] text-white">Archivé</Badge>
                            ) : course.isPublished ? (
                                <Badge className="rounded-full border-0 bg-[#0f56d9] px-2 py-0.5 text-[10px] text-white">Publié</Badge>
                            ) : (
                                <Badge className="rounded-full border-0 bg-[#fff6e0] px-2 py-0.5 text-[10px] text-[#9a6b00]">Brouillon</Badge>
                            )}
                            {course.lessons.length} leçon{course.lessons.length > 1 ? "s" : ""} · {formatMinutes(totalMinutes)}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="h-9 rounded-full px-4 text-[12px]"
                        disabled={saving}
                        onClick={() => handleSave({ isPublished: !course.isPublished })}
                    >
                        <Eye className="h-3.5 w-3.5" />
                        {course.isPublished ? "Dépublier" : "Publier"}
                    </Button>
                    <Button className="h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]" disabled={saving} onClick={() => handleSave()}>
                        {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="space-y-4 px-4 py-4">
                        <h2 className="text-[16px] font-semibold text-[#242a38]">Informations</h2>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[200px_1fr]">
                            <div>
                                <Label className="text-[12px]">Vignette</Label>
                                <ImageUpload url={form.thumbnailUrl} onChange={(path, url) => setForm({ ...form, thumbnailPath: path, thumbnailUrl: url })} className="mt-1 h-28 w-full" />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-[12px]">Titre *</Label>
                                    <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-[12px]">Sous-titre</Label>
                                    <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} className="mt-1" placeholder="Une phrase d'accroche" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label className="text-[12px]">Description</Label>
                            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1" rows={5} />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <Label className="text-[12px]">Catégorie métier</Label>
                                <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE}>Aucune</SelectItem>
                                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-[12px]">Instructeur</Label>
                                <Select value={form.instructorId} onValueChange={(v) => set("instructorId", v)}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE}>Aucun</SelectItem>
                                        {instructors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-[12px]">Niveau</Label>
                                <Select value={form.level} onValueChange={(v) => set("level", v as CourseLevel)}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(LEVEL_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-[12px]">Langue audio</Label>
                                <Select value={form.language} onValueChange={(v) => set("language", v)}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGE_OPTIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-[12px]">Sous-titres disponibles</Label>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {LANGUAGE_OPTIONS.map((l) => {
                                    const active = form.subtitleLanguages.includes(l.value)
                                    return (
                                        <button
                                            key={l.value}
                                            type="button"
                                            onClick={() => toggleSubtitleLang(l.value)}
                                            className={`rounded-full border px-3 py-1 text-[11px] ${active ? "border-[#0f56d9] bg-[#eaf1ff] text-[#0f56d9]" : "border-[#e7ebf3] text-[#5d6475]"}`}
                                        >
                                            {l.label}
                                        </button>
                                    )
                                })}
                            </div>
                            <p className="mt-1 text-[10px] text-[#8a92a3]">Les fichiers .vtt se renseignent leçon par leçon (vidéos en lien direct uniquement).</p>
                        </div>
                        <div>
                            <Label className="text-[12px]">Ce que l&apos;apprenant saura faire</Label>
                            <div className="mt-1 space-y-1.5">
                                {form.learningOutcomes.map((o, i) => (
                                    <div key={i} className="flex items-center gap-2 rounded-lg bg-[#f8f9fc] px-3 py-1.5 text-[12px]">
                                        <span className="flex-1">{o}</span>
                                        <button type="button" onClick={() => set("learningOutcomes", form.learningOutcomes.filter((_, j) => j !== i))}>
                                            <X className="h-3.5 w-3.5 text-[#8a92a3]" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <Input
                                        value={newOutcome}
                                        onChange={(e) => setNewOutcome(e.target.value)}
                                        placeholder="Ex. Détourer une image proprement"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && newOutcome.trim()) {
                                                e.preventDefault()
                                                set("learningOutcomes", [...form.learningOutcomes, newOutcome.trim()])
                                                setNewOutcome("")
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!newOutcome.trim()}
                                        onClick={() => {
                                            set("learningOutcomes", [...form.learningOutcomes, newOutcome.trim()])
                                            setNewOutcome("")
                                        }}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label className="text-[12px]">Bande-annonce (URL YouTube / Vimeo / MP4)</Label>
                            <Input value={form.trailerUrl} onChange={(e) => set("trailerUrl", e.target.value)} className="mt-1" placeholder="https://..." />
                        </div>
                        <label className="flex items-center justify-between rounded-lg border border-[#e7ebf3] px-3 py-2">
                            <span>
                                <span className="block text-[12px] font-medium text-[#252c3b]">Formation gratuite</span>
                                <span className="block text-[11px] text-[#8a92a3]">Toutes les leçons sont ouvertes, même sans forfait ni pass.</span>
                            </span>
                            <Switch checked={form.isFree} onCheckedChange={(v) => set("isFree", v)} />
                        </label>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-[16px] font-semibold text-[#242a38]">Leçons</h2>
                            <Button
                                className="h-8 rounded-full bg-[#0f56d9] px-4 text-[11px] font-semibold text-white hover:bg-[#0a4cc5]"
                                onClick={() => setLessonDialog({ open: true, lesson: null })}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Ajouter
                            </Button>
                        </div>
                        {course.lessons.length === 0 ? (
                            <div className="py-10 text-center text-[#8a92a3]">
                                <PlayCircle className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                <p className="text-[12px]">Aucune leçon pour l&apos;instant.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {course.lessons.map((lesson, index) => {
                                    const showSection = lesson.section && lesson.section !== course.lessons[index - 1]?.section
                                    return (
                                        <div key={lesson.id}>
                                            {showSection && <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wide text-[#8a92a3]">{lesson.section}</p>}
                                            <div className="flex items-center gap-2 rounded-lg border border-[#e7ebf3] px-2 py-2">
                                                <span className="w-5 text-center text-[11px] text-[#8a92a3]">{index + 1}</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[12px] font-medium text-[#252c3b]">{lesson.title}</p>
                                                    <p className="text-[10px] text-[#8a92a3]">
                                                        {lesson.videoProvider} · {formatMinutes(Math.ceil(lesson.durationSeconds / 60))}
                                                        {lesson.isFreePreview && <span className="ml-1 text-[#1f9d64]">· Aperçu gratuit</span>}
                                                        {!lesson.videoUrl && <span className="ml-1 text-[#d64545]">· Pas de vidéo</span>}
                                                        {lesson.subtitles?.length > 0 && <span className="ml-1">· CC {lesson.subtitles.map((s) => s.lang).join("/")}</span>}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => moveLesson(index, -1)}>
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === course.lessons.length - 1} onClick={() => moveLesson(index, 1)}>
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLessonDialog({ open: true, lesson })}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#c23c3c]" onClick={() => setDeleteLesson(lesson)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <LessonDialog
                open={lessonDialog.open}
                courseId={course.id}
                lesson={lessonDialog.lesson}
                lastSection={course.lessons[course.lessons.length - 1]?.section ?? ""}
                onOpenChange={(open) => setLessonDialog((s) => ({ ...s, open }))}
                onSaved={reloadLessons}
            />

            <AlertDialog open={!!deleteLesson} onOpenChange={(open) => !open && setDeleteLesson(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette leçon ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            « {deleteLesson?.title} » et la progression des apprenants sur cette leçon seront supprimées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLesson} className="bg-[#d64545] hover:bg-[#b93a3a]">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
