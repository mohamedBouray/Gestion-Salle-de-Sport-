
import { useEffect } from "react";
import {
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  X,
} from "lucide-react";

import {
  Badge,
  dateTime,
  Empty,
  ErrorBox,
  monogram,
  Wait,
} from "../CoachUI";

export default function MemberDetails({
  open,
  member,
  sessions = [],
  loading,
  error,
  onClose,
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fermer les détails"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/30"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label="Détails du membre"
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Détails du membre
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Uniquement les séances de vos cours
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <ErrorBox text={error} />

          {loading ? (
            <Wait loading />
          ) : member ? (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base font-bold text-blue-700">
                  {monogram(member.name)}
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900">
                    {member.name}
                  </p>

                  <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                    <Mail size={13} />
                    <span className="truncate">
                      {member.email || "—"}
                    </span>
                  </p>

                  <div className="mt-2">
                    <Badge status={member.status} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-900">
                  Cours suivis avec vous
                </h3>

                <div className="flex flex-wrap gap-2">
                  {(member.courses || []).length ? (
                    member.courses.map((course) => (
                      <span
                        key={course.id}
                        className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700"
                      >
                        {course.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">
                      Aucun cours
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Séances et réservations
                </h3>

                {sessions.length ? (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800">
                            {session.course?.name || "Cours sportif"}
                          </p>

                          <Badge status={session.enrollment_status} />
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={13} />
                            {dateTime(session.start_at)}
                          </span>

                          {session.end_at && (
                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={13} />
                              {new Date(session.end_at).toLocaleTimeString(
                                "fr-MA",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          )}

                          {session.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={13} />
                              {session.location}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="Aucune séance à afficher"
                    detail="Les réservations du membre pour vos séances apparaîtront ici."
                  />
                )}
              </div>
            </>
          ) : !error ? (
            <Empty title="Membre indisponible" />
          ) : null}
        </div>
      </section>
    </div>
  );
}
