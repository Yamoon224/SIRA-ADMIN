"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, UserPlus, Users, Building2, UserCheck, UserX, MoreHorizontal, Eye, Trash2, Shield } from "lucide-react"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilterMenu } from "@/components/ui/filter-menu"
import { DetailModal } from "@/components/modals/detail-modal"
import { AddUserModal } from "@/components/modals/add-user-modal"
import { userService } from "@/lib/services/user.service"
import { exportToCSV } from "@/lib/export-utils"
import type { IUser } from "@/lib/@types/entities"

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrateur",
    ENTREPRISE: "Entreprise",
    USER: "Utilisateur",
}

const STATUS_OPTIONS = [
    { value: "all", label: "Tous les statuts" },
    { value: "ACTIVE", label: "Actifs" },
    { value: "INACTIVE", label: "Inactifs" },
]

export default function Page() {
    const [stats, setStats] = useState<{
        totalUsers: number
        enterprises: number
        activeUsers: number
        newUsers: number
    } | null>(null)
    const [users, setUsers] = useState<IUser[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [detailUser, setDetailUser] = useState<IUser | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                userService.getUserStats(),
                userService.getUsers({ page: 1, limit: 50 }),
            ])
            setStats((statsRes as any)?.data ?? statsRes)
            const items = (usersRes as any)?.data ?? usersRes
            setUsers(Array.isArray(items) ? items : [])
        } catch (error) {
            console.error("Erreur lors du chargement:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (userId: string, newStatus: "ACTIVE" | "INACTIVE") => {
        try {
            await userService.updateUserStatus(userId, newStatus as any)
            setUsers(users.map((user) => (user.id === userId ? { ...user, status: newStatus as any } : user)))
            toast.success(newStatus === "ACTIVE" ? "Compte réactivé" : "Compte désactivé")
        } catch (error) {
            console.error("Erreur lors de la mise à jour:", error)
            toast.error("Mise à jour impossible")
        }
    }

    const handleAddUser = async (data: { name: string; email: string; role: string; status: string }) => {
        const roleMap: Record<string, string> = {
            Candidat: "USER",
            Entreprise: "ENTREPRISE",
            Admin: "ADMIN",
            RH: "ADMIN",
        }
        try {
            await userService.createUser({
                name: data.name,
                email: data.email,
                role: (roleMap[data.role] ?? "USER") as any,
                status: (data.status === "Actif" ? "ACTIVE" : "INACTIVE") as any,
                password: "goriya123",
            } as any)
            toast.success("Utilisateur créé")
            await loadData()
        } catch (error) {
            console.error("Erreur lors de la création:", error)
            toast.error("Création impossible")
        }
    }

    const handleRoleChange = async (user: IUser, role: "ADMIN" | "USER" | "ENTREPRISE") => {
        try {
            await userService.updateUser(user.id, { role } as any)
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: role as any } : u)))
            toast.success(`Rôle mis à jour : ${ROLE_LABELS[role]}`)
        } catch (error) {
            console.error("Erreur lors du changement de rôle:", error)
            toast.error("Changement de rôle impossible")
        }
    }

    const handleDelete = async (user: IUser) => {
        if (!window.confirm(`Supprimer définitivement le compte de ${user.name} ?`)) return
        try {
            await userService.deleteUser(user.id)
            setUsers((prev) => prev.filter((u) => u.id !== user.id))
            toast.success("Utilisateur supprimé")
        } catch (error) {
            console.error("Erreur lors de la suppression:", error)
            toast.error("Suppression impossible")
        }
    }

    const handleExport = () => {
        if (filteredUsers.length === 0) {
            toast.error("Aucun utilisateur à exporter")
            return
        }
        exportToCSV(
            filteredUsers.map((user) => ({
                nom: user.name,
                email: user.email,
                role: ROLE_LABELS[user.role] ?? user.role,
                statut: user.status,
                inscription: new Date(user.registrationDate).toLocaleDateString("fr-FR"),
            })),
            "utilisateurs",
        )
        toast.success("Export CSV généré")
    }

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            (user.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole =
            roleFilter === "all" ||
            (roleFilter === "admin" && user.role === "ADMIN") ||
            (roleFilter === "user" && user.role === "USER") ||
            (roleFilter === "enterprise" && user.role === "ENTREPRISE")
        const matchesStatus = statusFilter === "all" || user.status === statusFilter
        return matchesSearch && matchesRole && matchesStatus
    })

    if (loading) {
        return <div className="p-6">Chargement...</div>
    }

    return (
        <div className="p-2 space-y-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
                    <p className="text-gray-600">Administrer tous les comptes utilisateurs de la plateforme</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Ajouter Utilisateur
                </Button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Utilisateurs</p>
                                <p className="text-2xl font-bold text-blue-600">{stats?.totalUsers.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-sm flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Entreprises</p>
                                <p className="text-2xl font-bold text-green-600">{stats?.enterprises}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-sm flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Actifs</p>
                                <p className="text-2xl font-bold text-purple-600">{stats?.activeUsers.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-sm flex items-center justify-center">
                                <UserCheck className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Nouveaux</p>
                                <p className="text-2xl font-bold text-orange-600">{stats?.newUsers}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-sm flex items-center justify-center">
                                <UserPlus className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtres et recherche */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex-1">
                            <Input
                                placeholder="Rechercher un utilisateur..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-md"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les rôles</SelectItem>
                                <SelectItem value="admin">Administrateur</SelectItem>
                                <SelectItem value="user">Utilisateur</SelectItem>
                                <SelectItem value="enterprise">Entreprise</SelectItem>
                            </SelectContent>
                        </Select>
                        <FilterMenu
                            label="Filtres"
                            icon={Filter}
                            value={statusFilter}
                            options={STATUS_OPTIONS}
                            onChange={setStatusFilter}
                            align="end"
                            className="h-9 w-full sm:w-auto"
                        />
                        <Button variant="outline" className="w-full sm:w-auto" onClick={handleExport}>
                            Exporter CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Liste des utilisateurs */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4">Utilisateur</th>
                                    <th className="text-left py-3 px-4">Rôle</th>
                                    <th className="text-left py-3 px-4">Statut</th>
                                    <th className="text-left py-3 px-4">Date d'inscription</th>
                                    <th className="text-left py-3 px-4">Références</th>
                                    <th className="text-left py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b hover:bg-gray-50">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                                    <AvatarFallback>
                                                        {user.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-gray-600">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Badge
                                                variant={
                                                    user.role === "ADMIN" ? "default" : user.role === "ENTREPRISE" ? "secondary" : "outline"
                                                }
                                            >
                                                {user.role === "ADMIN"
                                                    ? "Administrateur"
                                                    : user.role === "ENTREPRISE"
                                                        ? "Entreprise"
                                                        : "Utilisateur"}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Badge
                                                variant={user.status === "ACTIVE" ? "default" : "secondary"}
                                                className={
                                                    user.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                                }
                                            >
                                                {user.status === "ACTIVE" ? "Actif" : "Inactif"}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-sm">
                                                {new Date(user.registrationDate).toLocaleDateString("fr-FR")}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-sm text-gray-400">-</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                {user.status === "ACTIVE" ? (
                                                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(user.id, "INACTIVE")}>
                                                        <UserX className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(user.id, "ACTIVE")}>
                                                        <UserCheck className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="outline">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52">
                                                        <DropdownMenuItem onClick={() => setDetailUser(user)}>
                                                            <Eye className="w-4 h-4" /> Voir les détails
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {(["ADMIN", "ENTREPRISE", "USER"] as const)
                                                            .filter((role) => role !== user.role)
                                                            .map((role) => (
                                                                <DropdownMenuItem key={role} onClick={() => handleRoleChange(user, role)}>
                                                                    <Shield className="w-4 h-4" /> Passer en {ROLE_LABELS[role]}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem variant="destructive" onClick={() => handleDelete(user)}>
                                                            <Trash2 className="w-4 h-4" /> Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddUser}
            />

            <DetailModal
                isOpen={detailUser !== null}
                onClose={() => setDetailUser(null)}
                title={detailUser?.name ?? ""}
                subtitle={detailUser?.email}
                fields={
                    detailUser
                        ? [
                            { label: "Rôle", value: ROLE_LABELS[detailUser.role] ?? detailUser.role },
                            { label: "Statut", value: detailUser.status === "ACTIVE" ? "Actif" : "Inactif" },
                            { label: "Email", value: detailUser.email },
                            {
                                label: "Inscrit le",
                                value: new Date(detailUser.registrationDate).toLocaleDateString("fr-FR"),
                            },
                            { label: "Entreprise", value: detailUser.company?.name ?? "-" },
                            { label: "Identifiant", value: detailUser.id, full: true },
                        ]
                        : []
                }
            />
        </div>
    )
}
