
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";


// React Bits
import AnimatedContent from "../Designs/AnimatedContent";
import FadeContent from "../Designs/FadeContent";

const description = (       
    <>
        {/* Subtitle */}
        <p className="mt-4 text-lg font-medium tracking-wide text-blue-100 sm:text-xl">
            The smarter way to manage your fitness center.
        </p>
        
        {/* Description */}
        <p className="mt-4 max-w-[540px] text-base leading-relaxed text-gray-300 sm:text-lg">
            Manage members, memberships, class schedules, trainers, attendance, 
            and reservations — all from one powerful enterprise engine built 
            for athletic performance facilities.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link 
                to="/register" 
                className="group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/30
                transition-all duration-300 ease-out hover:bg-blue-500 hover:shadow-blue-500/40 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                Get Started
                <svg  className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </Link>
        </div>
    </>
);

export default function Hero() {
    const heroImage = "/gym_background.png";

    const [reducedMotion, setReducedMotion] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handleChange = () => {
            setReducedMotion(media.matches);
        };
        media.addEventListener("change", handleChange);
        return () => {
            media.removeEventListener("change", handleChange);
        };
    }, []);

    const heading = (
        <h1 className="text-[clamp(1.7rem,7.8vw,3rem)]font-extrabold uppercase leading-[1.12] tracking-tight text-blue-600 sm:text-5xl lg:text-[56px]"  >
            TRAIN SMARTER.<br /> MANAGE BETTER.
        </h1>
    );

    return (
        <section id="home" className=" relative isolate mx-1.5 min-h-[550px] overflow-hidden bg-[#080e13] sm:min-h-[600px] lg:min-h-[650px] " >
            <img src={heroImage} alt=""  aria-hidden="true" fetchPriority="high" className="absolute inset-0h-full w-fullobject-cover object-center" />
            <div  aria-hidden="true"  className="absolute inset-0 bg-gradient-to-r from-black/80  via-black/55  to-black/20"/>
            <div  className=" relative z-10 flex min-h-[550px] items-center px-5 py-16 sm:min-h-[600px] sm:px-12 lg:min-h-[650px] lg:px-16" >
                <div className="w-full min-w-0 max-w-[580px]">
                    {reducedMotion ? (
                        heading
                    ) : (
                        <AnimatedContent
                            direction="vertical"
                            distance={35}
                            duration={0.9}
                            delay={0.1}
                            ease="power3.out"
                            initialOpacity={0}
                            animateOpacity={true}
                            threshold={0.1}
                            once={true}>
                            {heading}
                        </AnimatedContent>
                    )}

                    {/* ANIMATED DESCRIPTION & BUTTON */}
                    {reducedMotion ? (
                        description
                    ) : (
                        <FadeContent
                            duration={0.9}
                            delay={0.35}
                            initialOpacity={0}
                            threshold={0.1}
                            blur={false}
                        >
                            {description}
                        </FadeContent>
                    )}

                </div>
            </div>
        </section>
    );
}
