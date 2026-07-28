import { useParams, Link, Navigate } from "react-router-dom";
import {
  BadgeCheck,
  ChevronRight,
  Gem,
  Headphones,
  HeartHandshake,
  Crop,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { infoPages } from "../data/infoPages";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPolicies,
  selectPoliciesLoaded,
  selectPoliciesLoading,
  selectPolicyBySlug,
} from "../store/policySlice";
import { selectUser } from "../store/authSlice";
import { selectEditMode } from "../store/editableStyleSlice";
import {
  defaultAboutPage,
  fetchAboutPage,
  normalizeAboutPage,
  saveAboutPage,
  selectAboutPage,
  selectAboutPageSaving,
} from "../store/aboutPageSlice";
import { fileToCompressedDataUrl } from "../utils/imageUtils";

const ImageEditorModal = lazy(() => import("../components/ImageEditorModal"));

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

const defaultPageStyles = {
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

const normalizePageStyles = (styles = {}) => {
  if (styles.fontFamily || styles.headingSize || styles.bodySize) {
    return {
      title: { ...defaultPageStyles.title, fontFamily: styles.fontFamily || "default" },
      heading: {
        ...defaultPageStyles.heading,
        fontFamily: styles.fontFamily || "default",
        fontSize: Number(styles.headingSize) || 24,
        fontStyle: styles.fontStyle || "normal",
      },
      body: {
        ...defaultPageStyles.body,
        fontFamily: styles.fontFamily || "default",
        fontSize: Number(styles.bodySize) || 14,
        fontWeight: styles.fontWeight || "normal",
        fontStyle: styles.fontStyle || "normal",
        textColor: styles.textColor || "#4B5563",
      },
    };
  }

  return {
    title: { ...defaultPageStyles.title, ...(styles.title || {}) },
    heading: { ...defaultPageStyles.heading, ...(styles.heading || {}) },
    body: { ...defaultPageStyles.body, ...(styles.body || {}) },
  };
};

const toTextStyle = (style = defaultPageStyles.body) => ({
  fontFamily: fontFamilyMap[style.fontFamily],
  fontSize: `${Number(style.fontSize) || 14}px`,
  fontWeight: fontWeightMap[style.fontWeight] || 400,
  fontStyle: style.fontStyle || "normal",
  color: style.textColor || "#4B5563",
});

const fontOptions = [
  { value: "default", label: "Default" },
  { value: "serif", label: "Serif" },
  { value: "sans", label: "Sans" },
  { value: "mono", label: "Mono" },
];

const weightOptions = ["normal", "medium", "semibold", "bold"];

const resetFont = {
  fontFamily: "default",
  fontSize: 14,
  fontWeight: "normal",
  fontStyle: "normal",
  textColor: "#4B5563",
};

const aboutStats = [
  { label: "Certified Products", value: "100%", icon: ShieldCheck },
  { label: "Easy Returns", value: "7 Days", icon: Truck },
  { label: "Verified Guidance", value: "Trusted", icon: BadgeCheck },
];

const aboutValues = [
  {
    title: "Authentic Sourcing",
    body: "Products are selected with clear origin, quality checks, and customer confidence in mind.",
    icon: Gem,
  },
  {
    title: "Transparent Assurance",
    body: "Gemstones, rudraksha, yantras, and spiritual essentials are presented with honest product details.",
    icon: Star,
  },
  {
    title: "Human Support",
    body: "Our team helps customers before and after purchase, from product questions to order support.",
    icon: Headphones,
  },
];

const aboutProcessSteps = [
  {
    title: "Choose the right category",
    body: "Customers can explore gemstones, rudraksha, yantras, puja essentials, healing crystals, and astrology items with clear product details.",
  },
  {
    title: "Check trust details",
    body: "Before buying, customers can review price, size, delivery availability, return eligibility, certification notes, and product highlights.",
  },
  {
    title: "Order with support",
    body: "After checkout, order status, invoice, returns, refunds, and customer support are available from the account area.",
  },
];

const aboutQualityPoints = [
  "Product information is kept easy to read and transparent.",
  "Important buying details are shown before checkout.",
  "Orders are packed carefully for safe delivery.",
  "Support is available for order, product, return, and refund questions.",
];

function AboutEditModal({ editTarget, onClose, onApply }) {
  const [form, setForm] = useState(editTarget?.value || {});
  const [editingImageSrc, setEditingImageSrc] = useState(null);

  useEffect(() => {
    setForm(editTarget?.value || {});
    setEditingImageSrc(null);
  }, [editTarget]);

  if (!editTarget) return null;

  const isImage = editTarget.type === "image";
  const isButton = editTarget.type === "button";
  const font = form.font || resetFont;
  const previewText = isButton ? form.text : form.text ?? form.heading ?? "";

  const setFont = (patch) => {
    setForm((current) => ({ ...current, font: { ...(current.font || resetFont), ...patch } }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setEditingImageSrc(readerEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditedImage = async (croppedFile) => {
    try {
      const dataUrl = await fileToCompressedDataUrl(croppedFile, { maxSize: 2000 });
      setForm((current) => ({ ...current, url: dataUrl, enabled: true }));
    } catch (error) {
      console.error(error);
    } finally {
      setEditingImageSrc(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand">About Page Editor</p>
            <h3 className="font-display text-2xl font-semibold text-gray-900">{editTarget.label}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close editor">
            <X size={20} />
          </button>
        </div>

        {isImage ? (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Image URL</span>
              <input
                value={form.url || ""}
                onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                className="mt-2 w-full rounded-md border border-gray-300 px-4 py-3"
                placeholder="/image.webp or https://..."
              />
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-brand/50 bg-blue-50 px-4 py-3 text-sm font-bold text-brand transition hover:bg-blue-100">
              <Upload size={16} />
              Upload from device
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                onClick={(event) => {
                  event.currentTarget.value = null;
                }}
                className="hidden"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={form.enabled !== false}
                onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Show image
            </label>
            {form.url && (
              <div className="relative overflow-hidden rounded-md">
                <img src={form.url} alt="About preview" className="h-56 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setEditingImageSrc(form.url)}
                  className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-brand shadow-md transition hover:bg-blue-50"
                  aria-label="Open image size editor"
                  title="Crop / resize image"
                >
                  <Crop size={18} />
                </button>
              </div>
            )}
            <p className="text-xs leading-5 text-gray-500">
              Uploaded image opens in the editor first, so admin can crop, zoom, rotate, and compress it before staging.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {"heading" in form && (
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Heading</span>
                <input
                  value={form.heading || ""}
                  onChange={(event) => setForm((current) => ({ ...current, heading: event.target.value }))}
                  className="mt-2 w-full rounded-md border border-gray-300 px-4 py-3"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">{isButton ? "Button Text" : "Text"}</span>
              <textarea
                value={form.text ?? form.body ?? ""}
                onChange={(event) =>
                  setForm((current) =>
                    "body" in current ? { ...current, body: event.target.value } : { ...current, text: event.target.value },
                  )
                }
                rows={isButton ? 2 : 5}
                className="mt-2 w-full rounded-md border border-gray-300 px-4 py-3"
              />
            </label>

            {isButton && (
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Button Link</span>
                <input
                  value={form.link || ""}
                  onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
                  className="mt-2 w-full rounded-md border border-gray-300 px-4 py-3"
                />
              </label>
            )}

            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={form.enabled !== false}
                onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Show this item
            </label>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="font-semibold text-gray-900">Font Settings</h4>
                <button
                  type="button"
                  onClick={() => setFont(resetFont)}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white"
                >
                  <RotateCcw size={15} />
                  Reset Font
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={font.fontFamily} onChange={(event) => setFont({ fontFamily: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2">
                  {fontOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input type="number" min="1" max="96" value={font.fontSize} onChange={(event) => setFont({ fontSize: Number(event.target.value) })} className="rounded-md border border-gray-300 px-3 py-2" />
                <select value={font.fontWeight} onChange={(event) => setFont({ fontWeight: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2">
                  {weightOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select value={font.fontStyle} onChange={(event) => setFont({ fontStyle: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2">
                  <option value="normal">normal</option>
                  <option value="italic">italic</option>
                </select>
                <input type="color" value={font.textColor} onChange={(event) => setFont({ textColor: event.target.value })} className="h-11 rounded-md border border-gray-300 p-1" />
                <input value={font.textColor} onChange={(event) => setFont({ textColor: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div className="mt-4 rounded-md bg-white p-4">
                <p style={toTextStyle(font)}>{previewText || "Preview text"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-5 py-2.5 font-semibold text-gray-700">
            Cancel
          </button>
          <button type="button" onClick={() => onApply(form)} className="rounded-md bg-brand px-5 py-2.5 font-semibold text-white">
            Stage Change
          </button>
        </div>
      </div>
      {editingImageSrc && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] bg-black/60" />}>
          <ImageEditorModal
            imageSrc={editingImageSrc}
            defaultAspect={editTarget.path === "heroImage" || editTarget.path === "secondaryImage" ? 21 / 9 : 16 / 9}
            onSave={handleSaveEditedImage}
            onCancel={() => setEditingImageSrc(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

function EditButton({ active, label, onClick }) {
  if (!active) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2 text-brand shadow-md hover:bg-blue-50"
      aria-label={label}
    >
      <Pencil size={15} />
    </button>
  );
}

function AboutPageLayout({ page, titleStyle, headingStyle, bodyStyle, editable = false, onEdit }) {
  const sections = page.sections || [];
  const primarySection = sections[0];
  const promiseSection = sections[1];
  const processSteps = page.processSteps || aboutProcessSteps;
  const qualityPoints = page.qualityPoints || aboutQualityPoints.map((text) => ({ text, enabled: true, font: resetFont }));
  const buttonStyle = (button) => toTextStyle(button?.font || resetFont);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-lg bg-gradient-to-br from-brand via-[#244a91] to-[#4b197c] text-white shadow-card">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,#f8c44f_0,transparent_28%),radial-gradient(circle_at_12%_85%,#ffffff_0,transparent_22%)]" />
        <div className="relative grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] md:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-light">
              <Sparkles size={14} />
              Trusted Astrology Commerce
            </div>
            {page.title?.enabled !== false && (
              <div className="relative">
                <EditButton active={editable} label="Edit about title" onClick={() => onEdit("title", page.title, "Title")} />
                <h1
                  className="mt-5 font-display font-semibold leading-tight text-white"
                  style={{ ...toTextStyle(page.title?.font || headingStyle), color: page.title?.font?.textColor || "#FFFFFF" }}
                >
                  {page.title?.text || page.title}
                </h1>
              </div>
            )}
            {page.intro?.enabled !== false && (
              <div className="relative">
                <EditButton active={editable} label="Edit about intro" onClick={() => onEdit("intro", page.intro, "Intro Text")} />
                <p className="mt-4 max-w-2xl leading-7" style={toTextStyle(page.intro?.font || bodyStyle)}>
                  {page.intro?.text || page.intro}
                </p>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {page.primaryButton?.enabled !== false && (
                <div className="relative">
                  <EditButton active={editable} label="Edit primary button" onClick={() => onEdit("primaryButton", page.primaryButton, "Primary Button", "button")} />
                  <Link
                    to={page.primaryButton?.link || "/products"}
                    className="block rounded-md bg-gold-light px-5 py-3 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-yellow-300"
                    style={buttonStyle(page.primaryButton)}
                  >
                    {page.primaryButton?.text || "Explore Products"}
                  </Link>
                </div>
              )}
              {page.secondaryButton?.enabled !== false && (
                <div className="relative">
                  <EditButton active={editable} label="Edit secondary button" onClick={() => onEdit("secondaryButton", page.secondaryButton, "Secondary Button", "button")} />
                  <Link
                    to={page.secondaryButton?.link || "/contact"}
                    className="block rounded-md border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                    style={buttonStyle(page.secondaryButton)}
                  >
                    {page.secondaryButton?.text || "Contact Support"}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {page.heroImage?.enabled !== false && (
              <div className="relative overflow-hidden rounded-lg border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur">
                <EditButton active={editable} label="Edit hero image" onClick={() => onEdit("heroImage", page.heroImage, "Hero Image", "image")} />
                <img
                  src={page.heroImage?.url || "/Gemini_Generated_Image_89fz9b89fz9b89fz.webp"}
                  alt="Astro Wala Shop spiritual products and festive essentials"
                  className="h-64 w-full rounded-md object-cover object-center md:h-80"
                  loading="eager"
                />
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              {aboutStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-light/20 text-gold-light">
                      <Icon size={19} />
                    </span>
                    <div>
                      <p className="text-lg font-bold leading-tight text-white">{value}</p>
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-100">{label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {primarySection?.enabled !== false && (
        <div className="relative rounded-lg border border-gray-100 bg-white p-6 shadow-card md:p-8">
          <EditButton active={editable} label="Edit who we are section" onClick={() => onEdit("sections.0", primarySection, "Who We Are Section", "section")} />
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-brand">
              <HeartHandshake size={22} />
            </span>
            <h2 className="font-display text-2xl font-semibold text-gray-900">
              {primarySection?.heading || "Who we are"}
            </h2>
          </div>
          <p className="mt-5 leading-8" style={bodyStyle}>
            {primarySection?.body || page.intro}
          </p>
        </div>
        )}

        {promiseSection?.enabled !== false && (
        <div className="relative rounded-lg border border-amber-100 bg-amber-50/50 p-6 shadow-card md:p-8">
          <EditButton active={editable} label="Edit promise section" onClick={() => onEdit("sections.1", promiseSection, "Promise Section", "section")} />
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-amber-600">
              <ShieldCheck size={22} />
            </span>
            <h2 className="font-display text-2xl font-semibold text-gray-900">
              {promiseSection?.heading || "What we promise"}
            </h2>
          </div>
          <p className="mt-5 leading-8" style={bodyStyle}>
            {promiseSection?.body || "We keep every purchase clear, dependable, and easy to trust."}
          </p>
        </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-card md:p-8">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand" style={titleStyle}>Our Standards</p>
            <h2 className="font-display text-2xl font-semibold text-gray-900">Built for confident spiritual shopping</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {aboutValues.map(({ title, body, icon: Icon }) => (
            <div key={title} className="rounded-md border border-gray-100 bg-gray-50 p-5">
              <Icon size={22} className="text-brand" />
              <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-card">
          {page.secondaryImage?.enabled !== false && (
            <div className="relative h-full">
              <EditButton active={editable} label="Edit secondary image" onClick={() => onEdit("secondaryImage", page.secondaryImage, "Secondary Image", "image")} />
              <img
                src={page.secondaryImage?.url || "/Gemini_Generated_Image_89fz9b89fz9b89fz.webp"}
                alt="Customer shopping spiritual essentials on Astro Wala Shop"
                className="h-full min-h-[320px] w-full object-cover object-right"
                loading="lazy"
              />
            </div>
          )}
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-card md:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-brand" style={titleStyle}>How It Works</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-gray-900">
            Simple steps for confident buying
          </h2>
          <div className="mt-6 space-y-4">
            {processSteps.filter((step) => step.enabled !== false).map((step, index) => (
              <div key={`${step.heading}-${index}`} className="relative flex gap-4 rounded-md border border-gray-100 bg-gray-50 p-4">
                <EditButton active={editable} label="Edit process step" onClick={() => onEdit(`processSteps.${index}`, step, `Step ${index + 1}`, "section")} />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{step.heading || step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-card md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand" style={titleStyle}>Customer Guidance</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-gray-900">
              What customers should check before ordering
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              We encourage every customer to review the product information carefully before checkout. This helps avoid confusion and makes the buying experience smoother.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {qualityPoints.filter((point) => point.enabled !== false).map((point, index) => (
              <div key={`${point.text}-${index}`} className="relative flex gap-3 rounded-md border border-blue-100 bg-blue-50/60 p-4">
                <EditButton active={editable} label="Edit quality point" onClick={() => onEdit(`qualityPoints.${index}`, point, `Guidance Point ${index + 1}`)} />
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" />
                <p className="text-sm leading-6 text-gray-700" style={toTextStyle(point.font || resetFont)}>{point.text || point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 text-sm text-gray-700">
        Still need help?{" "}
        <Link to="/contact" className="font-semibold text-brand hover:underline">
          Contact our support team
        </Link>
        .
      </div>
    </div>
  );
}

export default function InfoPage() {
  const dispatch = useDispatch();
  const { slug } = useParams();
  const dynamicPolicy = useSelector(selectPolicyBySlug(slug));
  const loading = useSelector(selectPoliciesLoading);
  const loaded = useSelector(selectPoliciesLoaded);
  const user = useSelector(selectUser);
  const editMode = useSelector(selectEditMode);
  const savedAboutPage = useSelector(selectAboutPage);
  const savingAboutPage = useSelector(selectAboutPageSaving);
  const staticPage = infoPages[slug];
  const [aboutDraft, setAboutDraft] = useState(defaultAboutPage);
  const [aboutDirty, setAboutDirty] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const isAboutPage = slug === "about";
  const canEditAbout = isAboutPage && user?.role === "admin" && editMode;

  useEffect(() => {
    dispatch(fetchPolicies());
  }, [dispatch]);

  useEffect(() => {
    if (isAboutPage) {
      dispatch(fetchAboutPage());
    }
  }, [dispatch, isAboutPage]);

  useEffect(() => {
    if (!aboutDirty) {
      setAboutDraft(normalizeAboutPage(savedAboutPage));
    }
  }, [aboutDirty, savedAboutPage]);

  const aboutPage = useMemo(() => normalizeAboutPage(aboutDraft), [aboutDraft]);

  const setDraftValue = (path, value) => {
    setAboutDraft((current) => {
      const next = structuredClone(normalizeAboutPage(current));
      const parts = path.split(".");
      let target = next;
      for (let index = 0; index < parts.length - 1; index += 1) {
        const key = parts[index];
        target = target[key];
      }
      target[parts.at(-1)] = value;
      return next;
    });
    setAboutDirty(true);
  };

  const openAboutEditor = (path, value, label, type = "text") => {
    if (!canEditAbout) return;
    const editableValue = type === "section"
      ? { ...value, text: value.body, font: value.bodyFont || resetFont }
      : value;
    setEditTarget({ path, value: structuredClone(editableValue), label, type });
  };

  const applyAboutEdit = (value) => {
    if (!editTarget) return;
    const nextValue = editTarget.type === "section"
      ? {
          ...value,
          body: value.body ?? value.text ?? "",
          bodyFont: value.font || value.bodyFont || resetFont,
        }
      : value;
    setDraftValue(editTarget.path, nextValue);
    setEditTarget(null);
  };

  const saveAboutChanges = async () => {
    const result = await dispatch(saveAboutPage(aboutDraft));
    if (saveAboutPage.fulfilled.match(result)) {
      setAboutDirty(false);
      setEditTarget(null);
    }
  };

  const discardAboutChanges = () => {
    setAboutDraft(normalizeAboutPage(savedAboutPage));
    setAboutDirty(false);
    setEditTarget(null);
  };

  let page = staticPage;
  let pageStyles = defaultPageStyles;

  if (dynamicPolicy) {
    const parts = dynamicPolicy.content.split('\n\n');
    pageStyles = normalizePageStyles(dynamicPolicy.styles);
    page = {
      title: dynamicPolicy.heading,
      intro: parts[0] || "",
      sections: parts.slice(1).reduce((acc, curr, i, arr) => {
        if (i % 2 === 0) {
          acc.push({ heading: curr, body: arr[i + 1] || '' });
        }
        return acc;
      }, [])
    };
  }

  if (!page && (loading || !loaded)) {
    return <div className="text-sm text-gray-500">Loading policy...</div>;
  }

  if (!page) return <Navigate to="/" replace />;

  const titleStyle = toTextStyle(pageStyles.title);
  const headingStyle = toTextStyle(pageStyles.heading);
  const bodyStyle = toTextStyle(pageStyles.body);

  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link to="/" className="hover:text-brand">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700" style={titleStyle}>{isAboutPage ? aboutPage.title.text : page.title}</span>
      </div>

      {isAboutPage ? (
        <>
          {canEditAbout && (
            <div className="sticky top-3 z-40 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-white/95 p-3 shadow-lg backdrop-blur">
              <div>
                <p className="text-sm font-bold text-gray-900">Edit About Page</p>
                <p className="text-xs text-gray-500">Click pencil icons to edit text, image, buttons, and fonts.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={discardAboutChanges}
                  disabled={!aboutDirty || savingAboutPage}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={saveAboutChanges}
                  disabled={!aboutDirty || savingAboutPage}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingAboutPage ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
          <AboutPageLayout
            page={aboutPage}
            titleStyle={titleStyle}
            headingStyle={headingStyle}
            bodyStyle={bodyStyle}
            editable={canEditAbout}
            onEdit={openAboutEditor}
          />
          <AboutEditModal editTarget={editTarget} onClose={() => setEditTarget(null)} onApply={applyAboutEdit} />
        </>
      ) : (
      <div className="bg-white rounded-md shadow-card p-6 md:p-8 max-w-3xl">
        <h1 className="font-display font-semibold text-gray-900" style={headingStyle}>{page.title}</h1>
        <p className="mt-2" style={bodyStyle}>{page.intro}</p>

        <div className="flex flex-col gap-6 mt-6">
          {page.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="font-semibold text-gray-900 mb-1.5" style={{ fontFamily: headingStyle.fontFamily }}>{s.heading}</h2>
              <p className="leading-relaxed" style={bodyStyle}>{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 text-sm text-gray-500">
          Still need help?{" "}
          <Link to="/contact" className="text-brand font-medium">
            Contact our support team
          </Link>
          .
        </div>
      </div>
      )}
    </div>
  );
}
