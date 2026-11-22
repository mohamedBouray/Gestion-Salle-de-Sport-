import { Menu, Image, Layers3, CreditCard, Dumbbell, Mail, PanelBottom } from "lucide-react";

// ─────────────── Clés spéciales ───────────────
// trainer_image reste une ancienne clé image (compatibilité avec les settings existants).
export const imageKeys = ["site_logo", "hero_image", "trainer_image"];
export const arrayKeys = ["nav_links", "features_items", "pricing_plans", "classes_items", "footer_links"];

// ─────────────── Options ───────────────
const ANCHORS = ["#home", "#features", "#pricing", "#schedule", "#contact", "/login", "/register"];
const ICONS = ["members", "membership", "attendance", "payment", "trainer", "analytics"];


// Badge + titre + description d'une section (features_*, pricing_*, trainers_*)
const introFields = (prefix) => [
    [`${prefix}_badge`, "Badge"],
    [`${prefix}_title`, "Titre"],
    [`${prefix}_subtitle`, "Description", "textarea"],
];

// Liste de liens (menu et footer partagent la même structure)
const linkList = (key, title, max) => ({
    key, title, singular: "lien", max,
    initial: { label: "Nouveau lien", href: "#home" },
    fields: [
        ["label", "Libellé"],
        ["href", "Destination", "select", ANCHORS],
    ],
});

// ─────────────── Sections de l'éditeur ───────────────
export const editorSections = [
    {
        id: "navbar",
        title: "Navigation",
        subtitle: "Identité, logo et menu public",
        icon: Menu,
        fields: [
            ["site_name", "Nom du site"],
            ["navbar_login_text", "Bouton connexion"],
            ["navbar_register_text", "Bouton inscription"],
        ],
        images: [["site_logo", "Logo de la marque"]],
        list: linkList("nav_links", "Liens du menu", 8),
    },
    {
        id: "hero",
        title: "Hero Section",
        subtitle: "Premier écran visible par vos visiteurs",
        icon: Image,
        fields: [
            ["hero_title", "Titre principal", "textarea"],
            ["hero_subtitle", "Sous-titre"],
            ["hero_description", "Description", "textarea"],
            ["hero_button", "Texte du bouton"],
            ["hero_button_link", "Destination du bouton", "select", ANCHORS],
        ],
        images: [["hero_image", "Image de couverture"]],
    },
    {
        id: "features",
        title: "Features",
        subtitle: "Fonctionnalités et cartes du site",
        icon: Layers3,
        fields: introFields("features"),
        list: {
            key: "features_items",
            title: "Cartes des fonctionnalités",
            singular: "carte",
            max: 12,
            initial: { icon: "members", title: "Nouvelle fonctionnalité", description: "" },
            fields: [
                ["icon", "Icône", "select", ICONS],
                ["title", "Titre"],
                ["description", "Description", "textarea"],
            ],
        },
    },
    {
        id: "pricing",
        title: "Pricing",
        subtitle: "Offres affichées sur la vitrine",
        icon: CreditCard,
        fields: introFields("pricing"),
        list: {
            key: "pricing_plans",
            title: "Offres & tarifs",
            singular: "offre",
            max: 8,
            initial: {
                name: "Nouvelle offre", description: "", price: 0,
                currency: "DH", period: "/ mois", popular: false, features: [],
            },
            fields: [
                ["name", "Nom"],
                ["description", "Description", "textarea"],
                ["price", "Prix", "number"],
                ["currency", "Devise"],
                ["period", "Période"],
                ["popular", "Offre populaire", "checkbox"],
                ["features", "Avantages (une ligne par avantage)", "lines"],
            ],
        },
    },
    {
        id: "trainers",
        title: "Coaches & Classes",
        subtitle: "Coach réel et cours de démonstration",
        icon: Dumbbell,
        // Les infos du coach viennent de la base de données (choisi dans Gestion des coachs).
        fields: [
            ...introFields("trainers"),
            ["trainer_badge", "Badge du coach"],
        ],
        // Les cours restent configurables depuis l'éditeur.
        list: {
            key: "classes_items",
            title: "Cours de démonstration",
            singular: "cours",
            max: 12,
            initial: {
                category: "TRAINING", days: "Lundi", time: "10:00 - 11:00",
                title: "Nouveau cours", coach: "", location: "", enrolled: 0, capacity: 20,
            },
            fields: [
                ["title", "Nom du cours"],
                ["category", "Catégorie"],
                ["coach", "Coach"],
                ["days", "Jours"],
                ["time", "Horaire"],
                ["location", "Salle"],
                ["enrolled", "Inscrits (démo)", "number"],
                ["capacity", "Capacité (démo)", "number"],
            ],
        },
    },
    {
        id: "contact",
        title: "Contact",
        subtitle: "Coordonnées et formulaire public",
        icon: Mail,
        fields: [
            ["contact_title", "Titre"],
            ["contact_subtitle", "Description", "textarea"],
            ["contact_address", "Adresse"],
            ["contact_phone", "Téléphone", "tel"],
            ["contact_email", "E-mail", "email"],
            ["contact_hours", "Horaires"],
            ["contact_form_title", "Titre du formulaire"],
            ["contact_form_subtitle", "Texte du formulaire", "textarea"],
            ["contact_button", "Texte du bouton"],
        ],
    },
    {
        id: "footer",
        title: "Footer",
        subtitle: "CTA, navigation et copyright",
        icon: PanelBottom,
        fields: [
            ["footer_title", "Titre du CTA", "textarea"],
            ["footer_description", "Description", "textarea"],
            ["footer_primary_text", "Bouton principal"],
            ["footer_primary_link", "Lien principal", "select", ANCHORS],
            ["footer_secondary_text", "Bouton secondaire"],
            ["footer_secondary_link", "Lien secondaire", "select", ANCHORS],
            ["footer_copyright", "Copyright"],
        ],
        list: linkList("footer_links", "Liens du Footer", 10),
    },
];