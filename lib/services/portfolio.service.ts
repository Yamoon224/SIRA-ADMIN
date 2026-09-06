import { apiRequest } from "@/lib/api-client-http"
import { ApiResponse, IPaginatedResponse } from "@/lib/@types/api"
import { IPortfolio } from "@/lib/@types/entities"

export const portfolioService = {
    getStats: async () => {
        return apiRequest<ApiResponse<{
            totalPortfolios: number
            totalViews: number
            totalDownloads: number
            totalLikes: number
        }>>({
            endpoint: "/admin/portfolios/stats",
            method: "GET",
        })
    },

    getPortfolios: async (params?: { page?: number; limit?: number; category?: string; search?: string }) => {
        return apiRequest<IPaginatedResponse<IPortfolio>>({
            endpoint: "/portfolios/paginate",
            method: "GET",
            params,
        })
    },

    getFeaturedPortfolios: async () => {
        return apiRequest<ApiResponse<IPortfolio[]>>({
            endpoint: "/admin/portfolios/featured",
            method: "GET",
        })
    },

    getPortfolioById: async (id: string) => {
        return apiRequest<ApiResponse<IPortfolio>>({
            endpoint: `/portfolios/${id}`,
            method: "GET",
        })
    },

    getPopularCategories: async () => {
        return apiRequest<ApiResponse<Array<{ name: string; count: number }>>>({
            endpoint: "/admin/portfolios/categories",
            method: "GET",
        })
    },

    createPortfolio: async (data: {
        title: string
        description: string
        skills: string[]
        createdDate: string
        userId: string
    }) => {
        return apiRequest<ApiResponse<IPortfolio>>({
            endpoint: "/portfolios",
            method: "POST",
            data,
        })
    },

    featurePortfolio: async (id: string, featured: boolean) => {
        return apiRequest<ApiResponse<IPortfolio>>({
            endpoint: `/admin/portfolios/${id}/feature`,
            method: "PATCH",
            data: { featured },
        })
    },

    deletePortfolio: async (id: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/portfolios/${id}`,
            method: "DELETE",
        })
    },
}
