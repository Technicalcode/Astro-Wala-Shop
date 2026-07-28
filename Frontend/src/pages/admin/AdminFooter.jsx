import { useEffect, useMemo, useState } from "react";
import { Mail, MapPin, Phone, Plus, Save, ShieldCheck, Trash2, X, Pencil, Link as LinkIcon, Type, RotateCcw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFooterSettings,
  saveFooterSettings,
  selectFooterError,
  selectFooterLoading,
  selectFooterSaving,
  selectFooterSettings,
} from "../../store/footerSlice";
import {
  addPolicy,
  fetchPolicies,
  selectAllPolicies,
  selectPoliciesSaving,
  updatePolicy,
} from "../../store/policySlice";
import { infoPages } from "../../data/infoPages";
import Editable from "../../components/editable/Editable";

const iconOptions = [
  { value: "shield", label: "Shield" },
  { value: "truck", label: "Truck" },
  { value: "return", label: "Return" },
  { value: "verified", label: "Verified" },
];

const fontFamilyOptions = [
  { value: "default", label: "Default" },
  { value: "serif", label: "Serif" },
  { value: "sans", label: "Sans" },
  { value: "mono", label: "Mono" },
];

const fontWeightOptions = [
  { value: "normal", label: "Normal" },
  { value: "medium", label: "Medium" },
  { value: "semibold", label: "Semi Bold" },
  { value: "bold", label: "Bold" },
];

const defaultFontStyles = {
  title: {
    fontFamily: "default",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    textColor: "#374151",
  },
  heading: {
    fontFamily: "default",
    fontSize: 24,
    fontWeight: "bold",
    fontStyle: "normal",
    textColor: "#111827",
  },
  body: {
    fontFamily: "default",
    fontSize: 14,
    fontWeight: "normal",
    fontStyle: "normal",
    textColor: "#4B5563",
  },
};

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const sortByPosition = (items = []) =>
  [...items].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));

