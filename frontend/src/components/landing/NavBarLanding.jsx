import { useEffect, useState  } from "react";
import { Link , useNavigate } from "react-router-dom";

import PillNav from "../Designs/PillNav";

const links = [
    { label: "Home", href: "#home" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Classes & Coaches", href: "#schedule" },
    { label: "Contact", href: "#contact" },
];

export default function NavBarLanding() {
    const [activeHref, setActiveHref] = useState("#home");
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const Navigate =useNavigate(); 

    useEffect(() => {
        let frameId = null;
        const updateNavbar = () => {
            setScrolled(window.scrollY > 12);
            const scrollPosition = window.scrollY + 150;
            let currentSection = "#home";

            links.forEach((item) => {
                const section = document.getElementById(item.href.slice(1));
                if (!section) return;
                const top = section.getBoundingClientRect().top + window.scrollY;
                if (top <= scrollPosition) {
                    currentSection = item.href;
                }
            });
            setActiveHref(currentSection);
        };

        const handleScroll = () => {
            if (frameId !== null) return;
            frameId = requestAnimationFrame(() => {
                frameId = null;
                updateNavbar();
            });
        };
        updateNavbar();

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        window.addEventListener("resize", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);

            if (frameId !== null) {
                cancelAnimationFrame(frameId);
            }
        };
    }, []);

    useEffect(() => {
        if (!menuOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        };

        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMenuOpen(false);
            }
        };

        window.addEventListener("keydown", handleEscape);
        window.addEventListener("resize", handleResize);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleEscape);
            window.removeEventListener("resize", handleResize);
        };
    }, [menuOpen]);


    const handleLinkClick = (item) => {
        if (item.href?.startsWith("#")) {setActiveHref(item.href);}
        setMenuOpen(false);
    };

    return (
        <>
            {/* NAVBAR */}
            <header
                className={["sticky top-0 z-50 mx-1 mt-2","rounded-2xl border border-gray-200","bg-white/95 px-4 sm:px-6 lg:px-8","backdrop-blur-xl","transition-shadow duration-300",
                    scrolled? "shadow-lg shadow-slate-900/10": "shadow-sm",].join(" ")}>
                <div className="flex min-h-[68px] items-center justify-between gap-3">

                    {/* LOGO */}
                    <a href="#home"
                        onClick={() => handleLinkClick(links[0])}
                        className="group flex min-w-0 shrink-0 items-center gap-2"
                        aria-label="GYM Management Home">

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
                            <svg width="21" height="21"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true">
                                <path d="M6 5v14M18 5v14M3 9v6M21 9v6M3 12h18" />
                            </svg>
                        </span>

                        <span className="whitespace-nowrap text-sm font-bold tracking-tight text-gray-900 sm:text-base">
                            GYM{" "}
                            <span className="text-blue-600">
                                Management
                            </span>
                        </span>
                    </a>

                    {/* DESKTOP PILL NAV */}
                    <div className="hidden min-w-0 flex-1 justify-center lg:flex">
                        <PillNav
                            items={links}
                            activeHref={activeHref}
                            onItemClick={handleLinkClick}
                            theme="light"
                            layout="joined"
                            size="sm"
                            surface="none"
                            itemStyle="plain"
                            hoverEffect="glide"
                            indicator="pill"
                            highlightColor="#2563eb"
                            highlightTextColor="#ffffff"
                            textColor="#475569"
                            collapse="never"
                            intro={true}
                            ariaLabel="Desktop navigation"
                        />
                    </div>

                    {/* DESKTOP ACTIONS */}
                    <div className="hidden shrink-0 items-center gap-4 lg:flex">
                        <Link to="/login"  className="rounded-md px-2 py-2 text-xs font-semibold text-slate-700 transition-colors hover:text-blue-600">
                            Sign In
                        </Link>

                        <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:bg-blue-700 hover:shadow-lg">
                            Get Started
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>

                    {/* MOBILE ACTIONS */}
                    {/* MOBILE MENU BUTTON */}
                    <button type="button" onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-navigation"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-600 lg:hidden"
                    >
                        {menuOpen ? (
                            // Close Icon
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        ) : (
                            // Hamburger Icon
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M4 7h16M4 12h16M4 17h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* MOBILE DROPDOWN */}
                {menuOpen && (
                    <nav id="mobile-navigation" aria-label="Mobile navigation"
                        className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[calc(100dvh-100px)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-2xl lg:hidden"
                    >
                        {/* Mobile Navigation Links */}
                        <div className="space-y-1">
                            {links.map((item) => {
                                const isActive = activeHref === item.href;

                                return (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => handleLinkClick(item)}
                                        aria-current={isActive ? "page" : undefined}
                                        className={[
                                            "flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
                                            isActive
                                                ? "bg-blue-600 text-white"
                                                : "text-slate-700 hover:bg-blue-50 hover:text-blue-600",
                                        ].join(" ")}
                                    >
                                        <span>{item.label}</span>

                                        <span
                                            aria-hidden="true"
                                            className="text-base"
                                        >
                                            →
                                        </span>
                                    </a>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div className="my-3 border-t border-slate-100" />

                        {/* Authentication Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/login"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                                Sign In
                            </Link>

                            <Link
                                to="/register"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-center rounded-lg bg-blue-600 px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                                Get Started
                            </Link>
                        </div>
                    </nav>
                )}
            </header>

            {/* BACKDROP */}
            {menuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 cursor-default bg-slate-950/20 lg:hidden"
                />
            )}
        </>
    );
}
