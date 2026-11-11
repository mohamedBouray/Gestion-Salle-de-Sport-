import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";

const input = "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

export default function Contact() {
    const s = useLandingSettings();
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const info = [
        { icon: MapPin, title: "Our Location", value: s.contact_address },
        { icon: Phone, title: "Phone Number", value: s.contact_phone },
        { icon: Mail, title: "Email Address", value: s.contact_email },
        { icon: Clock, title: "Working Hours", value: s.contact_hours },
    ];
    const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    const submit = (e) => {
        e.preventDefault();
        if (!s.contact_email) return;
        const subject = encodeURIComponent(`Gym inquiry from ${form.name}`);
        const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
        window.location.href = `mailto:${s.contact_email}?subject=${subject}&body=${body}`;
    };
    return (
        <section id="contact" className="scroll-mt-24 bg-[#F7F9FF] px-2 py-8 sm:px-4 lg:py-12">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 text-center"><h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">{s.contact_title}</h2><p className="mx-auto mt-4 max-w-[650px] text-base leading-relaxed text-slate-500">{s.contact_subtitle}</p></div>
                <div className="grid gap-8 lg:grid-cols-2">
                    <div className="space-y-4">
                        {info.map(({ icon: Icon, title, value }) => <div key={title} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={24} /></div><div className="min-w-0"><p className="text-sm font-bold text-slate-800">{title}</p><p className="mt-1 break-words text-sm text-slate-500">{value || "—"}</p></div></div>)}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h3 className="text-xl font-bold">{s.contact_form_title}</h3><p className="mt-2 text-sm text-slate-500">{s.contact_form_subtitle}</p>
                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <label className="block text-sm font-medium">Full Name<input name="name" value={form.name} onChange={change} required maxLength={160} className={`mt-1.5 ${input}`} placeholder="John Doe" /></label>
                            <label className="block text-sm font-medium">Email Address<input name="email" type="email" value={form.email} onChange={change} required maxLength={190} className={`mt-1.5 ${input}`} placeholder="john@example.com" /></label>
                            <label className="block text-sm font-medium">Message<textarea name="message" value={form.message} onChange={change} required maxLength={3000} rows={4} className={`mt-1.5 ${input}`} placeholder="How can we help you?" /></label>
                            <button type="submit" disabled={!s.contact_email} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{s.contact_button} <Send size={16} /></button>
                            <p className="text-center text-xs text-slate-400">Your email application will open to send the message.</p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}