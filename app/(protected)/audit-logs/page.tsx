"use client"

import { useEffect, useState } from "react"
import { Eye, ScrollText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { auditLogService } from "@/lib/services/audit-log.service"
import type { IAuditLog } from "@/lib/@types/entities"
import { DataPagination, DEFAULT_PAGE_SIZE } from "@/components/ui/data-pagination"

const ACTION_LABELS: Record<string, string> = {
    created: "Création",
    updated: "Modification",
    deleted: "Suppression",
    login: "Connexion",
    login_failed: "Connexion échouée",
    logout: "Déconnexion",
}

const ACTION_BADGE_CLASS: Record<string, string> = {
    created: "bg-[#e8f9f1] text-[#1f9d64]",
    updated: "bg-[#eaf1ff] text-[#1a5fd9]",
    deleted: "bg-[#fdeceb] text-[#d64545]",
    login: "bg-[#f1f3f7] text-[#3d4354]",
    login_failed: "bg-[#fdeceb] text-[#d64545]",
    logout: "bg-[#f1f3f7] text-[#3d4354]",
}

export default function Page() {
    const [logs, setLogs] = useState<IAuditLog[]>([])
    const [actions, setActions] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [actionFilter, setActionFilter] = useState<string>("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [selected, setSelected] = useState<IAuditLog | null>(null)

    const loadLogs = async () => {
        setLoading(true)
        try {
            const res = await auditLogService.paginate({
                page,
                limit: pageSize,
                search: search || undefined,
                action: actionFilter || undefined,
            })
            const body = (res as any)?.data !== undefined ? res : { data: [], meta: { total: 0, page: 1, limit: pageSize, totalPages: 1 } }
            setLogs(Array.isArray(body.data) ? body.data : [])
            setTotalPages(body.meta?.totalPages ?? 1)
            setTotal(body.meta?.total ?? 0)
        } catch (err) {
            console.error("[audit-logs] load error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        auditLogService
            .getActions()
            .then((res) => setActions((res as any)?.data ?? []))
            .catch((err) => console.error("[audit-logs] actions error:", err))
    }, [])

    useEffect(() => {
        loadLogs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, actionFilter])

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        loadLogs()
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">
                    Journal d'audit
                </h1>
                <p className="mt-1 text-[14px] text-[#7f8797]">
                    Historique des actions effectuées dans le système ({total.toLocaleString("fr-FR")} entrées)
                </p>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f96a7]" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Rechercher par nom ou email de l'auteur..."
                                className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] pl-9 text-[12px] text-[#313847] shadow-none"
                            />
                        </div>
                        <Select
                            value={actionFilter || "all"}
                            onValueChange={(value) => {
                                setActionFilter(value === "all" ? "" : value)
                                setPage(1)
                            }}
                        >
                            <SelectTrigger className="h-10 w-full rounded-lg border-[#edf0f5] bg-[#f8f9fc] text-[12px] text-[#4d5567] lg:w-56">
                                <SelectValue placeholder="Toutes les actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les actions</SelectItem>
                                {actions.map((action) => (
                                    <SelectItem key={action} value={action}>
                                        {ACTION_LABELS[action] ?? action}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="submit" className="h-10 rounded-lg bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]">
                            Rechercher
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 flex items-center gap-2 text-[24px] font-semibold text-[#242a38]">
                        <ScrollText className="h-5 w-5 text-[#4d5567]" />
                        Entrées
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucune entrée trouvée.</p>
                    ) : (
                        <div className="space-y-2">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex flex-col gap-2 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-medium ${ACTION_BADGE_CLASS[log.action] ?? "bg-[#f1f3f7] text-[#3d4354]"}`}>
                                            {ACTION_LABELS[log.action] ?? log.action}
                                        </Badge>
                                        <div>
                                            <p className="text-[12px] font-medium text-[#252c3b]">
                                                {log.userName ?? "Système"} {log.auditableType ? `- ${log.auditableType.split("\\").pop()}` : ""}
                                            </p>
                                            <p className="text-[11px] text-[#7f8797]">{log.userEmail ?? "-"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[11px] text-[#4a5162]">
                                                {new Date(log.createdAt).toLocaleString("fr-FR")}
                                            </p>
                                            <p className="text-[10px] text-[#8a92a3]">{log.ipAddress ?? "-"}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]"
                                            onClick={() => setSelected(log)}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Détail
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <DataPagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        currentCount={logs.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size)
                            setPage(1)
                        }}
                        disabled={loading}
                        className="mt-4"
                    />
                </CardContent>
            </Card>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 flex items-center gap-2 text-[24px] font-semibold text-[#242a38]">
                        <ScrollText className="h-5 w-5 text-[#4d5567]" />
                        Entrées
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
                        </div>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucune entrée trouvée.</p>
                    ) : (
                        <div className="space-y-2">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex flex-col gap-2 rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-medium ${ACTION_BADGE_CLASS[log.action] ?? "bg-[#f1f3f7] text-[#3d4354]"}`}>
                                            {ACTION_LABELS[log.action] ?? log.action}
                                        </Badge>
                                        <div>
                                            <p className="text-[12px] font-medium text-[#252c3b]">
                                                {log.userName ?? "Système"} {log.auditableType ? `- ${log.auditableType.split("\\").pop()}` : ""}
                                            </p>
                                            <p className="text-[11px] text-[#7f8797]">{log.userEmail ?? "-"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[11px] text-[#4a5162]">
                                                {new Date(log.createdAt).toLocaleString("fr-FR")}
                                            </p>
                                            <p className="text-[10px] text-[#8a92a3]">{log.ipAddress ?? "-"}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="h-8 rounded-lg border-[#ebedf4] bg-[#f8f9fc] px-3 text-[11px] text-[#3f4657] hover:bg-[#f1f4fa]"
                                            onClick={() => setSelected(log)}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Détail
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <DataPagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        currentCount={logs.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size)
                            setPage(1)
                        }}
                        disabled={loading}
                        className="mt-4"
                    />
                </CardContent>
            </Card>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Détail de l'entrée d'audit</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-3 text-[12px]">
                            <div className="grid grid-cols-2 gap-2">
                                <p><span className="text-[#8a92a3]">Action :</span> {ACTION_LABELS[selected.action] ?? selected.action}</p>
                                <p><span className="text-[#8a92a3]">Date :</span> {new Date(selected.createdAt).toLocaleString("fr-FR")}</p>
                                <p><span className="text-[#8a92a3]">Auteur :</span> {selected.userName ?? "Système"} ({selected.userRole ?? "-"})</p>
                                <p><span className="text-[#8a92a3]">Email :</span> {selected.userEmail ?? "-"}</p>
                                <p><span className="text-[#8a92a3]">Ressource :</span> {selected.auditableType?.split("\\").pop() ?? "-"}</p>
                                <p><span className="text-[#8a92a3]">ID ressource :</span> {selected.auditableId ?? "-"}</p>
                                <p><span className="text-[#8a92a3]">Méthode :</span> {selected.method ?? "-"}</p>
                                <p><span className="text-[#8a92a3]">IP :</span> {selected.ipAddress ?? "-"}</p>
                            </div>
                            {selected.url && <p className="break-all"><span className="text-[#8a92a3]">URL :</span> {selected.url}</p>}
                            {selected.oldValues && (
                                <div>
                                    <p className="mb-1 font-medium text-[#4a5162]">Anciennes valeurs</p>
                                    <pre className="max-h-40 overflow-auto rounded-lg bg-[#f8f9fc] p-3 text-[11px]">{JSON.stringify(selected.oldValues, null, 2)}</pre>
                                </div>
                            )}
                            {selected.newValues && (
                                <div>
                                    <p className="mb-1 font-medium text-[#4a5162]">Nouvelles valeurs</p>
                                    <pre className="max-h-40 overflow-auto rounded-lg bg-[#f8f9fc] p-3 text-[11px]">{JSON.stringify(selected.newValues, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
