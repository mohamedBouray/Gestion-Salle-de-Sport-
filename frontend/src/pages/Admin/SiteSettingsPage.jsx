import { useEffect, useRef, useState } from "react";

import { ArrowDown, ArrowUp, Eye, ImagePlus, LoaderCircle, Plus, RotateCcw, Save, Trash2, UploadCloud } from "lucide-react";

import { adminApi } from "../../services/AdminApi";

import { apiError } from "../../services/api";

import { landingDefaults } from "../../data/landingDefaults";

import { editorSections, imageKeys } from "../../data/landingEditorSchema";

const inputClass = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

const clone = (value) => JSON.parse(JSON.stringify(value));

const merge = (values = {}) => ({ ...clone(landingDefaults), ...values });

function TextField({ spec, value, onChange }) {

    const [key, label, type = "text", options] = spec;

    const props = {

        value: value ?? "",

        onChange: (e) => onChange(key, e.target.value),

        className: inputClass,

    };

    return (

        <label className="block min-w-0">

            <span className="text-xs font-semibold text-slate-600">{label}</span>

            {type === "textarea" ? (

                <textarea {...props} rows={3} maxLength={key === "seo_description" ? 300 : 3000} />

            ) : type === "select" ? (

                <select {...props}>

                    {(options || []).map((option) => <option key={option} value={option}>{option}</option>)}

                </select>

            ) : (

                <input {...props} type={type} maxLength={key === "seo_title" ? 160 : 3000} min={type === "number" ? 0 : undefined} />

            )}

        </label>

    );

}

function ItemField({ spec, value, onChange }) {

    const [key, label, type = "text"] = spec;

    if (type === "checkbox") {

        return (

            <label className="flex items-center gap-2 text-[13px] font-medium text-slate-700">

                <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(key, e.target.checked)}

                    className="h-4 w-4 rounded accent-blue-600" />

                {label}

            </label>

        );

    }

    if (type === "lines") {

        return (

            <TextField spec={[key, label, "textarea"]} value={(value || []).join("\n")}

                onChange={(_, text) => onChange(key, text.split("\n").map((line) => line.trim()).filter(Boolean))} />

        );

    }

    return (

        <TextField spec={spec} value={value}

            onChange={(field, next) => onChange(field, type === "number" ? Math.max(0, Number(next) || 0) : next)} />

    );

}

