
import { useEffect, useState } from "react";
import AnimatedContent from "../Designs/AnimatedContent";

// FEATURES
const features = [
    {
        id: 1,
        icon: "members",
        title: "Member Management",
        description:
            "Keep every member profile organized in one place. Manage personal information, membership status, and account details with ease.",
    },
    {
        id: 2,
        icon: "membership",
        title: "Membership Plans",
        description:
            "Create and manage flexible membership plans, track active subscriptions, and maintain a clear overview of member renewals.",
    },
    {
        id: 3,
        icon: "attendance",
        title: "Attendance Tracking",
        description:
            "Monitor class attendance, manage member check-ins, and help coaches keep accurate participation records.",
    },
    {
        id: 4,
        icon: "payment",
        title: "Payment Management",
        description:
            "Simplify subscription administration, organize payment records, and generate professional PDF receipts for members.",
    },
    {
        id: 5,
        icon: "trainer",
        title: "Staff & Trainer Management",
        description:
            "Organize coaching staff, assign classes, manage schedules, and give trainers access to their daily activities.",
    },
    {
        id: 6,
        icon: "analytics",
        title: "Analytics & Reports",
        description:
            "Get a clearer view of gym operations with dashboards highlighting memberships, attendance, and key business metrics.",
    },
];

// FEATURE ICONS
function FeatureIcon({ name }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" >
            {name === "members" && (
                <>
                    <rect x="4" y="7" width="16" height="14" rx="2" />
                    <circle cx="11" cy="12" r="2" />
                    <path d="M7.5 18v-1a3.5 3.5 0 0 1 7 0v1" />
                    <path d="M17 2v6M14 5h6" />
                </>
            )}

            {name === "membership" && (
                <>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 10h18M7 15h5" />
                </>
            )}

            {name === "attendance" && (
                <>
                    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" />
                    <rect x="8" y="8" width="3" height="3" />
                    <rect x="14" y="8" width="3" height="3" />
                    <path d="M8 14h3v3H8zM14 14h1M17 14v3M14 17h1" />
                </>
            )}

            {name === "payment" && (
                <>
                    <rect x="6" y="3" width="13" height="17" rx="2" />
                    <path d="M9 8h7M9 12h7M9 16h4M4 7v13a2 2 0 0 0 2 2h9" />
                </>
            )}

            {name === "trainer" && (
                <>
                    <circle cx="17" cy="5" r="2" />
                    <path d="M5 8l5 2 4-3M14 7l-3 6-4 3M11 13l5 3 2 5M7 16l-4 5M3 5l4 2" />
                </>
            )}

            {name === "analytics" && (
                <>
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                    <path d="M8 17v-4M12 17V9M16 17v-6" />
                </>
            )}
        </svg>
    );
}

// PROFESSIONAL FEATURE CARD
function FeatureCard({ feature }) {
    return (
        <article
            className=" group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-[0_2px_12px_rgba(15,23,42,0.025)] transition-all duration-300 ease-out  hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]
             motion-reduce:transform-none motion-reduce:transition-none sm:p-7">
            {/* ICON CONTAINER */}
            <div
                className=" mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100
                bg-blue-50 text-blue-600 transition-colors duration-300 group-hover:border-blue-200 group-hover:bg-blue-100 motion-reduce:transition-none ">
                <FeatureIcon name={feature.icon} />
            </div>

            {/* CARD TITLE */}
            <h3 className="mb-3 text-[16px] font-bold leading-snug tracking-tight text-slate-900">
                {feature.title}
            </h3>

            {/* DESCRIPTION */}
            <p className=" text-[13px] leading-[1.85] text-slate-500 sm:text-[14px]">
                {feature.description}
            </p>
        </article>
    );
}

// MAIN SECTIONc
export default function Architecture() {
    const [reducedMotion, setReducedMotion] = useState(() =>
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    useEffect(() => {
        const media = window.matchMedia( "(prefers-reduced-motion: reduce)");
        const handleChange = () => {setReducedMotion(media.matches); };
        media.addEventListener("change", handleChange);
        return () => {
            media.removeEventListener("change",handleChange);
        };
    }, []);

    return (
        <section id="features" className="bg-[#F7F9FF] px-5 py-10 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-[1200px]">
                {/* SECTION HEADER */}
                <div className="mx-auto mb-12 max-w-[680px] text-center sm:mb-14">
                    {/* BADGE */}
                    <span className=" inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">
                        ARCHITECTURE
                    </span>
                    <h2 className=" mt-5 text-[27px] font-extrabold leading-tight tracking-tight text-[#0F2037] sm:text-[32px] lg:text-[36px]">
                        Everything You Need
                        <br className="hidden sm:block" />
                        {" "}to Run Your Gym
                    </h2>

                    {/* SUBTITLE */}
                    <p className=" mx-auto mt-5 max-w-[590px] text-[14px] leading-[1.8] text-slate-500 sm:text-[15px]" >
                        One powerful platform to simplify your daily
                        operations. Manage members, memberships,
                        classes, and staff from a single,
                        organized workspace.
                    </p>
                </div>

                {/* FEATURES GRID */}
                <div className=" grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {features.map((feature, index) => {
                        const card = (
                            <FeatureCard feature={feature} />
                        );
                        if (reducedMotion) {
                            return (
                                <div key={feature.id} className="h-full">
                                    {card}
                                </div>
                            );
                        }
                        return (
                            <AnimatedContent
                                key={feature.id}
                                className="h-full"
                                direction="vertical"
                                distance={22}
                                duration={0.65}
                                delay={(index % 3) * 0.08}
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
