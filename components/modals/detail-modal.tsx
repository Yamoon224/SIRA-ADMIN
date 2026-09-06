"use client"

import type { ReactNode } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

export type DetailField = {
    label: string
    value: ReactNode
    /** Occupe toute la largeur (descriptions, listes de compétences...). */
    full?: boolean
}

type DetailModalProps = {
    isOpen: boolean
    onClose: () => void
    title: string
    subtitle?: string
    fields: DetailField[]
    children?: ReactNode
    footer?: ReactNode
    size?: "sm" | "md" | "lg" | "xl"
}

/**
 * Fiche de détail générique utilisée par tous les boutons « Voir Profil » /
 * « Voir Détails » de l'admin.
 */
export function DetailModal({
    isOpen,
    onClose,
    title,
    subtitle,
    fields,
    children,
    footer,
    size = "lg",
}: DetailModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
            {subtitle ? <p className="mb-4 text-[12px] text-[#7f8797]">{subtitle}</p> : null}

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                    <div
                        key={field.label}
                        className={`rounded-lg border border-[#eceff5] bg-[#f8f9fc] px-3 py-2 ${field.full ? "sm:col-span-2" : ""}`}
                    >
                        <dt className="text-[10px] uppercase tracking-wide text-[#8a92a3]">{field.label}</dt>
                        <dd className="mt-1 text-[12px] font-medium text-[#2f3647] break-words">
                            {field.value === null || field.value === undefined || field.value === "" ? "-" : field.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {children ? <div className="mt-4">{children}</div> : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
                {footer}
                <Button variant="outline" onClick={onClose}>
                    Fermer
                </Button>
            </div>
        </Modal>
    )
}
