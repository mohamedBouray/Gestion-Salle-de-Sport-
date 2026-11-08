import { useEffect, useState } from "react";

// Landing Components
import Navbar from "../../components/landing/NavBarLanding";
import Hero from "../../components/landing/Hero";
import CoreArchitecture from "../../components/landing/Architecture";
import PricingSection from "../../components/landing/PricingSection";
import TrainersSchedule from "../../components/landing/TrainersSchedule";
import DashboardPreview from "../../components/landing/Contact";
import Footer from "../../components/landing/Footer";

// React Bits Animations
import AnimatedContent from "../../components/Designs/AnimatedContent";
import FadeContent from "../../components/Designs/FadeContent";

// Reusable Scroll Animation
function RevealSection({ children, reducedMotion, variant = "slide",}) {
    if (reducedMotion) {return children;}
    if (variant === "fade") {
        return (
            <FadeContent duration={0.8}delay={0}initialOpacity={0.1}threshold={0.1}blur={false}>
                {children}
            </FadeContent>
        );
    }
    return (
        <AnimatedContent direction="vertical" distance={30} duration={0.8} delay={0} ease="power3.out" initialOpacity={0.1} animateOpacity={true} scale={1}
            threshold={0.1}>
            {children}
        </AnimatedContent>
    );
}

export default function LandingPage() {

    const [reducedMotion, setReducedMotion] = useState(() =>typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updateMotion = () => {
            setReducedMotion(media.matches);
        };
        media.addEventListener("change", updateMotion);
        return () => {
            media.removeEventListener("change", updateMotion);
        };
    }, []);

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <Navbar />
            <main id="main-content">
                <Hero />
                <RevealSection reducedMotion={reducedMotion}>
                    <CoreArchitecture />
                </RevealSection>
                <RevealSection reducedMotion={reducedMotion}>
                    <PricingSection />
                </RevealSection>
                <RevealSection reducedMotion={reducedMotion}>
                    <TrainersSchedule />
                </RevealSection>
                <RevealSection reducedMotion={reducedMotion} variant="fade">
                    <DashboardPreview />
                </RevealSection>
            </main>
            <Footer />
        </div>
    );
}
