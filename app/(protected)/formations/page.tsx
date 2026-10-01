"use client"

import { useEffect, useState } from "react"
import { BookOpen, FolderKanban, GraduationCap, PlayCircle, Ticket } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { courseService, type ICourseStats } from "@/lib/services/course.service"
import { CoursesTab } from "./_components/courses-tab"
import { CategoriesTab } from "./_components/categories-tab"
import { InstructorsTab } from "./_components/instructors-tab"
import { ProjectsTab } from "./_components/projects-tab"

export default function FormationsPage() {
    const [stats, setStats] = useState<ICourseStats | null>(null)

    const loadStats = async () => {
        try {
            const res = await courseService.stats()
            setStats(res?.data ?? null)
        } catch (err) {
            console.error("[formations] stats error:", err)
        }
    }

    useEffect(() => {
        loadStats()
    }, [])

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Formations</h1>
                <p className="mt-1 text-[14px] text-[#7f8797]">
                    Cours par métier donnés par des professionnels : catalogue, leçons vidéo, instructeurs et projets des apprenants
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
                <KpiCard title="Cours publiés" value={stats ? `${stats.published} / ${stats.courses}` : "-"} icon={BookOpen} iconBoxClass="bg-[#4a89ef]" />
                <KpiCard title="Leçons" value={stats ? String(stats.lessons) : "-"} icon={PlayCircle} iconBoxClass="bg-[#8550e9]" />
                <KpiCard title="Inscriptions" value={stats ? `${stats.enrollments}` : "-"} hint={stats ? `${stats.completions} terminées` : undefined} icon={GraduationCap} iconBoxClass="bg-[#2db77f]" />
                <KpiCard title="Projets à relire" value={stats ? String(stats.pendingProjects) : "-"} icon={FolderKanban} iconBoxClass="bg-[#f08a24]" />
                <KpiCard title="Pass découverte actifs" value={stats ? String(stats.activePasses) : "-"} icon={Ticket} iconBoxClass="bg-[#2b78f6]" />
            </div>

            <Tabs defaultValue="courses">
                <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
                    <TabsTrigger value="courses">Cours</TabsTrigger>
                    <TabsTrigger value="categories">Catégories métiers</TabsTrigger>
                    <TabsTrigger value="instructors">Instructeurs</TabsTrigger>
                    <TabsTrigger value="projects">Projets soumis</TabsTrigger>
                </TabsList>
                <TabsContent value="courses"><CoursesTab onChanged={loadStats} /></TabsContent>
                <TabsContent value="categories"><CategoriesTab /></TabsContent>
                <TabsContent value="instructors"><InstructorsTab /></TabsContent>
                <TabsContent value="projects"><ProjectsTab onChanged={loadStats} /></TabsContent>
            </Tabs>
        </div>
    )
}

function KpiCard({ title, value, hint, icon: Icon, iconBoxClass }: { title: string; value: string; hint?: string; icon: React.ComponentType<{ className?: string }>; iconBoxClass: string }) {
    return (
        <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
            <CardContent className="flex items-start justify-between px-4 py-4">
                <div>
                    <p className="text-[11px] text-[#8b92a3]">{title}</p>
                    <p className="mt-3 text-[26px] leading-none font-semibold text-[#232a38]">{value}</p>
                    {hint && <p className="mt-1 text-[10px] text-[#8b92a3]">{hint}</p>}
                </div>
                <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-lg ${iconBoxClass}`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardContent>
        </Card>
    )
}
