"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sparkles } from "lucide-react"

export type AiToolUsage = { key: string; name: string; value: number }

/**
 * Utilisations enregistrées par outil IA (compteurs réels du backend). La
 * barre situe chaque outil par rapport au plus utilisé ; `null` = chargement.
 */
export function PerformanceChart({ tools }: { tools: AiToolUsage[] | null }) {
    const max = Math.max(1, ...(tools ?? []).map((tool) => tool.value))

    return (
        <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-2 shadow-none">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[31px] font-semibold text-[#242a38]">
                    <Sparkles className="h-4 w-4 text-[#6f52ff]" />
                    Utilisation des Outils IA
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-5">
                {tools === null ? (
                    <p className="text-[11px] text-[#8b92a3]">Chargement…</p>
                ) : tools.length === 0 ? (
                    <p className="text-[11px] text-[#8b92a3]">Aucune donnée disponible.</p>
                ) : (
                    tools.map((tool) => (
                        <div key={tool.key} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[#4c5362]">{tool.name}</span>
                                <span className="text-[#8b92a3]">{tool.value.toLocaleString("fr-FR")}</span>
                            </div>
                            <Progress
                                value={(tool.value / max) * 100}
                                className="h-2 bg-[#e8ebf2] [&_[data-slot=progress-indicator]]:bg-[#4285ff]"
                            />
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
