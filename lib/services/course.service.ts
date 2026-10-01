import { apiRequest } from "@/lib/api-client-http"
import { ApiResponse, IPaginatedResponse } from "@/lib/@types/api"

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
export type VideoProvider = "YOUTUBE" | "VIMEO" | "FILE"
export type CourseProjectStatus = "SUBMITTED" | "REVIEWED"

export interface ICourseCategory {
    id: string
    name: string
    slug: string
    description: string | null
    icon: string | null
    coverPath: string | null
    coverUrl: string | null
    sortOrder: number
    isActive: boolean
    coursesCount: number | null
}

export interface IInstructor {
    id: string
    name: string
    headline: string | null
    bio: string | null
    photoPath: string | null
    photoUrl: string | null
    country: string | null
    linkedinUrl: string | null
    isActive: boolean
    coursesCount: number | null
}

export interface ICourse {
    id: string
    slug: string | null
    title: string
    subtitle: string | null
    description: string | null
    category: string | null
    categoryId: string | null
    categoryRef?: ICourseCategory | null
    provider: string | null
    instructorId: string | null
    instructor?: IInstructor | null
    level: CourseLevel
    language: string
    subtitleLanguages: string[]
    learningOutcomes: string[]
    durationHours: number | null
    thumbnailPath: string | null
    thumbnailUrl: string | null
    trailerUrl: string | null
    isFree: boolean
    isPublished: boolean
    isActive: boolean
    lessonsCount: number
    totalMinutes: number
    publishedAt: string | null
}

export interface ISubtitleTrack {
    lang: string
    label?: string | null
    url: string
}

export interface ILessonResource {
    title: string
    url: string
}

export interface ICourseLesson {
    id: string
    courseId: string
    section: string | null
    title: string
    description: string | null
    videoUrl: string | null
    videoProvider: VideoProvider
    durationSeconds: number
    position: number
    isFreePreview: boolean
    subtitles: ISubtitleTrack[]
    resources: ILessonResource[]
}

export interface ICourseDetail extends ICourse {
    lessons: ICourseLesson[]
}

export interface ICourseProject {
    id: string
    courseId: string | null
    course: { id: string; slug: string | null; title: string } | null
    user?: { id: string; name: string; email: string } | null
    title: string
    description: string | null
    linkUrl: string | null
    fileName: string | null
    hasFile: boolean
    status: CourseProjectStatus
    feedback: string | null
    reviewedAt: string | null
    createdAt: string
}

export interface ICourseStats {
    courses: number
    published: number
    lessons: number
    enrollments: number
    completions: number
    pendingProjects: number
    activePasses: number
}

export type SaveCoursePayload = Partial<{
    title: string
    subtitle: string | null
    description: string | null
    categoryId: string | null
    instructorId: string | null
    level: CourseLevel
    language: string
    subtitleLanguages: string[]
    learningOutcomes: string[]
    thumbnailPath: string | null
    trailerUrl: string | null
    isFree: boolean
    isPublished: boolean
    isActive: boolean
}>

export type SaveLessonPayload = Partial<{
    title: string
    section: string | null
    description: string | null
    videoUrl: string | null
    videoProvider: VideoProvider
    durationSeconds: number
    isFreePreview: boolean
    subtitles: ISubtitleTrack[]
    resources: ILessonResource[]
}>

export const LEVEL_LABELS: Record<CourseLevel, string> = {
    BEGINNER: "Débutant",
    INTERMEDIATE: "Intermédiaire",
    ADVANCED: "Avancé",
}

export const LANGUAGE_OPTIONS = [
    { value: "fr", label: "Français" },
    { value: "en", label: "Anglais" },
    { value: "es", label: "Espagnol" },
    { value: "pt", label: "Portugais" },
    { value: "ar", label: "Arabe" },
]

