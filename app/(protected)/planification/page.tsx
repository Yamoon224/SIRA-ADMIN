"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Calendar,
    Clock3,
    Plus,
    Users,
    Video,
    Bell,
    CalendarDays,
    CheckCircle2,
} from "lucide-react"
import { planningService } from "@/lib/services/planning.service"
import type { ICalendarEvent } from "@/lib/@types/entities"

function formatTime(iso: string | Date) {
    const d = new Date(iso)
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function durationMinutes(start: string | Date, end: string | Date) {
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000
    if (diff >= 60) return `${Math.round(diff / 60)}h`
    return `${diff} min`
}

const STATUS_CLASS: Record<string, string> = {
    CONFIRMED: "bg-[#2f80ed] text-white",
    PENDING: "bg-[#edf0f6] text-[#3d4354]",
    CANCELLED: "bg-[#ffe7e7] text-[#e84b4b]",
}

const STATUS_LABEL: Record<string, string> = {
    CONFIRMED: "Confirmé",
    PENDING: "Programmé",
    CANCELLED: "Annulé",
}

export default function Page() {
    const [planStats, setPlanStats] = useState<{
        totalEvents: number
        upcomingEvents: number
        completedEvents: number
        cancelledEvents: number
    } | null>(null)
    const [todayEvents, setTodayEvents] = useState<ICalendarEvent[]>([])
    const [upcomingEvents, setUpcomingEvents] = useState<ICalendarEvent[]>([])
    const [loading, setLoading] = useState(true)

    const loadData = async () => {
        const today = new Date().toISOString().split("T")[0]
        try {
            const [statsRes, eventsRes, upcomingRes] = await Promise.all([
                planningService.getStats(),
                planningService.getEvents(today),
                planningService.getUpcomingEvents(5),
            ])
            setPlanStats((statsRes as any)?.data ?? statsRes)
            const evts = (eventsRes as any)?.data ?? eventsRes
            setTodayEvents(Array.isArray(evts) ? evts : [])
            const upc = (upcomingRes as any)?.data ?? upcomingRes
            setUpcomingEvents(Array.isArray(upc) ? upc : [])
        } catch (err) {
            console.error("[planification] load error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const statCards = [
        { title: "Événements Aujourd'hui", value: planStats ? String(planStats.totalEvents) : "-", icon: Calendar },
        { title: "À Venir", value: planStats ? String(planStats.upcomingEvents) : "-", icon: Users },
        { title: "Terminés", value: planStats ? String(planStats.completedEvents) : "-", icon: Video },
        { title: "Taux de Présence", value: "-", icon: CheckCircle2 },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center p-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0f56d9] border-t-transparent" />
            </div>
        )
    }

    const todayLabel = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Planification & Agenda</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">
                        Gestion centralisée des rendez-vous, entretiens et formations
                    </p>
                </div>

                <Button className="mt-1 h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]">
                    <Plus className="h-3.5 w-3.5" />
                    Nouvel Événement
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                        <CardContent className="flex items-start justify-between px-4 py-4">
                            <div>
                                <p className="text-[11px] text-[#8b92a3]">{stat.title}</p>
                                <p className="mt-3 text-[35px] leading-none font-semibold text-[#232a38]">{stat.value}</p>
                            </div>
                            <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a89ef]">
                                <stat.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none min-h-[640px]">
                    <CardContent className="px-4 py-4">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="flex items-center gap-2 text-[20px] font-semibold text-[#242a38] sm:text-[24px] lg:text-[30px]">
                                <CalendarDays className="h-4 w-4" />
                                Aujourd'hui - {todayLabel}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="h-8 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-3 text-[11px] text-[#4d5567]">
                                    Vue Semaine
                                </Button>
                                <Button variant="outline" className="h-8 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-3 text-[11px] text-[#4d5567]">
                                    Vue Mois
                                </Button>
                            </div>
                        </div>

                        {todayEvents.length === 0 ? (
                            <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucun événement aujourd'hui.</p>
                        ) : (
                            <div className="space-y-3">
                                {todayEvents.map((event) => (
                                    <div key={event.id} className="rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="w-[52px] text-right">
                                                    <p className="text-[18px] font-semibold text-[#232a38]">
                                                        {formatTime(event.startTime)}
                                                    </p>
                                                    <p className="text-[10px] text-[#8a92a3]">
                                                        {event.endTime ? durationMinutes(event.startTime, event.endTime) : "-"}
                                                    </p>
                                                </div>
                                                <div className="mt-0.5 h-10 w-[2px] bg-[#3f7fe8]" />
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-[12px] font-medium text-[#252c3b]">{event.title}</p>
                                                        <Badge className="rounded-full border-0 bg-[#edf0f6] px-2 py-0.5 text-[10px] text-[#3d4354]">
                                                            {event.type}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#7f8797]">
                                                        {event.location ? (
                                                            <span className="flex items-center gap-1">
                                                                <Video className="h-3.5 w-3.5" />
                                                                {event.location}
                                                            </span>
                                                        ) : null}
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3.5 w-3.5" />
                                                            {Array.isArray(event.participants) ? event.participants.join(", ") : "-"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <Badge className={`rounded-full border-0 px-2 py-0.5 text-[10px] ${STATUS_CLASS[event.status] ?? "bg-[#edf0f6] text-[#3d4354]"}`}>
                                                    {STATUS_LABEL[event.status] ?? event.status}
                                                </Badge>
                                                <p className="mt-2 text-[11px] text-[#4d5567]">Détails</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                        <CardContent className="px-4 py-4">
                            <h2 className="mb-3 flex items-center gap-2 text-[24px] font-semibold text-[#242a38]">
                                <Clock3 className="h-4 w-4" />
                                Prochains Événements
                            </h2>

                            {upcomingEvents.length === 0 ? (
                                <p className="text-[12px] text-[#8a92a3]">Aucun événement à venir.</p>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingEvents.map((item) => (
                                        <div key={item.id} className="rounded-lg border border-[#ebeff6] bg-[#f8f9fc] px-3 py-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-[12px] font-medium text-[#2f3647]">{item.title}</p>
                                                    <p className="mt-1 text-[10px] text-[#8a92a3]">
                                                        {new Date(item.startTime).toLocaleDateString("fr-FR")} • {formatTime(item.startTime)}
                                                    </p>
                                                    <p className="text-[10px] text-[#8a92a3]">{item.type}</p>
                                                </div>
                                                {item.endTime ? (
                                                    <Badge className="rounded-full border border-[#d8dce7] bg-white px-2 py-0.5 text-[10px] text-[#3d4354]">
                                                        {durationMinutes(item.startTime, item.endTime)}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                        <CardContent className="px-4 py-4">
                            <h2 className="mb-3 text-[24px] font-semibold text-[#242a38]">Actions Rapides</h2>
                            <div className="space-y-2">
                                <QuickAction icon={Video} label="Programmer Entretien" />
                                <QuickAction icon={Bell} label="Rappel Automatique" />
                                <QuickAction icon={Calendar} label="Bloquer Créneau" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                        <CardContent className="px-4 py-4">
                            <h2 className="mb-4 text-[24px] font-semibold text-[#242a38]">Statistiques du Jour</h2>
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div>
                                    <p className="text-[31px] font-semibold text-[#75b629]">
                                        {planStats?.upcomingEvents ?? "-"}
                                    </p>
                                    <p className="text-[10px] text-[#8a92a3]">À venir</p>
                                </div>
                                <div>
                                    <p className="text-[31px] font-semibold text-[#2f80ed]">
                                        {planStats ? `${planStats.completedEvents}/${planStats.totalEvents}` : "-"}
                                    </p>
                                    <p className="text-[10px] text-[#8a92a3]">Événements terminés</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

type QuickActionProps = {
    icon: React.ComponentType<{ className?: string }>
    label: string
}

function QuickAction({ icon: Icon, label }: QuickActionProps) {
    return (
        <Button variant="outline" className="h-9 w-full justify-start rounded-lg border-[#eceff5] bg-[#f8f9fc] px-3 text-[12px] text-[#41495a] hover:bg-[#f1f4fa]">
            <Icon className="h-3.5 w-3.5" />
            {label}
        </Button>
    )
}
