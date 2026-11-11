import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";
import AnimatedContent from "../Designs/AnimatedContent";
import FadeContent from "../Designs/FadeContent";

export default function Hero() {
    const s = useLandingSettings();
    const action = s.hero_button_link || "/register";
    const ctaClass = "group mt-10 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-1 hover:bg-blue-500";
    const cta = action.startsWith("#")
        ? <a href={action} className={ctaClass}>{s.hero_button} <ArrowRight size={18} /></a>
        : <Link to={action} className={ctaClass}>{s.hero_button} <ArrowRight size={18} /></Link>;

    return (
        <section id="home" className="relative isolate mx-1.5 min-h-[550px] overflow-hidden bg-[#080e13] sm:min-h-[600px] lg:min-h-[650px]">
            <img src={s.hero_image || "/gym_background.png"} alt="" aria-hidden="true" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
            <div className="relative z-10 flex min-h-[550px] items-center px-5 py-16 sm:min-h-[600px] sm:px-12 lg:min-h-[650px] lg:px-16">
                <div className="max-w-[580px]">
                    <AnimatedContent direction="vertical" distance={35} duration={0.9} initialOpacity={0} threshold={0.1} once>
                        <h1 className="whitespace-pre-line text-[clamp(1.7rem,7.8vw,3rem)] font-extrabold uppercase leading-[1.12] tracking-tight text-blue-600 sm:text-5xl lg:text-[56px]">
                            {s.hero_title}
                        </h1>
                    </AnimatedContent>
                    <FadeContent duration={0.9} delay={0.35} initialOpacity={0} threshold={0.1} blur={false}>
                        <p className="mt-4 text-lg font-medium tracking-wide text-blue-100 sm:text-xl">{s.hero_subtitle}</p>
                        <p className="mt-4 max-w-[540px] text-base leading-relaxed text-gray-300 sm:text-lg">{s.hero_description}</p>
                        {cta}
                    </FadeContent>
                </div>
            </div>
        </section>
    );
}