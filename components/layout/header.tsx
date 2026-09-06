"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Menu, ChevronDown, LogOut, Settings, User } from "lucide-react"
import { toast } from "sonner"
import { IUser } from "@/lib/@types/entities"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"
import { notificationService } from "@/lib/services/notification.service"
import { Sidebar } from "./sidebar"

type AdminNotification = {
    id: string
    title?: string
    message?: string
    createdAt?: string
    read?: boolean
}

export function Header() {
    const router = useRouter()
    const [user, setUser] = useState<IUser | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [notifLoading, setNotifLoading] = useState(false)

    const unreadCount = notifications.filter((n) => !n.read).length

    const loadNotifications = async () => {
        setNotifLoading(true)
        try {
            const res = await notificationService.getNotifications()
            const items = (res as any)?.data ?? res
            setNotifications(Array.isArray(items) ? items : [])
        } catch (error) {
            console.error("[header] notifications error:", error)
            toast.error("Impossible de charger les notifications")
        } finally {
            setNotifLoading(false)
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead()
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            toast.success("Notifications marquées comme lues")
        } catch (error) {
            console.error("[header] mark all read error:", error)
            toast.error("Action impossible pour le moment")
        }
    }

    const handleMarkRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id)
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
        } catch (error) {
            console.error("[header] mark read error:", error)
        }
    }

    const handleLogout = async () => {
        try {
            await fetch("/api/session", { method: "DELETE" })
        } catch (error) {
            console.error("Logout error:", error)
        } finally {
            localStorage.removeItem("goriya_user")
            router.push("/login")
        }
    }

    useEffect(() => {
        const stored = localStorage.getItem("goriya_user")
        if (stored) {
            try {
                setUser(JSON.parse(stored))
            } catch {
                // ignore parse errors
            }
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const userInitials = user?.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "GA"

    return (
        <header className="bg-[#f3f3f7] border-b border-[#d9d9df] px-4 py-2.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <Sidebar />
                        </SheetContent>
                    </Sheet>

                    <div className="hidden lg:block">
                        <h1 className="text-[27px] leading-tight font-semibold text-[#252a34]">Goriya Back Office</h1>
                        <span className="text-[15px] text-[#808692]">Plateforme d'emploi IA</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 lg:gap-5">
                    <Popover onOpenChange={(open) => { if (open) loadNotifications() }}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                                <Bell className="w-5 h-5 text-[#495061]" />
                                {unreadCount > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e84b4b] px-1 text-[9px] font-semibold text-white">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80 p-0">
                            <div className="flex items-center justify-between border-b border-[#eceff5] px-3 py-2">
                                <p className="text-[13px] font-semibold text-[#2f3647]">Notifications</p>
                                <Button
                                    variant="ghost"
                                    className="h-7 px-2 text-[11px] text-[#2f80ed] hover:bg-[#eef4ff]"
                                    onClick={handleMarkAllRead}
                                    disabled={notifications.length === 0}
                                >
                                    Tout marquer lu
                                </Button>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifLoading ? (
                                    <p className="px-3 py-6 text-center text-[12px] text-[#8a92a3]">Chargement...</p>
                                ) : notifications.length === 0 ? (
                                    <p className="px-3 py-6 text-center text-[12px] text-[#8a92a3]">Aucune notification.</p>
                                ) : (
                                    notifications.map((notification) => (
                                        <button
                                            key={notification.id}
                                            type="button"
                                            onClick={() => handleMarkRead(notification.id)}
                                            className={`block w-full border-b border-[#f2f4f8] px-3 py-2 text-left last:border-0 hover:bg-[#f8f9fc] ${notification.read ? "" : "bg-[#f5f9ff]"}`}
                                        >
                                            <p className="text-[12px] font-medium text-[#2f3647]">
                                                {notification.title ?? "Notification"}
                                            </p>
                                            {notification.message ? (
                                                <p className="mt-0.5 text-[11px] text-[#7f8797]">{notification.message}</p>
                                            ) : null}
                                            {notification.createdAt ? (
                                                <p className="mt-1 text-[10px] text-[#a1a7b6]">
                                                    {new Date(notification.createdAt).toLocaleString("fr-FR")}
                                                </p>
                                            ) : null}
                                        </button>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div ref={menuRef}>
                        <button
                            ref={triggerRef}
                            onClick={() => {
                                if (triggerRef.current) {
                                    const rect = triggerRef.current.getBoundingClientRect()
                                    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                                }
                                setMenuOpen((v) => !v)
                            }}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100 transition-colors"
                        >
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={user?.avatar ?? "/placeholder.svg"} />
                                <AvatarFallback className="bg-[#5865f2] text-white">{userInitials}</AvatarFallback>
                            </Avatar>
                            <div className="hidden lg:block text-left leading-tight">
                                <p className="text-sm text-[#2b3140]">{user?.name ?? "Goriya Admin"}</p>
                                <p className="text-xs text-[#8b92a3]">admin@goriya.com</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-500 hidden lg:block" />
                        </button>

                        {menuOpen && (
                            <div
                                style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
                                className="w-44 bg-white border border-gray-200 rounded-md shadow-lg py-1"
                            >
                                <button
                                    onClick={() => {
                                        setMenuOpen(false)
                                        router.push("/parametres?tab=profile")
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <User className="w-4 h-4" /> Profil
                                </button>
                                <button
                                    onClick={() => {
                                        setMenuOpen(false)
                                        router.push("/parametres")
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <Settings className="w-4 h-4" /> Parametres
                                </button>
                                <hr className="my-1 border-gray-100" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="w-4 h-4" /> Deconnexion
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
