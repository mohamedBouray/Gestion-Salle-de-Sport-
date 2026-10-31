import { useEffect, useState } from "react";
import AnimatedContent from "../Designs/AnimatedContent";


const pricingData = [
    {
        id: 1,
        name: "Starter",
        description: "Everything you need to organize and manage a growing fitness studio.",
        price: 199,
        currency: "DH",
        period: "/ mois",
        features: [
            "Jusqu'à 200 membres actifs",
            "Gestion des profils membres",
            "Suivi des abonnements",
            "Aperçu du planning des cours",
            "Gestion des reçus PDF",
        ],
        popular: false,
    },
    {
        id: 2,
        name: "Professional",
        description: "A complete management experience for established fitness centers.",
        price: 449,
        currency: "DH",
        period: "/ mois",
        features: [
            "Tout ce qui est dans Starter",
            "Gestion des coachs & cours",
            "Réservations des membres",
            "Suivi des présences",
            "Analyses du tableau de bord",
            "Accès basé sur les rôles",
        ],
        popular: true,
    },
    {
        id: 3,
        name: "Enterprise",
        description: "Extended management capabilities for larger fitness operations.",
        price: 999,
        currency: "DH",
        period: "/ mois",
        features: [
            "Tout ce qui est dans Professional",
            "Membres actifs illimités",
            "Gestion centralisée des utilisateurs",
            "Rapports opérationnels avancés",
            "Plans d'abonnement configurables",
        ],
        popular: false,
    },
];


function CheckIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 4 4L19 6" />
        </svg>
    );
}

// ==========================================
// 2. PRICING CARD (Component)
// ==========================================
function PricingCard({ plan }) {
    return (
        <article className={`group relative flex h-full flex-col rounded-2xl border px-6 py-8 sm:px-7 transition-all duration-300 ease-out hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none
        ${plan.popular ? `border-blue-500 bg-white shadow-[0_12px_40px_rgba(37,99,235,0.10)] hover:shadow-[0_18px_50px_rgba(37,99,235,0.14)]` : `border-slate-200 bg-[#FAFBFF] shadow-[0_2px_12px_rgba(15,23,42,0.025)]
               hover:border-blue-200 hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]`}`}>
            {/* POPULAR BADGE */}
            {plan.popular && (
                <span className=" absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    MOST POPULAR
                </span>
            )}

            {/* PLAN HEADER */}
            <div className="border-b border-slate-100 pb-7">
                <h3 className="text-[18px] font-bold tracking-tight text-slate-900">
                    {plan.name}
                </h3>
                <p className="mt-3 min-h-[62px] text-[13px] leading-[1.75] text-slate-500">
                    {plan.description}
                </p>

                {/* PRICE (B DH) */}
                <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-[24px] font-bold text-slate-900">
                        {plan.currency}
                    </span>
                    <span className="text-[48px] font-extrabold leading-none tracking-tight text-[#0F2037]">
                        {plan.price}
                    </span>
                    <span className="ml-1 text-[13px] text-slate-500">
                        {plan.period}
                    </span>
                </div>
            </div>

            {/* FEATURES */}
            <div className="flex-1 pt-7">
                <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    What's included
                </p>

                <ul className="space-y-4">
                    {plan.features.map((feature) => (
                        <li key={feature}
                            className="flex items-start gap-3 text-[13px] leading-relaxed text-slate-600">
                            <span className={` mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${plan.popular? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                                    }`}>
                                <CheckIcon />
                            </span>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* BOTTOM DETAIL */}
            <div className="mt-9 border-t border-slate-100 pt-5">
                <p className="text-center text-[12px] font-medium text-slate-400">
                    Built for better gym management
                </p>
            </div>
        </article>
    );
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function PricingSection() {

    const [reducedMotion, setReducedMotion] = useState(() => typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handleChange = () => setReducedMotion(media.matches);
        media.addEventListener("change", handleChange);
        return () => media.removeEventListener("change", handleChange);
    }, []);

    return (
        <section id="pricing"
            className="bg-white px-5 py-8 sm:px-8 sm:py-8 lg:px-8 lg:py-10">
            <div className="mx-auto max-w-[1200px]">
                {/* SECTION HEADER */}
                <div className="mx-auto mb-14 max-w-[700px] text-center">
                    <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">
                        SIMPLE & FLEXIBLE PRICING
                    </span>

                    <h2 className="mt-5 text-[27px] font-extrabold uppercase leading-tight tracking-tight text-[#0F2037] sm:text-[32px] lg:text-[36px]">
                        FLEXIBLE PLANS.
                        <br />
                        STRONGER MEMBERSHIPS.
                    </h2>

                    <p className="mx-auto mt-5 max-w-[550px] text-[14px] leading-[1.8] text-slate-500 sm:text-[15px]">
                        Find the right solution for your fitness business. From
                        growing studios to established gyms, manage your
                        operations with confidence.
                    </p>
                </div>

                {/* PRICING GRID */}
                <div className="grid grid-cols-1 items-stretch gap-7 pt-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {pricingData.map((plan, index) => {
                        const card = <PricingCard plan={plan} />;
                        if (reducedMotion) {
                            return (
                                <div key={plan.id} className="h-full">
                                    {card}
                                </div>
                            );
                        }
                        return (
                            <AnimatedContent
                                key={plan.id}
                                className="h-full"
                                direction="vertical"
                                distance={25}
                                duration={0.7}
                                delay={index * 0.12}
                                ease="power3.out"
                                initialOpacity={0}
                                animateOpacity={true}
                                scale={1}
                                threshold={0.1}
                            >
                                {card}
                            </AnimatedContent>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}