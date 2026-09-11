import {
    LayoutDashboard,
    Users,
    Building2,
    BarChart3,
    FileText,
    UserCheck,
    Briefcase,
    FileSearch,
    Calendar,
    Brain,
    Target,
    FolderOpen,
    FileBarChart,
    Shield,
    SlidersHorizontal,
    CircleDollarSign,
    Newspaper,
    ScrollText,
    GraduationCap,
    Megaphone,
} from "lucide-react"

export const menuGroups = [
    {
        title: "Principal",
        items: [
            {
                title: "Tableau de bord",
                href: "/dashboard",
                icon: LayoutDashboard,
            },
            {
                title: "Analytics",
                href: "/analytics",
                icon: BarChart3,
            },
            {
                title: "Comptabilité",
                href: "/comptabilite",
                icon: CircleDollarSign,
            },
        ],
    },
    {
        title: "Gestion Utilisateurs",
        items: [
            {
                title: "Étudiants/Candidats",
                href: "/students",
                icon: Users,
            },
            {
                title: "Entreprises",
                href: "/entreprises",
                icon: Building2,
            },
            {
                title: "Gestion Utilisateurs",
                href: "/gestion-utilisateurs",
                icon: UserCheck,
            },
            {
                title: "Potentiels Partenaires",
                href: "/partenaires-potentiels",
                icon: Megaphone,
            },
        ],
    },
    {
        title: "Outils IA",
        items: [
            {
                title: "Analyse IA CV",
                href: "/analyze-ai",
                icon: Brain,
            },
            {
                title: "Simulation Entretiens",
                href: "/simulation-entretiens",
                icon: FileBarChart,
            },
            {
                title: "Scoring IA",
                href: "/scoring-ai",
                icon: BarChart3,
            },
        ],
    },
    {
        title: "Emploi & Recrutement",
        items: [
            {
                title: "Offres d'Emploi",
                href: "/offres-emploi",
                icon: Briefcase,
            },
            {
                title: "Candidatures",
                href: "/candidatures",
                icon: FileText,
            },
            {
                title: "Matching IA",
                href: "/matching-ai",
                icon: Target,
            },
            {
                title: "Recherche Avancée",
                href: "/recherche-avancee",
                icon: FileSearch,
            },
        ],
    },
    {
        title: "Formation & Portfolio",
        items: [
            {
                title: "Formations",
                href: "/formations",
                icon: GraduationCap,
            },
            {
                title: "Portfolios",
                href: "/portfolios",
                icon: FolderOpen,
            },
            {
                title: "Blog",
                href: "/blog",
                icon: Newspaper,
            },
        ],
    },
    {
        title: "Système",
        items: [
            {
                title: "Planification",
                href: "/planification",
                icon: Calendar,
            },
            {
                title: "Sécurité",
                href: "/parametres",
                icon: Shield,
            },
            {
                title: "Journal d'audit",
                href: "/audit-logs",
                icon: ScrollText,
            },
            {
                title: "Paramètres",
                href: "/parametres",
                icon: SlidersHorizontal,
            },
        ],
    },
]