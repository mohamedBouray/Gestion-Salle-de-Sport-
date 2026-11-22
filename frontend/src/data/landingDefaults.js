// ─────────────── Helpers ───────────────
const MENU = [
    ["Home", "#home"],
    ["Features", "#features"],
    ["Pricing", "#pricing"],
    ["Classes & Coaches", "#schedule"],
    ["Contact", "#contact"],
];

// Nouvelle liste à chaque appel : navbar et footer ne partagent pas la même référence
const menuLinks = () => MENU.map(([label, href]) => ({ label, href }));
const feature = (icon, title, description) => ({ icon, title, description });
const plan = (name, description, price, popular, features) => (
    { name, description, price, currency: "DH", period: "/ mois", popular, features }
);

export const landingDefaults = {
    // ─────────────── NAVIGATION ───────────────
    site_name: "GYM Management",
    site_logo: "",
    navbar_login_text: "Sign In",
    navbar_register_text: "Get Started",
    nav_links: menuLinks(),

    // ─────────────── HERO ───────────────
    hero_title: "TRAIN SMARTER. MANAGE BETTER.",
    hero_subtitle: "The smarter way to manage your fitness center.",
    hero_description: "Manage members, memberships, class schedules, trainers, attendance, and reservations — all from one powerful platform.",
    hero_button: "Get Started",
    hero_button_link: "/register",
    hero_image: "/gym_background.png",

    // ─────────────── FEATURES ───────────────
    features_badge: "ARCHITECTURE",
    features_title: "Everything You Need to Run Your Gym",
    features_subtitle: "One powerful platform to simplify your daily operations.",
    features_items: [
        feature("members", "Member Management", "Keep every member profile organized in one place."),
        feature("membership", "Membership Plans", "Manage subscriptions, renewals and membership plans."),
        feature("attendance", "Attendance Tracking", "Follow attendance and class check-ins."),
        feature("payment", "Payment Management", "Organize payments and receipts."),
        feature("trainer", "Staff & Trainer Management", "Manage coaches, schedules and classes."),
        feature("analytics", "Analytics & Reports", "Follow key metrics from your dashboard."),
    ],

    // ─────────────── PRICING ───────────────
    pricing_badge: "SIMPLE & FLEXIBLE PRICING",
    pricing_title: "FLEXIBLE PLANS. STRONGER MEMBERSHIPS.",
    pricing_subtitle: "Find the right solution for your fitness business.",
    pricing_plans: [
        plan("Starter", "For growing fitness studios.", 199, false, [
            "Jusqu'à 200 membres actifs",
            "Gestion des profils membres",
            "Suivi des abonnements",
        ]),
        plan("Professional", "For established fitness centers.", 449, true, [
            "Gestion des coachs & cours",
            "Réservations des membres",
            "Suivi des présences",
        ]),
        plan("Enterprise", "For larger fitness operations.", 999, false, [
            "Membres actifs illimités",
            "Rapports avancés",
            "Plans configurables",
        ]),
    ],

    // ─────────────── COACHES & CLASSES ───────────────
    trainers_badge: "VERIFIED COACHING STAFF",
    trainers_title: "ELITE INSTRUCTION & LIVE SCHEDULE",
    trainers_subtitle: "Instructors and upcoming classes.",
    trainer_badge: "Head Instructor",

    // Anciennes valeurs gardées pour compatibilité : elles ne sont plus utilisées
    // dans la carte coach (le coach réel vient de settings.featured_coach).
    trainer_name: "Sarah Jenkins",
    trainer_role: "Strength & Conditioning Specialist",
    trainer_experience: "8+ YRS EXP",
    trainer_courses_label: "Assigned Courses: 3 Active",
    trainer_image: "/traiter.avif",

    // Les cours restent des données de démonstration.
    classes_items: [
        {
            category: "HIGH INTENSITY", days: "Mon · Thu · Fri", time: "07:30 - 08:30",
            title: "CrossFit Engine", coach: "Marcus Vance", location: "Strength Studio A",
            enrolled: 16, capacity: 18,
        },
        {
            category: "CARDIO CORE", days: "Tue · Fri", time: "18:00 - 19:15",
            title: "HIIT & Core Conditioning", coach: "Sarah Jenkins", location: "Functional Turf",
            enrolled: 12, capacity: 15,
        },
        {
            category: "RECOVERY", days: "Wed · Sat", time: "10:00 - 11:00",
            title: "Power Mobility & Recovery", coach: "Elena Roberts", location: "Studio B",
            enrolled: 10, capacity: 12,
        },
    ],

    // ─────────────── CONTACT ───────────────
    contact_title: "Ready to Upgrade Your Gym?",
    contact_subtitle: "Have questions about our platform? Our team is here to help.",
    contact_address: "123 Fitness Ave, Casablanca, Morocco",
    contact_phone: "+212 6 00 00 00 00",
    contact_email: "contact@gymmanagement.com",
    contact_hours: "Mon - Sat: 06:00 AM - 10:00 PM",
    contact_form_title: "Send us a Message",
    contact_form_subtitle: "Fill out the form below and we'll get back to you shortly.",
    contact_button: "Open Email App",

    // ─────────────── FOOTER ───────────────
    footer_title: "YOUR GYM. YOUR PEOPLE. ONE SMARTER SYSTEM.",
    footer_description: "Take control of your gym operations with one platform.",
    footer_primary_text: "Explore FitManager",
    footer_primary_link: "/register",
    footer_secondary_text: "Compare Plans",
    footer_secondary_link: "#pricing",
    footer_copyright: "All rights reserved.",
    footer_links: menuLinks(),
};