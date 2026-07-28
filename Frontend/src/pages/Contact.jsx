import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/authSlice";
import { backendUrl, fetchWithAuth, readApiResponse, trackedFetch } from "../config/api";

const SUBJECTS = [
  "Order Issue",
  "Product Question",
  "Astrologer Consultation",
  "Become a Seller",
  "Other",
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  subject: SUBJECTS[0],
  message: "",
};

export default function Contact() {
  const user = useSelector(selectUser);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [myMessages, setMyMessages] = useState([]);
  const [myMessagesLoading, setMyMessagesLoading] = useState(false);
  const isAdminUser = ["admin", "seller", "superadmin"].includes(
    String(user?.role || "").toLowerCase(),
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isAdminUser) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await trackedFetch(`${backendUrl}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          userId: user?.id || "",
          userEmail: user?.email || "",
        }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not send your message.");
      }

      setSubmitted(true);
      if (user && !isAdminUser) loadMyMessages();
    } catch (error) {
      setSubmitError(error.message || "Could not send your message.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    "h-12 rounded border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

  const loadMyMessages = async () => {
    if (!user || isAdminUser) return;
    setMyMessagesLoading(true);

    try {
      const response = await fetchWithAuth(`${backendUrl}/api/v1/contact/my`);
      const data = await readApiResponse(response);
      if (response.ok) setMyMessages(data.messages || []);
    } catch {
      setMyMessages([]);
    } finally {
      setMyMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadMyMessages();
  }, [user?.id, isAdminUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div>
      <Helmet>
        <title>Contact Us | AstroMart</title>
        <meta
          name="description"
          content="Get in touch with AstroMart for any questions about your orders, products, or astrologer consultations."
        />
      </Helmet>

      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Link to="/" className="hover:text-brand">
          Home
        </Link>
        <ChevronRight size={12} />
        <span className="text-gray-700">Contact Us</span>
      </div>

      <section className="relative mb-5 overflow-hidden rounded-md bg-gradient-to-br from-brand-dark via-brand to-indigo-900 p-6 text-white shadow-card md:p-9">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
            <MessageSquare size={14} />
            Customer Support
          </div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            Contact Us
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            Questions about an order, a product, or seller listing? Share the
            details and our support team will respond within 24 hours.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-white/10 p-3 ring-1 ring-white/10">
              <p className="text-xs text-white/70">Response Time</p>
              <p className="mt-1 font-semibold">Within 24 hours</p>
            </div>
            <div className="rounded-md bg-white/10 p-3 ring-1 ring-white/10">
              <p className="text-xs text-white/70">Support Hours</p>
              <p className="mt-1 font-semibold">10 AM - 7 PM</p>
            </div>
            <div className="rounded-md bg-white/10 p-3 ring-1 ring-white/10">
              <p className="text-xs text-white/70">Trusted Help</p>
              <p className="mt-1 font-semibold">Order & product care</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-cta-buy/30 blur-3xl" />
      </section>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex-1 rounded-md border border-gray-100 bg-white p-5 shadow-card md:p-7">
          {submitted ? (
            <div className="flex flex-col items-center py-14 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircle2 size={42} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Message received!
              </h2>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Thanks, {form.name.split(" ")[0] || "there"}. Our support team
                will get back to you at {form.email} shortly.
              </p>
              <button
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setSubmitted(false);
                }}
                className="mt-6 rounded-sm border border-brand px-5 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <h2 className="font-display text-2xl font-semibold text-gray-900">
                  Send us a message
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Fill the form and our team will connect with you soon.
                </p>
              </div>

              {isAdminUser && (
                <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Admin accounts cannot send customer contact messages from
                  this page.
                </div>
              )}

              {submitError && (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  required
                  disabled={isAdminUser || submitting}
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className={fieldClass}
                />
                <input
                  required
                  type="email"
                  disabled={isAdminUser || submitting}
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  disabled={isAdminUser || submitting}
                  placeholder="Phone Number (optional)"
                  value={form.phone}
                  maxLength={10}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value.replace(/\D/g, ""),
                    })
                  }
                  className={fieldClass}
                />
                <select
                  disabled={isAdminUser || submitting}
                  value={form.subject}
                  onChange={(event) =>
                    setForm({ ...form, subject: event.target.value })
                  }
                  className={fieldClass}
                >
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                required
                disabled={isAdminUser || submitting}
                placeholder="How can we help?"
                value={form.message}
                onChange={(event) =>
                  setForm({ ...form, message: event.target.value })
                }
                rows={5}
                className="min-h-36 rounded border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={isAdminUser || submitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-cta-buy px-8 text-sm font-semibold uppercase tracking-wide text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                >
                  <Send size={16} /> {submitting ? "Sending..." : "Send Message"}
                </button>
                <p className="text-xs text-gray-500">
                  Your message will appear in the admin contact panel.
                </p>
              </div>
            </form>
          )}
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-96">
          <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card">
            <h3 className="font-display text-xl font-semibold text-gray-900">
              Get in touch
            </h3>
            <p className="mb-5 mt-1 text-sm text-gray-500">
              Fast help for orders, delivery, returns, and product questions.
            </p>

            <div className="flex flex-col gap-4 text-sm">
              <a
                href="tel:+916398393497"
                className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 text-gray-700 transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                  <Phone size={17} />
                </span>
                <div>
                  <p className="font-medium">+91 63983 93497</p>
                  <p className="text-xs text-gray-500">Mon-Sat, 10 AM - 7 PM</p>
                </div>
              </a>

              <a
                href="mailto:adityak74920@gmail.com"
                className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 text-gray-700 transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                  <Mail size={17} />
                </span>
                <div>
                  <p className="font-medium">adityak74920@gmail.com</p>
                  <p className="text-xs text-gray-500">We reply within 24 hours</p>
                </div>
              </a>

              <a
                href="https://www.google.com/maps/search/?api=1&query=IDPL+Rishikesh+Uttarakhand"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 text-gray-700 transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                  <MapPin size={17} />
                </span>
                <div>
                  <p className="font-medium">Astro Wala Shop Commerce Pvt. Ltd.</p>
                  <p className="text-xs text-gray-500">
                    IDPL, Rishikesh, Uttarakhand 249201
                  </p>
                </div>
              </a>

              <div className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 text-gray-700">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                  <Clock size={17} />
                </span>
                <div>
                  <p className="font-medium">Support Hours</p>
                  <p className="text-xs text-gray-500">
                    Mon-Sat, 10:00 AM - 7:00 PM IST
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-card">
            <iframe
              title="Astro Wala Shop location - IDPL, Rishikesh"
              src="https://maps.google.com/maps?q=IDPL,Rishikesh,Uttarakhand&output=embed"
              className="h-56 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="rounded-md border border-green-100 bg-green-50 p-4 text-sm text-green-800">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Safe support promise</p>
                <p className="mt-1 text-green-700">
                  We never ask for OTP, card PIN, or bank password on support
                  calls.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {user && !isAdminUser && (
        <section className="mt-5 rounded-md border border-gray-100 bg-white p-5 shadow-card md:p-7">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-gray-900">
                Your contact messages
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Admin replies to your enquiries will appear here.
              </p>
            </div>
            <button
              type="button"
              onClick={loadMyMessages}
              className="self-start rounded-sm border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {myMessagesLoading ? (
            <p className="py-8 text-center text-sm font-medium text-gray-500">
              Loading your messages...
            </p>
          ) : myMessages.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No contact messages yet.
            </div>
          ) : (
            <div className="space-y-4">
              {myMessages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-md border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                        {message.subject}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {message.message}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>

                  {message.replies?.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {message.replies.map((reply, index) => (
                        <div
                          key={reply.id || `${message.id}-reply-${index}`}
                          className="rounded-md border border-green-100 bg-green-50 p-4"
                        >
                          <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                            Admin Reply
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-green-900">
                            {reply.message}
                          </p>
                          <p className="mt-2 text-xs text-green-700">
                            {formatDate(reply.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                      Waiting for admin reply.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
