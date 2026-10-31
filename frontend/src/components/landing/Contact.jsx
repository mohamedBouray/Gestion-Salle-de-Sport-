import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from "lucide-react";

// ==========================================
// 1. CONTACT DATA (Dynamique)
// ==========================================
const contactInfo = [
    {
        icon: MapPin,
        title: "Our Location",
        value: "123 Fitness Ave, Casablanca, Morocco",
    },
    {
        icon: Phone,
        title: "Phone Number",
        value: "+212 6 00 00 00 00",
    },
    {
        icon: Mail,
        title: "Email Address",
        value: "contact@gymmanagement.com",
    },
    {
        icon: Clock,
        title: "Working Hours",
        value: "Mon - Sat: 06:00 AM - 10:00 PM",
    },
];

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function Contact() {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setIsSubmitted(false), 3000);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <section id="contact" className="bg-[#F7F9FF] px-2 py-8 sm:px-4 lg:py-12">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 text-center">
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Ready to Upgrade Your Gym?
                    </h2>
                    <p className="mx-auto mt-4 max-w-[650px] text-base leading-relaxed text-slate-500">
                        Have questions about our platform? Our team is here to help you streamline your fitness center operations.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    
                    {/* LEFT: CONTACT INFO CARDS */}
                    <div className="space-y-4">
                        {contactInfo.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                                        <p className="mt-1 text-sm text-slate-500">{item.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* RIGHT: CONTACT FORM */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h3 className="text-xl font-bold text-slate-900">Send us a Message</h3>
                        <p className="mt-2 text-sm text-slate-500">Fill out the form below and we will get back to you shortly.</p>
                        
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                                <input 
                                    type="text" name="name" value={formData.name} onChange={handleChange} required
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
                                <input 
                                    type="email" name="email" value={formData.email} onChange={handleChange} required
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
                                <textarea 
                                    name="message" value={formData.message} onChange={handleChange} required rows="4"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="How can we help you?"
                                ></textarea>
                            </div>
                            
                            <button 
                                type="submit" 
                                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30"
                            >
                                {isSubmitted ? (
                                    <>
                                        <CheckCircle2 size={18} /> Message Sent!
                                    </>
                                ) : (
                                    <>
                                        Send Message <Send size={16} className="transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}