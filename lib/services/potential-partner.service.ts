import { apiRequest } from "@/lib/api-client-http"
import { ApiResponse, IPaginatedResponse } from "@/lib/@types/api"
import { IPotentialPartner } from "@/lib/@types/entities"
import { PotentialPartnerStatus } from "@/lib/@types/enums"

export const potentialPartnerService = {
    getPartners: async (filters?: {
        search?: string
        sector?: string
        city?: string
        companySize?: string
        status?: string
        hasEmail?: boolean
        page?: number
        limit?: number
    }) => {
        return apiRequest<IPaginatedResponse<IPotentialPartner>>({
            endpoint: "/admin/potential-partners/paginate",
            method: "GET",
            params: filters,
        })
    },

    getPartnerById: async (id: string) => {
        return apiRequest<ApiResponse<IPotentialPartner>>({
            endpoint: `/admin/potential-partners/${id}`,
            method: "GET",
        })
    },

    getStats: async () => {
        return apiRequest<ApiResponse<{
            total: number
            new: number
            contacted: number
            interested: number
            converted: number
            withValidEmail: number
        }>>({
            endpoint: "/admin/potential-partners/stats",
            method: "GET",
        })
    },

    getFilters: async () => {
        return apiRequest<ApiResponse<{ sectors: string[]; cities: string[] }>>({
            endpoint: "/admin/potential-partners/filters",
            method: "GET",
        })
    },

    createPartner: async (data: Partial<IPotentialPartner> & { companyName: string }) => {
        return apiRequest<ApiResponse<IPotentialPartner>>({
            endpoint: "/admin/potential-partners",
            method: "POST",
            data,
        })
    },

    updatePartner: async (id: string, data: Partial<IPotentialPartner>) => {
        return apiRequest<ApiResponse<IPotentialPartner>>({
            endpoint: `/admin/potential-partners/${id}`,
            method: "PATCH",
            data,
        })
    },

    updatePartnerStatus: async (id: string, status: PotentialPartnerStatus) => {
        return apiRequest<ApiResponse<IPotentialPartner>>({
            endpoint: `/admin/potential-partners/${id}/status`,
            method: "PATCH",
            data: { status },
        })
    },

    deletePartner: async (id: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/admin/potential-partners/${id}`,
            method: "DELETE",
        })
    },

    importCsv: async (file: File) => {
        const formData = new FormData()
        formData.append("file", file)

        return apiRequest<ApiResponse<{ inserted: number; updated: number; skipped: number; total: number }>>({
            endpoint: "/admin/potential-partners/import",
            method: "POST",
            data: formData,
        })
    },
}
