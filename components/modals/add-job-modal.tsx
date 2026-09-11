"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronsUpDown, ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { jobService } from "@/lib/services/job.service"
import { companyService } from "@/lib/services/company.service"
import type { ICompany } from "@/lib/@types/entities"
import { JobExperienceType, JobStatus, JobType } from "@/lib/@types/enums"

interface AddJobModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: () => void
}

const TYPE_LABELS: Record<JobType, string> = {
    [JobType.CDI]: "CDI",
    [JobType.CDD]: "CDD",
    [JobType.STAGE]: "Stage",
    [JobType.ALTERNANCE]: "Alternance",
    [JobType.FREELANCE]: "Freelance",
    [JobType.TEMPS_PARTIEL]: "Temps partiel",
}

const EXPERIENCE_LABELS: Record<JobExperienceType, string> = {
    [JobExperienceType.JUNIOR]: "Junior",
    [JobExperienceType.INTERMEDIAIRE]: "Intermédiaire",
    [JobExperienceType.SENIOR]: "Senior",
    [JobExperienceType.EXPERT]: "Expert",
}

const todayPlus = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}

const EMPTY_FORM = {
    title: "",
    location: "",
    type: "" as JobType | "",
    experience: "" as JobExperienceType | "",
    salary: "",
    description: "",
    requirements: "",
    benefits: "",
    status: JobStatus.ACTIVE as JobStatus,
    publishDate: todayPlus(0),
    endDate: todayPlus(30),
}

export function AddJobModal({ isOpen, onClose, onSubmit }: AddJobModalProps) {
    const [formData, setFormData] = useState(EMPTY_FORM)
    const [company, setCompany] = useState<ICompany | null>(null)
    const [companyPickerOpen, setCompanyPickerOpen] = useState(false)
    const [companyOptions, setCompanyOptions] = useState<ICompany[]>([])
    const [companySearch, setCompanySearch] = useState("")
    const [companyLoading, setCompanyLoading] = useState(false)
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Recherche d'entreprise débattue le temps de laisser l'utilisateur taper.
    useEffect(() => {
        if (!companyPickerOpen) return
        const timeout = setTimeout(async () => {
            setCompanyLoading(true)
            try {
                const res: any = await companyService.getCompanies({ search: companySearch || undefined, limit: 20 })
                setCompanyOptions(Array.isArray(res?.data) ? res.data : [])
            } catch (err) {
                console.error("[add-job-modal] company search error:", err)
            } finally {
                setCompanyLoading(false)
            }
        }, 300)
        return () => clearTimeout(timeout)
    }, [companySearch, companyPickerOpen])

    const resetForm = () => {
        setFormData(EMPTY_FORM)
        setCompany(null)
        setImage(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        setImage(file)
        setImagePreview(file ? URL.createObjectURL(file) : null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title.trim()) {
            toast.error("Le titre du poste est requis")
            return
        }
        setSaving(true)
        try {
            await jobService.createJobOfferAdmin({
                title: formData.title,
                companyId: company?.id ?? null,
                location: formData.location || null,
                type: formData.type || null,
                experience: formData.experience || null,
                salary: formData.salary || null,
                description: formData.description || null,
                benefits: formData.benefits || null,
                requirements: formData.requirements
                    ? formData.requirements.split(",").map((r) => r.trim()).filter(Boolean)
                    : [],
                status: formData.status,
                publishDate: formData.publishDate || null,
                endDate: formData.endDate || null,
                image,
            })
            toast.success("Offre créée")
            resetForm()
            onSubmit()
        } catch (err: any) {
            console.error("[add-job-modal] create error:", err)
            toast.error(err?.message || "Échec de la création de l'offre")
        } finally {
            setSaving(false)
        }
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Créer une nouvelle offre d'emploi" size="lg">
            <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="title">Titre du poste *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label>Entreprise</Label>
                        <Popover open={companyPickerOpen} onOpenChange={setCompanyPickerOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between font-normal"
                                >
                                    {company ? company.name : "Aucune entreprise (offre générique)"}
                                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder="Rechercher une entreprise..."
                                        value={companySearch}
                                        onValueChange={setCompanySearch}
                                    />
                                    <CommandList>
                                        {companyLoading ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="h-4 w-4 animate-spin text-[#8a92a3]" />
                                            </div>
                                        ) : (
                                            <>
                                                <CommandEmpty>Aucune entreprise trouvée.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="__none__"
                                                        onSelect={() => {
                                                            setCompany(null)
                                                            setCompanyPickerOpen(false)
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", !company ? "opacity-100" : "opacity-0")} />
                                                        Aucune entreprise (offre générique)
                                                    </CommandItem>
                                                    {companyOptions.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.id}
                                                            onSelect={() => {
                                                                setCompany(c)
                                                                setCompanyPickerOpen(false)
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", company?.id === c.id ? "opacity-100" : "opacity-0")} />
                                                            {c.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <p className="mt-1 text-[11px] text-[#8a92a3]">Facultatif : l'offre peut être publiée sans entreprise rattachée.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <Label htmlFor="location">Localisation</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Abidjan, Côte d'Ivoire"
                        />
                    </div>
                    <div>
                        <Label htmlFor="type">Type de contrat</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as JobType })}>
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Type de contrat" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(JobType).map((t) => (
                                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="experience">Expérience requise</Label>
                        <Select value={formData.experience} onValueChange={(value) => setFormData({ ...formData, experience: value as JobExperienceType })}>
                            <SelectTrigger id="experience">
                                <SelectValue placeholder="Expérience" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(JobExperienceType).map((exp) => (
                                    <SelectItem key={exp} value={exp}>{EXPERIENCE_LABELS[exp]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <Label htmlFor="salary">Salaire</Label>
                        <Input
                            id="salary"
                            value={formData.salary}
                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                            placeholder="450 000 - 600 000 FCFA"
                        />
                    </div>
                    <div>
                        <Label htmlFor="publishDate">Date de publication</Label>
                        <Input
                            id="publishDate"
                            type="date"
                            value={formData.publishDate}
                            onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="endDate">Date limite</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="description">Description du poste</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description détaillée du poste..."
                        rows={3}
                    />
                </div>

                <div>
                    <Label htmlFor="requirements">Exigences (séparées par des virgules)</Label>
                    <Textarea
                        id="requirements"
                        value={formData.requirements}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        placeholder="React, TypeScript, 3+ ans d'expérience"
                        rows={2}
                    />
                </div>

                <div>
                    <Label htmlFor="benefits">Avantages</Label>
                    <Textarea
                        id="benefits"
                        value={formData.benefits}
                        onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                        placeholder="Télétravail, tickets restaurant, mutuelle..."
                        rows={2}
                    />
                </div>

                <div>
                    <Label>Image de couverture (facultative)</Label>
                    <div className="mt-1 flex items-center gap-3">
                        {imagePreview ? (
                            <div className="relative h-16 w-24 overflow-hidden rounded-lg border border-[#e7ebf3]">
                                <img src={imagePreview} alt="Aperçu" className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setImage(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-16 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#d9dce6] text-[#8a92a3] hover:bg-[#f8f9fc]"
                            >
                                <ImagePlus className="h-4 w-4" />
                                <span className="text-[10px]">Ajouter</span>
                            </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} />
                        <p className="text-[11px] text-[#8a92a3]">PNG, JPG ou WEBP. Utile notamment pour une offre sans entreprise rattachée.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                        Annuler
                    </Button>
                    <Button type="submit" className="bg-[#0f56d9] text-white hover:bg-[#0a4cc5]" disabled={saving}>
                        {saving ? "Création..." : "Créer l'offre"}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
