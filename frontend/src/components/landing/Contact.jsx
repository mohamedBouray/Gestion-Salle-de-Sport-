import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";

import { apiError } from "../../services/api";
import { publicApi } from "../../services/PublicApi";

const initialForm = {
    name: "",
    email: "",
    subject: "Demande depuis le site",
    message: "",
    website: "",
};

const inputClass = "w-full rounded-lg border border-slate-200 bg-white " +"px-4 py-3.5 text-sm text-slate-900 outline-none " +"placeholder:text-slate-400 transition-colors " +
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

export default function Contact() {
    const s = useLandingSettings();

    const [form, setForm] = useState(initialForm);
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");

    const change = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const submit = async (e) => {
        e.preventDefault();

        if (sending) return;

        setSending(true);
        setFeedback("");
        setError("");

        try {

            const result = await publicApi.sendContact(form);

            setFeedback(
                result?.message || "Message envoyé avec succès."
            );
            setForm({ ...initialForm });
        } catch (err) {
            setError(apiError(err));
        } finally {
            setSending(false);
        }
    };

    return (
        <section id="contact" className="w-full bg-[#F0F4FA] px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
            <div className="w-full">
                {/* Section Header */}
                <div className="mb-10 text-center sm:mb-12">
                    <h2 className="text-2xl font-extrabold uppercase tracking-tight text-[#0F2037] sm:text-3xl lg:text-4xl">
                        {s.contact_title}
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                        {s.contact_subtitle}
                    </p>
                </div>

                {/* Contact Form */}
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div>
                            <label htmlFor="contact-name" className="mb-2 block text-xs font-semibold text-slate-700">
                                Nom complet
                            </label>
                            <input id="contact-name" type="text" name="name" value={form.name}  onChange={change} required maxLength={160} autoComplete="name" placeholder="Votre nom complet" className={inputClass}/>
                        </div>

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="contact-email"
                                className="mb-2 block text-xs font-semibold text-slate-700"
                            >
                                Adresse email
                            </label>

                            <input
                                id="contact-email"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={change}
                                required
                                maxLength={190}
                                autoComplete="email"
                                placeholder="votre@email.com"
                                className={inputClass}
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label htmlFor="contact-subject" className="mb-2 block text-xs font-semibold text-slate-700">
                                Sujet
                            </label>
                            <input
                                id="contact-subject"
                                type="text"
                                name="subject"
                                value={form.subject}
                                onChange={change}
                                required
                                maxLength={190}
                                placeholder="Sujet de votre message"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Second Row */}
                    <div className="space-y-5">
                        {/* Message */}
                        <div>
                            <label htmlFor="contact-message" className="mb-2 block text-xs font-semibold text-slate-700">
                                Message
                            </label>

                            <textarea
                                id="contact-message"
                                name="message"
                                value={form.message}
                                onChange={change}
                                required
                                maxLength={3000}
                                rows={4}
                                placeholder="Écrivez votre message ici..."
                                className={`${inputClass} min-h-[120px] resize-y`}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button type="submit" disabled={sending} className="flex h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                                {sending ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Envoyer le message
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                    {/* Anti-spam honeypot */}
                    <input
                        type="text"
                        name="website"
                        value={form.website}
                        onChange={change}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        className="absolute -left-[9999px]"
                    />

                    {/* Error */}
                    {error && (
                        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}
                    {/* Success */}
                    {feedback && (
                        <p role="status"  className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                            {feedback}
                        </p>
                    )}
                </form>
            </div>
        </section>
    );
}
