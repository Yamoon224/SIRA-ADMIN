"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { portfolioService } from "@/lib/services/portfolio.service"
import { userService } from "@/lib/services/user.service"
import type { IUser } from "@/lib/@types/entities"

type AddPortfolioModalProps = {
    isOpen: boolean
    onClose: () => void
    onCreated: () => void | Promise<void>
}

/** POST /portfolios exige un userId : le portfolio est rattaché à un candidat. */
export function AddPortfolioModal({ isOpen, onClose, onCreated }: AddPortfolioModalProps) {
    const [users, setUsers] = useState<IUser[]>([])
    const [userId, setUserId] = useState("")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [skills, setSkills] = useState("")
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen || users.length > 0) return

        const load = async () => {
            setLoading(true)
            try {
                const res = await userService.getUsers({ page: 1, limit: 100 })
                const items = (res as any)?.data ?? res
                setUsers(Array.isArray(items) ? items.filter((u: IUser) => u.role === "USER") : [])
            } catch (error) {
                console.error("[add-portfolio] load users error:", error)
                toast.error("Chargement des candidats impossible")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [isOpen, users.length])

    const handleSubmit = async () => {
        const skillList = skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)

        if (!userId || !title.trim() || !description.trim() || skillList.length === 0) {
            toast.error("Candidat, titre, description et au moins une compétence sont requis")
            return
        }

        setSaving(true)
        try {
            await portfolioService.createPortfolio({
                title: title.trim(),
                description: description.trim(),
                skills: skillList,
                createdDate: new Date().toISOString().split("T")[0],
                userId,
            })
            toast.success("Portfolio créé")
            setUserId("")
            setTitle("")
            setDescription("")
            setSkills("")
            onClose()
            await onCreated()
        } catch (error) {
            console.error("[add-portfolio] create error:", error)
            toast.error("Création impossible")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Créer un portfolio" size="md">
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
                    <Label htmlFor="portfolio-title">Titre *</Label>
                    <Input
                        id="portfolio-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Refonte d'une application mobile"
                    />
                </div>

                <div>
                    <Label htmlFor="portfolio-description">Description *</Label>
                    <Textarea
                        id="portfolio-description"
                        rows={4}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                </div>

                <div>
                    <Label htmlFor="portfolio-skills">Compétences * (séparées par des virgules)</Label>
                    <Input
                        id="portfolio-skills"
                        value={skills}
                        onChange={(event) => setSkills(event.target.value)}
                        placeholder="React, Figma, TypeScript"
                    />
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
                        {saving ? "Création..." : "Créer le portfolio"}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
