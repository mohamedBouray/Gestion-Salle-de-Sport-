import { Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import AnimatedContent from "../Designs/AnimatedContent";
import FadeContent from "../Designs/FadeContent";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";

function SmartLink({ href, children, className }) {
    return href?.startsWith("#") ? <a href={href} className={className}>{children}</a> : <Link to={href || "/"} className={className}>{children}</Link>;
}

export default function Footer() {
    const s = useLandingSettings();
    return (
        <footer className="bg-white font-sans">
            <section className="bg-[#2563EB] px-3 py-10 text-center sm:py-12">
                <AnimatedContent direction="vertical" distance={30} duration={0.8} initialOpacity={0} threshold={0.15}>
                    <div className="mx-auto max-w-3xl">
                        <h2 className="whitespace-pre-line text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[44px]">{s.footer_title}</h2>
                        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">{s.footer_description}</p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <SmartLink href={s.footer_primary_link} className="rounded bg-white px-6 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50">{s.footer_primary_text}</SmartLink>
                            <SmartLink href={s.footer_secondary_link} className="rounded border border-white/40 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10">{s.footer_secondary_text}</SmartLink>
                        </div>
                    </div>
                </AnimatedContent>
            </section>
            <div className="border-t border-slate-200 px-6 py-8 sm:px-10">
                <FadeContent duration={0.9} initialOpacity={0} threshold={0.1} blur={false}>
                    <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-6 lg:flex-row">
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                            <Link to="/" className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-white">{s.site_logo ? <img src={s.site_logo} className="h-7 w-7 rounded object-contain" alt="" /> : <Dumbbell size={16} />}</span>
                                <span className="text-sm font-bold text-slate-800">{s.site_name}</span>
                            </Link>
                            <p className="text-center text-[11px] text-slate-500 sm:text-left">© {new Date().getFullYear()} {s.site_name}. {s.footer_copyright}</p>
                        </div>
                        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Footer navigation">
                            {(s.footer_links || []).map((item, i) => <SmartLink key={i} href={item.href} className="text-[11px] font-medium text-slate-600 hover:text-blue-600">{item.label}</SmartLink>)}
                        </nav>
                    </div>
                </FadeContent>
            </div>
        </footer>
    );
}