"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { messageService } from "@/lib/services/message.service"

export type MessageRecipient = { id: string; name: string }

type MessageModalProps = {
    isOpen: boolean
    onClose: () => void
    recipients: MessageRecipient[]
}

/**
 * Envoi d'un message à un ou plusieurs destinataires : une conversation est
 * ouverte (ou récupérée) par destinataire, puis le contenu y est posté.
 */
export function MessageModal({ isOpen, onClose, recipients }: MessageModalProps) {
    const [content, setContent] = useState("")
    const [sending, setSending] = useState(false)

    const handleSend = async () => {
        const body = content.trim()
        if (!body) {
            toast.error("Le message est vide")
            return
        }

        setSending(true)
        let sent = 0
        const failures: string[] = []

        for (const recipient of recipients) {
            try {
                const res = await messageService.createConversation(recipient.id)
                const conversation = (res as any)?.data ?? res
                const conversationId = conversation?.id ?? conversation?.conversationId
                if (!conversationId) throw new Error("conversation sans identifiant")
                await messageService.sendMessage(String(conversationId), body)
                sent += 1
            } catch (error) {
                console.error("[message-modal] send error:", error)
                failures.push(recipient.name)
            }
        }

        setSending(false)

        if (sent > 0) {
            toast.success(`Message envoyé à ${sent} destinataire(s)`)
            setContent("")
            onClose()
        }
        if (failures.length > 0) {
            toast.error(`Échec pour : ${failures.slice(0, 3).join(", ")}${failures.length > 3 ? "..." : ""}`)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Envoyer un message" size="md">
            <div className="space-y-4">
                <div>
                    <Label>Destinataires ({recipients.length})</Label>
                    <p className="mt-1 max-h-24 overflow-y-auto rounded-lg border border-[#eceff5] bg-[#f8f9fc] px-3 py-2 text-[12px] text-[#4d5567]">
                        {recipients.length === 0
                            ? "Aucun destinataire"
                            : recipients.map((r) => r.name).join(", ")}
                    </p>
                </div>

                <div>
                    <Label htmlFor="message-content">Message *</Label>
                    <Textarea
                        id="message-content"
                        rows={6}
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder="Rédige ton message..."
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
                        Annuler
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || recipients.length === 0}
                        className="bg-[#0f56d9] hover:bg-[#0a4cc5]"
                    >
                        {sending ? "Envoi..." : "Envoyer"}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
