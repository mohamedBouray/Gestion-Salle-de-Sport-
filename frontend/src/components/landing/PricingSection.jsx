import AnimatedContent from "../Designs/AnimatedContent";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";
import { Check } from "lucide-react";

export default function PricingSection() {
    const s = useLandingSettings();
    const plans = Array.isArray(s.pricing_plans) ? s.pricing_plans : [];
    return (
        <section id="pricing" className="w-full bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-10" >
            <div className="w-full">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-extrabold uppercase tracking-tight text-[#0F2037] sm:text-4xl">
                        {s.pricing_title}
                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-500 sm:text-base">
                        {s.pricing_subtitle}
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid w-full grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">

                    {plans.length === 0 && (
                        <p className="col-span-full rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                            Aucun abonnement disponible pour le moment.
                        </p>
                    )}
                    {plans.map((plan, i) => (
                        <AnimatedContent
                            key={plan.id ?? i}
                            direction="vertical"
                            distance={20}
                            duration={0.6}
                            delay={i * 0.1}
                            initialOpacity={0}
                            threshold={0.1}
                        >
                            <article className={`relative flex h-full min-w-0 flex-col rounded-2xl border p-6 transition-colors duration-200 sm:p-8 ${
                                    plan.popular ? "border-blue-600 bg-white shadow-md" : "border-slate-200 bg-white shadow-sm hover:border-blue-300"}`}>
                                {plan.popular && (
                                    <span className="absolute -top-3 right-5 rounded-full bg-blue-600 px-4 py-1.5 text-[11px] font-bold text-white">
                                        Most Popular
                                    </span>
                                )}

                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600">{plan.type_label}</p>
                                {/* Name */}
                                <h3 className="text-xl font-bold text-slate-900">
                                    {plan.name}
                                </h3>

                                <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-500">
                                    {plan.description}
                                </p>

                                {/* Price */}
                                <div className="mt-7 flex flex-wrap items-baseline gap-2">
                                    <span className="text-4xl font-extrabold tracking-tight text-[#0F2037] sm:text-5xl">
                                        {plan.price}
                                    </span>

                                    <span className="text-lg font-bold text-[#0F2037]">
                                        {plan.currency}
                                    </span>

                                    <span className="text-sm text-slate-500">
                                        {plan.period}
                                    </span>
                                </div>

                                <div className="my-7 border-t border-slate-200" />

                                {/* Features */}
                                <div className="flex-1">
                                    <p className="mb-5 text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Inclus dans l'abonnement
                                    </p>

                                    <ul className="space-y-4">
                                        {(plan.features || []).map((feature, j) => (
                                            <li key={j} className="flex items-start gap-3 text-sm text-slate-600">
                                                <Check size={18} className="mt-0.5 shrink-0 text-blue-600"/>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                            </article>
                        </AnimatedContent>
                    ))}

                </div>
            </div>
        </section>
    );
}
