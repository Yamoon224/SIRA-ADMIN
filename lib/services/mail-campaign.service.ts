import { apiRequest } from "@/lib/api-client-http"
import { ApiResponse, IPaginatedResponse } from "@/lib/@types/api"
import { IMailCampaign, IMailCampaignRecipient, IMailCampaignTargetFilters } from "@/lib/@types/entities"

export const mailCampaignService = {
    getCampaigns: async (filters?: { page?: number; limit?: number }) => {
        return apiRequest<IPaginatedResponse<IMailCampaign>>({
            endpoint: "/admin/mail-campaigns/paginate",
            method: "GET",
            params: filters,
        })
    },

    getCampaignById: async (id: string) => {
        return apiRequest<ApiResponse<IMailCampaign>>({
            endpoint: `/admin/mail-campaigns/${id}`,
            method: "GET",
        })
    },

    createCampaign: async (data: { name: string; subject: string; bodyHtml: string; targetFilters?: IMailCampaignTargetFilters }) => {
        return apiRequest<ApiResponse<IMailCampaign>>({
            endpoint: "/admin/mail-campaigns",
            method: "POST",
            data,
        })
    },

    updateCampaign: async (id: string, data: Partial<{ name: string; subject: string; bodyHtml: string; targetFilters: IMailCampaignTargetFilters }>) => {
        return apiRequest<ApiResponse<IMailCampaign>>({
            endpoint: `/admin/mail-campaigns/${id}`,
            method: "PATCH",
            data,
        })
    },

    deleteCampaign: async (id: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/admin/mail-campaigns/${id}`,
            method: "DELETE",
        })
    },

    previewRecipients: async (filters: IMailCampaignTargetFilters) => {
        return apiRequest<ApiResponse<{ count: number }>>({
            endpoint: "/admin/mail-campaigns/preview-recipients",
            method: "GET",
            params: filters,
        })
    },

    testSend: async (id: string, email: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/admin/mail-campaigns/${id}/test-send`,
            method: "POST",
            data: { email },
        })
    },

    sendCampaign: async (id: string, filters: IMailCampaignTargetFilters) => {
        return apiRequest<ApiResponse<IMailCampaign>>({
            endpoint: `/admin/mail-campaigns/${id}/send`,
            method: "POST",
            data: filters,
        })
    },

    getRecipients: async (id: string, params?: { page?: number; limit?: number }) => {
        return apiRequest<IPaginatedResponse<IMailCampaignRecipient>>({
            endpoint: `/admin/mail-campaigns/${id}/recipients`,
            method: "GET",
            params,
        })
    },
}
