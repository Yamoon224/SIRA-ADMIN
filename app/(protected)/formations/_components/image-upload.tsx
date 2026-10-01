"use client"

import { useState } from "react"
import { ImagePlus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { courseService } from "@/lib/services/course.service"

/**
 * Envoie une image sur /admin/courses/upload-image et renvoie le chemin
 * stocké (`/storage/courses/...`) — utilisé pour les vignettes de cours, les
 * couvertures de catégories et les photos d'instructeurs.
 */
export function ImageUpload({
    url,
    onChange,
    className = "h-28 w-full",
    rounded = "rounded-lg",
}: {
    url: string | null
    onChange: (path: string | null, url: string | null) => void
    className?: string
    rounded?: string
}) {
    const [uploading, setUploading] = useState(false)

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        setUploading(true)
        try {
            const res = await courseService.uploadImage(file)
            onChange(res.data.path, res.data.url)
        } catch (err: any) {
            console.error("[formations] upload error:", err)
            toast.error(err?.message || "Échec de l'envoi de l'image (5 Mo max)")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className={`relative overflow-hidden border border-dashed border-[#d9dce6] bg-[#f8f9fc] ${rounded} ${className}`}>
            {url ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute right-1.5 top-1.5 h-6 w-6 rounded-full"
                        onClick={() => onChange(null, null)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </>
            ) : (
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-[11px] text-[#8a92a3]">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
                    <ImagePlus className="h-5 w-5" />
                    {uploading ? "Envoi..." : "Ajouter une image"}
                </label>
            )}
        </div>
    )
}
