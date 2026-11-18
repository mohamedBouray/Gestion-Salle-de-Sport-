import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

import { reservationsApi } from "../../services/ReservationsApi";
import { apiError } from "../../services/api";

import MemberReservationsHeader from "../../components/Members/reservations/MemberReservationsHeader";
import AvailableSessions from "../../components/Members/reservations/AvailableSessions";
import MyReservations from "../../components/Members/reservations/MyReservations";
import ReservationConfirmModal from "../../components/Members/reservations/ReservationConfirmModal";
import ReservationCancelModal from "../../components/Members/reservations/ReservationCancelModal";

const PAGE_SIZE = 12;
const initialPagination = { current_page: 1, last_page: 1, total: null };

function normalizePageResponse(response, key) {
  const source = response?.[key] ?? response?.data ?? response;
  const items = Array.isArray(source)
    ? source
    : Array.isArray(source?.data)
      ? source.data
      : [];
  const meta = response?.meta ?? source?.meta ?? {};
  const total = source?.total ?? meta.total ?? (Array.isArray(source) ? source.length : null);
  return {
    items,
    pagination: {
      current_page: Math.max(1, Number(source?.current_page ?? meta.current_page) || 1),
      last_page: Math.max(1, Number(source?.last_page ?? meta.last_page) || 1),
      total: total === null ? null : Number(total),
    },
  };
}

function errorMessage(error) {
  return error?.response ? apiError(error) : error?.message || "Une erreur est survenue.";
}

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState("available");
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sessionPagination, setSessionPagination] = useState(initialPagination);
  const [bookingPagination, setBookingPagination] = useState(initialPagination);
  const [sessionPage, setSessionPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingStatus, setBookingStatus] = useState("all");
  const [sessionQuery, setSessionQuery] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadSessions() {
      setLoadingSessions(true);
      setSessionError("");
      try {
        const response = await reservationsApi.member.sessions({
          page: sessionPage,
          per_page: PAGE_SIZE,
        });
        if (!active) return;
        const { items, pagination } = normalizePageResponse(response, "sessions");
        setSessions(items);
        setSessionPagination(pagination);
        if (sessionPage > pagination.last_page) setSessionPage(pagination.last_page);
      } catch (error) {
        if (!active) return;
        setSessions([]);
        setSessionError(errorMessage(error));
      } finally {
        if (active) setLoadingSessions(false);
      }
    }
    loadSessions();
    return () => { active = false; };
  }, [sessionPage, reload]);

  useEffect(() => {
    let active = true;
    async function loadBookings() {
      setLoadingBookings(true);
      setBookingError("");
      try {
        const params = { page: bookingPage, per_page: PAGE_SIZE };
        if (bookingStatus !== "all") params.status = bookingStatus;
        const response = await reservationsApi.member.list(params);
        if (!active) return;
        const { items, pagination } = normalizePageResponse(response, "reservations");
        setBookings(items);
        setBookingPagination(pagination);
        if (bookingPage > pagination.last_page) setBookingPage(pagination.last_page);
      } catch (error) {
        if (!active) return;
        setBookings([]);
        setBookingError(errorMessage(error));
      } finally {
        if (active) setLoadingBookings(false);
      }
    }
    loadBookings();
    return () => { active = false; };
  }, [bookingPage, bookingStatus, reload]);

  function refresh() {
    setNotice("");
    setReload((value) => value + 1);
  }

  function openConfirm(session) {
    if (saving || session?.can_book !== true) return;
    setActionError("");
    setSelectedSession(session);
  }

  function openCancel(reservation) {
    if (saving) return;
    setActionError("");
    setSelectedBooking(reservation);
  }

  async function bookSession() {
    if (!selectedSession || saving) return;
    setSaving(true);
    setActionError("");
    try {
      const result = await reservationsApi.member.create(selectedSession.id);
      setSelectedSession(null);
      setNotice(result?.message || "Votre réservation a été enregistrée.");
      setBookingStatus("all");
      setBookingPage(1);
      setActiveTab("mine");
      setReload((value) => value + 1);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function cancelBooking() {
    if (!selectedBooking || saving) return;
    setSaving(true);
    setActionError("");
    try {
      const result = await reservationsApi.member.cancel(selectedBooking.id);
      setSelectedBooking(null);
      setNotice(result?.message || "Votre réservation a été annulée.");
      setReload((value) => value + 1);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-full space-y-4 pb-8">
      <MemberReservationsHeader
        activeTab={activeTab}
        onTabChange={(nextTab) => { setActiveTab(nextTab); setNotice(""); }}
        onRefresh={refresh}
        refreshing={loadingSessions || loadingBookings}
        sessionsCount={sessionError ? null : sessionPagination.total}
        reservationsCount={bookingError ? null : bookingPagination.total}
      />

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700"
        >
          <CheckCircle2 size={16} className="shrink-0" />
          <p className="min-w-0 flex-1 font-medium">{notice}</p>
          <button
            type="button"
            aria-label="Masquer le message"
            onClick={() => setNotice("")}
            className="rounded p-0.5 hover:bg-emerald-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div role="tabpanel" className="outline-none">
        {activeTab === "available" ? (
          <AvailableSessions
            sessions={sessions}
            loading={loadingSessions}
            error={sessionError}
            pagination={sessionPagination}
            page={sessionPage}
            onPageChange={setSessionPage}
            query={sessionQuery}
            onQueryChange={setSessionQuery}
            onReserve={openConfirm}
            busy={saving}
          />
        ) : (
          <MyReservations
            reservations={bookings}
            loading={loadingBookings}
            error={bookingError}
            pagination={bookingPagination}
            page={bookingPage}
            onPageChange={setBookingPage}
            status={bookingStatus}
            onStatusChange={(value) => { setBookingStatus(value); setBookingPage(1); }}
            onCancel={openCancel}
            busy={saving}
          />
        )}
      </div>

      {selectedSession && (
        <ReservationConfirmModal
          session={selectedSession}
          onClose={() => { if (!saving) setSelectedSession(null); }}
          onConfirm={bookSession}
          busy={saving}
          error={actionError}
        />
      )}

      {selectedBooking && (
        <ReservationCancelModal
          reservation={selectedBooking}
          onClose={() => { if (!saving) setSelectedBooking(null); }}
          onConfirm={cancelBooking}
          busy={saving}
          error={actionError}
        />
      )}
    </main>
  );
}