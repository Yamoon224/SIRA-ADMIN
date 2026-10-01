"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Award,
    Calendar,
    Eye,
    Filter,
    Plus,
    Search,
    Sparkles,
    TrendingUp,
    Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FilterMenu, PERIOD_OPTIONS, matchesPeriod } from "@/components/ui/filter-menu"
import { AddStudentModal } from "@/components/modals/add-student-modal"
import { DetailModal } from "@/components/modals/detail-modal"
import { MessageModal } from "@/components/modals/message-modal"
import { studentsService } from "@/lib/services/students.service"
import { exportToCSV } from "@/lib/export-utils"
import type { IUser } from "@/lib/@types/entities"

const STATUS_OPTIONS = [
    { value: "all", label: "Tous les statuts" },
    { value: "ACTIVE", label: "Actifs" },
    { value: "INACTIVE", label: "Inactifs" },
]

function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

export default function Page() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [periodFilter, setPeriodFilter] = useState("all")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [detailStudent, setDetailStudent] = useState<IUser | null>(null)
    const [isMessageOpen, setIsMessageOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [students, setStudents] = useState<IUser[]>([])
    const [studentStats, setStudentStats] = useState<{
        total: number
        active: number
        inactive: number
        newThisMonth: number
    } | null>(null)
    const [loading, setLoading] = useState(true)

    const loadData = async () => {
        try {
            const [statsRes, listRes] = await Promise.all([
                studentsService.getStudentStats(),
                studentsService.getStudents({ page: 1, limit: 50 }),
            ])
            setStudentStats((statsRes as any)?.data ?? statsRes)
            const items = (listRes as any)?.data ?? listRes
            setStudents(Array.isArray(items) ? items : [])
        } catch (err) {
            console.error("[students] load error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // Lien « Voir Profil » depuis la recherche avancée.
        const q = new URLSearchParams(window.location.search).get("q")
        if (q) setSearchTerm(q)
    }, [])

    const filteredStudents = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase()
        return students.filter((s) => {
            const matchesSearch =
                !normalized || [s.name, s.email].some((v) => (v ?? "").toLowerCase().includes(normalized))
            const matchesStatus = statusFilter === "all" || s.status === statusFilter
            return matchesSearch && matchesStatus && matchesPeriod(s.registrationDate, periodFilter)
        })
    }, [searchTerm, statusFilter, periodFilter, students])

    /** Candidats visés par les actions en lot : la sélection, sinon la liste filtrée. */
    const targetedStudents = useMemo(
        () =>
            selectedIds.length > 0
                ? filteredStudents.filter((s) => selectedIds.includes(s.id))
                : filteredStudents,
        [filteredStudents, selectedIds],
    )

    const allVisibleSelected =
        filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.includes(s.id))

    const toggleStudent = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }

    const toggleAllVisible = () => {
        setSelectedIds(allVisibleSelected ? [] : filteredStudents.map((s) => s.id))
    }

    const handleAddStudent = async (studentData: any) => {
        try {
            await studentsService.createStudent({ ...studentData, password: studentData.password || "goriya123" })
            setIsAddModalOpen(false)
            toast.success("Candidat créé")
            await loadData()
        } catch (err) {
            console.error("[students] create error:", err)
            toast.error("Création impossible")
        }
    }

    const handleExport = async () => {
        // Sélection ou filtre actif : on exporte exactement ce que l'admin voit.
        const isSubset =
            selectedIds.length > 0 || filteredStudents.length !== students.length
        if (isSubset) {
            if (targetedStudents.length === 0) {
                toast.error("Aucun candidat à exporter")
                return
            }
            exportToCSV(
                targetedStudents.map((s) => ({
                    nom: s.name,
                    email: s.email,
                    role: s.role,
                    statut: s.status,
                    entreprise: s.company?.name ?? "",
                    inscription: new Date(s.registrationDate).toLocaleDateString("fr-FR"),
                })),
                "candidats",
            )
            toast.success(`${targetedStudents.length} candidat(s) exporté(s)`)
            return
        }

        try {
            const result = await studentsService.exportCSV()
            const blob = new Blob([result as any], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "candidats.csv"
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Export CSV généré")
        } catch (err) {
            console.error("[students] export error:", err)
            toast.error("Export impossible")
        }
    }

    const handleOpenMessage = () => {
        if (targetedStudents.length === 0) {
            toast.error("Aucun candidat sélectionné")
            return
        }
        setIsMessageOpen(true)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Étudiants/Candidats</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">Gère les profils des candidats sur la plateforme</p>
                </div>

                <Button
                    className="mt-1 h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus className="h-3.5 w-3.5" />
                    Nouveau Candidat
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Total Candidats"
                    value={studentStats ? studentStats.total.toLocaleString("fr-FR") : "-"}
                    note=""
                    noteClass="text-[#23b26f]"
                    icon={Users}
                    borderClass="border-[#d9dce6]"
                    iconBoxClass="bg-[#4a89ef]"
                />
                <KpiCard
                    title="Profils Actifs"
                    value={studentStats ? String(studentStats.active) : "-"}
                    note=""
                    noteClass="text-[#23b26f]"
                    icon={Award}
                    borderClass="border-[#55d5ac]"
                    iconBoxClass="bg-[#2db77f]"
                />
                <KpiCard
                    title="Inactifs"
                    value={studentStats ? String(studentStats.inactive) : "-"}
                    note=""
                    noteClass="text-[#23b26f]"
                    icon={Sparkles}
                    borderClass="border-[#a777ff]"
                    iconBoxClass="bg-[#8550e9]"
                />
                <KpiCard
                    title="Nouveaux ce mois"
                    value={studentStats ? String(studentStats.newThisMonth) : "-"}
                    note=""
                    noteClass="text-[#23b26f]"
                    icon={TrendingUp}
                    borderClass="border-[#f0b475]"
                    iconBoxClass="bg-[#ee9b3b]"
                />
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f96a7]" />
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Rechercher par nom, email, domaine..."
                                className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] pl-9 text-[12px] text-[#313847] shadow-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <FilterMenu
                                label="Filtrer"
                                icon={Filter}
                                value={statusFilter}
                                options={STATUS_OPTIONS}
                                onChange={setStatusFilter}
                            />
                            <FilterMenu
                                label="Date"
                                icon={Calendar}
                                value={periodFilter}
                                options={PERIOD_OPTIONS}
                                onChange={setPeriodFilter}
                                align="end"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-[24px] font-semibold text-[#242a38]">Liste des Candidats</h2>
                        {filteredStudents.length > 0 && (
                            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#4d5567]">
                                <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} />
                                Tout sélectionner ({selectedIds.length})
                            </label>
                        )}
                    </div>

                    {filteredStudents.length === 0 ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucun candidat trouvé.</p>
                    ) : (
                        <div className="space-y-3">
                            {filteredStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex flex-col gap-3 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={selectedIds.includes(student.id)}
                                            onCheckedChange={() => toggleStudent(student.id)}
                                            aria-label={`Sélectionner ${student.name}`}
                                        />
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-[12px] font-semibold text-white">
                                            {getInitials(student.name)}
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-medium text-[#252c3b]">{student.name}</p>
                                            <p className="text-[11px] text-[#7f8797]">{student.email}</p>
                                            <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8a92a3]">
                                                <Badge className="rounded-full border-0 bg-[#f1f3f7] px-2 py-0.5 text-[10px] font-medium text-[#202737]">
                                                    {student.role}
                                                </Badge>
                                                <span>{student.company?.name ?? "-"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                                        <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${student.status === "ACTIVE" ? "bg-[#24bf7e] text-white" : "bg-[#edf0f6] text-[#3d4354]"}`}>
                                            {student.status === "ACTIVE" ? "Actif" : "Inactif"}
                                        </Badge>

                                        <div className="text-right">
                                            <p className="text-[11px] text-[#4a5162]">
                                                {new Date(student.registrationDate).toLocaleDateString("fr-FR")}
                                            </p>
                                            <p className="text-[10px] text-[#8a92a3]">Inscrit le</p>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]"
                                            onClick={() => setDetailStudent(student)}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Voir Profil
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-[12px] text-[#8a92a3]">
                        {selectedIds.length > 0
                            ? `${selectedIds.length} candidat(s) sélectionné(s)`
                            : "Sélectionne des candidats pour des actions en lot (sinon la liste filtrée est utilisée)"}
                    </p>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button
                            variant="outline"
                            className="h-9 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-3 text-[11px] text-[#4d5567] hover:bg-[#f1f4fa]"
                            onClick={handleExport}
                        >
                            Exporter CSV
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-3 text-[11px] text-[#4d5567] hover:bg-[#f1f4fa]"
                            onClick={handleOpenMessage}
                        >
                            Envoyer Message
                        </Button>
                        <Button
                            className="h-9 rounded-lg border border-[#2f80ed] bg-white px-3 text-[11px] text-[#2f80ed] hover:bg-[#eef5ff]"
                            onClick={() => router.push("/scoring-ai")}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Analyse Goriya
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddStudent} />

            <MessageModal
                isOpen={isMessageOpen}
                onClose={() => setIsMessageOpen(false)}
                recipients={targetedStudents.map((s) => ({ id: s.id, name: s.name }))}
            />

            <DetailModal
                isOpen={detailStudent !== null}
                onClose={() => setDetailStudent(null)}
                title={detailStudent?.name ?? ""}
                subtitle={detailStudent?.email}
                fields={
                    detailStudent
                        ? [
                            { label: "Rôle", value: detailStudent.role },
                            { label: "Statut", value: detailStudent.status === "ACTIVE" ? "Actif" : "Inactif" },
                            { label: "Email", value: detailStudent.email },
                            {
                                label: "Inscrit le",
                                value: new Date(detailStudent.registrationDate).toLocaleDateString("fr-FR"),
                            },
                            { label: "Entreprise", value: detailStudent.company?.name ?? "-" },
                            { label: "Identifiant", value: detailStudent.id, full: true },
                        ]
                        : []
                }
                footer={
                    detailStudent ? (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedIds([detailStudent.id])
                                setDetailStudent(null)
                                setIsMessageOpen(true)
                            }}
                        >
                            Envoyer un message
                        </Button>
                    ) : null
                }
            />
        </div>
    )
}

type KpiCardProps = {
    title: string
    value: string
    note: string
    noteClass: string
    icon: React.ComponentType<{ className?: string }>
    borderClass: string
    iconBoxClass: string
}

function KpiCard({ title, value, note, noteClass, icon: Icon, borderClass, iconBoxClass }: KpiCardProps) {
    return (
        <Card className={`rounded-[10px] border bg-white py-0 shadow-none ${borderClass}`}>
            <CardContent className="flex items-start justify-between px-4 py-4">
                <div>
                    <p className="text-[11px] text-[#8b92a3]">{title}</p>
                    <p className="mt-3 text-[35px] leading-none font-semibold text-[#232a38]">{value}</p>
                    <p className={`mt-2 text-[10px] ${noteClass}`}>{note}</p>
                </div>
                <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-lg ${iconBoxClass}`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardContent>
        </Card>
    )
}
