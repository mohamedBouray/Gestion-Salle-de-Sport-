import { CalendarDays, CheckCircle2 } from "lucide-react";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";

const categoryColors = ["text-blue-600 bg-blue-50", "text-emerald-600 bg-emerald-50", "text-violet-600 bg-violet-50"];

export default function TrainersSchedule() {
    const s = useLandingSettings();
    return (
        <section id="schedule" className="scroll-mt-24 bg-white px-5 py-4 sm:px-4 sm:py-10 lg:px-5 lg:py-12">
            <div className="mx-auto max-w-[1200px]">
                <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div><span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">{s.trainers_badge}</span><h2 className="mt-2 text-[28px] font-extrabold uppercase text-slate-900 sm:text-[32px]">{s.trainers_title}</h2></div>
                    <p className="max-w-[300px] text-[13px] leading-relaxed text-slate-500">{s.trainers_subtitle}</p>
                </div>
                <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="relative h-[240px] overflow-hidden rounded-lg bg-slate-100">
                            <img src={s.trainer_image || "/traiter.avif"} alt={s.trainer_name} loading="lazy" className="h-full w-full object-cover" />
                            <span className="absolute left-3 top-3 rounded bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-600">{s.trainer_badge}</span>
                        </div>
                        <div className="mt-5 px-2 pb-2">
                            <div className="flex items-center justify-between gap-2"><h3 className="text-xl font-bold">{s.trainer_name}</h3><span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">{s.trainer_experience}</span></div>
                            <p className="mt-1 text-[13px] font-semibold text-blue-600">{s.trainer_role}</p>
                            <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">{s.trainer_courses_label}</p>
                        </div>
                    </article>
                    <div>
                        <h3 className="mb-4 text-xs font-bold uppercase text-slate-500">UPCOMING CLASSES</h3>
                        <div className="space-y-3">
                            {(s.classes_items || []).map((course, i) => {
                                const remaining = Math.max((Number(course.capacity) || 0) - (Number(course.enrolled) || 0), 0);
                                return <article key={i} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm sm:flex-row sm:items-center">
                                    <div><div className="flex flex-wrap items-center gap-2"><span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${categoryColors[i % categoryColors.length]}`}>{course.category}</span><span className="flex items-center gap-1 text-[11px] text-slate-500"><CalendarDays size={12} />{course.days} · {course.time}</span></div><h4 className="mt-2 text-[15px] font-bold text-slate-900">{course.title}</h4><p className="mt-1 text-xs text-slate-500">Coach {course.coach} | {course.location}</p></div>
                                    <div className="border-t border-slate-100 pt-3 text-right sm:border-0 sm:pt-0"><div className="text-[13px] font-bold"><span className="text-blue-600">{course.enrolled}</span> / {course.capacity} Spots</div><div className="mt-1 flex justify-end gap-1 text-[10px] text-emerald-600"><CheckCircle2 size={12} />{remaining} remaining</div><span className="mt-2 inline-flex rounded bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-600">Preview</span></div>
                                </article>;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}