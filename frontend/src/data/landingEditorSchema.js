import { Menu, Image, Layers3, CreditCard, Dumbbell, Mail, PanelBottom } from "lucide-react";

export const imageKeys = ["site_logo", "hero_image", "trainer_image"];
export const arrayKeys = ["nav_links", "features_items", "pricing_plans", "classes_items", "footer_links"];

const anchors = ["#home", "#features", "#pricing", "#schedule", "#contact", "/login", "/register"];
const icons = ["members", "membership", "attendance", "payment", "trainer", "analytics"];

export const editorSections = [
    {
        id: "navbar", title: "Navigation", subtitle: "Identité, logo et menu public", icon: Menu,
        fields: [["site_name", "Nom du site"], ["navbar_login_text", "Bouton connexion"], ["navbar_register_text", "Bouton inscription"]],
        images: [["site_logo", "Logo de la marque"]],
        list: { key: "nav_links", title: "Liens du menu", singular: "lien", max: 8, initial: { label: "Nouveau lien", href: "#home" }, fields: [["label", "Libellé"], ["href", "Destination", "select", anchors]] },
    },
    {
        id: "hero", title: "Hero Section", subtitle: "Premier écran visible par vos visiteurs", icon: Image,
        fields: [["hero_title", "Titre principal", "textarea"], ["hero_subtitle", "Sous-titre"], ["hero_description", "Description", "textarea"], ["hero_button", "Texte du bouton"], ["hero_button_link", "Destination du bouton", "select", anchors]],
        images: [["hero_image", "Image de couverture"]],
    },
    {
        id: "features", title: "Features", subtitle: "Fonctionnalités et cartes du site", icon: Layers3,
        fields: [["features_badge", "Badge"], ["features_title", "Titre"], ["features_subtitle", "Description", "textarea"]],
        list: { key: "features_items", title: "Cartes des fonctionnalités", singular: "carte", max: 12, initial: { icon: "members", title: "Nouvelle fonctionnalité", description: "" }, fields: [["icon", "Icône", "select", icons], ["title", "Titre"], ["description", "Description", "textarea"]] },
    },
    {
        id: "pricing", title: "Pricing", subtitle: "Offres affichées sur la vitrine", icon: CreditCard,
        fields: [["pricing_badge", "Badge"], ["pricing_title", "Titre"], ["pricing_subtitle", "Description", "textarea"]],
        list: { key: "pricing_plans", title: "Offres & tarifs", singular: "offre", max: 8, initial: { name: "Nouvelle offre", description: "", price: 0, currency: "DH", period: "/ mois", popular: false, features: [] }, fields: [["name", "Nom"], ["description", "Description", "textarea"], ["price", "Prix", "number"], ["currency", "Devise"], ["period", "Période"], ["popular", "Offre populaire", "checkbox"], ["features", "Avantages (une ligne par avantage)", "lines"]] },
    },
    {
        id: "trainers", title: "Coaches & Classes", subtitle: "Contenu de démonstration du planning", icon: Dumbbell,
        fields: [["trainers_badge", "Badge"], ["trainers_title", "Titre"], ["trainers_subtitle", "Description", "textarea"], ["trainer_name", "Nom du coach mis en avant"], ["trainer_role", "Spécialité"], ["trainer_experience", "Expérience"], ["trainer_badge", "Badge du coach"], ["trainer_courses_label", "Texte des cours attribués"]],
        images: [["trainer_image", "Photo du coach vitrine"]],
        list: { key: "classes_items", title: "Cours de démonstration", singular: "cours", max: 12, initial: { category: "TRAINING", days: "Lundi", time: "10:00 - 11:00", title: "Nouveau cours", coach: "", location: "", enrolled: 0, capacity: 20 }, fields: [["title", "Nom du cours"], ["category", "Catégorie"], ["coach", "Coach"], ["days", "Jours"], ["time", "Horaire"], ["location", "Salle"], ["enrolled", "Inscrits (démo)", "number"], ["capacity", "Capacité (démo)", "number"]] },
    },
    {
        id: "contact", title: "Contact", subtitle: "Coordonnées et formulaire public", icon: Mail,
        fields: [["contact_title", "Titre"], ["contact_subtitle", "Description", "textarea"], ["contact_address", "Adresse"], ["contact_phone", "Téléphone", "tel"], ["contact_email", "E-mail", "email"], ["contact_hours", "Horaires"], ["contact_form_title", "Titre du formulaire"], ["contact_form_subtitle", "Texte du formulaire", "textarea"], ["contact_button", "Texte du bouton"]],
    },
    {
        id: "footer", title: "Footer", subtitle: "CTA, navigation et copyright", icon: PanelBottom,
        fields: [["footer_title", "Titre du CTA", "textarea"], ["footer_description", "Description", "textarea"], ["footer_primary_text", "Bouton principal"], ["footer_primary_link", "Lien principal", "select", anchors], ["footer_secondary_text", "Bouton secondaire"], ["footer_secondary_link", "Lien secondaire", "select", anchors], ["footer_copyright", "Copyright"]],
        list: { key: "footer_links", title: "Liens du Footer", singular: "lien", max: 10, initial: { label: "Nouveau lien", href: "#home" }, fields: [["label", "Libellé"], ["href", "Destination", "select", anchors]] },
    },
];