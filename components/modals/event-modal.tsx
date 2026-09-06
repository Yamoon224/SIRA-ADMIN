"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { planningService } from "@/lib/services/planning.service"
import { EventType } from "@/lib/@types/enums"

type EventModalProps = {
    isOpen: boolean
    onClose: () => void
    onCreated: () => void | Promise<void>
    /** Type pré-sélectionné selon l'action rapide déclenchée. */
    defaultType?: EventType
    defaultTitle?: string
}

/** Valeur `datetime-local` pour maintenant + `offsetMinutes`. */
function localDateTime(offsetMinutes: number) {
    const date = new Date(Date.now() + offsetMinutes * 60_000)
    date.setSeconds(0, 0)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function EventModal({ isOpen, onClose, onCreated, defaultType, defaultTitle }: EventModalProps) {
    const [title, setTitle] = useState("")
    const [type, setType] = useState<EventType>(EventType.ENTRETIEN)
    const [startTime, setStartTime] = useState(localDateTime(60))
    const [endTime, setEndTime] = useState(localDateTime(120))
    const [location, setLocation] = useState("")
    const [participants, setParticipants] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setTitle(defaultTitle ?? "")
        setType(defaultType ?? EventType.ENTRETIEN)
        setStartTime(localDateTime(60))
        setEndTime(localDateTime(120))
        setLocation("")
        setParticipants("")
    }, [isOpen, defaultType, defaultTitle])

    const handleSubmit = async () => {
        if (!title.trim() || !startTime || !endTime) {
            toast.error("Titre, début et fin sont requis")
            return
        }
        if (new Date(endTime) <= new Date(startTime)) {
            toast.error("La fin doit être après le début")
            return
        }

        setSaving(true)
        try {
            await planningService.createEvent({
                title: title.trim(),
                type,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                participants: participants
                    .split(",")
                    .map((p) => p.trim())
                    .filter(Boolean),
                location: location.trim() || undefined,
            })
            toast.success("Événement créé")
            onClose()
            await onCreated()
        } catch (error) {
            console.error("[event-modal] create error:", error)
            toast.error("Création impossible")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nouvel événement" size="md">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="event-title">Titre *</Label>
                    <Input
                        id="event-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Entretien technique — Développeur React"
                    />
                </div>

                <div>
                    <Label>Type</Label>
                    <Select value={type} onValueChange={(value) => setType(value as EventType)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={EventType.ENTRETIEN}>Entretien</SelectItem>
                            <SelectItem value={EventType.FORMATION}>Formation</SelectItem>
                            <SelectItem value={EventType.REUNION}>Réunion</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="event-start">Début *</Label>
                        <Input
                            id="event-start"
                            type="datetime-local"
                            value={startTime}
                            onChange={(event) => setStartTime(event.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="event-end">Fin *</Label>
                        <Input
                            id="event-end"
                            type="datetime-local"
                            value={endTime}
                            onChange={(event) => setEndTime(event.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="event-location">Lieu / lien visio</Label>
                    <Input
                        id="event-location"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="Visioconférence, Abidjan..."
                    />
                </div>

                <div>
                    <Label htmlFor="event-participants">Participants (séparés par des virgules)</Label>
                    <Input
                        id="event-participants"
                        value={participants}
                        onChange={(event) => setParticipants(event.target.value)}
                        placeholder="candidat@mail.com, rh@entreprise.com"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                        Annuler
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-[#0f56d9] hover:bg-[#0a4cc5]"
                    >
                        {saving ? "Création..." : "Créer l'événement"}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
