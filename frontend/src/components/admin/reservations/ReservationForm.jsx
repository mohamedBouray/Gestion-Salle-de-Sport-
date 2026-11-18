import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Info, LoaderCircle, Search, X } from "lucide-react";

const fieldClass =
  "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition " +
  "hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60";

const searchClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] outline-none transition " +
  "placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10";

function dateLabel(value) {
  if (!value) return "Date non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-MA", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function sessionTitle(session) {
  return (
    session.course?.name ||
    session.course_name ||
    (session.course_id ? `Cours #${session.course_id}` : "Cours sportif")
  );
}

function placesLeft(session) {
  if (session.remaining_places !== null && session.remaining_places !== undefined) {
    const remaining = Number(session.remaining_places);
    return Number.isFinite(remaining) ? Math.max(0, remaining) : null;
  }
  if (session.capacity != null && session.enrolled_count != null) {
    const cap = Number(session.capacity);
    const count = Number(session.enrolled_count);
    return Number.isFinite(cap) && Number.isFinite(count)
      ? Math.max(0, cap - count)
      : null;
  }
  return null;
}

export default function ReservationForm({
  members = [],
  sessions = [],
  loading = false,
  loadingError = "",
  error = "",
  saving = false,
  onClose,
  onSave,
}) {
  const [memberId, setMemberId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const filteredMembers = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();
    return members.filter(
      (member) =>
        !term ||
        `${member.name || ""} ${member.email || ""} ${member.phone || ""}`
          .toLowerCase()
          .includes(term)
    );
  }, [members, memberSearch]);

  const filteredSessions = useMemo(() => {
    const term = sessionSearch.trim().toLowerCase();
    return sessions.filter((session) => {
      const haystack = `${sessionTitle(session)} ${
        session.coach?.name || session.coach_name || ""
      } ${session.location || ""}`.toLowerCase();
      return !term || haystack.includes(term);
    });
  }, [sessions, sessionSearch]);

  const selectedMember = members.find((member) => String(member.id) === memberId);
  const selectedSession = sessions.find((session) => String(session.id) === sessionId);
  const remaining = selectedSession ? placesLeft(selectedSession) : null;
  const canSubmit = !saving && !loading && memberId && sessionId && remaining !== 0;

  function submit(event) {
    event.preventDefault();
    setValidationError("");

    if (!selectedMember || !selectedSession) {
      setValidationError("Veuillez sélectionner un membre et une séance.");
      return;
    }
    if (selectedMember.status !== "active") {
      setValidationError("Le membre doit avoir un compte actif.");
      return;
    }
    if (
      selectedSession.status !== "scheduled" ||
      new Date(selectedSession.start_at) <= new Date()
    ) {
      setValidationError("La séance sélectionnée n'est plus réservable.");
      return;
    }
    if (remaining === 0) {
      setValidationError("Cette séance est complète.");
      return;
    }
    onSave({ member_id: Number(memberId), session_id: Number(sessionId) });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-form-title"
        className="flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <header className="flex shrink-0 items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="reservation-form-title" className="text-base font-bold text-[#0f1b33]">
              Nouvelle réservation
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Réserver une séance pour un membre.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fermer"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {(error || validationError) && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error || validationError}</span>
              </div>
            )}

            {loadingError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-800"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {loadingError}
              </div>
            )}

            {loading ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-slate-500">
                <LoaderCircle size={24} className="animate-spin text-blue-600" />
                <p className="text-[13px]">Chargement des membres et séances...</p>
              </div>
            ) : (
              <>
                {/* MEMBER */}
                <div>
                  <label
                    htmlFor="reservation-member-search"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Membre
                  </label>

                  <div className="relative mt-1.5">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="reservation-member-search"
                      type="search"
                      value={memberSearch}
                      onChange={(event) => setMemberSearch(event.target.value)}
                      placeholder="Filtrer par nom ou email..."
                      className={searchClass}
                    />
                  </div>

                  <select
                    aria-label="Membre à réserver"
                    required
                    value={memberId}
                    onChange={(event) => {
                      setMemberId(event.target.value);
                      setValidationError("");
                    }}
                    className={fieldClass}
                  >
                    <option value="">Sélectionner un membre actif</option>
                    {selectedMember &&
                      !filteredMembers.some((member) => String(member.id) === memberId) && (
                        <option value={memberId}>{selectedMember.name}</option>
                      )}
                    {filteredMembers.map((member) => (
                      <option key={member.id} value={String(member.id)}>
                        {member.name || `Membre #${member.id}`}
                        {member.email ? ` — ${member.email}` : ""}
                      </option>
                    ))}
                  </select>

                  {members.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-700">Aucun membre actif chargé.</p>
                  )}
                </div>

                {/* SESSION */}
                <div>
                  <label
                    htmlFor="reservation-session-search"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Séance
                  </label>

                  <div className="relative mt-1.5">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="reservation-session-search"
                      type="search"
                      value={sessionSearch}
                      onChange={(event) => setSessionSearch(event.target.value)}
                      placeholder="Filtrer par cours, coach ou salle..."
                      className={searchClass}
                    />
                  </div>

                  <select
                    required
                    aria-label="Séance à réserver"
                    value={sessionId}
                    onChange={(event) => {
                      setSessionId(event.target.value);
                      setValidationError("");
                    }}
                    className={fieldClass}
                  >
                    <option value="">Sélectionner une séance future</option>
                    {selectedSession &&
                      !filteredSessions.some((session) => String(session.id) === sessionId) && (
                        <option value={sessionId}>
                          {sessionTitle(selectedSession)} — {dateLabel(selectedSession.start_at)}
                        </option>
                      )}
                    {filteredSessions.map((session) => {
                      const free = placesLeft(session);
                      const full = free === 0;
                      return (
                        <option key={session.id} value={String(session.id)} disabled={full}>
                          {sessionTitle(session)} — {dateLabel(session.start_at)}
                          {full ? " — Complète" : free !== null ? ` — ${free} place(s)` : ""}
                        </option>
                      );
                    })}
                  </select>

                  {sessions.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-700">Aucune séance future chargée.</p>
                  )}
                </div>

                {selectedSession && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <p className="text-[13px] font-bold text-slate-900">
                      {sessionTitle(selectedSession)}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {dateLabel(selectedSession.start_at)} ·{" "}
                      {selectedSession.location || "Salle non précisée"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-blue-700">
                      {remaining === null
                        ? "Places restantes non disponibles"
                        : `${remaining} place(s) restante(s)`}
                    </p>
                  </div>
                )}

                <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <Info size={15} className="mt-0.5 shrink-0 text-blue-600" />
                  Le serveur vérifie l'abonnement du membre, la capacité, les
                  doublons et les règles de réservation avant de confirmer. La
                  liste est limitée aux membres et séances chargés par la page.
                </p>
              </>
            )}
          </div>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Fermer
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <LoaderCircle size={14} className="animate-spin" />}
              {saving ? "Enregistrement..." : "Confirmer la réservation"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}