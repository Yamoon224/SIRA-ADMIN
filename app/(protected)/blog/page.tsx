"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { articleService, type IArticle } from "@/lib/services/article.service"

const emptyForm = {
    title: "",
    excerpt: "",
    content: "",
    authorName: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
}

export default function BlogPage() {
    const [articles, setArticles] = useState<IArticle[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<IArticle | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)

    const load = () => {
        setLoading(true)
        articleService.getArticles({ limit: 50 })
            .then((res: any) => setArticles(res?.data ?? []))
            .catch(() => toast.error("Impossible de charger les articles"))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
        setCoverFile(null)
        setDialogOpen(true)
    }

    const openEdit = (article: IArticle) => {
        setEditing(article)
        setForm({
            title: article.title,
            excerpt: article.excerpt ?? "",
            content: article.content,
            authorName: article.authorName ?? "",
            status: article.status,
        })
        setCoverFile(null)
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.title || !form.content) {
            toast.error("Titre et contenu sont requis")
            return
        }
        setSaving(true)
        try {
            const body = new FormData()
            body.append("title", form.title)
            body.append("excerpt", form.excerpt)
            body.append("content", form.content)
            body.append("authorName", form.authorName)
            body.append("status", form.status)
            if (coverFile) body.append("coverImage", coverFile)

            if (editing) {
                await articleService.updateArticle(editing.id, body)
                toast.success("Article mis à jour")
            } else {
                await articleService.createArticle(body)
                toast.success("Article créé")
            }
            setDialogOpen(false)
            load()
        } catch (err: any) {
            toast.error(err?.message || "Erreur lors de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (article: IArticle) => {
        if (!confirm(`Supprimer l'article "${article.title}" ?`)) return
        try {
            await articleService.deleteArticle(article.id)
            toast.success("Article supprimé")
            load()
        } catch {
            toast.error("Erreur lors de la suppression")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-foreground">Blog</h1>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Nouvel article
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <Table className="min-w-[720px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Auteur</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Publié le</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {articles.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun article pour l'instant.</TableCell></TableRow>
                            ) : articles.map((article) => (
                                <TableRow key={article.id}>
                                    <TableCell className="font-medium">{article.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{article.authorName || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={article.status === "PUBLISHED" ? "default" : "secondary"}>
                                            {article.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("fr-FR") : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(article)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(article)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        <Textarea placeholder="Extrait (résumé court)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
                        <Textarea placeholder="Contenu de l'article" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} />
                        <Input placeholder="Auteur" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
                        <div>
                            <label className="text-sm text-muted-foreground mb-1 block">Image de couverture</label>
                            <Input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                        </div>
                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "DRAFT" | "PUBLISHED" })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DRAFT">Brouillon</SelectItem>
                                <SelectItem value="PUBLISHED">Publié</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Enregistrer" : "Créer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
