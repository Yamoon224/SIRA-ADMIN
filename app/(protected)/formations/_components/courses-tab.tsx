"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Archive, BookOpen, Filter, Pencil, Plus, RotateCcw, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FilterMenu, type FilterOption } from "@/components/ui/filter-menu"
import { DataPagination, DEFAULT_PAGE_SIZE } from "@/components/ui/data-pagination"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    courseCategoryService,
    courseService,
    formatMinutes,
    instructorService,
    LEVEL_LABELS,
    type ICourse,
    type ICourseCategory,
    type IInstructor,
} from "@/lib/services/course.service"

const STATUS_OPTIONS: FilterOption[] = [
    { value: "all", label: "Tous les statuts" },
    { value: "PUBLISHED", label: "Publiés" },
    { value: "DRAFT", label: "Brouillons" },
    { value: "ARCHIVED", label: "Archivés" },
]

const NONE = "none"

export function CoursesTab({ onChanged }: { onChanged?: () => void }) {
    const router = useRouter()
    const [courses, setCourses] = useState<ICourse[]>([])
    const [categories, setCategories] = useState<ICourseCategory[]>([])
    const [instructors, setInstructors] = useState<IInstructor[]>([])
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [createOpen, setCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState({ title: "", categoryId: NONE, instructorId: NONE })
    const [creating, setCreating] = useState(false)
    const [archiveTarget, setArchiveTarget] = useState<ICourse | null>(null)

    const loadList = async () => {
        setLoading(true)
        try {
            const res = await courseService.paginate({
                page,
                limit: pageSize,
                search: search || undefined,
                status: statusFilter === "all" ? undefined : statusFilter,
                category: categoryFilter === "all" ? undefined : categoryFilter,
            })
            setCourses(Array.isArray(res?.data) ? res.data : [])
            setTotalPages(res?.meta?.totalPages ?? 1)
            setTotal(res?.meta?.total ?? 0)
        } catch (err) {
            console.error("[formations] load error:", err)
            toast.error("Impossible de charger les formations")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        Promise.all([courseCategoryService.list(), instructorService.list()])
            .then(([cats, instr]) => {
                setCategories(cats?.data ?? [])
                setInstructors(instr?.data ?? [])
            })
            .catch((err) => console.error("[formations] referentials error:", err))
    }, [])

    useEffect(() => {
        loadList()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, statusFilter, categoryFilter])

    const handleCreate = async () => {
        if (!createForm.title.trim()) return
        setCreating(true)
        try {
            const res = await courseService.create({
                title: createForm.title.trim(),
                categoryId: createForm.categoryId === NONE ? null : createForm.categoryId,
                instructorId: createForm.instructorId === NONE ? null : createForm.instructorId,
            })
            toast.success("Formation créée — ajoutez maintenant ses leçons")
            onChanged?.()
            router.push(`/formations/${res.data.id}`)
        } catch (err: any) {
            console.error("[formations] create error:", err)
            toast.error(err?.message || "Échec de la création")
        } finally {
            setCreating(false)
        }
    }

    const handleArchive = async () => {
        if (!archiveTarget) return
        try {
            await courseService.remove(archiveTarget.id)
            toast.success("Formation archivée")
            setArchiveTarget(null)
            onChanged?.()
            await loadList()
        } catch (err) {
            console.error("[formations] archive error:", err)
            toast.error("Échec de l'archivage")
        }
    }

    const handleRestore = async (course: ICourse) => {
        try {
            await courseService.update(course.id, { isActive: true })
            toast.success("Formation restaurée")
            onChanged?.()
            await loadList()
        } catch (err) {
            console.error("[formations] restore error:", err)
            toast.error("Échec de la restauration")
        }
    }

    const categoryOptions: FilterOption[] = [
        { value: "all", label: "Toutes les catégories" },
        ...categories.map((c) => ({ value: c.id, label: c.name })),
    ]

    return (
        <div className="space-y-4">
            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            setPage(1)
                            loadList()
                        }}
                        className="flex flex-col gap-3 lg:flex-row lg:items-center"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f96a7]" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher par titre, catégorie, instructeur..."
                                className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] pl-9 text-[12px] text-[#313847] shadow-none"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <FilterMenu label="Catégorie" icon={Filter} value={categoryFilter} options={categoryOptions} onChange={(v) => { setCategoryFilter(v); setPage(1) }} />
                            <FilterMenu label="Statut" icon={Filter} value={statusFilter} options={STATUS_OPTIONS} onChange={(v) => { setStatusFilter(v); setPage(1) }} align="end" />
                        </div>
                        <Button type="submit" className="h-10 rounded-lg bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]">
                            Rechercher
                        </Button>
                        <Button
                            type="button"
                            className="h-10 rounded-lg bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                            onClick={() => {
                                setCreateForm({ title: "", categoryId: NONE, instructorId: NONE })
                                setCreateOpen(true)
                            }}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Nouvelle formation
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="py-12 text-center text-[#8a92a3]">
                            <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-30" />
                            <p className="text-[13px]">Aucune formation trouvée.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {courses.map((course) => (
                                <div
                                    key={course.id}
                                    className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#ff3b30] to-[#ff8a4c]">
                                            {course.thumbnailUrl && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <Link href={`/formations/${course.id}`} className="block truncate text-[13px] font-semibold text-[#252c3b] hover:underline">
                                                {course.title}
                                            </Link>
                                            <p className="text-[11px] text-[#7f8797]">
                                                {course.instructor?.name ?? "Sans instructeur"} · {course.lessonsCount} leçon{course.lessonsCount > 1 ? "s" : ""} · {formatMinutes(course.totalMinutes)}
                                            </p>
                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                <StatusBadge course={course} />
                                                {(course.categoryRef?.name ?? course.category) && (
                                                    <Badge className="rounded-full border-0 bg-[#eaf1ff] px-2 py-0.5 text-[10px] text-[#1a5fd9]">
                                                        {course.categoryRef?.name ?? course.category}
                                                    </Badge>
                                                )}
                                                <Badge className="rounded-full border-0 bg-[#f1f3f7] px-2 py-0.5 text-[10px] text-[#3d4354]">{LEVEL_LABELS[course.level]}</Badge>
                                                {course.isFree && <Badge className="rounded-full border-0 bg-[#e8f9f1] px-2 py-0.5 text-[10px] text-[#1f9d64]">Gratuit</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/formations/${course.id}`}>
                                            <Button variant="outline" className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]">
                                                <Pencil className="h-3.5 w-3.5" />
                                                Éditer
                                            </Button>
                                        </Link>
                                        {course.isActive ? (
                                            <Button
                                                variant="outline"
                                                className="h-8 rounded-lg border-[#f3d9d9] bg-[#fdf4f4] px-3 text-[11px] text-[#c23c3c] hover:bg-[#fbeaea]"
                                                onClick={() => setArchiveTarget(course)}
                                                title="Archiver"
                                            >
                                                <Archive className="h-3.5 w-3.5" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="h-8 rounded-lg border-[#ebedf4] px-3 text-[11px] text-[#3f4657]"
                                                onClick={() => handleRestore(course)}
                                                title="Restaurer"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <DataPagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        currentCount={courses.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
                        disabled={loading}
                        className="mt-4"
                    />
                </CardContent>
            </Card>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nouvelle formation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-[12px]">Titre *</Label>
                            <Input value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} className="mt-1" placeholder="Ex. Créer son premier visuel avec Photoshop" />
                        </div>
                        <div>
                            <Label className="text-[12px]">Catégorie métier</Label>
                            <Select value={createForm.categoryId} onValueChange={(v) => setCreateForm({ ...createForm, categoryId: v })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE}>Aucune</SelectItem>
                                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-[12px]">Instructeur</Label>
                            <Select value={createForm.instructorId} onValueChange={(v) => setCreateForm({ ...createForm, instructorId: v })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE}>Aucun</SelectItem>
                                    {instructors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-[11px] text-[#8a92a3]">La formation est créée en brouillon ; vous la publierez une fois ses leçons ajoutées.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                        <Button onClick={handleCreate} disabled={creating || !createForm.title.trim()} className="bg-[#0f56d9] text-white hover:bg-[#0a4cc5]">
                            {creating ? "Création..." : "Créer et éditer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archiver cette formation ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            « {archiveTarget?.title} » disparaîtra du catalogue. Les inscriptions, progressions et certificats des apprenants sont conservés, et la formation peut être restaurée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchive} className="bg-[#d64545] hover:bg-[#b93a3a]">Archiver</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function StatusBadge({ course }: { course: ICourse }) {
    if (!course.isActive) {
        return <Badge className="rounded-full border-0 bg-[#2a3140] px-2 py-0.5 text-[10px] text-white">Archivé</Badge>
    }
    return course.isPublished ? (
        <Badge className="rounded-full border-0 bg-[#0f56d9] px-2 py-0.5 text-[10px] text-white">Publié</Badge>
    ) : (
        <Badge className="rounded-full border-0 bg-[#fff6e0] px-2 py-0.5 text-[10px] text-[#9a6b00]">Brouillon</Badge>
    )
}
