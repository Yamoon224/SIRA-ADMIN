"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { scoringService, type IScoringCriteria } from "@/lib/services/scoring.service"

type ScoringWeightsModalProps = {
    isOpen: boolean
    onClose: () => void
    criteria: IScoringCriteria[]
    onSaved: () => void | Promise<void>
}

/** Édition des pondérations du moteur de scoring (PATCH /admin/scoring/criteria). */
export function ScoringWeightsModal({ isOpen, onClose, criteria, onSaved }: ScoringWeightsModalProps) {
    const [weights, setWeights] = useState<IScoringCriteria[]>(criteria)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen) setWeights(criteria)
    }, [isOpen, criteria])

    const totalWeight = weights.reduce((sum, item) => sum + (item.weight ?? 0), 0)

    const handleSave = async () => {
        if (weights.length === 0) {
            toast.error("Aucun critère à enregistrer")
            return
        }
        if (Math.round(totalWeight) !== 100) {
            toast.error(`La somme des pondérations doit faire 100 % (actuellement ${Math.round(totalWeight)} %)`)
            return
        }

        setSaving(true)
        try {
            await scoringService.updateCriteria(weights)
            toast.success("Pondérations enregistrées")
            onClose()
            await onSaved()
        } catch (error) {
            console.error("[scoring-weights] save error:", error)
            toast.error("Enregistrement impossible")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajuster les pondérations" size="lg">
            <div className="space-y-4">
                {weights.length === 0 ? (
                    <p className="text-[12px] text-[#8a92a3]">Aucun critère de scoring disponible.</p>
                ) : (
                    weights.map((criterion, index) => (
                        <div key={criterion.name} className="space-y-2">
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="text-[#3f4657]">{criterion.name}</span>
                                <span className="font-medium text-[#2f80ed]">{Math.round(criterion.weight)} %</span>
                            </div>
                            <Slider
                                value={[criterion.weight]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={([value]) =>
                                    setWeights((prev) =>
                                        prev.map((item, i) => (i === index ? { ...item, weight: value } : item)),
                                    )
                                }
                            />
                        </div>
                    ))
                )}

                <div
                    className={`rounded-lg border px-3 py-2 text-[12px] ${Math.round(totalWeight) === 100 ? "border-[#cdeedd] bg-[#f2fbf6] text-[#23b26f]" : "border-[#f6d7b8] bg-[#fff9f2] text-[#cb7b1b]"}`}
                >
                    Total : {Math.round(totalWeight)} % {Math.round(totalWeight) === 100 ? "" : "(doit faire 100 %)"}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                        Annuler
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || weights.length === 0}
                        className="bg-[#0f56d9] hover:bg-[#0a4cc5]"
                    >
                        {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