export const courseService = {
    paginate: async (filters?: { page?: number; limit?: number; search?: string; category?: string; status?: string; level?: string }) =>
        apiRequest<IPaginatedResponse<ICourse>>({ endpoint: "/admin/courses/paginate", method: "GET", params: filters }),

    stats: async () => apiRequest<ApiResponse<ICourseStats>>({ endpoint: "/admin/courses/stats", method: "GET" }),

    get: async (id: string) => apiRequest<ApiResponse<ICourseDetail>>({ endpoint: `/admin/courses/${id}`, method: "GET" }),

    create: async (data: SaveCoursePayload & { title: string }) =>
        apiRequest<ApiResponse<ICourse>>({ endpoint: "/admin/courses", method: "POST", data }),

    update: async (id: string, data: SaveCoursePayload) =>
        apiRequest<ApiResponse<ICourse>>({ endpoint: `/admin/courses/${id}`, method: "PATCH", data }),

    /** Archive la formation : les inscriptions et certificats sont conservés. */
    remove: async (id: string) => apiRequest<ApiResponse<null>>({ endpoint: `/admin/courses/${id}`, method: "DELETE" }),

    uploadImage: async (file: File) => {
        const formData = new FormData()
        formData.append("image", file)
        return apiRequest<ApiResponse<{ path: string; url: string }>>({ endpoint: "/admin/courses/upload-image", method: "POST", data: formData })
    },

    createLesson: async (courseId: string, data: SaveLessonPayload & { title: string }) =>
        apiRequest<ApiResponse<ICourseLesson>>({ endpoint: `/admin/courses/${courseId}/lessons`, method: "POST", data }),

    updateLesson: async (lessonId: string, data: SaveLessonPayload) =>
        apiRequest<ApiResponse<ICourseLesson>>({ endpoint: `/admin/course-lessons/${lessonId}`, method: "PATCH", data }),

    deleteLesson: async (lessonId: string) =>
        apiRequest<ApiResponse<null>>({ endpoint: `/admin/course-lessons/${lessonId}`, method: "DELETE" }),

    reorderLessons: async (courseId: string, ids: string[]) =>
        apiRequest<ApiResponse<ICourseLesson[]>>({ endpoint: `/admin/courses/${courseId}/lessons/reorder`, method: "POST", data: { ids } }),
}

export const courseCategoryService = {
    list: async () => apiRequest<ApiResponse<ICourseCategory[]>>({ endpoint: "/admin/course-categories", method: "GET" }),
    create: async (data: Partial<ICourseCategory> & { name: string }) =>
        apiRequest<ApiResponse<ICourseCategory>>({ endpoint: "/admin/course-categories", method: "POST", data }),
    update: async (id: string, data: Partial<ICourseCategory>) =>
        apiRequest<ApiResponse<ICourseCategory>>({ endpoint: `/admin/course-categories/${id}`, method: "PATCH", data }),
    remove: async (id: string) => apiRequest<ApiResponse<null>>({ endpoint: `/admin/course-categories/${id}`, method: "DELETE" }),
}

export const instructorService = {
    list: async () => apiRequest<ApiResponse<IInstructor[]>>({ endpoint: "/admin/instructors", method: "GET" }),
    create: async (data: Partial<IInstructor> & { name: string }) =>
        apiRequest<ApiResponse<IInstructor>>({ endpoint: "/admin/instructors", method: "POST", data }),
    update: async (id: string, data: Partial<IInstructor>) =>
        apiRequest<ApiResponse<IInstructor>>({ endpoint: `/admin/instructors/${id}`, method: "PATCH", data }),
    remove: async (id: string) => apiRequest<ApiResponse<null>>({ endpoint: `/admin/instructors/${id}`, method: "DELETE" }),
}

export const courseProjectService = {
    paginate: async (filters?: { page?: number; limit?: number; status?: string; search?: string }) =>
        apiRequest<IPaginatedResponse<ICourseProject>>({ endpoint: "/admin/course-projects/paginate", method: "GET", params: filters }),
    review: async (id: string, feedback: string | null) =>
        apiRequest<ApiResponse<ICourseProject>>({ endpoint: `/admin/course-projects/${id}/review`, method: "PATCH", data: { feedback } }),
    downloadFile: async (id: string) =>
        apiRequest<Blob>({ endpoint: `/admin/course-projects/${id}/file`, method: "GET", responseType: "blob" }),
}

/** "2h30" / "45 min" à partir d'un nombre de minutes. */
export function formatMinutes(total: number): string {
    if (!total) return "0 min"
    const h = Math.floor(total / 60)
    const m = total % 60
    if (!h) return `${m} min`
    return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`
}
