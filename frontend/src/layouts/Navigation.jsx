
import {
     LayoutDashboard,
    UsersRound,
    UserRoundCheck,
    Dumbbell,
    CalendarDays,
    CalendarCheck2,
    ClipboardCheck,
    ListTodo,
    CreditCard,
    WalletCards,
    BadgeDollarSign,
    BarChart3,
    MessageSquare,
    PanelsTopLeft,
    Settings2,
    CircleUserRound,
    BookOpenCheck,
    TicketCheck,
    ShieldCheck,
    Clock3,
} from "lucide-react";

export const ROLE_CONFIG = {
    admin: {
        label: "Espace administrateur",
        compact: "Administrateur",
        home: "/admin/dashboard",

        sections: [
            {
                title: "PRINCIPAL",
                items: [{label: "Tableau de bord",path: "/admin/dashboard", icon: LayoutDashboard,},],
            },
            {
                title: "UTILISATEURS",
                items: [
                    {label: "Membres",path: "/admin/members", icon: UsersRound,},
                    { label: "Coachs", path: "/admin/coaches", icon: UserRoundCheck,},],
            },
            {
                title: "COURS COLLECTIFS",
                items: [
                    { label: "Cours sportifs", path: "/admin/classes", icon: Dumbbell,},
                    {label: "Planning", path: "/admin/schedule", icon: CalendarDays,},
                    { label: "Réservations", path: "/admin/reservations",icon: CalendarCheck2,},
                    { label: "Présences", path: "/admin/attendance", icon: ClipboardCheck,},
                ],
            },
            {
                title: "COACHING PERSONNEL",
                items: [{ label: "Demandes privées",path: "/admin/personal-requests", icon: ListTodo,},
                    {label: "Séances privées",path: "/admin/private-sessions", icon: CalendarDays,},
                ],
            },
            {
                title: "FINANCES",
                items: [
                    {label: "Tarifs de la salle",path: "/admin/tariffs", icon: BadgeDollarSign,},
                    { label: "Abonnements",path: "/admin/memberships", icon: CreditCard,},
                    { label: "Paiements",path: "/admin/payments", icon: WalletCards,},
                ],
            },
            {
                title: "ANALYSE",
                items: [
                    {
                        label: "Statistiques",
                        path: "/admin/analytics",
                        icon: BarChart3,
                    },
                ],
            },
            {
                title: "SITE WEB",
                items: [
                    { label: "Messages", path: "/admin/messages",icon: MessageSquare,},
                    {label: "Contenu du site", path: "/admin/landing-page",icon: PanelsTopLeft,},
                ],
            },
            {
                title: "SYSTÈME",
                items: [
                    { label: "Paramètres",path: "/admin/settings",icon: Settings2,},
                    { label: "Mon profil", path: "/admin/profile", icon: CircleUserRound,},
                ],
            },
        ],
    },









    coach: {
        label: "Espace coach",
        compact: "Coach",
        home: "/coach/dashboard",

        sections: [
            {
                title: "PRINCIPAL",
                items: [
                    {
                        label: "Tableau de bord",
                        path: "/coach/dashboard",
                        icon: LayoutDashboard,
                    },
                ],
            },
            {
                title: "MON ACTIVITÉ",
                items: [
                    {
                        label: "Mes cours",
                        path: "/coach/classes",
                        icon: Dumbbell,
                    },
                    {
                        label: "Mon planning",
                        path: "/coach/schedule",
                        icon: CalendarDays,
                    },
                    {
                        label: "Mes membres",
                        path: "/coach/members",
                        icon: UsersRound,
                    },
                    {
                        label: "Présences",
                        path: "/coach/attendance",
                        icon: ClipboardCheck,
                    },
                    {
                        label: "Demandes",
                        path: "/coach/tasks",
                        icon: ListTodo,
                    },
                ],
            },
            {
                title: "COMPTE",
                items: [
                    {
                        label: "Mon profil",
                        path: "/coach/profile",
                        icon: CircleUserRound,
                    },
                ],
            },
        ],
    },

    member: {
        label: "Espace membre",
        compact: "Membre",
        home: "/member/dashboard",

        sections: [
            {
                title: "PRINCIPAL",
                items: [
                    {
                        label: "Tableau de bord",
                        path: "/member/dashboard",
                        icon: LayoutDashboard,
                    },
                ],
            },
            {
                title: "MON SPORT",
                items: [
                    {
                        label: "Explorer les cours",
                        path: "/member/classes",
                        icon: BookOpenCheck,
                    },
                    {
                        label: "Planning",
                        path: "/member/schedule",
                        icon: CalendarDays,
                    },
                    {
                        label: "Mes réservations",
                        path: "/member/reservations",
                        icon: TicketCheck,
                    },
                    {
                        label: "Mon abonnement",
                        path: "/member/membership",
                        icon: ShieldCheck,
                    },
                    {
                        label: "Mes présences",
                        path: "/member/attendance",
                        icon: Clock3,
                    },
                    {
                        label: "Demandes privées",
                        path: "/member/requests",
                        icon: ListTodo,
                    },
                ],
            },
            {
                title: "COMPTE",
                items: [
                    {
                        label: "Paiements",
                        path: "/member/payments",
                        icon: CreditCard,
                    },
                    {
                        label: "Mon profil",
                        path: "/member/profile",
                        icon: CircleUserRound,
                    },
                ],
            },
        ],
    },
};

export function getRoleConfig(role) {
    return ROLE_CONFIG[role] ?? ROLE_CONFIG.member;
}

export function getRoleItems(role) {
    return getRoleConfig(role).sections.flatMap(
        (section) => section.items
    );
}

export function getNavigationItem(role, pathname) {
    return (
        getRoleItems(role).find(
            (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)) ?? null
    );
}
