
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, ChevronRight,ChevronDown,CircleUserRound, LogOut,X,} from "lucide-react";

import {getRoleConfig, getRoleItems, getNavigationItem,} from "./Navigation";

function getInitials(name) {
    return (name || "Gym User")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase();
}

export default function Header({ role = "member", user, onMenuOpen, onLogout, loggingOut = false,}) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const config = getRoleConfig(role);
    const items = useMemo(() => getRoleItems(role), [role]);
    const currentPage = getNavigationItem(role, pathname);

    const [searchOpen, setSearchOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [search, setSearch] = useState("");

    const accountRef = useRef(null);
    const searchRef = useRef(null);

    const initials = getInitials(user?.name);
    const pageTitle = currentPage?.label || "Tableau de bord";

    const results = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return items;

        return items.filter((item) =>
            item.label.toLowerCase().includes(value)
        );
    }, [items, search]);

    useEffect(() => {
        function handleKeyDown(event) {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();
                setSearchOpen(true);
                setAccountOpen(false);
            }

            if (event.key === "Escape") {
                setSearchOpen(false);
                setAccountOpen(false);
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (searchOpen) {
            searchRef.current?.focus();
        }
    }, [searchOpen]);

    useEffect(() => {
        setSearchOpen(false);
        setAccountOpen(false);
        setSearch("");
    }, [pathname]);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (
                accountRef.current &&
                !accountRef.current.contains(event.target)
            ) {
                setAccountOpen(false);
            }
        }

        document.addEventListener("pointerdown", handleOutsideClick);

        return () => {
            document.removeEventListener(
                "pointerdown",
                handleOutsideClick
            );
        };
    }, []);

    function goTo(path) {
        setSearchOpen(false);
        setAccountOpen(false);
        setSearch("");
        navigate(path);
    }

    return (
        <>
            <div className="flex h-[68px] min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
                {/* Left */}
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={onMenuOpen}
                        aria-label="Ouvrir le menu"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden">
                        <Menu size={20} />
                    </button>

                    <div className="min-w-0">
                        <div className="hidden items-center gap-1.5 text-[11px] text-slate-400 sm:flex">
                            <span>{config.compact}</span>
                            <ChevronRight size={13} />
                            <span className="truncate">{pageTitle}</span>
                        </div>

                        <h1 className="truncate text-[15px] font-semibold text-slate-900 sm:text-base">
                            {pageTitle}
                        </h1>
                    </div>
                </div>

                {/* Right */}
                <div className="flex shrink-0 items-center gap-2">
                    <button type="button"
                        onClick={() => {
                            setAccountOpen(false);
                            setSearchOpen(true);
                        }}
                        className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:bg-white" aria-label="Rechercher une page">
                        <Search size={16} />
                        <span className="hidden md:inline">
                            Rechercher...
                        </span>
                    </button>

                    <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

                    {/* Account Dropdown */}
                    <div ref={accountRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setAccountOpen((value) => !value)}
                            aria-expanded={accountOpen}
                            aria-label="Menu du compte"
                            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-50">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700">
                                {initials}
                            </span>

                            <span className="hidden max-w-32 text-left md:block">
                                <span className="block truncate text-xs font-semibold text-slate-800">
                                    {user?.name || "Gym User"}
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                    {config.compact}
                                </span>
                            </span>

                            <ChevronDown
                                size={14}
                                className="hidden text-slate-400 md:block"/>
                        </button>

                        {accountOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                                <div className="border-b border-slate-100 px-3 py-2.5">
                                    <p className="truncate text-xs font-semibold text-slate-800">
                                        {user?.name || "Gym User"}
                                    </p>
                                    <p className="truncate text-[11px] text-slate-500">
                                        {user?.email || ""}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => goTo(`/${role}/profile`)}
                                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50">
                                    <CircleUserRound size={16} />
                                    Mon profil
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAccountOpen(false);
                                        onLogout?.();
                                    }}
                                    disabled={loggingOut}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">
                                    <LogOut size={16} />
                                    Déconnexion
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Modal */}
            {searchOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/40 px-4 pt-[12vh] backdrop-blur-[2px]"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSearchOpen(false);
                        }
                    }}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Recherche des pages"
                        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                            <Search size={19} className="text-slate-400" />

                            <input
                                ref={searchRef}
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter" &&
                                        results[0]
                                    ) {
                                        goTo(results[0].path);
                                    }
                                }}
                                placeholder="Rechercher une page..."
                                className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"/>

                            <button
                                type="button"
                                onClick={() => setSearchOpen(false)}
                                aria-label="Fermer la recherche"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto p-2">
                            {results.length === 0 ? (
                                <p className="p-6 text-center text-sm text-slate-500">
                                    Aucun résultat.
                                </p>
                            ) : (
                                results.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <button
                                            key={item.path}
                                            type="button"
                                            onClick={() => goTo(item.path)}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                                            <Icon size={17} />
                                            <span className="flex-1">
                                                {item.label}
                                            </span>
                                            <ChevronRight size={15} />
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <p className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
                            Ctrl + K pour rechercher · Échap pour fermer
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
