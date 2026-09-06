"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
    Download,
    Search,
    Filter,
    MapPin,
    Clock3,
    Briefcase,
    Star,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { searchService, type ISearchFilters } from "@/lib/services/search.service"
import type { IUser, IJobOffer } from "@/lib/@types/entities"

type ResultItem = {
    id: string
    kind: "candidate" | "offer"
    initials: string
    title: string
    subtitle: string
    location: string
    metaOne: string
    metaTwo: string
    tags: string[]
    score?: string
    actionLabel: string
    actionSubLabel?: string
}

function toResultItem(raw: IUser | IJobOffer): ResultItem {
    if ("email" in raw) {
        const u = raw as IUser
        return {
            id: u.id,
            kind: "candidate",
            initials: u.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
            title: u.name,
            subtitle: "Candidat",
            location: "-",
            metaOne: "-",
            metaTwo: new Date(u.registrationDate).toLocaleDateString("fr-FR"),
            tags: [],
            actionLabel: "Voir Profil",
        }
    }
    const j = raw as IJobOffer
    return {
        id: j.id,
        kind: "offer",
        initials: (j.company?.name ?? "??").slice(0, 2).toUpperCase(),
        title: j.title,
        subtitle: j.company?.name ?? "-",
        location: j.location ?? "-",
        metaOne: j.salary ?? "-",
        metaTwo: new Date(j.publishDate).toLocaleDateString("fr-FR"),
        tags: [],
        actionLabel: "Voir Offre",
        actionSubLabel: `${j.applicants ?? 0} candidature${j.applicants !== 1 ? "s" : ""}`,
    }
}

const quickTags = ["Développeurs", "Designers", "Data Scientists", "Marketing", "Remote"]

