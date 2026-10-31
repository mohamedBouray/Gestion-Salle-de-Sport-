import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";

// React Bits
import AnimatedContent from "../Designs/AnimatedContent";
import FadeContent from "../Designs/FadeContent";


const footerLinks = [
    { label: "Product Architecture", href: "#" },
    { label: "Entity Modules", href: "#" },
    { label: "Security & SOC2", href: "#" },
    { label: "API Docs", href: "#" },
    { label: "Privacy Policy", href: "#" },
];

export default function Footer() {
    const [reducedMotion, setReducedMotion] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handleChange = () => setReducedMotion(media.matches);
        media.addEventListener("change", handleChange);
        return () => media.removeEventListener("change", handleChange);
    }, []);

    const ctaContent = (
        <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[44px]">
                YOUR GYM. YOUR PEOPLE.
                <br />
                ONE SMARTER SYSTEM.
            </h2>
            
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
                Take control of your gym operations with a platform built to simplify every session, subscription, and reservation.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link  to="/register" 
                    className="rounded bg-white px-6 py-2.5 text-sm font-semibold text-[#2563EB] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-lg">
                    Explore FitManager
                </Link>
                <a  href="#pricing" 
                    className="rounded border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10">
                    Compare Plans
                </a>
            </div>
        </div>
    );

    return (
        <footer className="bg-white font-sans">
            <section className="bg-[#2563EB] px-3 py-10 text-center sm:py-12">
                {reducedMotion ? (
                    ctaContent
                ) : (
                    <AnimatedContent
                        direction="vertical"
                        distance={30}
                        duration={0.8}
                        delay={0}
                        ease="power3.out"
                        initialOpacity={0}
                        animateOpacity={true}
                        scale={1}
                        threshold={0.15}
                    >
                        {ctaContent}
                    </AnimatedContent>
                )}
            </section>
            <div className="border-t border-slate-200 px-6 py-8 sm:px-10">
                {reducedMotion ? (
                    <FooterBottom />
                ) : (
                    <FadeContent
                        duration={0.9}
                        delay={0.2}
                        initialOpacity={0}
                        threshold={0.1}
                        blur={false}
                    >
                        <FooterBottom />
                    </FadeContent>
                )}
            </div>
        </footer>
    );
}

// ======================================
// FOOTER BOTTOM (Component Mfarqa bach t9ad l'animation)
// ======================================
function FooterBottom() {
    return (
        <>
            <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-6 lg:flex-row">
                
                {/* LEFT: Logo & Copyright */}
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-[#2563EB] text-white">
                            <Dumbbell size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-800">
                            FitManager
                        </span>
                    </Link>
                    
                    <p className="text-center text-[11px] text-slate-500 sm:text-left">
                        © {new Date().getFullYear()} FitManager Enterprise Gym Systems Inc. All rights reserved.
                    </p>
                </div>

                {/* RIGHT: Links */}
                <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                    {footerLinks.map((link) => (
                        <a  key={link.label} 
                            href={link.href}
                            className="text-[11px] font-medium text-slate-600 transition-colors hover:text-blue-600">
                            {link.label}
                        </a>
                    ))}
                </nav>
            </div>

            {/* Bottom Row (Terms of Service) */}
            <div className="mx-auto mt-4 max-w-[1100px] text-center lg:text-right">
                 <a href="#" className="text-[11px] font-medium text-slate-600 transition-colors hover:text-blue-600">
                    Terms of Service
                </a>
            </div>
        </>
    );
}