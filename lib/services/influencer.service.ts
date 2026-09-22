import { apiRequest } from "@/lib/api-client-http"
import { ApiResponse, IPaginatedResponse } from "@/lib/@types/api"
import { IInfluencer, IPromoCodeRedemption } from "@/lib/@types/entities"
import { InfluencerStatus } from "@/lib/@types/enums"

export interface InfluencerInput {
    name: string
    email?: string | null
    phone?: string | null
    defaultCommissionRate?: number | null
    notes?: string | null
    status?: InfluencerStatus
}

export const influencerService = {
    getInfluencers: async (filters?: { page?: number; limit?: number }) => {
        return apiRequest<IPaginatedResponse<IInfluencer>>({
            endpoint: "/admin/influencers/paginate",
            method: "GET",
            params: filters,
        })
    },

    getInfluencerById: async (id: string) => {
        return apiRequest<ApiResponse<IInfluencer>>({
            endpoint: `/admin/influencers/${id}`,
            method: "GET",
        })
    },

    createInfluencer: async (data: InfluencerInput) => {
        return apiRequest<ApiResponse<IInfluencer>>({
            endpoint: "/admin/influencers",
            method: "POST",
            data,
        })
    },

    updateInfluencer: async (id: string, data: Partial<InfluencerInput>) => {
        return apiRequest<ApiResponse<IInfluencer>>({
            endpoint: `/admin/influencers/${id}`,
            method: "PATCH",
            data,
        })
    },

    deleteInfluencer: async (id: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/admin/influencers/${id}`,
            method: "DELETE",
        })
    },

    getBalance: async (id: string) => {
        return apiRequest<ApiResponse<{ unpaidBalance: number; totalEarned: number; totalPaid: number }>>({
            endpoint: `/admin/influencers/${id}/balance`,
            method: "GET",
        })
    },

    getRedemptions: async (id: string, params?: { page?: number; limit?: number }) => {
        return apiRequest<IPaginatedResponse<IPromoCodeRedemption>>({
            endpoint: `/admin/influencers/${id}/redemptions`,
            method: "GET",
            params,
        })
    },
}