function Repeater({ config, items = [], onChange }) {

    const update = (index, key, value) =>

        onChange(items.map((item, i) => i === index ? { ...item, [key]: value } : item));

    const remove = (index) => onChange(items.filter((_, i) => i !== index));

    const move = (index, direction) => {

        const next = [...items];

        const target = index + direction;

        if (target < 0 || target >= next.length) return;

        [next[index], next[target]] = [next[target], next[index]];

        onChange(next);

    };

    return (

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">

                <div className="flex items-baseline gap-2">

                    <h3 className="text-sm font-bold text-slate-900">{config.title}</h3>

                    <span className="text-xs text-slate-400">{items.length} élément(s)</span>

                </div>

                <button type="button" disabled={items.length >= config.max}

                    onClick={() => onChange([...items, clone(config.initial)])}

                    className=" cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-40">

                    <Plus size={14} />Ajouter {config.singular}

                </button>

            </div>

            <div className="divide-y divide-slate-100">

                {!items.length && <p className="p-8 text-center text-sm text-slate-500">Aucun élément. Cliquez sur Ajouter.</p>}

                {items.map((item, index) => (

                    <div key={index} className="p-5">

                        <div className="mb-3 flex items-center gap-2.5">

                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-600">{index + 1}</span>

                            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800">

                                {item.title || item.name || item.label || `Élément ${index + 1}`}

                            </p>

                            <button type="button" title="Monter" aria-label="Monter" disabled={!index} onClick={() => move(index, -1)}

                                className=" cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={15} /></button>

                            <button type="button" title="Descendre" aria-label="Descendre" disabled={index === items.length - 1}

                                onClick={() => move(index, 1)} className=" cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">

                                <ArrowDown size={15} />

                            </button>

                            <button type="button" title="Supprimer" aria-label="Supprimer" onClick={() => remove(index)}

                                className=" cursor-pointer rounded-md p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>

                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">

                            {config.fields.map((spec) => (

                                <div key={spec[0]} className={["textarea", "lines", "checkbox"].includes(spec[2]) ? "sm:col-span-2" : ""}>

                                    <ItemField spec={spec} value={item[spec[0]]}

                                        onChange={(field, value) => update(index, field, value)} />

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

            <div className="relative isolate min-h-[170px] overflow-hidden rounded-lg bg-[#080e13] p-4 text-white">

                <img src={imageUrls.hero_image || data.hero_image} alt="" className="absolute inset-0 h-full w-full object-cover" />

                <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/35" />

                <div className="relative max-w-[240px]">

                    <h3 className="break-words text-lg font-extrabold uppercase leading-tight text-blue-400">{data.hero_title}</h3>

                    <p className="mt-2 text-xs text-blue-100">{data.hero_subtitle}</p>

                    <span className="mt-3 inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-bold">{data.hero_button}</span>

                </div>

            </div>

        );

    }

    if (section.id === "seo") {

        return (

            <div className="rounded-lg bg-slate-50 p-4">

                <div className="mb-3 flex items-center gap-2">

                    <img src={imageUrls.site_favicon || data.site_favicon || "/favicon.svg"} alt="Favicon"

                        className="h-8 w-8 rounded-md object-contain" />

                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Aperçu SEO</p>

                </div>

                <h3 className="break-words text-base font-extrabold text-slate-900">{data.seo_title || data.site_name}</h3>

                <p className="mt-1.5 break-words text-xs leading-5 text-slate-600">

                    {data.seo_description || data.hero_description}

                </p>

            </div>

        );

    }

    if (section.list) {

        const entries = data[section.list.key] || [];

        return (

            <div className="space-y-2">

                {entries.slice(0, 3).map((item, index) => (

                    <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">

                        <p className="text-xs font-bold text-slate-800">{item.title || item.name || item.label}</p>

                        {item.price !== undefined && (

                            <p className="mt-1 text-base font-extrabold text-blue-600">{item.price} {item.currency}</p>

                        )}

                        {item.description && (

                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>

                        )}

                    </div>

                ))}

                {entries.length > 3 && (

                    <p className="text-center text-xs text-slate-400">+ {entries.length - 3} autres éléments</p>

                )}

            </div>

        );

    }

    return (

        <div className="rounded-lg bg-slate-50 p-4">

            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">{data.site_name}</p>

            <h3 className="mt-2 text-base font-extrabold text-slate-900">

                {section.id === "footer" ? data.site_name : data[`${section.id}_title`] || section.title}

            </h3>

            <p className="mt-1.5 text-xs leading-5 text-slate-600">

                {section.id === "footer"

                    ? data.footer_description

                    : data[`${section.id}_subtitle`] || data.site_name}

            </p>

            {section.id === "contact" && (

                <span className="mt-3 inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white">

                    {data.contact_button === "Open Email App" ? "Envoyer le message" : data.contact_button || "Envoyer le message"}

                </span>

            )}

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

    const section = editorSections.find((item) => item.id === active) || editorSections[0];

    const Icon = section.icon;

    const dirty = JSON.stringify(form) !== JSON.stringify(saved) || Object.keys(files).length > 0;

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

        return () => { alive = false; };

    }, []);

    useEffect(() => {

        const warn = (event) => { if (dirty) event.preventDefault(); };

        window.addEventListener("beforeunload", warn);

        return () => window.removeEventListener("beforeunload", warn);

    }, [dirty]);

    useEffect(() => {

        return () => Object.values(previewRef.current).forEach((url) => URL.revokeObjectURL(url));

    }, []);

    const clearPreviews = () => {

        Object.values(previewRef.current).forEach((url) => URL.revokeObjectURL(url));

        previewRef.current = {};

        setPreviews({});

        setFiles({});

    };

    function chooseImage(key, file) {

        if (!file) return;

        const validType = /^image\/(jpeg|png|webp)$/.test(file.type);

        const validSize = file.size <= 4 * 1024 * 1024;

        if (!validType || !validSize) {

            setError("Image JPG, PNG ou WEBP, maximum 4 Mo.");

            return;

        }

        if (previewRef.current[key]) URL.revokeObjectURL(previewRef.current[key]);

        const url = URL.createObjectURL(file);

        previewRef.current[key] = url;

        setFiles((prev) => ({ ...prev, [key]: file }));

        setPreviews((prev) => ({ ...prev, [key]: url }));

        setError("");

        setNotice("");

    }

    function reset() {

        if (!window.confirm("Annuler les modifications non enregistrées ?")) return;

        setForm(clone(saved));

        clearPreviews();

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

                Object.entries(form).filter(([key]) => !imageKeys.includes(key))

            );

            let result = await adminApi.siteSettings.update(settings);

            for (const [key, file] of Object.entries(files)) {

                result = await adminApi.siteSettings.uploadImage(key, file);

            }

            const next = merge(result.settings);

            setForm(next);

            setSaved(clone(next));

            clearPreviews();

            setNotice("Modifications enregistrées. Le site public utilisera ces valeurs.");

        } catch (e) {

            setError(`${apiError(e)} Certaines modifications ont peut-être été enregistrées : vérifiez avant de réessayer.`);

        } finally {

            setSaving(false);

        }

    }

    return (

        <div className="min-h-full bg-[#f5f7fb] px-4 py-5 text-slate-900 sm:px-6">

            <div className="mx-auto max-w-[1400px] space-y-4">

                <header className="flex flex-wrap items-center justify-between gap-3">

                    <div>

                        <h1 className="text-xl font-extrabold tracking-tight text-[#0f1b33] sm:text-2xl">

                            Personnalisation du site

                        </h1>

                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-slate-500">

                            Modifiez les textes, images et offres de votre landing page.

                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${dirty ? "text-amber-600" : "text-emerald-600"}`}>

                                <span className={`h-1.5 w-1.5 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`} />

                                {dirty ? "Non enregistré" : "À jour"}

                            </span>

                        </p>

                    </div>

                    <div className="flex flex-wrap gap-2">

                        <a href="/" target="_blank" rel="noreferrer"

                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">

                            <Eye size={15} />Voir le site

                        </a>

                        <button type="button" onClick={reset} disabled={!dirty || saving || loading}

                            className=" cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40">

                            <RotateCcw size={14} />Annuler

                        </button>

                        <button type="button" onClick={save} disabled={!dirty || saving || loading}

                            className=" cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-40">

                            {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}

                            {saving ? "Enregistrement..." : "Enregistrer"}

                        </button>

                    </div>

                </header>

                {error && (

                    <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>

                )}

                {notice && (

                    <p role="status" className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">{notice}</p>

                )}

                <nav role="tablist" aria-label="Sections à modifier"

                    className="flex gap-1 overflow-x-auto border-b border-slate-200">

                    {editorSections.map(({ id, title, icon: ItemIcon }) => (

                        <button key={id} type="button" role="tab" aria-selected={active === id}

                            aria-controls="landing-settings-panel" onClick={() => setActive(id)}

                            className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${

                                active === id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"

                            }`}>

                            <ItemIcon size={15} />{title}

                        </button>

                    ))}

                </nav>

                <div id="landing-settings-panel" role="tabpanel"

                    className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">

                    <div className="min-w-0 space-y-4">

                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">

                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">

                                    <Icon size={18} />

                                </span>

                                <div className="min-w-0">

                                    <h2 className="text-sm font-bold text-slate-900">{section.title}</h2>

                                    <p className="truncate text-xs text-slate-500">{section.subtitle}</p>

                                </div>

                            </div>

                            {loading ? (

                                <div className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500">

                                    <LoaderCircle className="animate-spin text-blue-600" />Chargement...

                                </div>

                            ) : (

                                <div className="grid gap-4 p-5 sm:grid-cols-2">

                                    {(section.fields || []).map((spec) => (

                                        <div key={spec[0]} className={spec[2] === "textarea" ? "sm:col-span-2" : ""}>

                                            <TextField spec={spec} value={form[spec[0]]} onChange={change} />

                                        </div>

                                    ))}

                                    {(section.images || []).map(([key, label]) => (

                                        <div key={key} className="sm:col-span-2">

                                            <p className="mb-1.5 text-xs font-semibold text-slate-600">{label}</p>

                                            <div className="flex flex-col gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-3 sm:flex-row sm:items-center">

                                                <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-200 sm:w-40">

                                                    {previews[key] || form[key] ? (

                                                        <img src={previews[key] || form[key]} alt={label}

                                                            className={`h-full w-full ${key === "site_favicon" ? "object-contain" : "object-cover"}`} />

                                                    ) : (

                                                        <ImagePlus size={22} className="text-slate-400" />

                                                    )}

                                                </div>

                                                <div className="min-w-0 flex-1">

                                                    <p className="text-[13px] font-semibold text-slate-700">Importer une image</p>

                                                    <p className="mt-0.5 text-xs text-slate-500">JPG, PNG ou WEBP · 4 Mo max.</p>

                                                    <label className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600">

                                                        <UploadCloud size={15} />Choisir une image

                                                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"

                                                            onChange={(e) => {

                                                                chooseImage(key, e.target.files?.[0]);

                                                                e.target.value = "";

                                                            }} />

                                                    </label>

                                                    {files[key] && (

                                                        <p className="mt-2 break-all text-[11px] text-blue-700">

                                                            {files[key].name} · en attente d'enregistrement

                                                        </p>

                                                    )}

                                                </div>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                        </section>

                        {!loading && section.list && (

                            <Repeater config={section.list} items={form[section.list.key] || []}

                                onChange={(value) => change(section.list.key, value)} />

                        )}

                        {section.id === "trainers" && !loading && (

                            <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">

                                Le coach affiché sur la Landing Page vient de Gestion des coachs (un seul coach actif).

                                Les cours ci-dessous sont des données vitrine de démonstration.

                            </p>

                        )}

                        <div className="flex justify-end">

                            <button type="button" onClick={save} disabled={!dirty || saving || loading}

                                className=" cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-40">

                                {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}

                                {saving ? "Enregistrement..." : "Enregistrer les modifications"}

                            </button>

                        </div>

                    </div>

                    <aside className="xl:sticky xl:top-5">

                        <section className="rounded-xl border border-slate-200 bg-white p-4">

                            <div className="mb-3 flex items-center gap-2">

                                <Eye size={15} className="text-blue-600" />

                                <h3 className="text-[13px] font-bold text-slate-900">Aperçu rapide</h3>

                            </div>

                            <SectionPreview section={section} data={form} imageUrls={previews} />

                            <p className="mt-3 text-[11px] leading-5 text-slate-400">

                                Aperçu indicatif. Les changements sont visibles sur le site après enregistrement.

                            </p>

                        </section>

                    </aside>

                </div>

            </div>

        </div>

    );

}
