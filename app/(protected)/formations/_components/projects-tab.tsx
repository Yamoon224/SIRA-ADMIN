"use client"

import { useEffect, useState } from "react"
import { Download, ExternalLink, Filter, FolderKanban, MessageSquareText, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FilterMenu, type FilterOption } from "@/components/ui/filter-menu"
import { DataPagination, DEFAULT_PAGE_SIZE } from "@/components/ui/data-pagination"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { courseProjectService, type ICourseProject } from "@/lib/services/course.service"

const STATUS_OPTIONS: FilterOption[] = [
    { value: "all", label: "Tous" },
    { value: "SUBMITTED", label: "À relire" },
    { value: "REVIEWED", label: "Relus" },
]

export function ProjectsTab({ onChanged }: { onChanged?: () => void }) {
    const [projects, setProjects] = useState<ICourseProject[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("SUBMITTED")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [reviewTarget, setReviewTarget] = useState<ICourseProject | null>(null)
    const [feedback, setFeedback] = useState("")
    const [saving, setSaving] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const res = await courseProjectService.paginate({
                page,
                limit: pageSize,
                search: search || undefined,
                status: statusFilter === "all" ? undefined : statusFilter,
            })
            setProjects(Array.isArray(res?.data) ? res.data : [])
            setTotalPages(res?.meta?.totalPages ?? 1)
            setTotal(res?.meta?.total ?? 0)
        } catch (err) {
            console.error("[formations] projects error:", err)
            toast.error("Impossible de charger les projets")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, statusFilter])

    const handleReview = async () => {
        if (!reviewTarget) return
        setSaving(true)
        try {
            await courseProjectService.review(reviewTarget.id, feedback.trim() || null)
            toast.success("Retour envoyé à l'apprenant")
            setReviewTarget(null)
            onChanged?.()
            await load()
        } catch (err) {
            console.error("[formations] review error:", err)
            toast.error("Échec de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const handleDownload = async (project: ICourseProject) => {
        try {
            const blob = await courseProjectService.downloadFile(project.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = project.fileName ?? "projet"
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error("[formations] download error:", err)
            toast.error("Fichier introuvable")
        }
    }

    return (
        <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
            <CardContent className="px-4 py-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        setPage(1)
                        load()
                    }}
                    className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f96a7]" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher par titre ou apprenant..."
                            className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] pl-9 text-[12px] shadow-none"
                        />
                    </div>
                    <FilterMenu label="Statut" icon={Filter} value={statusFilter} options={STATUS_OPTIONS} onChange={(v) => { setStatusFilter(v); setPage(1) }} align="end" />
                    <Button type="submit" className="h-10 rounded-lg bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]">
                        Rechercher
                    </Button>
                </form>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                    </div>
                ) : projects.length === 0 ? (
                    <div className="py-10 text-center text-[#8a92a3]">
                        <FolderKanban className="mx-auto mb-3 h-10 w-10 opacity-30" />
                        <p className="text-[13px]">Aucun projet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {projects.map((p) => (
                            <div key={p.id} className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-[#252c3b]">{p.title}</p>
                                    <p className="text-[11px] text-[#7f8797]">
                                        {p.user?.name ?? "-"} · {p.user?.email ?? ""} · {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                                    </p>
                                    {p.course && <p className="text-[11px] text-[#1a5fd9]">Cours : {p.course.title}</p>}
                                    {p.description && <p className="mt-1 line-clamp-2 text-[11px] text-[#5d6475]">{p.description}</p>}
                                    {p.feedback && (
                                        <p className="mt-1 text-[11px] italic text-[#1f9d64]">Retour : {p.feedback}</p>
                                    )}
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    {p.status === "REVIEWED" ? (
                                        <Badge className="rounded-full border-0 bg-[#e8f9f1] px-2 py-0.5 text-[10px] text-[#1f9d64]">Relu</Badge>
                                    ) : (
                                        <Badge className="rounded-full border-0 bg-[#fff6e0] px-2 py-0.5 text-[10px] text-[#9a6b00]">À relire</Badge>
                                    )}
                                    {p.linkUrl && (
                                        <a href={p.linkUrl} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="h-8 rounded-lg px-3 text-[11px]">
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                Lien
                                            </Button>
                                        </a>
                                    )}
                                    {p.hasFile && (
                                        <Button variant="outline" className="h-8 rounded-lg px-3 text-[11px]" onClick={() => handleDownload(p)}>
                                            <Download className="h-3.5 w-3.5" />
                                            Fichier
                                        </Button>
                                    )}
                                    <Button
                                        className="h-8 rounded-lg bg-[#0f56d9] px-3 text-[11px] text-white hover:bg-[#0a4cc5]"
                                        onClick={() => {
                                            setReviewTarget(p)
                                            setFeedback(p.feedback ?? "")
                                        }}
                                    >
                                        <MessageSquareText className="h-3.5 w-3.5" />
                                        {p.status === "REVIEWED" ? "Modifier le retour" : "Relire"}
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
                    currentCount={projects.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
                    disabled={loading}
                    className="mt-4"
                />

                <Dialog open={!!reviewTarget} onOpenChange={(open) => !open && setReviewTarget(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Relire « {reviewTarget?.title} »</DialogTitle>
                        </DialogHeader>
                        <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={5}
                            placeholder="Votre retour pour l'apprenant (points forts, axes d'amélioration)..."
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setReviewTarget(null)}>Annuler</Button>
                            <Button onClick={handleReview} disabled={saving} className="bg-[#0f56d9] text-white hover:bg-[#0a4cc5]">
                                {saving ? "Envoi..." : "Marquer comme relu"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}
