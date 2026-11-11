import AnimatedContent from "../Designs/AnimatedContent";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";

export default function PricingSection() {
    const s = useLandingSettings();
    return (
        <section id="pricing" className="scroll-mt-24 bg-white px-5 py-8 sm:px-8 lg:py-10">
            <div className="mx-auto max-w-[1200px]">
                <div className="mx-auto mb-14 max-w-[700px] text-center">
                    <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">{s.pricing_badge}</span>
                    <h2 className="mt-5 text-[27px] font-extrabold uppercase leading-tight text-[#0F2037] sm:text-[32px] lg:text-[36px]">{s.pricing_title}</h2>
                    <p className="mx-auto mt-5 max-w-[550px] text-sm leading-7 text-slate-500 sm:text-[15px]">{s.pricing_subtitle}</p>
                </div>
                <div className="grid items-stretch gap-7 pt-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {(s.pricing_plans || []).map((plan, i) => (
                        <AnimatedContent key={i} direction="vertical" distance={25} duration={0.7} delay={i * 0.12} initialOpacity={0} threshold={0.1}>
                            <article className={`group relative flex h-full flex-col rounded-2xl border px-6 py-8 transition hover:-translate-y-1 motion-reduce:transform-none sm:px-7 ${plan.popular ? "border-blue-500 bg-white shadow-[0_12px_40px_rgba(37,99,235,0.10)]" : "border-slate-200 bg-[#FAFBFF] shadow-sm hover:border-blue-200"}`}>
                                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-[10px] font-bold uppercase text-white">MOST POPULAR</span>}
                                <div className="border-b border-slate-100 pb-7">
                                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                                    <p className="mt-3 min-h-[62px] text-[13px] leading-[1.75] text-slate-500">{plan.description}</p>
                                    <div className="mt-6 flex items-baseline gap-1"><span className="text-2xl font-bold">{plan.currency}</span><span className="text-5xl font-extrabold text-[#0F2037]">{plan.price}</span><span className="ml-1 text-xs text-slate-500">{plan.period}</span></div>
                                </div>
                                <div className="flex-1 pt-7">
                                    <p className="mb-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">What's included</p>
                                    <ul className="space-y-4">{(plan.features || []).map((feature, j) => <li key={j} className="flex gap-3 text-[13px] leading-relaxed text-slate-600"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">✓</span>{feature}</li>)}</ul>
                                </div>
                                <p className="mt-9 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">Built for better gym management</p>
                            </article>
                        </AnimatedContent>
                    ))}
                </div>
            </div>
        </section>
    );
}