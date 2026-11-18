import { useEffect } from "react";
import { X } from "lucide-react";

const statuses = {
    pending: { label: "En attente", badge: "bg-amber-50 text-amber-700 ring-amber-600/20" },
    confirmed: { label: "Confirmée", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
    attended: { label: "Présent(e)", badge: "bg-blue-50 text-blue-700 ring-blue-600/20" },
    cancelled: { label: "Annulée", badge: "bg-red-50 text-red-700 ring-red-600/20" },
};

function dateLabel(value, options = {}) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("fr-MA", {
        day: "numeric", month: "long", year: "numeric", ...options,
    }).format(date);
}

function money(value) {
    if (value == null || value === "") return "—";
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";
    return `${amount.toLocaleString("fr-MA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} MAD`;
}

function Group({ title, children }) {
    return (
        <section>
            <h3 className="mb-2 text-[13px] font-bold text-slate-800">{title}</h3>
            <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {children}
            </dl>
        </section>
    );
}

function Row({ label, children }) {
    return (
        <div className="flex justify-between gap-4 px-4 py-2.5 text-[13px]">
            <dt className="shrink-0 text-slate-500">{label}</dt>
            <dd className="min-w-0 break-words text-right font-medium text-slate-800">
                {children || "—"}
            </dd>
        </div>
    );
}

export default function ReservationDetails({ reservation, onClose }) {
    useEffect(() => {
        function onKeyDown(event) {
            if (event.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    if (!reservation) return null;

    const member = reservation.member ?? {};
    const session = reservation.session ?? reservation.course_session ?? {};
    const course = session.course ?? reservation.course ?? {};
    const coach = session.coach ?? reservation.coach ?? {};
    const status = statuses[reservation.status] || {
        label: reservation.status || "Inconnu",
        badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    };

    const memberName =
        member.name ||
        reservation.member_name ||
        (reservation.member_id ? `Membre #${reservation.member_id}` : "Non renseigné");

    const courseName =
        course.name ||
        session.course_name ||
        reservation.course_name ||
        (session.course_id ? `Cours #${session.course_id}` : "Non renseigné");

    const coachName =
        coach.name || session.coach_name || reservation.coach_name || "Non renseigné";

    const startAt = session.start_at || reservation.start_at;
    const endAt = session.end_at || reservation.end_at;

    return (
        <div
            className="fixed inset-0 z-[100] bg-slate-950/50"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="reservation-details-title"
                className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3.5">
                    <h2
                        id="reservation-details-title"
                        className="text-base font-bold text-[#0f1b33]"
                    >
                        Détails de réservation
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer les détails"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-400">
                            Réservation #{reservation.id ?? "—"}
                        </p>

                        <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.badge}`}
                        >
                            {status.label}
                        </span>
                    </div>

                    <Group title="Membre">
                        <Row label="Nom complet">{memberName}</Row>
                        <Row label="Email">{member.email || reservation.member_email}</Row>
                        <Row label="Téléphone">{member.phone || reservation.member_phone}</Row>
                        <Row label="Identifiant">{reservation.member_id || member.id}</Row>
                    </Group>

                    <Group title="Séance réservée">
                        <Row label="Cours">{courseName}</Row>
                        <Row label="Coach">{coachName}</Row>
                        <Row label="Début">
                            <span className="capitalize">
                                {dateLabel(startAt, { weekday: "long", hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </Row>
                        <Row label="Fin">
                            {dateLabel(endAt, { hour: "2-digit", minute: "2-digit" })}
                        </Row>
                        <Row label="Salle">{session.location || reservation.location}</Row>
                        <Row label="Séance n°">{reservation.session_id || session.id}</Row>
                    </Group>

                    <Group title="Informations de réservation">
                        <Row label="Date d'inscription">
                            {dateLabel(reservation.enrolled_at || reservation.created_at, {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </Row>
                        <Row label="Prix à la réservation">{money(reservation.price_at_booking)}</Row>
                        {reservation.cancelled_at && (
                            <Row label="Date d'annulation">
                                {dateLabel(reservation.cancelled_at, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </Row>
                        )}
                    </Group>

                    <p className="text-xs leading-5 text-slate-400">
                        Cette fenêtre est en lecture seule. Les informations proviennent de
                        la réservation reçue par la page.
                    </p>
                </div>

                <footer className="flex shrink-0 justify-end border-t border-slate-200 px-5 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Fermer
                    </button>
                </footer>
            </aside>
        </div>
    );
}