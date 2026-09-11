import { apiRequest } from "@/lib/api-client-http"
import { ICandidature, IJobOffer } from "@/lib/@types/entities"
import { ApiResponse, IPaginatedResponse } from "@/lib/@types/api"
import { JobStatus } from "@/lib/@types/enums"

export const jobService = {
    getJobs: async (filters?: {
        search?: string
        location?: string
        jobType?: string[]
        experience?: string[]
        salary?: string[]
        status?: JobStatus
        page?: number
        limit?: number
    }) => {
        return apiRequest<IPaginatedResponse<IJobOffer>>({
            endpoint: "/job-offers/paginate",
            method: "GET",
            params: filters,
        })
    },

    getJobById: async (id: string) => {
        return apiRequest<ApiResponse<IJobOffer>>({
            endpoint: `/job-offers/${id}`,
            method: "GET",
        })
    },

    getStats: async () => {
        return apiRequest<ApiResponse<{
            total: number
            active: number
            closed: number
            draft: number
            totalApplicants: number
        }>>({
            endpoint: "/admin/job-offers/stats",
            method: "GET",
        })
    },

    getSectorDistribution: async () => {
        return apiRequest<ApiResponse<Array<{ name: string; count: number; percentage: number }>>>({
            endpoint: "/admin/job-offers/sectors",
            method: "GET",
        })
    },

    createJobOffer: async (data: Partial<IJobOffer>) => {
        return apiRequest<ApiResponse<IJobOffer>>({
            endpoint: "/job-offers",
            method: "POST",
            data,
        })
    },

    updateJobOffer: async (id: string, data: Partial<IJobOffer>) => {
        return apiRequest<ApiResponse<IJobOffer>>({
            endpoint: `/job-offers/${id}`,
            method: "PATCH",
            data,
        })
    },

    /**
     * Création côté admin (`/admin/job-offers`, distinct de `/job-offers` qui
     * exige une session ENTREPRISE) : companyId est facultatif (offre non
     * rattachée à une entreprise), et l'image de couverture est optionnelle.
     * multipart/form-data pour supporter l'upload — cf. le sélecteur
     * d'entreprise et le champ image du formulaire de création.
     */
    createJobOfferAdmin: async (data: {
        title: string
        companyId?: string | null
        location?: string | null
        type?: string | null
        experience?: string | null
        salary?: string | null
        description?: string | null
        benefits?: string | null
        requirements?: string[]
        status?: JobStatus
        publishDate?: string | null
        endDate?: string | null
        image?: File | null
    }) => {
        const formData = jobOfferFormData(data)
        return apiRequest<ApiResponse<IJobOffer>>({
            endpoint: "/admin/job-offers",
            method: "POST",
            data: formData,
        })
    },

    /**
     * PHP ignore le corps multipart d'un vrai PATCH : on envoie un POST avec
     * method spoofing `_method=PATCH`, que la route PATCH /admin/job-offers/{id}
     * accepte nativement (mécanisme Laravel standard).
     */
    updateJobOfferAdmin: async (
        id: string,
        data: {
            title?: string
            companyId?: string | null
            location?: string | null
            type?: string | null
            experience?: string | null
            salary?: string | null
            description?: string | null
            benefits?: string | null
            requirements?: string[]
            status?: JobStatus
            publishDate?: string | null
            endDate?: string | null
            image?: File | null
            removeImage?: boolean
        },
    ) => {
        const formData = jobOfferFormData(data)
        formData.append("_method", "PATCH")
        return apiRequest<ApiResponse<IJobOffer>>({
            endpoint: `/admin/job-offers/${id}`,
            method: "POST",
            data: formData,
        })
    },

    updateJobStatus: async (id: string, status: JobStatus) => {
        // Pas de route dédiée /job-offers/{id}/status côté backend — PATCH
        // /job-offers/{id} accepte déjà `status` (ADMIN outrepasse la
        // vérification de propriété, voir AuthorizesOwnership).
        return apiRequest<ApiResponse<IJobOffer>>({
            endpoint: `/job-offers/${id}`,
            method: "PATCH",
            data: { status },
        })
    },

    deleteJobOffer: async (id: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/job-offers/${id}`,
            method: "DELETE",
        })
    },

    applyToJob: async (jobId: string, applicationData: { coverLetter?: string; resumeUrl?: string }) => {
        return apiRequest<ApiResponse<ICandidature>>({
            endpoint: `/admin/job-offers/${jobId}/apply`,
            method: "POST",
            data: applicationData,
        })
    },

    saveJob: async (jobId: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/admin/job-offers/${jobId}/save`,
            method: "POST",
        })
    },

    unsaveJob: async (jobId: string) => {
        return apiRequest<ApiResponse<null>>({
            endpoint: `/admin/job-offers/${jobId}/save`,
            method: "DELETE",
        })
    },
}

/** Construit le FormData partagé par createJobOfferAdmin/updateJobOfferAdmin. */
function jobOfferFormData(data: Record<string, unknown>): FormData {
    const formData = new FormData()

    for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue
        if (key === "image") {
            if (value instanceof File) formData.append("image", value)
            continue
        }
        if (key === "requirements" && Array.isArray(value)) {
            value.forEach((req) => formData.append("requirements[]", String(req)))
            continue
        }
        if (value === null) {
            formData.append(key, "")
            continue
        }
        formData.append(key, String(value))
    }

    return formData
}
