import { apiRequest } from "@/lib/api-client-http"
import { ApiResponse, IPaginatedResponse } from "@/lib/@types/api"
import { IPromoCode, IPromoCodeRedemption } from "@/lib/@types/entities"
import { PromoDiscountType } from "@/lib/@types/enums"

export interface PromoCodeInput {
    campaignId: string
    influencerId?: string | null
    code: string
    discountType?: PromoDiscountType | null
    discountValue?: number | null
    commissionRate?: number | null
    maxUses?: number | null
    maxUsesPerUser?: number
    startsAt?: string | null
    endsAt?: string | null
    isActive?: boolean
}

export const promoCodeService = {
    getCodes: async (filters?: { campaignId?: string; influencerId?: string; isActive?: boolean; page?: number; limit?: number }) => {
        return apiRequest<IPaginatedResponse<IPromoCode>>({
            endpoint: "/admin/promo-codes/paginate",
            method: "GET",
            params: filters,
        })
    },

    getCodeById: async (id: string) => {
        return apiRequest<ApiResponse<IPromoCode>>({
            endpoint: `/admin/promo-codes/${id}`,
            method: "GET",
        })
    },

    generateCode: async () => {
        return apiRequest<ApiResponse<{ code: string }>>({
            endpoint: "/admin/promo-codes/generate",
            method: "POST",
        })
    },

    createCode: async (data: PromoCodeInput) => {
        return apiRequest<ApiResponse<IPromoCode>>({
            endpoint: "/admin/promo-codes",
            method: "POST",
            data,
        })
    },

    updateCode: async (id: string, data: Partial<PromoCodeInput>) => {
        return apiRequest<ApiResponse<IPromoCode>>({
            endpoint: `/admin/promo-codes/${id}`,
            method: "PATCH",
            data,
        })
    },

    deleteCode: async (id: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/admin/promo-codes/${id}`,
            method: "DELETE",
        })
    },

    getRedemptions: async (id: string, params?: { page?: number; limit?: number }) => {
        return apiRequest<IPaginatedResponse<IPromoCodeRedemption>>({
            endpoint: `/admin/promo-codes/${id}/redemptions`,
            method: "GET",
            params,
        })
    },
}
