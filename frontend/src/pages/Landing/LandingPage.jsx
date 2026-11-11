import { useEffect, useState } from "react";
import Navbar from "../../components/landing/NavBarLanding";
import Hero from "../../components/landing/Hero";
import Architecture from "../../components/landing/Architecture";
import PricingSection from "../../components/landing/PricingSection";
import TrainersSchedule from "../../components/landing/TrainersSchedule";
import Contact from "../../components/landing/Contact";
import Footer from "../../components/landing/Footer";
import AnimatedContent from "../../components/Designs/AnimatedContent";
import FadeContent from "../../components/Designs/FadeContent";
import { LandingSettingsProvider } from "../../contexts/LandingSettingsContext";

function Reveal({ children, reduced, fade = false }) {
    if (reduced) return children;
    if (fade) return <FadeContent duration={0.8} initialOpacity={0.1} threshold={0.1} blur={false}>{children}</FadeContent>;
    return <AnimatedContent direction="vertical" distance={25} duration={0.8} initialOpacity={0.1} threshold={0.1}>{children}</AnimatedContent>;
}

export default function LandingPage() {
    const [reduced, setReduced] = useState(() =>
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReduced(media.matches);
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    return (
        <LandingSettingsProvider>
            <div className="min-h-screen bg-white text-slate-900">
                <Navbar />
                <main id="main-content">
                    <Hero />
                    <Reveal reduced={reduced}><Architecture /></Reveal>
                    <Reveal reduced={reduced}><PricingSection /></Reveal>
                    <Reveal reduced={reduced}><TrainersSchedule /></Reveal>
                    <Reveal reduced={reduced} fade><Contact /></Reveal>
                </main>
                <Footer />
            </div>
        </LandingSettingsProvider>
    );
}