export default function Page() {
    const router = useRouter()
    const [query, setQuery] = useState("")
    const [includeCandidates, setIncludeCandidates] = useState(true)
    const [includeOffers, setIncludeOffers] = useState(true)
    const [experience, setExperience] = useState([2])
    const [minScore, setMinScore] = useState([70])
    const [location, setLocation] = useState("all")
    const [sector, setSector] = useState("all")
    const [results, setResults] = useState<ResultItem[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [availableLocations, setAvailableLocations] = useState<string[]>([])
    const [availableSectors, setAvailableSectors] = useState<string[]>([])
    const [searched, setSearched] = useState(false)
    const [searching, setSearching] = useState(false)

    useEffect(() => {
        searchService.getAdvancedFilters()
            .then((res) => {
                const f = (res as any)?.data ?? res
                setAvailableLocations(f?.locations ?? [])
                setAvailableSectors(f?.sectors ?? [])
            })
            .catch(() => { /* ignore */ })
    }, [])

    const handleSearch = async () => {
        setSearching(true)
        setSearched(true)
        try {
            const filters: ISearchFilters = {
                location: location !== "all" ? location : undefined,
                sector: sector !== "all" ? sector : undefined,
                experience: `${experience[0]}`,
                minScore: minScore[0],
                page: 1,
                limit: 20,
            }
            const type = includeCandidates && includeOffers ? "all" : includeCandidates ? "candidate" : "offer"
            const res = await searchService.search(query, { ...filters, type })
            const items = (res as any)?.data ?? res ?? []
            const arr = Array.isArray(items) ? items : []
            setResults(arr.map(toResultItem))
            setTotalCount((res as any)?.meta?.total ?? arr.length)
        } catch (err) {
            console.error("[recherche] search error:", err)
            toast.error("Recherche impossible")
            setResults([])
        } finally {
            setSearching(false)
        }
    }

    /** Renvoie vers la page de gestion correspondant au résultat, pré-filtrée. */
    const openResult = (item: ResultItem) => {
        if (item.kind === "candidate") {
            router.push(`/students?q=${encodeURIComponent(item.title)}`)
        } else {
            router.push(`/offres-emploi?entreprise=${encodeURIComponent(item.title)}`)
        }
    }

    const handleExport = async () => {
        try {
            const filters: ISearchFilters = {
                location: location !== "all" ? location : undefined,
                sector: sector !== "all" ? sector : undefined,
                type: includeCandidates && includeOffers ? "all" : includeCandidates ? "candidate" : "offer",
            }
            const res = await searchService.exportResults(query, filters)
            const blob = new Blob([res as any], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "resultats-recherche.csv"
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Export CSV généré")
        } catch (err) {
            console.error("[recherche] export error:", err)
            toast.error("Export impossible")
        }
    }

    const filteredResults = useMemo(() => {
        return results.filter((item) => {
            const includeKind = (item.kind === "candidate" && includeCandidates) || (item.kind === "offer" && includeOffers)
            return includeKind
        })
    }, [results, includeCandidates, includeOffers])

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Recherche Avancée</h1>
                    <p className="mt-1 text-[14px] text-[#7f8797]">
                        Moteur de recherche intelligent pour candidats et offres d'emploi
                    </p>
                </div>

                <Button
                    className="mt-1 h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5]"
                    onClick={handleExport}
                >
                    <Download className="h-3.5 w-3.5" />
                    Exporter Résultats
                </Button>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f96a7]" />
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder="Rechercher candidats, postes, compétences..."
                                className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] pl-9 text-[12px] text-[#313847] shadow-none"
                            />
                        </div>
                        <Button
                            className="h-10 rounded-full bg-[#2f80ed] px-5 text-[12px] font-semibold text-white hover:bg-[#2575e3]"
                            onClick={handleSearch}
                            disabled={searching}
                        >
                            <Search className="h-3.5 w-3.5" />
                            {searching ? "Recherche…" : "Rechercher"}
                        </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {quickTags.map((tag) => (
                            <Badge
                                key={tag}
                                className="cursor-pointer rounded-full border border-[#e7ebf3] bg-white px-2 py-0.5 text-[10px] text-[#3f4657]"
                                onClick={() => { setQuery(tag); }}
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 flex items-center gap-2 text-[28px] font-semibold text-[#242a38]">
                            <Filter className="h-4 w-4" />
                            Filtres Avancés
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <p className="mb-2 text-[12px] font-medium text-[#4a5162]">Type de recherche</p>
                                <div className="space-y-2 text-[12px]">
                                    <label className="flex items-center gap-2 text-[#4a5162]">
                                        <Checkbox checked={includeCandidates} onCheckedChange={(value) => setIncludeCandidates(Boolean(value))} />
                                        Candidats
                                    </label>
                                    <label className="flex items-center gap-2 text-[#4a5162]">
                                        <Checkbox checked={includeOffers} onCheckedChange={(value) => setIncludeOffers(Boolean(value))} />
                                        Offres d'emploi
                                    </label>
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-[12px] font-medium text-[#4a5162]">Localisation</p>
                                <Select value={location} onValueChange={setLocation}>
                                    <SelectTrigger className="h-10 rounded-lg border-[#eceff5] bg-[#f8f9fc] text-[12px] text-[#4d5567]">
                                        <SelectValue placeholder="Choisir une ville" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes les villes</SelectItem>
                                        {availableLocations.map((loc) => (
                                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <p className="mb-2 text-[12px] font-medium text-[#4a5162]">Années d'expérience : {experience[0]}</p>
                                <Slider value={experience} onValueChange={setExperience} max={10} step={1} className="[&_[data-slot=slider-range]]:bg-[#3f7fe8]" />
                                <div className="mt-1 flex justify-between text-[10px] text-[#8a92a3]">
                                    <span>0 ans</span>
                                    <span>10+ ans</span>
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-[12px] font-medium text-[#4a5162]">Score minimum : {minScore[0]}</p>
                                <Slider value={minScore} onValueChange={setMinScore} max={100} step={1} className="[&_[data-slot=slider-range]]:bg-[#3f7fe8]" />
                                <div className="mt-1 flex justify-between text-[10px] text-[#8a92a3]">
                                    <span>0</span>
                                    <span>100</span>
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-[12px] font-medium text-[#4a5162]">Secteur</p>
                                <Select value={sector} onValueChange={setSector}>
                                    <SelectTrigger className="h-10 rounded-lg border-[#eceff5] bg-[#f8f9fc] text-[12px] text-[#4d5567]">
                                        <SelectValue placeholder="Tous secteurs" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous secteurs</SelectItem>
                                        {availableSectors.map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                variant="outline"
                                className="h-9 w-full rounded-lg border-[#eceff5] bg-[#f8f9fc] text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]"
                                onClick={() => { setQuery(""); setLocation("all"); setSector("all"); setExperience([2]); setMinScore([70]); setResults([]); setSearched(false); }}
                            >
                                Réinitialiser Filtres
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] text-[#7f8797]">
                            {searched ? `${totalCount} résultat${totalCount !== 1 ? "s" : ""} trouvé${totalCount !== 1 ? "s" : ""}` : "Lance une recherche"}
                        </p>
                        <Select defaultValue="pertinent">
                            <SelectTrigger className="h-9 w-[170px] rounded-lg border-[#eceff5] bg-[#f8f9fc] text-[12px] text-[#4d5567]">
                                <SelectValue placeholder="Tri" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pertinent">Plus pertinent</SelectItem>
                                <SelectItem value="recent">Plus récent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {filteredResults.length === 0 && searched && !searching ? (
                        <p className="text-center text-[13px] text-[#8a92a3] py-6">Aucun résultat pour cette recherche.</p>
                    ) : (
                        filteredResults.map((item) => (
                            <Card key={item.id} className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                                <CardContent className="px-4 py-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4e8df3] to-[#6b47e8] text-[11px] font-semibold text-white">
                                                {item.initials}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-[16px] font-semibold text-[#232a38]">{item.title}</p>
                                                    <Badge className="rounded-full border-0 bg-[#e7f0ff] px-2 py-0.5 text-[10px] text-[#2f80ed]">
                                                        {item.kind === "candidate" ? "Candidat" : "Offre"}
                                                    </Badge>
                                                    {item.score ? (
                                                        <Badge className="rounded-full border-0 bg-[#edf0f6] px-2 py-0.5 text-[10px] text-[#3d4354]">
                                                            {item.score}
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                                <p className="text-[13px] leading-none text-[#7f8797]">{item.subtitle}</p>

                                                <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-[#7f8797]">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {item.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        {item.kind === "candidate" ? <Briefcase className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                                                        {item.metaOne}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock3 className="h-3.5 w-3.5" />
                                                        {item.metaTwo}
                                                    </span>
                                                </div>

                                                {item.tags.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {item.tags.map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                className="rounded-full border border-[#e7ebf3] bg-white px-2 py-0.5 text-[10px] text-[#3f4657]"
                                                            >
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <Button
                                                onClick={() => openResult(item)}
                                                className="h-9 rounded-full bg-[#2f80ed] px-4 text-[12px] font-semibold text-white hover:bg-[#2575e3]"
                                            >
                                                {item.actionLabel}
                                            </Button>
                                            {item.actionSubLabel ? (
                                                <p className="mt-2 text-[11px] text-[#7f8797]">{item.actionSubLabel}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
