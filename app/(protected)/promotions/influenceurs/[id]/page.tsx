"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { influencerService } from "@/lib/services/influencer.service"
import { influencerPayoutService } from "@/lib/services/influencer-payout.service"
import type { IInfluencer, IInfluencerPayout, IPromoCodeRedemption } from "@/lib/@types/entities"
import { InfluencerPayoutStatus, PromoRedemptionStatus } from "@/lib/@types/enums"

const PAYOUT_STATUS_LABELS: Record<string, string> = {
    PENDING: "En attente",
    PAID: "Payé",
    CANCELLED: "Annulé",
}

const PAYOUT_STATUS_BADGE: Record<string, string> = {
    PENDING: "bg-[#fff6e0] text-[#9a6b00]",
    PAID: "bg-[#e8f9f1] text-[#1f9d64]",
    CANCELLED: "bg-[#fdeceb] text-[#d64545]",
}

export default function InfluencerDetailPage() {
    const params = useParams<{ id: string }>()
    const influencerId = params.id

    const [influencer, setInfluencer] = useState<IInfluencer | null>(null)
    const [balance, setBalance] = useState<{ unpaidBalance: number; totalEarned: number; totalPaid: number } | null>(null)
    const [redemptions, setRedemptions] = useState<IPromoCodeRedemption[]>([])
    const [payouts, setPayouts] = useState<IInfluencerPayout[]>([])
    const [loading, setLoading] = useState(true)

    const [payoutOpen, setPayoutOpen] = useState(false)
    const [selectedRedemptions, setSelectedRedemptions] = useState<string[]>([])
    const [paymentMethod, setPaymentMethod] = useState("")
    const [paymentReference, setPaymentReference] = useState("")
    const [saving, setSaving] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const [infRes, balanceRes, redemptionsRes, payoutsRes]: any[] = await Promise.all([
                influencerService.getInfluencerById(influencerId),
                influencerService.getBalance(influencerId),
                influencerService.getRedemptions(influencerId, { limit: 50 }),
                influencerPayoutService.getPayouts({ influencerId, limit: 50 }),
            ])
            setInfluencer(infRes?.data ?? null)
            setBalance(balanceRes?.data ?? null)
            setRedemptions(Array.isArray(redemptionsRes?.data) ? redemptionsRes.data : [])
            setPayouts(Array.isArray(payoutsRes?.data) ? payoutsRes.data : [])
        } catch (err) {
            console.error("[influenceur/id] load error:", err)
            toast.error("Impossible de charger l'influenceur")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [influencerId])

    const payableRedemptions = redemptions.filter(
        (r) => r.status === PromoRedemptionStatus.CONFIRMED && !r.payoutId && (r.commissionAmount ?? 0) > 0
    )

    const openPayout = () => {
        setSelectedRedemptions(payableRedemptions.map((r) => r.id))
        setPaymentMethod("")
        setPaymentReference("")
        setPayoutOpen(true)
    }

    const toggleRedemption = (id: string) => {
        setSelectedRedemptions((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))
    }

    const selectedTotal = payableRedemptions
        .filter((r) => selectedRedemptions.includes(r.id))
        .reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0)

    const handleCreatePayout = async () => {
        if (selectedRedemptions.length === 0) {
            toast.error("Sélectionnez au moins une commission à verser")
            return
        }
        setSaving(true)
        try {
            await influencerPayoutService.createPayout({
                influencerId,
                redemptionIds: selectedRedemptions,
                paymentMethod: paymentMethod || undefined,
                paymentReference: paymentReference || undefined,
            })
            toast.success("Versement créé")
            setPayoutOpen(false)
            await load()
        } catch (err: any) {
            console.error("[influenceur/id] payout error:", err)
            toast.error(err?.message || "Échec de la création du versement")
        } finally {
            setSaving(false)
        }
    }

    const handleMarkPaid = async (payout: IInfluencerPayout) => {
        try {
            await influencerPayoutService.updatePayout(payout.id, { status: InfluencerPayoutStatus.PAID })
            toast.success("Versement marqué payé")
            await load()
        } catch (err: any) {
            toast.error(err?.message || "Échec de la mise à jour")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link href="/promotions/influenceurs" className="mb-1 flex items-center gap-1 text-[12px] text-[#7f8797] hover:text-[#3f4657]">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Influenceurs
                    </Link>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px]">{influencer?.name ?? "Influenceur"}</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">{influencer?.email || "—"} {influencer?.phone ? `· ${influencer.phone}` : ""}</p>
                </div>
                <Button
                    className="h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                    onClick={openPayout}
                    disabled={payableRedemptions.length === 0}
                >
                    <Wallet className="h-3.5 w-3.5" />
                    Nouveau versement
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <p className="text-[11px] text-[#7f8797]">Solde dû</p>
                        <p className="mt-1 text-[22px] font-semibold text-[#c26a1f]">{(balance?.unpaidBalance ?? 0).toLocaleString("fr-FR")} FCFA</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <p className="text-[11px] text-[#7f8797]">Total généré</p>
                        <p className="mt-1 text-[22px] font-semibold text-[#242a38]">{(balance?.totalEarned ?? 0).toLocaleString("fr-FR")} FCFA</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <p className="text-[11px] text-[#7f8797]">Déjà versé</p>
                        <p className="mt-1 text-[22px] font-semibold text-[#1f9d64]">{(balance?.totalPaid ?? 0).toLocaleString("fr-FR")} FCFA</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[20px] font-semibold text-[#242a38]">Utilisations de ses codes</h2>
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : redemptions.length === 0 ? (
                        <p className="py-6 text-center text-[13px] text-[#8a92a3]">Aucune utilisation pour le moment.</p>
                    ) : (
                        <div className="space-y-2">
                            {redemptions.map((r) => (
                                <div key={r.id} className="flex items-center justify-between rounded-lg border border-[#e7ebf3] px-3 py-2 text-[12px]">
                                    <div>
                                        <p className="font-medium text-[#252c3b]">{r.promoCode} · {r.userName ?? "Utilisateur"}</p>
                                        <p className="text-[11px] text-[#7f8797]">
                                            {r.finalAmount.toLocaleString("fr-FR")} FCFA payés · commission {(r.commissionAmount ?? 0).toLocaleString("fr-FR")} FCFA
                                            {r.payoutId ? " · versée" : ""}
                                        </p>
                                    </div>
                                    <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${r.status === "CONFIRMED" ? "bg-[#e8f9f1] text-[#1f9d64]" : r.status === "PENDING" ? "bg-[#fff6e0] text-[#9a6b00]" : "bg-[#fdeceb] text-[#d64545]"}`}>
                                        {r.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[20px] font-semibold text-[#242a38]">Historique des versements</h2>
                    {payouts.length === 0 ? (
                        <p className="py-6 text-center text-[13px] text-[#8a92a3]">Aucun versement pour le moment.</p>
                    ) : (
                        <div className="space-y-2">
                            {payouts.map((p) => (
                                <div key={p.id} className="flex items-center justify-between rounded-lg border border-[#e7ebf3] px-3 py-2 text-[12px]">
                                    <div>
                                        <p className="font-medium text-[#252c3b]">{p.amount.toLocaleString("fr-FR")} FCFA</p>
                                        <p className="text-[11px] text-[#7f8797]">
                                            {p.paymentMethod || "—"} {p.paymentReference ? `· ${p.paymentReference}` : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${PAYOUT_STATUS_BADGE[p.status] ?? ""}`}>
                                            {PAYOUT_STATUS_LABELS[p.status] ?? p.status}
                                        </Badge>
                                        {p.status === InfluencerPayoutStatus.PENDING && (
                                            <Button variant="outline" className="h-7 rounded-lg px-2 text-[11px]" onClick={() => handleMarkPaid(p)}>
                                                Marquer payé
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nouveau versement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-[#e7ebf3] p-2">
                            {payableRedemptions.map((r) => (
                                <label key={r.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[12px] hover:bg-[#f8f9fc]">
                                    <span className="flex items-center gap-2">
                                        <Checkbox checked={selectedRedemptions.includes(r.id)} onCheckedChange={() => toggleRedemption(r.id)} />
                                        {r.promoCode} · {r.userName ?? "Utilisateur"}
                                    </span>
                                    <span className="font-medium text-[#252c3b]">{(r.commissionAmount ?? 0).toLocaleString("fr-FR")} FCFA</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-right text-[13px] font-semibold text-[#242a38]">
                            Total : {selectedTotal.toLocaleString("fr-FR")} FCFA
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[12px]">Moyen de paiement</Label>
                                <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1" placeholder="Mobile Money" />
                            </div>
                            <div>
                                <Label className="text-[12px]">Référence</Label>
                                <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="mt-1" placeholder="Optionnel" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayoutOpen(false)}>Annuler</Button>
                        <Button onClick={handleCreatePayout} disabled={saving} className="bg-[#0f56d9] text-white hover:bg-[#0a4cc5]">
                            {saving ? "Création..." : "Créer le versement"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
