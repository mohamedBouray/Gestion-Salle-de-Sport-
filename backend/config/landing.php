<?php

return [
    // [groupe, libellé Admin, valeur par défaut]
    'fields' => [
        'site_name' => ['Navigation', 'Nom du site', 'GYM Management'],
        'site_logo' => ['Navigation', 'Logo', ''],
        'navbar_login_text' => ['Navigation', 'Connexion', 'Sign In'],
        'navbar_register_text' => ['Navigation', 'Inscription', 'Get Started'],
        'nav_links' => ['Navigation', 'Liens', json_encode([
            ['label' => 'Home', 'href' => '#home'],
            ['label' => 'Features', 'href' => '#features'],
            ['label' => 'Pricing', 'href' => '#pricing'],
            ['label' => 'Classes & Coaches', 'href' => '#schedule'],
            ['label' => 'Contact', 'href' => '#contact'],
        ])],

        'hero_title' => ['Hero', 'Titre', 'TRAIN SMARTER. MANAGE BETTER.'],
        'hero_subtitle' => ['Hero', 'Sous-titre', 'The smarter way to manage your fitness center.'],
        'hero_description' => ['Hero', 'Description', 'Manage members, memberships, class schedules, trainers, attendance, and reservations — all from one powerful platform.'],
        'hero_button' => ['Hero', 'Bouton', 'Get Started'],
        'hero_button_link' => ['Hero', 'Lien du bouton', '/register'],
        'hero_image' => ['Hero', 'Image', '/gym_background.png'],

        'features_badge' => ['Features', 'Badge', 'ARCHITECTURE'],
        'features_title' => ['Features', 'Titre', 'Everything You Need to Run Your Gym'],
        'features_subtitle' => ['Features', 'Description', 'One powerful platform to simplify your daily operations.'],
        'features_items' => ['Features', 'Cartes', json_encode([
            ['icon'=>'members','title'=>'Member Management','description'=>'Keep every member profile organized in one place.'],
            ['icon'=>'membership','title'=>'Membership Plans','description'=>'Manage subscriptions, renewals and membership plans.'],
            ['icon'=>'attendance','title'=>'Attendance Tracking','description'=>'Follow attendance and class check-ins.'],
            ['icon'=>'payment','title'=>'Payment Management','description'=>'Organize payments and receipts.'],
            ['icon'=>'trainer','title'=>'Staff & Trainer Management','description'=>'Manage coaches, schedules and classes.'],
            ['icon'=>'analytics','title'=>'Analytics & Reports','description'=>'Follow key metrics from your dashboard.'],
        ])],

        'pricing_badge' => ['Pricing', 'Badge', 'SIMPLE & FLEXIBLE PRICING'],
        'pricing_title' => ['Pricing', 'Titre', 'FLEXIBLE PLANS. STRONGER MEMBERSHIPS.'],
        'pricing_subtitle' => ['Pricing', 'Description', 'Find the right solution for your fitness business.'],
        'pricing_plans' => ['Pricing', 'Offres', json_encode([
            ['name'=>'Starter','description'=>'For growing fitness studios.','price'=>199,'currency'=>'DH','period'=>'/ mois','popular'=>false,'features'=>["Jusqu'à 200 membres actifs",'Gestion des profils membres','Suivi des abonnements']],
            ['name'=>'Professional','description'=>'For established fitness centers.','price'=>449,'currency'=>'DH','period'=>'/ mois','popular'=>true,'features'=>['Gestion des coachs & cours','Réservations des membres','Suivi des présences']],
            ['name'=>'Enterprise','description'=>'For larger fitness operations.','price'=>999,'currency'=>'DH','period'=>'/ mois','popular'=>false,'features'=>['Membres actifs illimités','Rapports avancés','Plans configurables']],
        ])],

        'trainers_badge' => ['Trainers', 'Badge', 'VERIFIED COACHING STAFF'],
        'trainers_title' => ['Trainers', 'Titre', 'ELITE INSTRUCTION & LIVE SCHEDULE'],
        'trainers_subtitle' => ['Trainers', 'Description', 'Instructors and upcoming classes.'],
        'trainer_name' => ['Trainers', 'Nom', 'Sarah Jenkins'],
        'trainer_role' => ['Trainers', 'Spécialité', 'Strength & Conditioning Specialist'],
        'trainer_experience' => ['Trainers', 'Expérience', '8+ YRS EXP'],
        'trainer_badge' => ['Trainers', 'Badge coach', 'Head Instructor'],
        'trainer_courses_label' => ['Trainers', 'Cours coach', 'Assigned Courses: 3 Active'],
        'trainer_image' => ['Trainers', 'Photo coach', '/traiter.avif'],
        'classes_items' => ['Trainers', 'Cours démonstration', json_encode([
            ['category'=>'HIGH INTENSITY','days'=>'Mon · Thu · Fri','time'=>'07:30 - 08:30','title'=>'CrossFit Engine','coach'=>'Marcus Vance','location'=>'Strength Studio A','enrolled'=>16,'capacity'=>18],
            ['category'=>'CARDIO CORE','days'=>'Tue · Fri','time'=>'18:00 - 19:15','title'=>'HIIT & Core Conditioning','coach'=>'Sarah Jenkins','location'=>'Functional Turf','enrolled'=>12,'capacity'=>15],
            ['category'=>'RECOVERY','days'=>'Wed · Sat','time'=>'10:00 - 11:00','title'=>'Power Mobility & Recovery','coach'=>'Elena Roberts','location'=>'Studio B','enrolled'=>10,'capacity'=>12],
        ])],

        'contact_title' => ['Contact', 'Titre', 'Ready to Upgrade Your Gym?'],
        'contact_subtitle' => ['Contact', 'Description', 'Have questions about our platform? Our team is here to help.'],
        'contact_address' => ['Contact', 'Adresse', '123 Fitness Ave, Casablanca, Morocco'],
        'contact_phone' => ['Contact', 'Téléphone', '+212 6 00 00 00 00'],
        'contact_email' => ['Contact', 'E-mail', 'contact@gymmanagement.com'],
        'contact_hours' => ['Contact', 'Horaires', 'Mon - Sat: 06:00 AM - 10:00 PM'],
        'contact_form_title' => ['Contact', 'Titre formulaire', 'Send us a Message'],
        'contact_form_subtitle' => ['Contact', 'Description formulaire', "Fill out the form below and we'll get back to you shortly."],
        'contact_button' => ['Contact', 'Bouton formulaire', 'Open Email App'],

        'footer_title' => ['Footer', 'Titre', 'YOUR GYM. YOUR PEOPLE. ONE SMARTER SYSTEM.'],
        'footer_description' => ['Footer', 'Description', 'Take control of your gym operations with one platform.'],
        'footer_primary_text' => ['Footer', 'Bouton principal', 'Explore FitManager'],
        'footer_primary_link' => ['Footer', 'Lien principal', '/register'],
        'footer_secondary_text' => ['Footer', 'Bouton secondaire', 'Compare Plans'],
        'footer_secondary_link' => ['Footer', 'Lien secondaire', '#pricing'],
        'footer_copyright' => ['Footer', 'Copyright', 'All rights reserved.'],
        'footer_links' => ['Footer', 'Liens', json_encode([
            ['label'=>'Home','href'=>'#home'],
            ['label'=>'Features','href'=>'#features'],
            ['label'=>'Pricing','href'=>'#pricing'],
            ['label'=>'Classes & Coaches','href'=>'#schedule'],
            ['label'=>'Contact','href'=>'#contact'],
        ])],
    ],
    'json_keys' => ['nav_links','features_items','pricing_plans','classes_items','footer_links'],
    'image_keys' => ['site_logo','hero_image','trainer_image'],
];