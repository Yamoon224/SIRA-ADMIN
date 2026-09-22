import { apiRequest } from "@/lib/api-client-http"

export interface SubscriptionStats {
    total: number
    active: number
    expired: number
    revenue: number
}

export interface SubscriptionRow {
    id: string
    userId: string
    status: string
    startDate: string
    endDate: string | null
    autoRenew: boolean
    createdAt: string
    user?: {
        id: string
        name: string
        email: string
        role: string
        status: string
    }
    plan?: {
        id: string
        name: string
        price: number
        billingPeriod: string
        userType: string
    }
}

export interface SubscriptionPlanRow {
    id: string
    name: string
    price: number
    billingPeriod: string
    userType: "USER" | "ENTREPRISE"
    isActive: boolean
}

export const subscriptionService = {
    /** Plans actifs d'un type de compte — utilisé pour cibler des campagnes promo sur des forfaits précis. */
    getPlans: (userType: "USER" | "ENTREPRISE") =>
        apiRequest<SubscriptionPlanRow[]>({ endpoint: `/subscriptions/plans?userType=${userType}`, method: "GET" }),

    getAdminStats: () =>
        apiRequest<SubscriptionStats>({ endpoint: "/subscriptions/admin/stats", method: "GET" }),

    getAllSubscriptions: (page = 1, limit = 10) =>
        apiRequest<{ data: SubscriptionRow[]; total: number; page: number; limit: number }>({
            endpoint: `/subscriptions/admin/all?page=${page}&limit=${limit}`,
            method: "GET",
        }),

    getRevenueTrend: () =>
        apiRequest<{ data: Array<{ month: string; value: number }> }>({
            endpoint: "/subscriptions/admin/revenue-trend",
            method: "GET",
        }),

    getSubscriptionsTrend: () =>
        apiRequest<{ data: Array<{ month: string; value: number }> }>({
            endpoint: "/subscriptions/admin/subscriptions-trend",
            method: "GET",
        }),
}
