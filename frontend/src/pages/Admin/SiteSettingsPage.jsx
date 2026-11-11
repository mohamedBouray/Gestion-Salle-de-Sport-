import { useEffect, useRef, useState } from "react";
import {
    AlertCircle, ArrowDown, ArrowUp, Check, ChevronRight,
    Eye, Globe2, ImagePlus, LoaderCircle, Plus,
    RotateCcw, Save, Settings2, Trash2, UploadCloud,
    WandSparkles
} from "lucide-react";

import { adminApi } from "../../services/AdminApi";
import { apiError } from "../../services/api";
import { landingDefaults } from "../../data/landingDefaults";
import { editorSections, imageKeys } from "../../data/landingEditorSchema";

const inputClass ="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const clone = (value) => JSON.parse(JSON.stringify(value));
const merge = (values = {}) => ({
    ...clone(landingDefaults),
    ...values,
});

function TextField({ spec, value, onChange }) {
    const [key, label, type = "text", options] = spec;

    const props = {
        value: value ?? "",
        onChange: (e) => onChange(key, e.target.value),
        className: inputClass,
    };

    return (
        <label className="block min-w-0">
            <span className="text-xs font-semibold text-slate-700">
                {label}
            </span>

            {type === "textarea" ? (
                <textarea {...props} rows={3} maxLength={3000} />
            ) : type === "select" ? (
                <select {...props}>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    {...props}
                    type={type}
                    maxLength={3000}
                    min={type === "number" ? 0 : undefined}
                />
            )}
        </label>
    );
}

function ItemField({ spec, value, onChange }) {
    const [key, label, type = "text"] = spec;

    if (type === "checkbox") {
        return (
            <label className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm font-medium text-blue-900">
                <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => onChange(key, e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                />
                {label}
            </label>
        );
    }

    if (type === "lines") {
        return (
            <TextField
                spec={[key, label, "textarea"]}
                value={(value || []).join("\n")}
                onChange={(_, text) =>
                    onChange(
                        key,
                        text.split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean)
                    )
                }
            />
        );
    }

    return (
        <TextField
            spec={spec}
            value={value}
            onChange={(field, next) =>
                onChange(
                    field,
                    type === "number"
                        ? Math.max(0, Number(next) || 0)
                        : next
                )
            }
        />
    );
}

