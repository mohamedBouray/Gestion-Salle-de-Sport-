import {
    LayoutDashboard, UsersRound, UserRoundCheck, Dumbbell, CalendarDays,
    CalendarCheck2, CreditCard, ClipboardCheck, BarChart3, Settings2,
    WalletCards, ListTodo, CircleUserRound, Clock3, BookOpenCheck,
    TicketCheck, ShieldCheck, MessageSquare, PanelsTopLeft
} from "lucide-react";


export const ROLE_CONFIG = {
    admin: {
        label: "Espace Admin", compact: "Administration",
        sections: [
            {
                title: "ESPACE", items: [
                    { label: "Tableau de bord", path: "/admin/dashboard", icon: LayoutDashboard },
                ]
            },
            {
                title: "GESTION", items: [
                    { label: "Membres", path: "/admin/members", icon: UsersRound },
                    { label: "Coachs", path: "/admin/coaches", icon: UserRoundCheck },
                    { label: "Cours sportifs", path: "/admin/classes", icon: Dumbbell },
                    { label: "Planning", path: "/admin/schedule", icon: CalendarDays },
                    { label: "Réservations", path: "/admin/reservations", icon: CalendarCheck2 },
                    { label: "Abonnements", path: "/admin/memberships", icon: CreditCard },
                ]
            },
            {
                title: "OPÉRATIONS", items: [
                    { label: "Présences", path: "/admin/attendance", icon: ClipboardCheck },
                    { label: "Demandes privées", path: "/admin/personal-requests", icon: ListTodo },
                    { label: "Paiements", path: "/admin/payments", icon: WalletCards },
                    { label: "Rapports", path: "/admin/analytics", icon: BarChart3 },
                ]
            },
            {
                title: "SITE", items: [
                    { label: "Messages", path: "/admin/messages", icon: MessageSquare },
                    { label: "Landing Page", path: "/admin/landing-page", icon: PanelsTopLeft },
                ]
            },
            {
                title: "COMPTE", items: [
                    { label: "Paramètres", path: "/admin/settings", icon: Settings2 },
                    { label: "Mon profil", path: "/admin/profile", icon: CircleUserRound },
                ]
            },
        ],
    },
    coach: {
        label: "Espace Coach", compact: "Coach",
        sections: [
            {
                title: "ESPACE", items: [
                    { label: "Tableau de bord", path: "/coach/dashboard", icon: LayoutDashboard },
                ]
            },
            {
                title: "MON TRAVAIL", items: [
                    { label: "Mes cours", path: "/coach/classes", icon: Dumbbell },
                    { label: "Mon planning", path: "/coach/schedule", icon: CalendarDays },
                    { label: "Mes membres", path: "/coach/members", icon: UsersRound },
                    { label: "Présences", path: "/coach/attendance", icon: ClipboardCheck },
                    { label: "Demandes", path: "/coach/tasks", icon: ListTodo },
                ]
            },
            {
                title: "COMPTE", items: [
                    { label: "Mon profil", path: "/coach/profile", icon: CircleUserRound },
                ]
            },
        ],
    },
    member: {
        label: "Espace Membre", compact: "Membre",
        sections: [
            {
                title: "ESPACE", items: [
                    { label: "Tableau de bord", path: "/member/dashboard", icon: LayoutDashboard },
                ]
            },
            {
                title: "MON SPORT", items: [
                    { label: "Explorer les cours", path: "/member/classes", icon: BookOpenCheck },
                    { label: "Mes réservations", path: "/member/reservations", icon: TicketCheck },
                    { label: "Planning", path: "/member/schedule", icon: CalendarDays },
                    { label: "Mon abonnement", path: "/member/membership", icon: ShieldCheck },
                    { label: "Mes présences", path: "/member/attendance", icon: Clock3 },
                    { label: "Demandes privées", path: "/member/requests", icon: ListTodo },
                ]
            },
            {
                title: "COMPTE", items: [
                    { label: "Paiements", path: "/member/payments", icon: CreditCard },
                    { label: "Mon profil", path: "/member/profile", icon: CircleUserRound },
                ]
            },
        ],
    },
};

export const getRoleConfig = (role) => ROLE_CONFIG[role] || ROLE_CONFIG.member;
export const getRoleItems = (role) => getRoleConfig(role).sections.flatMap((section) => section.items);