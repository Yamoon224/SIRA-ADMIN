"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, Mail, Pencil, Plus, Send, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { mailCampaignService } from "@/lib/services/mail-campaign.service"
import { potentialPartnerService } from "@/lib/services/potential-partner.service"
import type { IMailCampaign, IMailCampaignRecipient } from "@/lib/@types/entities"

const STATUS_LABELS: Record<string, string> = {
    draft: "Brouillon",
    sending: "Envoi en cours",
    sent: "Envoyée",
    failed: "Échec",
}

const STATUS_BADGE_CLASS: Record<string, string> = {
    draft: "bg-[#f1f3f7] text-[#3d4354]",
    sending: "bg-[#fff6e0] text-[#9a6b00]",
    sent: "bg-[#e8f9f1] text-[#1f9d64]",
    failed: "bg-[#fdeceb] text-[#d64545]",
}

const DEFAULT_BODY = `<p>Bonjour {{contact}},</p>
<p>Nous avons identifié {{entreprise}} comme un partenaire potentiel intéressant pour Goriya, la plateforme ivoirienne de recrutement et d'employabilité.</p>
<p>Nous serions ravis d'échanger avec vous sur les opportunités de partenariat.</p>
<p>Cordialement,<br>L'équipe Goriya</p>`

type FormState = {
    id?: string
    name: string
    subject: string
    bodyHtml: string
    sector: string
    city: string
    status: string
}

const EMPTY_FORM: FormState = {
    name: "",
    subject: "Goriya x {{entreprise}} — proposition de partenariat",
    bodyHtml: DEFAULT_BODY,
    sector: "",
    city: "",
    status: "",
}

