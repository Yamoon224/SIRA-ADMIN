import { ApiResponse, IPaginatedResponse } from "@/lib/@types/api"
import { apiRequest } from "@/lib/api-client-http"
import { ICandidature } from "@/lib/@types/entities"
import { CandidatureStatus } from "@/lib/@types/enums"

export const candidatureService = {
    getCandidatures: async (params?: { page?: number; limit?: number; status?: CandidatureStatus }) => {
        return apiRequest<IPaginatedResponse<ICandidature>>({
            endpoint: "/candidatures/paginate",
            method: "GET",
            params,
        })
    },

    getCandidatureById: async (id: string) => {
        return apiRequest<ApiResponse<ICandidature>>({
            endpoint: `/candidatures/${id}`,
            method: "GET",
        })
    },

    getStats: async () => {
        return apiRequest<ApiResponse<{
            total: number
            enAttente: number
            enCours: number
            approuvees: number
            rejetees: number
        }>>({
            endpoint: "/admin/candidatures/stats",
            method: "GET",
        })
    },

    createCandidature: async (data: {
        candidateName: string
        candidateEmail: string
        userId: string
        jobOfferId: string
        appliedDate: string
        status?: CandidatureStatus
        score?: number
    }) => {
        return apiRequest<ApiResponse<ICandidature>>({
            endpoint: "/candidatures",
            method: "POST",
            data,
        })
    },

    updateCandidatureStatus: async (id: string, status: CandidatureStatus) => {
        // Pas de route dédiée /candidatures/{id}/status côté backend — PATCH
        // /candidatures/{id} accepte déjà `status` (ADMIN outrepasse la
        // vérification de propriété, voir AuthorizesOwnership).
        return apiRequest<ApiResponse<ICandidature>>({
            endpoint: `/candidatures/${id}`,
            method: "PATCH",
            data: { status },
        })
    },

    withdrawCandidature: async (id: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/candidatures/${id}`,
            method: "DELETE",
        })
    },
}
