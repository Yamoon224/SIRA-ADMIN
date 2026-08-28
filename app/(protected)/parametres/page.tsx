"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Database, Mail, Palette, Settings, Shield, User, Save } from "lucide-react"
import { settingsService } from "@/lib/services/settings.service"

const TABS = [
    { key: "general", label: "Général", icon: Settings },
    { key: "profile", label: "Profil", icon: User },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "appearance", label: "Apparence", icon: Palette },
    { key: "emails", label: "Emails", icon: Mail },
    { key: "database", label: "Base de Données", icon: Database },
    { key: "security", label: "Sécurité", icon: Shield },
]

export default function Page() {
    const [activeTab, setActiveTab] = useState("general")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [platformName, setPlatformName] = useState("Goriya")
    const [mainUrl, setMainUrl] = useState("https://goriya.com")
    const [supportEmail, setSupportEmail] = useState("support@goriya.com")
    const [timezone, setTimezone] = useState("Africa/Abidjan")
    const [description, setDescription] = useState(
        "Plateforme d'emploi intelligente utilisant l'IA pour optimiser le matching candidats-entreprises et l'analyse de CV.",
    )

    useEffect(() => {
        const load = async () => {
            try {
                const res = await settingsService.getSettings()
                const settings = (res as any)?.data ?? res
                if (settings) {
                    if (settings.platformName) setPlatformName(settings.platformName)
                    if (settings.mainUrl) setMainUrl(settings.mainUrl)
                    if (settings.supportEmail) setSupportEmail(settings.supportEmail)
                    if (settings.timezone) setTimezone(settings.timezone)
                    if (settings.description) setDescription(settings.description)
                }
            } catch (err) {
                console.error("[parametres] load error:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await settingsService.updateSettings({
                platformName,
                mainUrl,
                supportEmail,
                timezone,
                description,
            })
        } catch (err) {
            console.error("[parametres] save error:", err)
        } finally {
            setSaving(false)
        }
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
            <div>
                <h1 className="text-[28px] font-semibold leading-tight text-[#242a38] sm:text-[33px] lg:text-[39px]">Paramètres Système</h1>
                <p className="mt-1 text-[14px] text-[#7f8797]">Configuration générale de la plateforme Goriya</p>
            </div>

            <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                <CardContent className="px-3 py-2">
                    <div className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-7">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex h-9 items-center justify-center gap-2 rounded-lg px-2 text-[12px] ${
                                    activeTab === tab.key
                                        ? "bg-[#f4f6fb] text-[#2f3647]"
                                        : "text-[#7f8797] hover:bg-[#f8f9fc]"
                                }`}
                            >
                                <tab.icon className="h-3.5 w-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {activeTab === "general" && (
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-4">
                        <h2 className="mb-4 text-[31px] font-semibold text-[#242a38]">Configuration Générale</h2>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-[12px] text-[#4a5162]">Nom de la plateforme</label>
                                <Input
                                    value={platformName}
                                    onChange={(event) => setPlatformName(event.target.value)}
                                    placeholder="Nom de la plateforme"
                                    className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] text-[12px] text-[#313847] shadow-none"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-[12px] text-[#4a5162]">URL principale</label>
                                <Input
                                    value={mainUrl}
                                    onChange={(event) => setMainUrl(event.target.value)}
                                    placeholder="https://exemple.com"
                                    className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] text-[12px] text-[#313847] shadow-none"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-[12px] text-[#4a5162]">Email support</label>
                                <Input
                                    value={supportEmail}
                                    onChange={(event) => setSupportEmail(event.target.value)}
                                    placeholder="support@exemple.com"
                                    className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] text-[12px] text-[#313847] shadow-none"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-[12px] text-[#4a5162]">Fuseau horaire</label>
                                <Select value={timezone} onValueChange={setTimezone}>
                                    <SelectTrigger className="h-10 rounded-lg border-[#edf0f5] bg-[#f8f9fc] text-[12px] text-[#313847] shadow-none">
                                        <SelectValue placeholder="Choisir un fuseau" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                                        <SelectItem value="Africa/Abidjan">Africa/Abidjan</SelectItem>
                                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="mb-2 block text-[12px] text-[#4a5162]">Description de la plateforme</label>
                            <Textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                className="min-h-28 rounded-lg border-[#edf0f5] bg-[#f8f9fc] text-[12px] text-[#313847] shadow-none"
                            />
                        </div>

                        <Button
                            className="mt-4 h-9 rounded-full bg-[#0f56d9] px-5 text-[12px] font-semibold text-white hover:bg-[#0a4cc5] disabled:opacity-60"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save className="h-3.5 w-3.5" />
                            {saving ? "Enregistrement…" : "Enregistrer les Modifications"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {activeTab !== "general" && (
                <Card className="rounded-[10px] border border-[#d9dce6] bg-white py-0 shadow-none">
                    <CardContent className="px-4 py-8 text-center text-[13px] text-[#8a92a3]">
                        Section "{TABS.find((t) => t.key === activeTab)?.label}" - à implémenter.
                    </CardContent>
                </Card>
            )}

            <Badge className="hidden">placeholder</Badge>
        </div>
    )
}