export default function MailCampaignsPage() {
    const [campaigns, setCampaigns] = useState<IMailCampaign[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [recipientCount, setRecipientCount] = useState<number | null>(null)
    const [countingRecipients, setCountingRecipients] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState<IMailCampaign | null>(null)
    const [sendTarget, setSendTarget] = useState<IMailCampaign | null>(null)
    const [sending, setSending] = useState(false)
    const [resumingId, setResumingId] = useState<string | null>(null)
    const [testEmail, setTestEmail] = useState("")
    const [testTarget, setTestTarget] = useState<IMailCampaign | null>(null)
    const [testSending, setTestSending] = useState(false)

    const [recipientsOf, setRecipientsOf] = useState<IMailCampaign | null>(null)
    const [recipients, setRecipients] = useState<IMailCampaignRecipient[]>([])
    const [recipientsLoading, setRecipientsLoading] = useState(false)

    const loadCampaigns = async () => {
        setLoading(true)
        try {
            const res: any = await mailCampaignService.getCampaigns({ page, limit: pageSize })
            setCampaigns(Array.isArray(res?.data) ? res.data : [])
            setTotalPages(res?.meta?.totalPages ?? 1)
            setTotal(res?.meta?.total ?? 0)
        } catch (err) {
            console.error("[campagnes] load error:", err)
            toast.error("Impossible de charger les campagnes")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCampaigns()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize])

    // Rafraîchit automatiquement pendant qu'une campagne est en cours d'envoi,
    // pour voir la progression sans recharger la page manuellement.
    useEffect(() => {
        const hasSending = campaigns.some((c) => c.status === "sending")
        if (!hasSending) return
        const interval = setInterval(loadCampaigns, 4000)
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaigns])

    const openCreate = () => {
        setForm(EMPTY_FORM)
        setRecipientCount(null)
        setFormOpen(true)
    }

    const openEdit = (campaign: IMailCampaign) => {
        setForm({
            id: campaign.id,
            name: campaign.name,
            subject: campaign.subject,
            bodyHtml: campaign.bodyHtml,
            sector: campaign.targetFilters?.sector ?? "",
            city: campaign.targetFilters?.city ?? "",
            status: campaign.targetFilters?.status ?? "",
        })
        setRecipientCount(null)
        setFormOpen(true)
    }

    const refreshRecipientCount = async (f: FormState) => {
        setCountingRecipients(true)
        try {
            const res: any = await mailCampaignService.previewRecipients({
                sector: f.sector || undefined,
                city: f.city || undefined,
                status: f.status || undefined,
            })
            setRecipientCount(res?.data?.count ?? 0)
        } catch (err) {
            console.error("[campagnes] preview error:", err)
        } finally {
            setCountingRecipients(false)
        }
    }

    const handleSave = async () => {
        if (!form.name.trim() || !form.subject.trim() || !form.bodyHtml.trim()) {
            toast.error("Nom, objet et contenu sont requis")
            return
        }
        setSaving(true)
        try {
            const targetFilters = {
                sector: form.sector || undefined,
                city: form.city || undefined,
                status: form.status || undefined,
            }
            if (form.id) {
                await mailCampaignService.updateCampaign(form.id, { name: form.name, subject: form.subject, bodyHtml: form.bodyHtml, targetFilters })
                toast.success("Campagne mise à jour")
            } else {
                await mailCampaignService.createCampaign({ name: form.name, subject: form.subject, bodyHtml: form.bodyHtml, targetFilters })
                toast.success("Campagne créée en brouillon")
            }
            setFormOpen(false)
            await loadCampaigns()
        } catch (err: any) {
            console.error("[campagnes] save error:", err)
            toast.error(err?.message || "Échec de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await mailCampaignService.deleteCampaign(deleteTarget.id)
            toast.success("Campagne supprimée")
            setDeleteTarget(null)
            await loadCampaigns()
        } catch (err: any) {
            console.error("[campagnes] delete error:", err)
            toast.error(err?.message || "Échec de la suppression")
        }
    }

    const handleTestSend = async () => {
        if (!testTarget || !testEmail.trim()) return
        setTestSending(true)
        try {
            await mailCampaignService.testSend(testTarget.id, testEmail.trim())
            toast.success(`Email de test envoyé à ${testEmail.trim()}`)
            setTestTarget(null)
            setTestEmail("")
        } catch (err: any) {
            console.error("[campagnes] test-send error:", err)
            toast.error(err?.message || "Échec de l'envoi de test")
        } finally {
            setTestSending(false)
        }
    }

    const handleSend = async () => {
        if (!sendTarget) return
        setSending(true)
        try {
            const filters = sendTarget.targetFilters ?? {}
            await mailCampaignService.sendCampaign(sendTarget.id, filters)
            toast.success("Envoi de la campagne lancé")
            setSendTarget(null)
            await loadCampaigns()
        } catch (err: any) {
            console.error("[campagnes] send error:", err)
            toast.error(err?.message || "Échec du lancement de l'envoi")
        } finally {
            setSending(false)
        }
    }

    // L'envoi tourne en boucle synchrone côté serveur (pas de worker sur
    // l'hébergement mutualisé) : une requête HTTP trop longue peut expirer
    // avant que tous les destinataires soient traités. Rappeler /send sur
    // une campagne déjà "sending" reprend uniquement les PENDING restants.
    const handleResume = async (campaign: IMailCampaign) => {
        setResumingId(campaign.id)
        try {
            await mailCampaignService.sendCampaign(campaign.id, campaign.targetFilters ?? {})
            await loadCampaigns()
        } catch (err: any) {
            console.error("[campagnes] resume error:", err)
            toast.error(err?.message || "Échec de la reprise de l'envoi")
        } finally {
            setResumingId(null)
        }
    }

    const openRecipients = async (campaign: IMailCampaign) => {
        setRecipientsOf(campaign)
        setRecipientsLoading(true)
        try {
            const res: any = await mailCampaignService.getRecipients(campaign.id, { page: 1, limit: 50 })
            setRecipients(Array.isArray(res?.data) ? res.data : [])
        } catch (err) {
            console.error("[campagnes] recipients error:", err)
        } finally {
            setRecipientsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link href="/partenaires-potentiels" className="mb-1 flex items-center gap-1 text-[12px] text-[#7f8797] hover:text-[#3f4657]">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Potentiels Partenaires
                    </Link>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Campagnes de mailing</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">Rédige, cible et envoie des campagnes vers les partenaires potentiels</p>
                </div>

                <Button className="h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]" onClick={openCreate}>
                    <Plus className="h-3.5 w-3.5" />
                    Nouvelle campagne
                </Button>
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
                                <div key={campaign.id} className="rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[13px] font-medium text-[#252c3b]">{campaign.name}</p>
                                                <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE_CLASS[campaign.status] ?? ""}`}>
                                                    {STATUS_LABELS[campaign.status] ?? campaign.status}
                                                </Badge>
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-[#7f8797]">{campaign.subject}</p>
                                            {campaign.status !== "draft" && (
                                                <p className="mt-1 text-[11px] text-[#8a92a3]">
                                                    {campaign.sentCount}/{campaign.totalRecipients} envoyés
                                                    {campaign.failedCount > 0 ? ` · ${campaign.failedCount} échecs` : ""}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {campaign.status === "draft" && (
                                                <>
                                                    <Button variant="outline" className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657]" onClick={() => openEdit(campaign)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Modifier
                                                    </Button>
                                                    <Button variant="outline" className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657]" onClick={() => setTestTarget(campaign)}>
                                                        <Mail className="h-3.5 w-3.5" />
                                                        Tester
                                                    </Button>
                                                    <Button className="h-8 rounded-lg bg-[#0f56d9] px-3 text-[11px] text-white hover:bg-[#0a4cc5]" onClick={() => setSendTarget(campaign)}>
                                                        <Send className="h-3.5 w-3.5" />
                                                        Envoyer
                                                    </Button>
                                                    <Button variant="outline" className="h-8 rounded-lg border-[#f3d9d9] bg-[#fdf4f4] px-3 text-[11px] text-[#c23c3c]" onClick={() => setDeleteTarget(campaign)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                            {campaign.status === "sending" && campaign.sentCount + campaign.failedCount < campaign.totalRecipients && (
                                                <Button
                                                    className="h-8 rounded-lg bg-[#0f56d9] px-3 text-[11px] text-white hover:bg-[#0a4cc5]"
                                                    disabled={resumingId === campaign.id}
                                                    onClick={() => handleResume(campaign)}
                                                >
                                                    <Send className="h-3.5 w-3.5" />
                                                    {resumingId === campaign.id ? "Envoi..." : "Continuer l'envoi"}
                                                </Button>
                                            )}
                                            {campaign.status !== "draft" && (
                                                <Button variant="outline" className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657]" onClick={() => openRecipients(campaign)}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Destinataires
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {campaign.status === "sending" && campaign.totalRecipients > 0 && (
                                        <Progress value={((campaign.sentCount + campaign.failedCount) / campaign.totalRecipients) * 100} className="mt-3 h-1.5" />
                                    )}
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

            {/* Création / édition */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{form.id ? "Modifier la campagne" : "Nouvelle campagne"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-[12px]">Nom interne de la campagne *</Label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Ex. Prospection PME Abidjan — sept. 2026" />
                        </div>
                        <div>
                            <Label className="text-[12px]">Objet de l'email *</Label>
                            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-[12px]">Contenu de l'email (HTML) *</Label>
                            <Textarea value={form.bodyHtml} onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })} className="mt-1 font-mono text-[12px]" rows={10} />
                            <p className="mt-1 text-[11px] text-[#8a92a3]">
                                Placeholders disponibles : <code>{"{{entreprise}}"}</code>, <code>{"{{contact}}"}</code>, <code>{"{{secteur}}"}</code>, <code>{"{{ville}}"}</code>. Un lien de désabonnement est ajouté automatiquement à l'envoi.
                            </p>
                        </div>

                        <div className="rounded-lg border border-[#e7ebf3] bg-[#f8f9fc] p-3">
                            <p className="mb-2 text-[12px] font-medium text-[#3f4657]">Ciblage des destinataires</p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <Input placeholder="Secteur (exact)" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="h-9 text-[12px]" />
                                <Input placeholder="Ville (exacte)" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-9 text-[12px]" />
                                <Input placeholder="Statut (ex. new)" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 text-[12px]" />
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <p className="text-[11px] text-[#8a92a3]">Seuls les partenaires avec un email valide et non désabonnés sont ciblés.</p>
                                <Button type="button" variant="outline" className="h-8 rounded-lg text-[11px]" onClick={() => refreshRecipientCount(form)} disabled={countingRecipients}>
                                    <Users className="h-3.5 w-3.5" />
                                    {countingRecipients ? "Calcul..." : recipientCount !== null ? `${recipientCount} destinataires` : "Estimer les destinataires"}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-[#0f56d9] text-white hover:bg-[#0a4cc5]">
                            {saving ? "Enregistrement..." : "Enregistrer le brouillon"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Test d'envoi */}
            <Dialog open={!!testTarget} onOpenChange={(open) => !open && setTestTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Envoyer un email de test</DialogTitle>
                    </DialogHeader>
                    <div>
                        <Label className="text-[12px]">Adresse email de réception</Label>
                        <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="mt-1" placeholder="vous@goriya.net" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTestTarget(null)}>Annuler</Button>
                        <Button onClick={handleTestSend} disabled={testSending} className="bg-[#0f56d9] text-white hover:bg-[#0a4cc5]">
                            {testSending ? "Envoi..." : "Envoyer le test"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation d'envoi réel */}
            <AlertDialog open={!!sendTarget} onOpenChange={(open) => !open && setSendTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Lancer l'envoi de « {sendTarget?.name} » ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            L'email sera envoyé à tous les partenaires potentiels joignables correspondant au ciblage de cette campagne.
                            Les envois sont étalés dans le temps (quelques secondes entre chaque email) pour ne pas surcharger la messagerie.
                            Cette action ne peut pas être annulée une fois lancée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSend} disabled={sending} className="bg-[#0f56d9] hover:bg-[#0a4cc5]">
                            {sending ? "Lancement..." : "Envoyer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Suppression */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Le brouillon « {deleteTarget?.name} » sera définitivement supprimé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-[#d64545] hover:bg-[#b93a3a]">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Destinataires */}
            <Dialog open={!!recipientsOf} onOpenChange={(open) => !open && setRecipientsOf(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Destinataires — {recipientsOf?.name}</DialogTitle>
                    </DialogHeader>
                    {recipientsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : (
                        <div className="max-h-96 space-y-2 overflow-y-auto">
                            {recipients.map((r) => (
                                <div key={r.id} className="flex items-center justify-between rounded-lg border border-[#e7ebf3] px-3 py-2 text-[12px]">
                                    <div>
                                        <p className="font-medium text-[#252c3b]">{r.partner.companyName}</p>
                                        <p className="text-[11px] text-[#7f8797]">{r.partner.email}</p>
                                    </div>
                                    <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${STATUS_BADGE_CLASS[r.status] ?? "bg-[#f1f3f7] text-[#3d4354]"}`}>
                                        {r.status}
                                    </Badge>
                                </div>
                            ))}
                            {recipients.length === 0 && <p className="py-6 text-center text-[12px] text-[#8a92a3]">Aucun destinataire.</p>}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
