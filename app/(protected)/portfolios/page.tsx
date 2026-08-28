"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Eye,
    Image,
    Plus,
    Search,
    Filter,
    Star,
    ExternalLink,
    Trophy,
    FolderOpen,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { portfolioService } from "@/lib/services/portfolio.service"
import type { IPortfolio } from "@/lib/@types/entities"

function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

export default function Page() {
    const [query, setQuery] = useState("")
    const [portfolioStats, setPortfolioStats] = useState<{
        totalPortfolios: number
        totalViews: number
        totalDownloads: number
        totalLikes: number
    } | null>(null)
    const [featured, setFeatured] = useState<IPortfolio[]>([])
    const [portfolios, setPortfolios] = useState<IPortfolio[]>([])
    const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, featuredRes, listRes, catRes] = await Promise.all([
                    portfolioService.getStats(),
                    portfolioService.getFeaturedPortfolios(),
                    portfolioService.getPortfolios({ page: 1, limit: 20 }),
                    portfolioService.getPopularCategories(),
                ])
                setPortfolioStats((statsRes as any)?.data ?? statsRes)
                const feat = (featuredRes as any)?.data ?? featuredRes
                setFeatured(Array.isArray(feat) ? feat : [])
                const items = (listRes as any)?.data ?? listRes
                setPortfolios(Array.isArray(items) ? items : [])
                const cats = (catRes as any)?.data ?? catRes
                setCategories(Array.isArray(cats) ? cats : [])
            } catch (err) {
                console.error("[portfolios] load error:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return portfolios
        return portfolios.filter((p) =>
            [p.title, p.description, ...(p.skills ?? []), p.user?.name ?? ""]
                .join(" ")
                .toLowerCase()
                .includes(q),
        )
    }, [query, portfolios])

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
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Portfolios Candidats</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">
                        Vitrine des créations et projets des talents de la plateforme
                    </p>
                </div>

                <Button className="mt-1 h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]">
                    <Plus className="h-3.5 w-3.5" />
                    Créer Portfolio
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Kpi title="Portfolios Actifs" value={portfolioStats ? portfolioStats.totalPortfolios.toLocaleString("fr-FR") : "-"} icon={FolderOpen} />
                <Kpi title="Vues Totales" value={portfolioStats ? portfolioStats.totalViews.toLocaleString("fr-FR") : "-"} icon={Eye} />
                <Kpi title="Likes" value={portfolioStats ? portfolioStats.totalLikes.toLocaleString("fr-FR") : "-"} icon={Star} />
                <Kpi title="Téléchargements" value={portfolioStats ? portfolioStats.totalDownloads.toLocaleString("fr-FR") : "-"} icon={Image} />
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f96a7]" />
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Rechercher portfolio par nom, domaine, technologies..."
                                className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] pl-9 text-[12px] text-[#313847] shadow-none"
                            />
                        </div>
                        <Button variant="outline" className="h-10 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-4 text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]">
                            <Filter className="h-3.5 w-3.5" />
                            Filtres
                        </Button>
                    </div>

                    {categories.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {categories.slice(0, 4).map((cat) => (
                                <Badge key={cat.name} className="rounded-full border border-[#e7ebf3] bg-white px-2 py-0.5 text-[10px] text-[#3f4657]">
                                    {cat.name} ({cat.count})
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr]">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 flex items-center gap-2 text-[24px] font-semibold text-[#242a38]">
                            <Star className="h-4 w-4" />
                            Catégories Populaires
                        </h2>
                        {categories.length === 0 ? (
                            <p className="text-[12px] text-[#8a92a3]">Aucune catégorie disponible.</p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <div key={category.name} className="flex items-center justify-between rounded-lg border border-[#ebeff6] bg-[#f8f9fc] px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf3ff] text-[#3f7fe8]">
                                                <Star className="h-3 w-3" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-medium text-[#2f3647]">{category.name}</p>
                                                <p className="text-[10px] text-[#8a92a3]">{category.count} portfolios</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 flex items-center gap-2 text-[24px] font-semibold text-[#242a38]">
                            <Trophy className="h-4 w-4" />
                            Portfolios en Vedette
                        </h2>

                        {featured.length === 0 ? (
                            <p className="text-[12px] text-[#8a92a3]">Aucun portfolio en vedette.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {featured.map((item) => (
                                    <div key={item.id} className="rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-[10px] font-semibold text-white">
                                                    {item.user?.name ? getInitials(item.user.name) : "?"}
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-medium text-[#252c3b]">{item.user?.name ?? "-"}</p>
                                                </div>
                                            </div>
                                            <Badge className="rounded-full border-0 bg-[#edf0f6] px-2 py-0.5 text-[10px] text-[#3d4354]">
                                                Vedette
                                            </Badge>
                                        </div>

                                        <p className="mt-2 text-[13px] font-medium text-[#2d3443]">{item.title}</p>
                                        <p className="mt-1 text-[11px] text-[#8a92a3]">{item.description}</p>

                                        <div className="mt-2 flex items-center justify-between text-[10px] text-[#8a92a3]">
                                            <span>{(item.skills ?? []).slice(0, 1).join("")}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {item.views}</span>
                                                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {item.likes}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <h2 className="mb-4 text-[30px] font-semibold text-[#242a38]">Tous les Portfolios</h2>

                    {filtered.length === 0 ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucun portfolio trouvé.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((item) => (
                                <div key={item.id} className="rounded-[10px] border border-[#e7ebf3] bg-white px-3 py-3">
                                    <div className="mb-3 flex h-36 items-center justify-center rounded-lg border border-[#edf0f6] bg-[#f9fbff] text-[#8693a8]">
                                        <Image className="h-8 w-8" />
                                    </div>

                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-[10px] font-semibold text-white">
                                                {item.user?.name ? getInitials(item.user.name) : "?"}
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-medium text-[#252c3b]">{item.user?.name ?? "-"}</p>
                                            </div>
                                        </div>
                                        {item.featured ? (
                                            <Badge className="rounded-full border-0 bg-[#edf0f6] px-2 py-0.5 text-[10px] text-[#3d4354]">Vedette</Badge>
                                        ) : null}
                                    </div>

                                    <p className="mt-2 text-[13px] font-medium text-[#2d3443]">{item.title}</p>
                                    <p className="mt-1 text-[11px] text-[#8a92a3]">{item.description}</p>

                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {(item.skills ?? []).map((tag) => (
                                            <Badge key={tag} className="rounded-full border border-[#e7ebf3] bg-white px-2 py-0.5 text-[10px] text-[#3f4657]">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between text-[10px] text-[#8a92a3]">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {item.views}</span>
                                            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {item.likes}</span>
                                        </div>
                                        <Button variant="ghost" className="h-6 w-6 p-0 text-[#697286] hover:bg-[#f2f5fb]">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

type KpiProps = {
    title: string
    value: string
    icon: React.ComponentType<{ className?: string }>
}

function Kpi({ title, value, icon: Icon }: KpiProps) {
    return (
        <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
            <CardContent className="flex items-start justify-between px-4 py-4">
                <div>
                    <p className="text-[11px] text-[#8b92a3]">{title}</p>
                    <p className="mt-3 text-[35px] leading-none font-semibold text-[#232a38]">{value}</p>
                </div>
                <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a89ef]">
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardContent>
        </Card>
    )
}
