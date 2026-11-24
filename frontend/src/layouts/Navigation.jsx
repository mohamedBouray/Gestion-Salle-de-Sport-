import {
    LayoutDashboard, UsersRound, UserRoundCheck, Dumbbell, CalendarDays, CalendarCheck2,
    ClipboardCheck, ClipboardList, CreditCard, WalletCards, BadgeDollarSign, MessageSquare,
    PanelsTopLeft, Settings2, CircleUserRound, BookOpenCheck, TicketCheck, ShieldCheck, Clock3,
} from "lucide-react";

// Une entrée de menu : { label, path, icon }
const link = (label, path, icon) => ({ label, path, icon });

export const ROLE_CONFIG = {
    // ─────────────── ADMIN ───────────────
    admin: {
        label: "Espace administrateur",
        compact: "Administrateur",
        home: "/admin/dashboard",
        sections: [
            {
                title: "PRINCIPAL",
                items: [
                    link("Tableau de bord", "/admin/dashboard", LayoutDashboard),
                ],
            },
            {
                title: "UTILISATEURS",
                items: [
                    link("Membres", "/admin/members", UsersRound),
                    link("Coachs", "/admin/coaches", UserRoundCheck),
                ],
            },
            {
                title: "COURS COLLECTIFS",
                items: [
                    link("Cours sportifs", "/admin/classes", Dumbbell),
                    link("Propositions de cours", "/admin/course-proposals", ClipboardList),
                    link("Planning", "/admin/schedule", CalendarDays),
                    link("Réservations", "/admin/reservations", CalendarCheck2),
                    link("Présences", "/admin/attendance", ClipboardCheck),
                ],
            },
            {
                title: "FINANCES",
                items: [
                    link("Tarifs de la salle", "/admin/tariffs", BadgeDollarSign),
                    link("Abonnements", "/admin/memberships", CreditCard),
                    link("Paiements", "/admin/payments", WalletCards),
                ],
            },
            {
                title: "SITE WEB",
                items: [
                    link("Messages", "/admin/messages", MessageSquare),
                    link("Contenu du site", "/admin/landing-page", PanelsTopLeft),
                ],
            },
            {
                title: "SYSTÈME",
                items: [
                    link("Paramètres", "/admin/settings", Settings2),
                    link("Mon profil", "/admin/profile", CircleUserRound),
                ],
            },
        ],
    },

    // ─────────────── COACH ───────────────
    coach: {
        label: "Espace coach",
        compact: "Coach",
        home: "/coach/dashboard",
        sections: [
            {
                title: "PRINCIPAL",
                items: [
                    link("Tableau de bord", "/coach/dashboard", LayoutDashboard),
                ],
            },
            {
                title: "MON ACTIVITÉ",
                items: [
                    link("Mes cours", "/coach/classes", Dumbbell),
                    link("Mon planning", "/coach/schedule", CalendarDays),
                    link("Mes membres", "/coach/members", UsersRound),
                    link("Présences", "/coach/attendance", ClipboardCheck),
                ],
            },
            {
                title: "COMPTE",
                items: [
                    link("Mon profil", "/coach/profile", CircleUserRound),
                ],
            },
        ],
    },

    // ─────────────── MEMBRE ───────────────
    member: {
        label: "Espace membre",
        compact: "Membre",
        home: "/member/dashboard",
        sections: [
            {
                title: "PRINCIPAL",
                items: [
                    link("Tableau de bord", "/member/dashboard", LayoutDashboard),
                ],
            },
            {
                title: "MON SPORT",
                items: [
                    link("Explorer les cours", "/member/classes", BookOpenCheck),
                    link("Planning", "/member/schedule", CalendarDays),
                    link("Mes réservations", "/member/reservations", TicketCheck),
                    link("Mon abonnement", "/member/membership", ShieldCheck),
                    link("Mes présences", "/member/attendance", Clock3),
                ],
            },
            {
                title: "COMPTE",
                items: [
                    link("Paiements", "/member/payments", CreditCard),
                    link("Mon profil", "/member/profile", CircleUserRound),
                ],
            },
        ],
    },
};

// ─────────────── Helpers ───────────────

export function getRoleConfig(role) {
    return ROLE_CONFIG[role] ?? ROLE_CONFIG.member;
}

export function getRoleItems(role) {
    return getRoleConfig(role).sections.flatMap((section) => section.items);
}

// Retourne l'entrée correspondant à l'URL (la plus spécifique si plusieurs correspondent)
export function getNavigationItem(role, pathname) {
    return getRoleItems(role).filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0] ?? null;
}
