"use client"

import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type FilterOption = { value: string; label: string }

type FilterMenuProps = {
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
    icon?: React.ComponentType<{ className?: string }>
    className?: string
    align?: "start" | "center" | "end"
}

/**
 * Bouton de filtre générique : affiche le libellé par défaut tant qu'aucune
 * option n'est choisie, puis le libellé de l'option active.
 */
export function FilterMenu({
    label,
    value,
    options,
    onChange,
    icon: Icon,
    className,
    align = "start",
}: FilterMenuProps) {
    const active = options.find((option) => option.value === value && option.value !== "all")

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-10 rounded-lg border-[#eceff5] bg-[#f8f9fc] px-4 text-[12px] text-[#4d5567] hover:bg-[#f1f4fa]",
                        active && "border-[#bcd3fb] bg-[#eef4ff] text-[#2f80ed]",
                        className,
                    )}
                >
                    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                    {active ? active.label : label}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align={align} className="w-56 p-1">
                <div className="max-h-72 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={cn(
                                "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#3f4657] hover:bg-[#f1f4fa]",
                                option.value === value && "bg-[#eef4ff] text-[#2f80ed]",
                            )}
                        >
                            <span className="truncate">{option.label}</span>
                            {option.value === value ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

/** Périodes réutilisables pour les filtres « Date ». */
export const PERIOD_OPTIONS: FilterOption[] = [
    { value: "all", label: "Toutes les dates" },
    { value: "7", label: "7 derniers jours" },
    { value: "30", label: "30 derniers jours" },
    { value: "90", label: "90 derniers jours" },
    { value: "365", label: "12 derniers mois" },
]

/** Vrai si `date` tombe dans la fenêtre `period` (en jours, ou "all"). */
export function matchesPeriod(date: Date | string | null | undefined, period: string) {
    if (period === "all") return true
    if (!date) return false
    const days = Number(period)
    if (!Number.isFinite(days)) return true
    const time = new Date(date).getTime()
    if (Number.isNaN(time)) return false
    return time >= Date.now() - days * 24 * 60 * 60 * 1000
}

/** Construit une liste d'options à partir des valeurs distinctes d'une collection. */
export function optionsFrom<T>(items: T[], pick: (item: T) => string | null | undefined, allLabel: string): FilterOption[] {
    const seen = new Set<string>()
    for (const item of items) {
        const raw = pick(item)
        if (raw && raw.trim()) seen.add(raw.trim())
    }
    return [
        { value: "all", label: allLabel },
        ...Array.from(seen)
            .sort((a, b) => a.localeCompare(b, "fr"))
            .map((value) => ({ value, label: value })),
    ]
}
