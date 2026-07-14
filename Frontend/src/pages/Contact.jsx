import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Send, CheckCircle2, ChevronRight, Clock } from "lucide-react";

const SUBJECTS = ["Order Issue", "Product Question", "Astrologer Consultation", "Become a Seller", "Other"];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: SUBJECTS[0], message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo only — no backend is wired up, so the message isn't actually sent anywhere yet.
    setSubmitted(true);
  };

  return (
    <div>
      <Helmet>
        <title>Contact Us | AstroMart</title>
        <meta name="description" content="Get in touch with AstroMart for any questions about your orders, products, or astrologer consultations." />
      </Helmet>
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link to="/" className="hover:text-brand">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700">Contact Us</span>
      </div>

      <div className="bg-white rounded-md shadow-card p-6 md:p-8 mb-4">
        <h1 className="font-display font-semibold text-2xl text-gray-900">Contact Us</h1>
        <p className="text-gray-500 mt-2 max-w-xl">
          Questions about an order, a product, or want to list on Astro Wala Shop? Reach out — we usually
          respond within 24 hours.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white rounded-md shadow-card p-6">
          {submitted ? (
            <div className="flex flex-col items-center text-center py-10">
              <CheckCircle2 size={48} className="text-green-600 mb-4" />
              <h2 className="font-semibold text-lg text-gray-900">Message received!</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Thanks, {form.name.split(" ")[0] || "there"} — our support team will get back to you
                at {form.email} shortly.
              </p>
              <button
                onClick={() => {
                  setForm({ name: "", email: "", phone: "", subject: SUBJECTS[0], message: "" });
                  setSubmitted(false);
                }}
                className="mt-6 text-brand font-medium text-sm hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h2 className="font-semibold text-gray-900">Send us a message</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand"
                />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  placeholder="Phone Number (optional)"
                  value={form.phone}
                  maxLength={10}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                  className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand"
                />
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand bg-white"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <textarea
                required
                placeholder="How can we help?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand"
              />
              <button
                type="submit"
                className="self-start bg-cta-buy text-white font-semibold px-8 py-2.5 rounded-sm text-sm uppercase tracking-wide flex items-center gap-2"
              >
                <Send size={15} /> Send Message
              </button>
              <p className="text-[11px] text-gray-400">
                This is a demo form — messages aren't actually sent anywhere yet.
              </p>
            </form>
          )}
        </div>

        <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-md shadow-card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Get in touch</h3>
            <div className="flex flex-col gap-4 text-sm">
              <a href="tel:+916398393497" className="flex items-start gap-3 text-gray-700 hover:text-brand">
                <Phone size={17} className="text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">+91 63983 93497</p>
                  <p className="text-xs text-gray-500">Mon–Sat, 10 AM – 7 PM</p>
                </div>
              </a>
              <a href="mailto:support@astromart.in" className="flex items-start gap-3 text-gray-700 hover:text-brand">
                <Mail size={17} className="text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">support@astromart.in</p>
                  <p className="text-xs text-gray-500">We reply within 24 hours</p>
                </div>
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=IDPL+Rishikesh+Uttarakhand"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-gray-700 hover:text-brand"
              >
                <MapPin size={17} className="text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Astro Wala Shop Commerce Pvt. Ltd.</p>
                  <p className="text-xs text-gray-500">IDPL, Rishikesh, Uttarakhand 249201</p>
                </div>
              </a>
              <div className="flex items-start gap-3 text-gray-700">
                <Clock size={17} className="text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Support Hours</p>
                  <p className="text-xs text-gray-500">Mon–Sat, 10:00 AM – 7:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md shadow-card overflow-hidden">
            <iframe
              title="Astro Wala Shop location — IDPL, Rishikesh"
              src="https://maps.google.com/maps?q=IDPL,Rishikesh,Uttarakhand&output=embed"
              className="w-full h-48 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
