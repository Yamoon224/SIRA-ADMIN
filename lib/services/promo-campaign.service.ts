import { apiRequest } from "@/lib/api-client-http"
import { ApiResponse, IPaginatedResponse } from "@/lib/@types/api"
import { IPromoCampaign } from "@/lib/@types/entities"
import { PromoCampaignStatus, PromoDiscountType } from "@/lib/@types/enums"

export interface PromoCampaignInput {
    name: string
    description?: string
    discountType: PromoDiscountType
    discountValue: number
    applicableUserTypes: ("USER" | "ENTREPRISE")[]
    applicablePlanIds?: string[]
    minPlanPrice?: number
    startsAt?: string
    endsAt?: string
    status?: PromoCampaignStatus
}

export const promoCampaignService = {
    getCampaigns: async (filters?: { page?: number; limit?: number }) => {
        return apiRequest<IPaginatedResponse<IPromoCampaign>>({
            endpoint: "/admin/promo-campaigns/paginate",
            method: "GET",
            params: filters,
        })
    },

    getCampaignById: async (id: string) => {
        return apiRequest<ApiResponse<IPromoCampaign>>({
            endpoint: `/admin/promo-campaigns/${id}`,
            method: "GET",
        })
    },

    getStats: async () => {
        return apiRequest<ApiResponse<{
            campaigns: number
            activeCodes: number
            redemptions: number
            totalDiscountGiven: number
            commissionOwed: number
            commissionPaid: number
        }>>({
            endpoint: "/admin/promo-campaigns/stats",
            method: "GET",
        })
    },

    createCampaign: async (data: PromoCampaignInput) => {
        return apiRequest<ApiResponse<IPromoCampaign>>({
            endpoint: "/admin/promo-campaigns",
            method: "POST",
            data,
        })
    },

    updateCampaign: async (id: string, data: Partial<PromoCampaignInput>) => {
        return apiRequest<ApiResponse<IPromoCampaign>>({
            endpoint: `/admin/promo-campaigns/${id}`,
            method: "PATCH",
            data,
        })
    },

    deleteCampaign: async (id: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/admin/promo-campaigns/${id}`,
            method: "DELETE",
        })
    },
}
