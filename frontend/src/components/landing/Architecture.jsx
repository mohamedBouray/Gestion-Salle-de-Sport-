import AnimatedContent from "../Designs/AnimatedContent";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";

function FeatureIcon({ name }) {
    const paths = {
        members: <><rect x="4" y="7" width="16" height="14" rx="2" /><circle cx="11" cy="12" r="2" /><path d="M7.5 18v-1a3.5 3.5 0 0 1 7 0v1M17 2v6M14 5h6" /></>,
        membership: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h5" /></>,
        attendance: <><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" /><rect x="8" y="8" width="3" height="3" /><rect x="14" y="8" width="3" height="3" /></>,
        payment: <><rect x="6" y="3" width="13" height="17" rx="2" /><path d="M9 8h7M9 12h7M9 16h4M4 7v13a2 2 0 0 0 2 2h9" /></>,
        trainer: <><circle cx="17" cy="5" r="2" /><path d="M5 8l5 2 4-3M14 7l-3 6-4 3M11 13l5 3 2 5M7 16l-4 5M3 5l4 2" /></>,
        analytics: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 17v-4M12 17V9M16 17v-6" /></>,
    };
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.members}</svg>;
}

export default function Architecture() {
    const s = useLandingSettings();
    return (
        <section id="features" className="scroll-mt-24 bg-[#F7F9FF] px-5 py-10 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-[1200px]">
                <div className="mx-auto mb-12 max-w-[680px] text-center sm:mb-14">
                    <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">{s.features_badge}</span>
                    <h2 className="mt-5 text-[27px] font-extrabold leading-tight tracking-tight text-[#0F2037] sm:text-[32px] lg:text-[36px]">{s.features_title}</h2>
                    <p className="mx-auto mt-5 max-w-[590px] text-[14px] leading-[1.8] text-slate-500 sm:text-[15px]">{s.features_subtitle}</p>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {(s.features_items || []).map((item, i) => (
                        <AnimatedContent key={i} direction="vertical" distance={22} duration={0.65} delay={(i % 3) * 0.08} initialOpacity={0} threshold={0.1}>
                            <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg motion-reduce:transform-none sm:p-7">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 group-hover:bg-blue-100"><FeatureIcon name={item.icon} /></div>
                                <h3 className="mb-3 text-[16px] font-bold text-slate-900">{item.title}</h3>
                                <p className="text-[13px] leading-[1.85] text-slate-500 sm:text-[14px]">{item.description}</p>
                            </article>
                        </AnimatedContent>
                    ))}
                </div>
            </div>
        </section>
    );
}