function Repeater({ config, items = [], onChange }) {
    const update = (index, key, value) => {
        onChange(
            items.map((item, i) =>
                i === index ? { ...item, [key]: value } : item
            )
        );
    };

    const remove = (index) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const move = (index, direction) => {
        const next = [...items];
        const target = index + direction;

        if (target < 0 || target >= next.length) return;

        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">
                        {config.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                        {items.length} élément(s) · Modifiez l'ordre et le contenu
                    </p>
                </div>

                <button
                    type="button"
                    disabled={items.length >= config.max}
                    onClick={() =>
                        onChange([...items, clone(config.initial)])
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-40"
                >
                    <Plus size={15} />
                    Ajouter {config.singular}
                </button>
            </div>

            <div className="space-y-3 bg-slate-50/60 p-3 sm:p-5">
                {!items.length && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white p-7 text-center text-sm text-slate-500">
                        Aucun élément. Cliquez sur Ajouter.
                    </p>
                )}

                {items.map((item, index) => (
                    <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                    >
                        <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                                {index + 1}
                            </span>

                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                                {item.title ||
                                    item.name ||
                                    item.label ||
                                    `Élément ${index + 1}`}
                            </p>

                            <button
                                type="button"
                                title="Monter"
                                aria-label="Monter"
                                disabled={!index}
                                onClick={() => move(index, -1)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                            >
                                <ArrowUp size={15} />
                            </button>

                            <button
                                type="button"
                                title="Descendre"
                                aria-label="Descendre"
                                disabled={index === items.length - 1}
                                onClick={() => move(index, 1)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                            >
                                <ArrowDown size={15} />
                            </button>

                            <button
                                type="button"
                                title="Supprimer"
                                aria-label="Supprimer"
                                onClick={() => remove(index)}
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {config.fields.map((spec) => (
                                <div
                                    key={spec[0]}
                                    className={
                                        ["textarea", "lines", "checkbox"]
                                            .includes(spec[2])
                                            ? "sm:col-span-2"
                                            : ""
                                    }
                                >
                                    <ItemField
                                        spec={spec}
                                        value={item[spec[0]]}
                                        onChange={(field, value) =>
                                            update(index, field, value)
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function SectionPreview({ section, data, imageUrls }) {
    if (section.id === "hero") {
        return (
            <div className="relative isolate min-h-[200px] overflow-hidden rounded-2xl bg-[#080e13] p-5 text-white">
                <img
                    src={imageUrls.hero_image || data.hero_image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/35" />

                <div className="relative max-w-[260px]">
                    <h3 className="break-words text-xl font-extrabold uppercase leading-tight text-blue-400">
                        {data.hero_title}
                    </h3>

                    <p className="mt-2 text-xs text-blue-100">
                        {data.hero_subtitle}
                    </p>

                    <span className="mt-4 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold">
                        {data.hero_button}
                    </span>
                </div>
            </div>
        );
    }

    if (section.list) {
        const entries = data[section.list.key] || [];

        return (
            <div className="space-y-2">
                {entries.slice(0, 3).map((item, index) => (
                    <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                        <p className="text-xs font-bold text-slate-800">
                            {item.title || item.name || item.label}
                        </p>

                        {item.price !== undefined && (
                            <p className="mt-1 text-lg font-extrabold text-blue-600">
                                {item.price} {item.currency}
                            </p>
                        )}

                        {item.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                {item.description}
                            </p>
                        )}
                    </div>
                ))}

                {entries.length > 3 && (
                    <p className="text-center text-xs text-slate-400">
                        + {entries.length - 3} autres éléments
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-[#f7f9ff] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {data.site_name}
            </p>

            <h3 className="mt-3 text-lg font-extrabold text-slate-900">
                {data[`${section.id}_title`] || section.title}
            </h3>

            <p className="mt-2 text-xs leading-6 text-slate-600">
                {data[`${section.id}_subtitle`] ||
                    data.footer_description ||
                    data.site_name}
            </p>
        </div>
    );
}

export default function SiteSettingsPage() {
    const [active, setActive] = useState("hero");
    const [form, setForm] = useState(() => merge());
    const [saved, setSaved] = useState(() => merge());

    const [files, setFiles] = useState({});
    const [previews, setPreviews] = useState({});
    const previewRef = useRef({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const section = editorSections.find((s) => s.id === active);
    const Icon = section.icon;

    const dirty =
        JSON.stringify(form) !== JSON.stringify(saved) ||
        Object.keys(files).length > 0;

    const change = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setNotice("");
    };

    useEffect(() => {
        let alive = true;

        adminApi.siteSettings.get()
            .then(({ settings }) => {
                if (!alive) return;

                const loaded = merge(settings);
                setForm(loaded);
                setSaved(clone(loaded));
            })
            .catch((e) => alive && setError(apiError(e)))
            .finally(() => alive && setLoading(false));

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        const warn = (event) => {
            if (dirty) event.preventDefault();
        };

        window.addEventListener("beforeunload", warn);

        return () => {
            window.removeEventListener("beforeunload", warn);
        };
    }, [dirty]);

    useEffect(() => {
        return () => {
            Object.values(previewRef.current).forEach((url) =>
                URL.revokeObjectURL(url)
            );
        };
    }, []);

    function chooseImage(key, file) {
        if (!file) return;

        const validType = /^image\/(jpeg|png|webp)$/.test(file.type);
        const validSize = file.size <= 4 * 1024 * 1024;

        if (!validType || !validSize) {
            setError("Image JPG, PNG ou WEBP, maximum 4 Mo.");
            return;
        }

        if (previewRef.current[key]) {
            URL.revokeObjectURL(previewRef.current[key]);
        }

        const url = URL.createObjectURL(file);

        previewRef.current[key] = url;

        setFiles((prev) => ({
            ...prev,
            [key]: file,
        }));

        setPreviews((prev) => ({
            ...prev,
            [key]: url,
        }));

        setError("");
        setNotice("");
    }

    function reset() {
        if (!window.confirm("Annuler les modifications non enregistrées ?")) {
            return;
        }

        setForm(clone(saved));

        Object.values(previewRef.current).forEach((url) =>
            URL.revokeObjectURL(url)
        );

        previewRef.current = {};
        setPreviews({});
        setFiles({});
        setError("");
        setNotice("");
    }

    async function save() {
        if (loading || saving || !dirty) return;

        setSaving(true);
        setError("");
        setNotice("");

        try {
            const settings = Object.fromEntries(
                Object.entries(form).filter(
                    ([key]) => !imageKeys.includes(key)
                )
            );

            let result = await adminApi.siteSettings.update(settings);

            for (const [key, file] of Object.entries(files)) {
                result = await adminApi.siteSettings.uploadImage(key, file);
            }

            const next = merge(result.settings);

            setForm(next);
            setSaved(clone(next));
            setFiles({});

            Object.values(previewRef.current).forEach((url) =>
                URL.revokeObjectURL(url)
            );

            previewRef.current = {};
            setPreviews({});

            setNotice(
                "Modifications enregistrées. Le site public utilisera ces valeurs."
            );
        } catch (e) {
            setError(
                `${apiError(e)} Certaines modifications ont peut-être été enregistrées : vérifiez avant de réessayer.`
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-full bg-[#f5f7fb] px-4 py-5 text-slate-900 sm:px-6 lg:py-7">
            <div className="mx-auto max-w-[1500px] space-y-5">

                {/* Header */}
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
                            <Globe2 size={15} />
                            Site web
                            <ChevronRight size={13} />
                            Éditeur de contenu
                        </p>

                        <h1 className="text-2xl font-extrabold tracking-tight text-[#0f1b33] sm:text-3xl">
                            Personnalisation du site
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Modifiez les textes, images, cartes et offres de votre Landing Page.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <a
                            href="/"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-50"
                        >
                            <Eye size={17} />
                            Voir le site
                        </a>

                        <button
                            type="button"
                            onClick={reset}
                            disabled={!dirty || saving || loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                        >
                            <RotateCcw size={16} />
                            Annuler
                        </button>

                        <button
                            type="button"
                            onClick={save}
                            disabled={!dirty || saving || loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40"
                        >
                            {saving ? (
                                <LoaderCircle size={17} className="animate-spin" />
                            ) : (
                                <Save size={17} />
                            )}
                            {saving ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </div>
                </header>

                {/* Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <WandSparkles size={20} />
                        </span>

                        <div>
                            <p className="text-sm font-bold text-slate-800">
                                Éditeur de la vitrine
                            </p>
                            <p className="text-xs text-slate-500">
                                {editorSections.length} sections personnalisables
                            </p>
                        </div>
                    </div>

                    <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                            dirty
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                        }`}
                    >
                        {dirty ? (
                            <AlertCircle size={14} />
                        ) : (
                            <Check size={14} />
                        )}
                        {dirty ? "Modifications non enregistrées" : "À jour"}
                    </span>
                </div>

                {error && (
                    <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </p>
                )}

                {notice && (
                    <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {notice}
                    </p>
                )}

                {/* Tabs en haut */}
                <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                            <Settings2 size={17} className="text-blue-600" />
                            Sections de la Landing Page
                        </div>

                        <span className="hidden text-xs text-slate-400 sm:block">
                            Choisissez une section à modifier
                        </span>
                    </div>

                    <nav
                        role="tablist"
                        aria-label="Sections à modifier"
                        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
                    >
                        {editorSections.map(
                            ({ id, title, icon: ItemIcon }, index) => (
                                <button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={active === id}
                                    aria-controls="landing-settings-panel"
                                    onClick={() => setActive(id)}
                                    className={`group flex min-w-0 items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs font-semibold transition sm:text-sm ${
                                        active === id
                                            ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                    }`}
                                >
                                    <span
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                            active === id
                                                ? "bg-white/15"
                                                : "bg-white text-blue-600"
                                        }`}
                                    >
                                        <ItemIcon size={17} />
                                    </span>

                                    <span className="min-w-0 flex-1 leading-tight">
                                        {title}
                                    </span>

                                    <span
                                        className={`hidden text-[10px] xl:inline ${
                                            active === id
                                                ? "text-blue-100"
                                                : "text-slate-400"
                                        }`}
                                    >
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                </button>
                            )
                        )}
                    </nav>
                </section>

                {/* Content + Preview */}
                <div
                    id="landing-settings-panel"
                    role="tabpanel"
                    className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_310px]"
                >
                    <div className="min-w-0 space-y-5">
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                        <Icon size={22} />
                                    </span>

                                    <div>
                                        <h2 className="text-lg font-extrabold text-slate-900">
                                            {section.title}
                                        </h2>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {section.subtitle}
                                        </p>
                                    </div>
                                </div>

                                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                                    {editorSections.findIndex(
                                        (s) => s.id === active
                                    ) + 1} / {editorSections.length}
                                </span>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
                                    <LoaderCircle className="animate-spin text-blue-600" />
                                    Chargement...
                                </div>
                            ) : (
                                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                                    {section.fields.map((spec) => (
                                        <div
                                            key={spec[0]}
                                            className={
                                                spec[2] === "textarea"
                                                    ? "sm:col-span-2"
                                                    : ""
                                            }
                                        >
                                            <TextField
                                                spec={spec}
                                                value={form[spec[0]]}
                                                onChange={change}
                                            />
                                        </div>
                                    ))}

                                    {(section.images || []).map(
                                        ([key, label]) => (
                                            <div
                                                key={key}
                                                className="sm:col-span-2"
                                            >
                                                <p className="mb-2 text-xs font-semibold text-slate-700">
                                                    {label}
                                                </p>

                                                <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                                                    <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-200 sm:w-44">
                                                        {previews[key] || form[key] ? (
                                                            <img
                                                                src={
                                                                    previews[key] ||
                                                                    form[key]
                                                                }
                                                                alt={label}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <ImagePlus
                                                                size={24}
                                                                className="text-slate-400"
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-slate-700">
                                                            Importer une image
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            JPG, PNG ou WEBP · 4 Mo max.
                                                        </p>

                                                        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">
                                                            <UploadCloud size={16} />
                                                            Choisir une image

                                                            <input
                                                                type="file"
                                                                accept="image/jpeg,image/png,image/webp"
                                                                className="sr-only"
                                                                onChange={(e) => {
                                                                    chooseImage(
                                                                        key,
                                                                        e.target.files?.[0]
                                                                    );
                                                                    e.target.value = "";
                                                                }}
                                                            />
                                                        </label>

                                                        {files[key] && (
                                                            <p className="mt-2 break-all text-[11px] text-blue-700">
                                                                {files[key].name} · en attente d'enregistrement
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </section>

                        {!loading && section.list && (
                            <Repeater
                                config={section.list}
                                items={form[section.list.key] || []}
                                onChange={(value) =>
                                    change(section.list.key, value)
                                }
                            />
                        )}

                        {section.id === "trainers" && !loading && (
                            <p className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                                Les coachs et cours ici sont des données
                                vitrine de démonstration. Les réservations
                                réelles doivent venir des modules métier.
                            </p>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={save}
                                disabled={!dirty || saving || loading}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40"
                            >
                                {saving ? (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={17} />
                                )}

                                {saving
                                    ? "Enregistrement..."
                                    : "Enregistrer les modifications"}
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <aside className="space-y-4 xl:sticky xl:top-5">
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Eye
                                    size={17}
                                    className="text-blue-600"
                                />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Aperçu rapide
                                </h3>
                            </div>

                            <SectionPreview
                                section={section}
                                data={form}
                                imageUrls={previews}
                            />

                            <p className="mt-3 text-xs leading-5 text-slate-400">
                                Aperçu indicatif. « Voir le site » ouvre
                                la page complète.
                            </p>
                        </section>

                        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                            <p className="text-xs font-bold text-blue-900">
                                Publication
                            </p>

                            <p className="mt-2 text-xs leading-5 text-blue-700">
                                Les changements seront visibles sur le site
                                après enregistrement et actualisation.
                            </p>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}
