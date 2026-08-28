import { apiRequest } from "@/lib/api-client-http"
import { ApiResponse } from "@/lib/@types/api"
import { IUser } from "@/lib/@types/entities";

export const authService = {
    login: async (credentials: { email: string; password: string }) => {
        return apiRequest<ApiResponse<{ access_token: string; user: IUser }>>({
            endpoint: "/admin/auth/login",
            method: "POST",
            data: credentials,
        })
    },

    signup: async (userData: {
        name: string
        email: string
        password: string,
        role: string,
        acceptTerms?: boolean
    }) => {
        return apiRequest<ApiResponse<{ token: string; user: IUser }>>({
            endpoint: "/users",
            method: "POST",
            data: userData,
        })
    },

    logout: async () => {
        return apiRequest<ApiResponse<null>>({
            endpoint: "/admin/auth/logout",
            method: "POST",
        })
    },

    refreshToken: async () => {
        return apiRequest<ApiResponse<{ token: string }>>(  {
            endpoint: "/admin/auth/refresh",
            method: "POST",
        })
    },

    verifyOtp: async (email: string, code: string) => {
        // Pas de route non-admin dédiée — /admin/auth/verify-otp n'est en
        // réalité restreinte à aucun rôle particulier.
        return apiRequest<ApiResponse<{ token: string; user: IUser }>>({
            endpoint: "/admin/auth/verify-otp",
            method: "POST",
            data: { email, code },
        })
    },

    googleAuth: async (googleData: {
        googleId: string
        email: string
        name: string
        firstName: string
        lastName: string
        picture: string
    }) => {
        return apiRequest<ApiResponse<{ token: string; user: IUser }>>({  
            endpoint: "/auth/google",
            method: "POST",
            data: googleData,
        })
    },
}
