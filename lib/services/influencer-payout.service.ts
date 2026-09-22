import { apiRequest } from "@/lib/api-client-http"
import { ApiResponse, IPaginatedResponse } from "@/lib/@types/api"
import { IInfluencerPayout } from "@/lib/@types/entities"
import { InfluencerPayoutStatus } from "@/lib/@types/enums"

export interface CreatePayoutInput {
    influencerId: string
    redemptionIds: string[]
    paymentMethod?: string
    paymentReference?: string
    notes?: string
    markPaid?: boolean
}

export const influencerPayoutService = {
    getPayouts: async (filters?: { influencerId?: string; page?: number; limit?: number }) => {
        return apiRequest<IPaginatedResponse<IInfluencerPayout>>({
            endpoint: "/admin/influencer-payouts/paginate",
            method: "GET",
            params: filters,
        })
    },

    getPayoutById: async (id: string) => {
        return apiRequest<ApiResponse<IInfluencerPayout>>({
            endpoint: `/admin/influencer-payouts/${id}`,
            method: "GET",
        })
    },

    createPayout: async (data: CreatePayoutInput) => {
        return apiRequest<ApiResponse<IInfluencerPayout>>({
            endpoint: "/admin/influencer-payouts",
            method: "POST",
            data,
        })
    },

    updatePayout: async (id: string, data: Partial<{ status: InfluencerPayoutStatus; paymentMethod: string; paymentReference: string; notes: string }>) => {
        return apiRequest<ApiResponse<IInfluencerPayout>>({
            endpoint: `/admin/influencer-payouts/${id}`,
            method: "PATCH",
            data,
        })
    },
}
