"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { candidatureService } from "@/lib/services/candidature.service"
import { jobService } from "@/lib/services/job.service"
import { userService } from "@/lib/services/user.service"
import { CandidatureStatus } from "@/lib/@types/enums"
import type { IJobOffer, IUser } from "@/lib/@types/entities"

type AddCandidatureModalProps = {
    isOpen: boolean
    onClose: () => void
    onCreated: () => void | Promise<void>
}

/**
 * Rattache un candidat existant à une offre : POST /candidatures exige un
 * userId et un jobOfferId, d'où les deux listes chargées à l'ouverture.
 */
export function AddCandidatureModal({ isOpen, onClose, onCreated }: AddCandidatureModalProps) {
    const [users, setUsers] = useState<IUser[]>([])
    const [jobs, setJobs] = useState<IJobOffer[]>([])
    const [userId, setUserId] = useState("")
    const [jobOfferId, setJobOfferId] = useState("")
    const [status, setStatus] = useState<CandidatureStatus>(CandidatureStatus.EN_ATTENTE)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen || users.length > 0 || jobs.length > 0) return

        const load = async () => {
            setLoading(true)
            try {
                const [usersRes, jobsRes] = await Promise.all([
                    userService.getUsers({ page: 1, limit: 100 }),
                    jobService.getJobs({ page: 1, limit: 100 }),
                ])
                const userItems = (usersRes as any)?.data ?? usersRes
                setUsers(Array.isArray(userItems) ? userItems.filter((u: IUser) => u.role === "USER") : [])
                const jobItems = (jobsRes as any)?.data ?? jobsRes
                setJobs(Array.isArray(jobItems) ? jobItems : [])
            } catch (error) {
                console.error("[add-candidature] load error:", error)
                toast.error("Chargement des candidats et offres impossible")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [isOpen, users.length, jobs.length])

    const handleSubmit = async () => {
        const candidate = users.find((u) => u.id === userId)
        if (!candidate || !jobOfferId) {
            toast.error("Sélectionne un candidat et une offre")
            return
        }

        setSaving(true)
        try {
            await candidatureService.createCandidature({
                candidateName: candidate.name,
                candidateEmail: candidate.email,
                userId: candidate.id,
                jobOfferId,
                appliedDate: new Date().toISOString(),
                status,
            })
            toast.success("Candidature créée")
            setUserId("")
            setJobOfferId("")
            setStatus(CandidatureStatus.EN_ATTENTE)
            onClose()
            await onCreated()
        } catch (error) {
            console.error("[add-candidature] create error:", error)
            toast.error("Création impossible")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle candidature" size="md">
            <div className="space-y-4">
                <div>
                    <Label>Candidat *</Label>
                    <Select value={userId} onValueChange={setUserId} disabled={loading}>
                        <SelectTrigger>
                            <SelectValue placeholder={loading ? "Chargement..." : "Sélectionner un candidat"} />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.name} — {user.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Offre d'emploi *</Label>
                    <Select value={jobOfferId} onValueChange={setJobOfferId} disabled={loading}>
                        <SelectTrigger>
                            <SelectValue placeholder={loading ? "Chargement..." : "Sélectionner une offre"} />
                        </SelectTrigger>
                        <SelectContent>
                            {jobs.map((job) => (
                                <SelectItem key={job.id} value={job.id}>
                                    {job.title} — {job.company?.name ?? "-"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Statut</Label>
                    <Select value={status} onValueChange={(value) => setStatus(value as CandidatureStatus)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={CandidatureStatus.EN_ATTENTE}>En attente</SelectItem>
                            <SelectItem value={CandidatureStatus.EN_COURS}>En cours d'examen</SelectItem>
                            <SelectItem value={CandidatureStatus.APPROUVEE}>Approuvée</SelectItem>
                            <SelectItem value={CandidatureStatus.REJETEE}>Rejetée</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                        Annuler
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving || loading}
                        className="bg-[#0f56d9] hover:bg-[#0a4cc5]"
                    >
                        {saving ? "Création..." : "Créer la candidature"}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
