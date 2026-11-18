import { Link } from "react-router-dom";
import {Dumbbell, MapPin, Phone, Mail, Clock, ArrowUpRight,} from "lucide-react";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";

function SmartLink({ href, children, className }) {
    if (href?.startsWith("#")) {
        return (
            <a href={href} className={className}
                onClick={(e) => {
                    const section = document.getElementById(
                        href.slice(1)
                    );
                    if (!section) 
                        return;
                    e.preventDefault();
                    window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top +12, behavior: "smooth",});
                }} >
                {children}
            </a>
        );
    }
    return (
        <Link to={href || "/"} className={className}>
            {children}
        </Link>
    );
}

export default function Footer() {
    const s = useLandingSettings();

    const footerLinks = s.footer_links || [];

    const contactInfo = [
        {
            icon: MapPin,
            label: "Adresse",
            value: s.contact_address,
        },
        {
            icon: Phone,
            label: "Téléphone",
            value: s.contact_phone,
        },
        {
            icon: Mail,
            label: "Email",
            value: s.contact_email,
        },
    ];

    return (
        <footer className="w-full bg-[#F1F1F1] font-sans">
            <div className="w-full px-5 py-10 sm:px-8 lg:px-12">
                <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
                    <div>
                        <Link to="/" className="inline-flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
                                {s.site_logo ? (
                                    <img src={s.site_logo} alt="" className="h-8 w-8 rounded-md object-contain"/>
                                ) : (<Dumbbell size={17} />)}
                            </span>
                            <span className="text-sm font-extrabold text-slate-900">
                                {s.site_name}
                            </span>
                        </Link>

                        <p className="mt-4 max-w-[260px] text-xs leading-6 text-slate-500">
                            {s.footer_description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                            {s.footer_primary_text && (
                                <SmartLink href={s.footer_primary_link}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline" >
                                    {s.footer_primary_text}
                                    <ArrowUpRight size={13} />
                                </SmartLink>
                            )}

                            {s.footer_secondary_text && (
                                <SmartLink href={s.footer_secondary_link}
                                    className="text-xs font-medium text-slate-600 hover:text-blue-600 hover:underline">
                                    {s.footer_secondary_text}
                                </SmartLink>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-800">
                            Liens utiles
                        </h3>
                        <nav className="flex flex-col items-start gap-3" aria-label="Footer navigation">
                            {footerLinks.map((item, i) => (
                                <SmartLink key={`${item.href}-${i}`} href={item.href}
                                    className="text-xs text-slate-500 transition-colors hover:text-blue-600 hover:underline">
                                    {item.label}
                                </SmartLink>
                            ))}
                        </nav>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-800">
                            Contact & Informations
                        </h3>

                        <div className="space-y-4">
                            {contactInfo.map(
                                ({ icon: Icon, label, value }) => (
                                    <div key={label}
                                        className="flex items-start gap-2.5">
                                        <Icon size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-blue-600"/>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-semibold text-slate-700">
                                                {label}
                                            </p>
                                            <p className="mt-1 break-words whitespace-pre-line text-xs leading-5 text-slate-500">
                                                {value || "Non renseigné"}
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Working Hours */}
                    <div>
                        <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-800">
                            Horaires d'ouverture
                        </h3>

                        <div className="flex items-start gap-2.5">
                            <Clock size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-blue-600"/>
                            <p className="whitespace-pre-line text-xs leading-6 text-slate-500">
                                {s.contact_hours || "Non renseigné"}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Copyright */}
            <div className="border-t border-slate-300/70 px-5 py-4 sm:px-8 lg:px-12">
                <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
                    <p className="text-[11px] text-slate-500">
                        © {new Date().getFullYear()} {s.site_name}.{" "}{s.footer_copyright}
                    </p>
                    <p className="text-[11px] text-slate-400">
                        Tous droits réservés.
                    </p>
                </div>
            </div>
        </footer>
    );
}
