import { useState } from "react";
import { CalendarDays, UsersRound, CheckCircle2 } from "lucide-react";

// ==========================================
// DEMO DATA (Simple)
// ==========================================
const demoTrainer = {name: "Sarah Jenkins", role: "Strength & Conditioning Specialist", image: "/traiter.avif",  experience: "8+ YRS EXP",};

const demoClasses = [
    {
        id: 1,
        category: "HIGH INTENSITY",
        categoryColor: "text-blue-600 bg-blue-50",
        days: "Mon · Thu · Fri",
        time: "07:30 - 08:30",
        title: "CrossFit Engine",
        coach: "Marcus Vance",
        location: "Strength Studio A",
        enrolled: 16,
        capacity: 18,
    },
    {
        id: 2,
        category: "CARDIO CORE",
        categoryColor: "text-emerald-600 bg-emerald-50",
        days: "Tue · Fri",
        time: "18:00 - 19:15",
        title: "HIIT & Core Conditioning",
        coach: "Sarah Jenkins",
        location: "Functional Turf",
        enrolled: 12,
        capacity: 15,
    },
    {
        id: 3,
        category: "RECOVERY",
        categoryColor: "text-violet-600 bg-violet-50",
        days: "Wed · Sat",
        time: "10:00 - 11:00",
        title: "Power Mobility & Recovery",
        coach: "Elena Roberts",
        location: "Studio B",
        enrolled: 10,
        capacity: 12,
    },
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function TrainersSchedule() {
    const [trainer] = useState(demoTrainer);
    const [classes] = useState(demoClasses);

    return (
        <section id="schedule" className="bg-white px-5 py-4 sm:px-4 sm:py-10 lg:px-5 lg:py-12">
            <div className="mx-auto max-w-[1200px]">
                
                {/* SECTION HEADER */}
                <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">
                            VERIFIED COACHING STAFF
                        </span>
                        <h2 className="mt-2 text-[28px] font-extrabold uppercase tracking-tight text-slate-900 sm:text-[32px]">
                            ELITE INSTRUCTION & LIVE SCHEDULE
                        </h2>
                    </div>
                    <p className="max-w-[300px] text-[13px] leading-relaxed text-slate-500">
                        Instructors mapped to dynamic classes with real-time seat capacities.
                    </p>
                </div>

                {/* TWO-COLUMN LAYOUT */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
                    
                    {/* LEFT: TRAINER CARD (Simple) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="relative h-[240px] overflow-hidden rounded-lg bg-slate-100">
                            <img 
                                src={trainer.image} 
                                alt={trainer.name} 
                                className="h-full w-full object-cover object-center" 
                            />
                            <span className="absolute left-3 top-3 rounded bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 backdrop-blur-sm">
                                Head Instructor
                            </span>
                        </div>

                        <div className="mt-5 px-2 pb-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">{trainer.name}</h3>
                                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                                    {trainer.experience}
                                </span>
                            </div>
                            <p className="mt-1 text-[13px] font-semibold text-blue-600">{trainer.role}</p>
                            
                            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                <span className="text-[12px] text-slate-500">Assigned Courses: 3 Active</span>
                                <a href="#" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">
                                    View Full Profile &rarr;
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: CLASSES LIST (Simple) */}
                    <div>
                        <h3 className="mb-4 text-[12px] font-bold uppercase tracking-wide text-slate-500">
                            UPCOMING LIVE CLASSES
                        </h3>
                        
                        <div className="space-y-3">
                            {classes.map((course) => {
                                const available = Math.max(course.capacity - course.enrolled, 0);
                                
                                return (
                                    <div key={course.id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-sm sm:flex-row sm:items-center">
                                        
                                        {/* Class Info */}
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${course.categoryColor}`}>
                                                    {course.category}
                                                </span>
                                                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                                    <CalendarDays size={12} /> {course.days} · {course.time}
                                                </span>
                                            </div>
                                            
                                            <h4 className="mt-2 text-[15px] font-bold text-slate-900">{course.title}</h4>
                                            <p className="mt-1 text-[12px] text-slate-500">
                                                Coach {course.coach} <span className="mx-1 text-slate-300">|</span> {course.location}
                                            </p>
                                        </div>

                                        {/* Capacity & Button */}
                                        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1 text-[13px] font-bold text-slate-900">
                                                    <span className="text-blue-600">{course.enrolled}</span>
                                                    <span className="text-slate-400">/ {course.capacity} Spots</span>
                                                </div>
                                                <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-medium text-emerald-600">
                                                    <CheckCircle2 size={12} />
                                                    {available} remaining
                                                </div>
                                            </div>
                                            
                                            <button className="rounded bg-blue-600 px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 sm:mt-2">
                                                Reserve
                                            </button>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}