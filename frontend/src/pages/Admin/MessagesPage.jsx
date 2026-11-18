import { Fragment, useEffect, useState } from "react";
import { Search, Mail, MailOpen, MailCheck, Send, Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MessageSquare, Clock3 } from "lucide-react";
import { adminApi, apiError } from "../../services/AdminApi";
import { Shell, Title, Feedback, Wait, displayDate } from "../../components/operations/Workspace";

const PAGE_SIZE = 10;
const filters = [
    { value: "all", label: "Tous" },
    { value: "new", label: "Nouveaux" },
    { value: "read", label: "Lus" },
    { value: "replied", label: "Répondus" },
];

const statusConfig = {
    new: { label: "Nouveau", style: "bg-blue-50 text-blue-700 ring-blue-600/15", dot: "bg-blue-500" },
    read: { label: "Lu", style: "bg-amber-50 text-amber-700 ring-amber-600/15", dot: "bg-amber-500" },
    replied: { label: "Répondu", style: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" },
};

const thClass = "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";

function getInitials(name = "") {
    return String(name).trim().split(/\s+/).slice(0, 2)
        .map((word) => word.charAt(0)).join("").toUpperCase() || "?";
}

export default function MessagesPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [activeId, setActiveId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        async function loadMessages() {
            setLoading(true);
            setError("");
            try {
                const response = await adminApi.messages.list({
                    page, per_page: PAGE_SIZE,
                    ...(filter !== "all" ? { status: filter } : {}),
                });
                if (!active) return;
                const result = response.messages;
                const last = Math.max(1, result?.last_page ?? 1);
                setMessages(result?.data ?? []);
                setTotal(result?.total ?? 0);
                setLastPage(last);
                if (page > last) setPage(last);
            } catch (err) {
                if (!active) return;
                setMessages([]);
                setError(apiError(err));
            } finally {
                if (active) setLoading(false);
            }
        }
        loadMessages();
        return () => { active = false; };
    }, [page, filter, reload]);

    const reloadMessages = () => setReload((value) => value + 1);

    const changeFilter = (value) => {
        if (busyId !== null) return;
        setFilter(value);
        setPage(1);
        setSearch("");
        setActiveId(null);
        setReplyText("");
        setError("");
        setSuccess("");
    };

    const toggleDetails = (id) => {
        if (busyId !== null) return;
        setActiveId((current) => current === id ? null : id);
        setReplyText("");
        setError("");
    };

    const markAsRead = async (message) => {
        if (busyId !== null || message.status !== "new") return;
        setBusyId(message.id);
        setError("");
        setSuccess("");
        try {
            await adminApi.messages.markRead(message.id);
            setSuccess("Message marqué comme lu.");
            reloadMessages();
        } catch (err) {
            setError(apiError(err));
        } finally {
            setBusyId(null);
        }
    };

    const sendReply = async (message) => {
        if (busyId !== null || message.status === "replied") return;
        const text = replyText.trim();
        if (text.length < 2 || text.length > 5000) {
            setError("La réponse doit contenir entre 2 et 5000 caractères.");
            return;
        }
        setBusyId(message.id);
        setError("");
        setSuccess("");
        try {
            await adminApi.messages.reply(message.id, text);
            setSuccess(`Réponse acceptée pour envoi à ${message.email}.`);
            setActiveId(null);
            setReplyText("");
            reloadMessages();
        } catch (err) {
            setError(apiError(err));
        } finally {
            setBusyId(null);
        }
    };

    const visibleMessages = messages.filter((message) => {
        const keyword = search.toLowerCase().trim();
        if (!keyword) return true;
        return [message.name, message.email, message.subject, message.message]
            .some((value) => String(value ?? "").toLowerCase().includes(keyword));
    });

    return (
        <Shell>
            <Title kicker="" title="Messages de contact" description="Consultez et gérez les messages reçus depuis votre site." />
            <Feedback error={error} success={success} />
            <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="inline-flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
                        {filters.map((item) => (
                            <button key={item.value} type="button" onClick={() => changeFilter(item.value)}
                                disabled={busyId !== null}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer  ${
                                    filter === item.value ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                }`}>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <div className="relative w-full sm:w-60">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher..." aria-label="Rechercher sur la page actuelle"
                                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10" />
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                            <MessageSquare size={14} />
                            <span className="whitespace-nowrap">{total} message{total !== 1 ? "s" : ""}</span>
                        </div>
                    </div>
                </div>

                <Wait loading={loading} empty={!messages.length}>
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
                            <colgroup>
                                <col className="w-[22%]" /><col className="w-[24%]" />
                                <col className="w-[19%]" /><col className="w-[15%]" />
                                <col className="w-[10%]" /><col className="w-[10%]" />
                            </colgroup>

                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200">
                                    <th className={`${thClass} pl-4`}>Contact</th>
                                    <th className={thClass}>Email</th>
                                    <th className={thClass}>Sujet</th>
                                    <th className={thClass}>Date</th>
                                    <th className={thClass}>Statut</th>
                                    <th className={`${thClass} pr-4 text-right`}>Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {visibleMessages.map((message) => {
                                    const isOpen = activeId === message.id;
                                    const isBusy = busyId === message.id;
                                    const isReplied = message.status === "replied";
                                    const status = statusConfig[message.status] || {
                                        label: message.status,
                                        style: "bg-slate-100 text-slate-600 ring-slate-500/15",
                                        dot: "bg-slate-400",
                                    };

                                    return (
                                        <Fragment key={message.id}>
                                            <tr className={`transition-colors ${isOpen ? "bg-blue-50/40" : "hover:bg-slate-50/70"}`}>
                                                <td className="py-2 pl-4 pr-3 align-middle">
                                                    <div className="flex min-w-0 items-center gap-2.5">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
                                                            {getInitials(message.name)}
                                                        </div>
                                                        <div className="flex min-w-0 items-baseline gap-1.5">
                                                            <p title={message.name} className="truncate text-[13px] font-semibold text-slate-900">{message.name}</p>
                                                            <span className="shrink-0 text-[11px] text-slate-400">#{message.id}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-3 py-2 align-middle">
                                                    <div className="flex min-w-0 items-center gap-1.5">
                                                        <Mail size={13} className="shrink-0 text-slate-400" />
                                                        <a href={`mailto:${message.email}`} title={message.email}
                                                            className="block min-w-0 truncate text-xs text-slate-600 hover:text-blue-600">
                                                            {message.email}
                                                        </a>
                                                    </div>
                                                </td>

                                                <td className="px-3 py-2 align-middle">
                                                    <p title={message.subject} className="truncate text-xs font-medium text-slate-700">{message.subject}</p>
                                                </td>

                                                <td className="px-3 py-2 align-middle">
                                                    <span className="block truncate text-xs tabular-nums text-slate-500">
                                                        {displayDate(message.created_at)}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-2 align-middle">
                                                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${status.style}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                                        {status.label}
                                                    </span>
                                                </td>

                                                <td className="py-2 pl-3 pr-4 text-right align-middle">
                                                    <button type="button" onClick={() => toggleDetails(message.id)}
                                                        disabled={busyId !== null} aria-expanded={isOpen}
                                                        aria-controls={`message-details-${message.id}`}
                                                        className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs  cursor-pointer font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:opacity-50">
                                                        Détails
                                                        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {isOpen && (
                                                <tr>
                                                    <td colSpan={6} className="bg-slate-50/70 px-4 py-4">
                                                        <div id={`message-details-${message.id}`} className="grid items-start gap-4 xl:grid-cols-2">
                                                            <div className="min-w-0">
                                                                <div className="mb-2 flex items-center gap-2">
                                                                    <MessageSquare size={15} className="text-blue-600" />
                                                                    <h3 className="text-[13px] font-bold text-slate-900">Message reçu</h3>
                                                                </div>

                                                                <div className="rounded-lg border border-slate-200 bg-white p-4">
                                                                    <p className="mb-2 break-words text-[13px] font-semibold text-slate-800">{message.subject}</p>
                                                                    <p className="whitespace-pre-wrap break-words text-[13px] leading-6 text-slate-600">
                                                                        {message.message}
                                                                    </p>
                                                                </div>

                                                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                                                        <Clock3 size={13} />{displayDate(message.created_at)}
                                                                    </span>

                                                                    {message.status === "new" && (
                                                                        <button type="button" onClick={() => markAsRead(message)}
                                                                            disabled={busyId !== null}
                                                                            className="inline-flex items-center gap-1.5 rounded-md border cursor-pointer border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                                                            <MailOpen size={14} />Marquer comme lu
                                                                        </button>
                                                                    )}

                                                                    {isReplied && (
                                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                                                            <MailCheck size={14} />Répondu
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="mb-2 flex items-center gap-2">
                                                                    <Send size={15} className="text-blue-600" />
                                                                    <h3 className="text-[13px] font-bold text-slate-900">Répondre par email</h3>
                                                                </div>

                                                                {isReplied ? (
                                                                    <div className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-[13px] text-emerald-700">
                                                                        <MailCheck size={18} className="shrink-0" />
                                                                        Une réponse a déjà été envoyée.
                                                                    </div>
                                                                ) : (
                                                                    <form onSubmit={(e) => { e.preventDefault(); sendReply(message); }}
                                                                        className="rounded-lg border border-slate-200 bg-white p-4">
                                                                        <p className="mb-2 break-all text-xs text-slate-500">À : {message.email}</p>

                                                                        <textarea rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                                                            disabled={isBusy} maxLength={5000} placeholder="Écrivez votre réponse..."
                                                                            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50" />

                                                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                                                            <span className="text-xs text-slate-400">{replyText.length}/5000</span>
                                                                            <button type="submit" disabled={busyId !== null || replyText.trim().length < 2}
                                                                                className="inline-flex items-center cursor-pointer justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                                                                                {isBusy ? (
                                                                                    <><Loader2 size={14} className="animate-spin" />Envoi...</>
                                                                                ) : (
                                                                                    <><Send size={14} />Envoyer la réponse</>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </form>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}

                                {visibleMessages.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                                            Aucun message trouvé sur cette page.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Wait>

                {!loading && total > 0 && (
                    <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                            {total} message{total !== 1 ? "s" : ""}<span className="mx-2">·</span>Page {page} sur {lastPage}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button type="button" disabled={page <= 1 || busyId !== null}
                                onClick={() => { setPage((value) => value - 1); setActiveId(null); setReplyText(""); }}
                                className="inline-flex items-center gap-1 cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                                <ChevronLeft size={14} />Précédent
                            </button>
                            <button type="button" disabled={page >= lastPage || busyId !== null}
                                onClick={() => { setPage((value) => value + 1); setActiveId(null); setReplyText(""); }}
                                className="inline-flex items-center gap-1 cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                                Suivant<ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Shell>
    );
}