const normalizeKey = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getInfoSlug = (to = "") => {
  const match = String(to).trim().match(/^\/info\/([^/?#]+)/);
  return match ? normalizeKey(match[1]) : "";
};

const hiddenPolicySlugs = new Set(["payments", "about"]);

const isHiddenPolicyLink = (link = {}) => {
  const slug = normalizeKey(link.slug || getInfoSlug(link.to || ""));
  const label = String(link.label || link.title || "").trim().toLowerCase();

  return hiddenPolicySlugs.has(slug) || label === "payments" || label === "about us";
};

const staticPageToContent = (page) => {
  if (!page) return "";
  const parts = [page.intro || ""];
  (page.sections || []).forEach((section) => {
    parts.push(section.heading || "");
    parts.push(section.body || "");
  });
  return parts.filter(Boolean).join("\n\n");
};

const normalizeEditorStyles = (styles = {}) => {
  if (styles.fontFamily || styles.headingSize || styles.bodySize) {
    return {
      title: { ...defaultFontStyles.title, fontFamily: styles.fontFamily || "default" },
      heading: {
        ...defaultFontStyles.heading,
        fontFamily: styles.fontFamily || "default",
        fontSize: Number(styles.headingSize) || 24,
        fontStyle: styles.fontStyle || "normal",
      },
      body: {
        ...defaultFontStyles.body,
        fontFamily: styles.fontFamily || "default",
        fontSize: Number(styles.bodySize) || 14,
        fontWeight: styles.fontWeight || "normal",
        fontStyle: styles.fontStyle || "normal",
        textColor: styles.textColor || "#4B5563",
      },
    };
  }

  return {
    title: { ...defaultFontStyles.title, ...(styles.title || {}) },
    heading: { ...defaultFontStyles.heading, ...(styles.heading || {}) },
    body: { ...defaultFontStyles.body, ...(styles.body || {}) },
  };
};

const FontControls = ({ label, value, onChange, maxSize = 64 }) => {
  const current = value || defaultFontStyles.body;
  const update = (patch) => onChange({ ...current, ...patch });

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <h4 className="font-bold text-gray-900 mb-4">{label}</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Family</label>
          <select value={current.fontFamily} onChange={(e) => update({ fontFamily: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm">
            {fontFamilyOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Size</label>
          <input type="number" min="1" max={maxSize} value={current.fontSize} onChange={(e) => update({ fontSize: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Weight</label>
          <select value={current.fontWeight} onChange={(e) => update({ fontWeight: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm">
            {fontWeightOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Style</label>
          <select value={current.fontStyle} onChange={(e) => update({ fontStyle: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm">
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color</label>
          <div className="flex gap-2">
            <input type="color" value={current.textColor} onChange={(e) => update({ textColor: e.target.value })} className="h-12 w-14 rounded-xl border border-gray-200 bg-white p-1" />
            <input value={current.textColor} onChange={(e) => update({ textColor: e.target.value })} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono" />
          </div>
        </div>
      </div>
    </div>
  );
};

const fontFamilyMap = {
  default: undefined,
  serif: "Georgia, Cambria, Times New Roman, serif",
  sans: "Inter, ui-sans-serif, system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

const fontWeightMap = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const toPreviewStyle = (style = defaultFontStyles.body) => ({
  fontFamily: fontFamilyMap[style.fontFamily],
  fontSize: `${Number(style.fontSize) || 14}px`,
  fontWeight: fontWeightMap[style.fontWeight] || 400,
  fontStyle: style.fontStyle || "normal",
  color: style.textColor,
});

const fontLabels = {
  title: "Title Font",
  heading: "Page Heading Font",
  body: "Page Content Font",
};

const FontButton = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-brand hover:bg-indigo-100"
    title={label}
    aria-label={label}
  >
    <Type size={18} />
  </button>
);

export default function AdminFooter() {
  const dispatch = useDispatch();
  const settings = useSelector(selectFooterSettings);
  const loading = useSelector(selectFooterLoading);
  const saving = useSelector(selectFooterSaving);
  const pageSaving = useSelector(selectPoliciesSaving);
  const error = useSelector(selectFooterError);
  const policies = useSelector(selectAllPolicies);
  const [draft, setDraft] = useState(settings);
  const [pageEditor, setPageEditor] = useState(null);
  const [pendingPageEdits, setPendingPageEdits] = useState({});
  const [activeFontKey, setActiveFontKey] = useState(null);

  useEffect(() => {
    dispatch(fetchFooterSettings());
    dispatch(fetchPolicies());
  }, [dispatch]);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const sortedSections = useMemo(() => sortByPosition(draft.sections), [draft.sections]);
  const sortedBadges = useMemo(() => sortByPosition(draft.trustBadges), [draft.trustBadges]);
  const sortedPolicies = useMemo(
    () =>
      sortByPosition(
        policies.map((policy) => ({
          ...policy,
          ...(pendingPageEdits[policy.slug] || {}),
        })),
      ),
    [pendingPageEdits, policies],
  );

  const updateSection = (sectionId, patch) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              ...patch,
              key: patch.title && !section.key ? normalizeKey(patch.title) : section.key,
            }
          : section,
      ),
    }));
  };

  const addSection = () => {
    setDraft((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: makeId("section"),
          key: `custom-${prev.sections.length + 1}`,
          title: "NEW SECTION",
          position: prev.sections.length + 1,
          enabled: true,
          links: [],
        },
      ],
    }));
  };

  const deleteSection = (sectionId) => {
    if (!confirm("Delete this footer section?")) return;
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }));
  };

  const addLink = (sectionId) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              links: [
                ...section.links,
                {
                  id: makeId("link"),
                  label: "New Link",
                  to: "/info/new-page",
                  position: section.links.length + 1,
                  enabled: true,
                },
              ],
            }
          : section,
      ),
    }));
  };

  const updateLink = (sectionId, linkId, patch) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              links: section.links.map((link) => (link.id === linkId ? { ...link, ...patch } : link)),
            }
          : section,
      ),
    }));
  };

  const deleteLink = (sectionId, linkId) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? { ...section, links: section.links.filter((link) => link.id !== linkId) }
          : section,
      ),
    }));
  };

  const openPageEditor = (sectionId, link) => {
    const slug = getInfoSlug(link.to);
    if (!slug) {
      alert("Only /info/... footer links can have editable page content here.");
      return;
    }

    const existingPolicy = pendingPageEdits[slug] || policies.find((policy) => policy.slug === slug);
    const staticPage = infoPages[slug];

    setPageEditor({
      sectionId,
      linkId: link.id,
      id: existingPolicy?.id || "",
      title: existingPolicy?.title || link.label || staticPage?.title || "",
      slug,
      heading: existingPolicy?.heading || staticPage?.title || link.label || "",
      content: existingPolicy?.content || staticPageToContent(staticPage),
      styles: normalizeEditorStyles(existingPolicy?.styles),
      position: existingPolicy?.position || link.position || 0,
    });
  };

  const savePageContent = (e) => {
    e.preventDefault();
    const payload = {
      ...pageEditor,
      slug: normalizeKey(pageEditor.slug),
      position: Number(pageEditor.position) || 0,
      styles: normalizeEditorStyles(pageEditor.styles),
    };

    setPendingPageEdits((prev) => ({
      ...prev,
      [payload.slug]: payload,
    }));

    if (pageEditor.linkId && !String(pageEditor.linkId).startsWith("policy-")) {
      updateLink(pageEditor.sectionId, pageEditor.linkId, {
        label: payload.title,
        to: `/info/${payload.slug}`,
      });
    }

    setPageEditor(null);
    setActiveFontKey(null);
  };

  const updatePageFont = (key, value) => {
    setPageEditor((current) => ({
      ...current,
      styles: {
        ...normalizeEditorStyles(current.styles),
        [key]: value,
      },
    }));
  };

  const resetPageFont = (key) => {
    updatePageFont(key, defaultFontStyles[key]);
  };

  const addBadge = () => {
    setDraft((prev) => ({
      ...prev,
      trustBadges: [
        ...prev.trustBadges,
        {
          id: makeId("badge"),
          label: "New Trust Badge",
          icon: "shield",
          position: prev.trustBadges.length + 1,
          enabled: true,
        },
      ],
    }));
  };

  const updateBadge = (badgeId, patch) => {
    setDraft((prev) => ({
      ...prev,
      trustBadges: prev.trustBadges.map((badge) => (badge.id === badgeId ? { ...badge, ...patch } : badge)),
    }));
  };

  const deleteBadge = (badgeId) => {
    setDraft((prev) => ({
      ...prev,
      trustBadges: prev.trustBadges.filter((badge) => badge.id !== badgeId),
    }));
  };

  const updateContact = (patch) => {
    setDraft((prev) => ({
      ...prev,
      contact: { ...prev.contact, ...patch },
    }));
  };

  const handleSave = async () => {
    try {
      await dispatch(saveFooterSettings(draft)).unwrap();
      const pageEdits = Object.values(pendingPageEdits);
      for (const page of pageEdits) {
        if (page.id) {
          await dispatch(updatePolicy(page)).unwrap();
        } else {
          await dispatch(addPolicy(page)).unwrap();
        }
      }
      setPendingPageEdits({});
      alert("Footer settings saved successfully.");
    } catch (err) {
      alert(err || "Failed to save footer settings");
    }
  };

  const discardChanges = () => {
    setDraft(settings);
    setPendingPageEdits({});
    setPageEditor(null);
    setActiveFontKey(null);
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Editable as="h1" id="admin-footer-heading" kind="button" label="Footer Heading" className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3">
              <MapPin size={36} className="text-amber-400" />
              Store Footer
            </Editable>
            <Editable as="p" id="admin-footer-sub" kind="button" label="Footer Subtext" className="text-indigo-100 max-w-2xl text-base md:text-lg opacity-90 leading-relaxed">
              Manage footer columns, page links, trust badges, and contact details shown on the storefront.
            </Editable>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={discardChanges}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all backdrop-blur-sm shadow-sm"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={saving || pageSaving}
              className="bg-white text-brand hover:bg-indigo-50 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all disabled:opacity-60"
            >
              <Save size={18} /> {saving || pageSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 py-20 text-center">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-brand rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading footer settings...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-brand">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="font-semibold text-gray-900 text-xl">Trust Badges</h2>
              </div>
              <button onClick={addBadge} className="px-4 py-2 rounded-xl bg-brand text-white font-bold text-sm flex items-center gap-2">
                <Plus size={16} /> Add Badge
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {sortedBadges.map((badge) => (
                <div key={badge.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <select value={badge.icon} onChange={(e) => updateBadge(badge.id, { icon: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                      {iconOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <button onClick={() => deleteBadge(badge.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input value={badge.label} onChange={(e) => updateBadge(badge.id, { label: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                  <div className="flex items-center gap-3">
                    <input type="number" value={badge.position} onChange={(e) => updateBadge(badge.id, { position: e.target.value })} className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" checked={badge.enabled} onChange={(e) => updateBadge(badge.id, { enabled: e.target.checked })} />
                      Show
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-xl text-brand">
                      <LinkIcon size={20} />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-xl">Footer Sections</h2>
                  </div>
                  <button onClick={addSection} className="px-4 py-2 rounded-xl bg-brand text-white font-bold text-sm flex items-center gap-2">
                    <Plus size={16} /> Add Section
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {sortedSections.map((section) => (
                    <div key={section.id} className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_110px_auto] gap-3 items-end">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Section Title</label>
                          <input value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-900" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Position</label>
                          <input type="number" value={section.position} onChange={(e) => updateSection(section.id, { position: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3" />
                        </div>
                        <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
                          <input type="checkbox" checked={section.enabled} onChange={(e) => updateSection(section.id, { enabled: e.target.checked })} />
                          Show
                        </label>
                        <button onClick={() => deleteSection(section.id)} className="p-3 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500 uppercase">Links Inside {section.title}</span>
                          <button onClick={() => addLink(section.id)} className="text-sm font-bold text-brand flex items-center gap-1">
                            <Plus size={15} /> Add Link
                          </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {(section.key === "policy" && section.links.length === 0
                            ? sortedPolicies
                                .filter((policy) => !isHiddenPolicyLink(policy))
                                .map((policy) => ({
                                  id: `policy-${policy.id}`,
                                  label: policy.title,
                                  to: `/info/${policy.slug}`,
                                  position: policy.position,
                                  enabled: true,
                                  generated: true,
                                }))
                            : section.key === "policy"
                              ? sortByPosition(section.links).filter((link) => !isHiddenPolicyLink(link))
                              : sortByPosition(section.links)
                          ).map((link) => (
                            <div key={link.id} className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_90px_90px_88px_auto] gap-3 p-4 items-center">
                              <input value={link.label} disabled={link.generated} onChange={(e) => updateLink(section.id, link.id, { label: e.target.value })} placeholder="Link label" className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500" />
                              <input value={link.to} disabled={link.generated} onChange={(e) => updateLink(section.id, link.id, { to: e.target.value })} placeholder="/info/about" className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono disabled:bg-gray-50 disabled:text-gray-500" />
                              <input type="number" value={link.position} disabled={link.generated} onChange={(e) => updateLink(section.id, link.id, { position: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500" />
                              <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input type="checkbox" checked={link.enabled} disabled={link.generated} onChange={(e) => updateLink(section.id, link.id, { enabled: e.target.checked })} />
                                Show
                              </label>
                              <button
                                type="button"
                                onClick={() => openPageEditor(section.id, link)}
                                disabled={!getInfoSlug(link.to)}
                                className="inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-brand hover:bg-indigo-100 disabled:opacity-40"
                              >
                                <Pencil size={14} /> Page
                              </button>
                              <button disabled={link.generated} onClick={() => deleteLink(section.id, link.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30">
                                <X size={17} />
                              </button>
                            </div>
                          ))}
                          {section.links.length === 0 && (
                            <div className="p-6 text-sm text-gray-500 text-center">No links in this section yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 h-fit sticky top-28">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-brand">
                  <Phone size={20} />
                </div>
                <h2 className="font-semibold text-gray-900 text-xl">Get In Touch</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone</label>
                  <input value={draft.contact.phone} onChange={(e) => updateContact({ phone: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                  <input type="email" value={draft.contact.email} onChange={(e) => updateContact({ email: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Address</label>
                  <textarea rows={5} value={draft.contact.address} onChange={(e) => updateContact({ address: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Map URL</label>
                  <input value={draft.contact.mapUrl} onChange={(e) => updateContact({ mapUrl: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3" />
                </div>
                <label className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700">
                  <input type="checkbox" checked={draft.newsletterEnabled} onChange={(e) => setDraft((prev) => ({ ...prev, newsletterEnabled: e.target.checked }))} />
                  Show newsletter subscribe box
                </label>

                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-brand">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <Pencil size={16} /> Tip
                  </div>
                  Use internal page paths like <span className="font-mono">/info/about</span> or external links starting with <span className="font-mono">https://</span>.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {pageEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setPageEditor(null); setActiveFontKey(null); }} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-50 text-brand rounded-xl">
                <Pencil size={24} />
              </div>
              <h2 className="font-display font-bold text-2xl text-gray-900">Edit Footer Page</h2>
            </div>

            <form onSubmit={savePageContent} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Title (Footer Link Name)</label>
                  <div className="flex gap-2">
                    <input required value={pageEditor.title} onChange={(e) => setPageEditor({ ...pageEditor, title: e.target.value })} className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                    <FontButton label="Edit title font" onClick={() => setActiveFontKey("title")} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL Slug</label>
                  <div className="flex relative">
                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-500 sm:text-sm font-mono">/info/</span>
                    <input required value={pageEditor.slug} onChange={(e) => setPageEditor({ ...pageEditor, slug: e.target.value })} className="flex-1 min-w-0 w-full bg-gray-50 border border-gray-200 rounded-none rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Page Heading (H1)</label>
                  <div className="flex gap-2">
                    <input required value={pageEditor.heading} onChange={(e) => setPageEditor({ ...pageEditor, heading: e.target.value })} className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                    <FontButton label="Edit page heading font" onClick={() => setActiveFontKey("heading")} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Footer Position (Order)</label>
                  <input type="number" required value={pageEditor.position} onChange={(e) => setPageEditor({ ...pageEditor, position: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Page Content (Paragraphs)</label>
                <div className="flex gap-2">
                  <textarea
                    required
                    value={pageEditor.content}
                    onChange={(e) => setPageEditor({ ...pageEditor, content: e.target.value })}
                    rows={10}
                    placeholder="Intro paragraph, then section heading and body. Use double newlines between each part."
                    className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-y"
                  />
                  <FontButton label="Edit page content font" onClick={() => setActiveFontKey("body")} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => { setPageEditor(null); setActiveFontKey(null); }} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={pageSaving} className="bg-brand text-white hover:bg-brand-dark font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-all shadow-md hover:shadow-lg">
                  Save Page Draft
                </button>
              </div>
            </form>
          </div>

          {activeFontKey && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{fontLabels[activeFontKey]}</h3>
                    <p className="text-xs text-gray-500">Preview and adjust this text style.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveFontKey(null)}
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Close font editor"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Live Preview</p>
                  <p style={toPreviewStyle(normalizeEditorStyles(pageEditor.styles)[activeFontKey])}>
                    {activeFontKey === "title"
                      ? pageEditor.title || "Footer Link Title"
                      : activeFontKey === "heading"
                        ? pageEditor.heading || "Page Heading"
                        : pageEditor.content?.split("\n").find(Boolean) || "This preview shows how page content will look."}
                  </p>
                </div>

                <FontControls
                  label={fontLabels[activeFontKey]}
                  value={normalizeEditorStyles(pageEditor.styles)[activeFontKey]}
                  maxSize={activeFontKey === "heading" ? 96 : 64}
                  onChange={(value) => updatePageFont(activeFontKey, value)}
                />

                <div className="mt-5 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => resetPageFont(activeFontKey)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw size={15} /> Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFontKey(null)}
                    className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
