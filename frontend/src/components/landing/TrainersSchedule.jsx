import { CalendarDays, CheckCircle2 } from "lucide-react";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";

const categoryColors = [
    "text-blue-600 bg-blue-50",
    "text-emerald-600 bg-emerald-50",
    "text-violet-600 bg-violet-50",
];

const normalizeName = (value) =>
    String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/^coach\s+/, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const belongsToCoach = (course, coach) => {
    if (!course || !coach) return false;

    const courseCoachId =
        course.coach_id ??
        course.coachId ??
        (typeof course.coach === "object"
            ? course.coach?.id
            : null);

    // Priorité à l'identifiant unique
    if (courseCoachId != null) {
        return String(courseCoachId) === String(coach.id);
    }

    // Compatibilité avec les données existantes
    const courseCoachName =
        typeof course.coach === "string"
            ? course.coach
            : course.coach?.name ?? course.coach_name ?? "";

    const name = normalizeName(courseCoachName);

    return name !== "" && name === normalizeName(coach.name);
};

export default function TrainersSchedule() {
    const s = useLandingSettings();
    const coach = s.featured_coach ?? null;

    const allCourses = Array.isArray(s.classes_items)
        ? s.classes_items
        : [];

    // Afficher uniquement les cours du coach sélectionné
    const coachCourses = coach
        ? allCourses.filter((course) =>
              belongsToCoach(course, coach)
          )
        : [];

    return (
        <section
            id="schedule"
            className="scroll-mt-24 bg-white px-5 py-4 sm:px-4 sm:py-10 lg:px-4 lg:py-8"
        >
            <div className="mx-auto max-w-[1200px]">

                <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                            {s.trainers_badge}
                        </span>

                        <h2 className="mt-2 text-[28px] font-extrabold uppercase text-slate-900 sm:text-[32px]">
                            {s.trainers_title}
                        </h2>
                    </div>

                    <p className="max-w-[300px] text-[13px] leading-relaxed text-slate-500">
                        {s.trainers_subtitle}
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">

                    {/* FEATURED COACH */}
                    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="relative h-[240px] overflow-hidden rounded-lg bg-slate-100">
                            {coach?.photo_url ? (
                                <img
                                    src={coach.photo_url}
                                    alt={coach.name}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                    {coach
                                        ? "Photo non disponible"
                                        : "Aucun coach sélectionné"}
                                </div>
                            )}

                            {coach && (
                                <span className="absolute left-3 top-3 rounded bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-600">
                                    {s.trainer_badge}
                                </span>
                            )}
                        </div>

                        <div className="mt-5 px-2 pb-2">
                            {coach ? (
                                <>
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-xl font-bold">
                                            {coach.name}
                                        </h3>

                                        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                                            {coach.experience_years ?? 0} ans
                                        </span>
                                    </div>

                                    <p className="mt-1 text-[13px] font-semibold text-blue-600">
                                        {coach.specialty || "Coach sportif"}
                                    </p>

                                    <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                                        {coach.courses_count ?? 0} cours associés
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-slate-900">
                                        Aucun coach mis en avant
                                    </h3>

                                    <p className="mt-1 text-[13px] text-slate-500">
                                        Sélectionnez un coach actif depuis l'administration.
                                    </p>
                                </>
                            )}
                        </div>
                    </article>

                    {/* COURS DU FEATURED COACH */}
                    <div>
                        <h3 className="mb-4 text-xs font-bold uppercase text-slate-500">
                            {coach
                                ? `COURS DE ${coach.name}`
                                : "UPCOMING CLASSES"}
                        </h3>

                        {coachCourses.length === 0 ? (
                            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                                <CalendarDays
                                    size={30}
                                    className="mb-3 text-slate-400"
                                />

                                <h4 className="text-sm font-bold text-slate-700">
                                    Aucun cours disponible
                                </h4>

                                <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-slate-500">
                                    {coach
                                        ? "Aucun cours de ce coach dans le planning affiché."
                                        : "Aucun coach sélectionné pour le moment."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {coachCourses.map((course, i) => {
                                    const capacity = Math.max(
                                        Number(course.capacity) || 0,
                                        0
                                    );

                                    const enrolled = Math.max(
                                        Number(course.enrolled) || 0,
                                        0
                                    );

                                    const remaining = Math.max(
                                        capacity - enrolled,
                                        0
                                    );

                                    return (
                                        <article
                                            key={course.id ?? i}
                                            className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm sm:flex-row sm:items-center"
                                        >
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">

                                                    <span
                                                        className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${categoryColors[i % categoryColors.length]}`}
                                                    >
                                                        {course.category || "COURS"}
                                                    </span>

                                                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                                        <CalendarDays size={12} />
                                                        {course.days || "À définir"}
                                                        {" · "}
                                                        {course.time || "À définir"}
                                                    </span>
                                                </div>

                                                <h4 className="mt-2 text-[15px] font-bold text-slate-900">
                                                    {course.title}
                                                </h4>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Coach {coach.name}
                                                    {course.location
                                                        ? ` | ${course.location}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <div className="border-t border-slate-100 pt-3 text-right sm:border-0 sm:pt-0">

                                                <div className="text-[13px] font-bold">
                                                    <span className="text-blue-600">
                                                        {enrolled}
                                                    </span>
                                                    {" / "}
                                                    {capacity} Spots
                                                </div>

                                                <div className="mt-1 flex justify-end gap-1 text-[10px] text-emerald-600">
                                                    <CheckCircle2 size={12} />
                                                    {remaining} remaining
                                                </div>

                                                <span className="mt-2 inline-flex rounded bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-600">
                                                    Preview
                                                </span>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}