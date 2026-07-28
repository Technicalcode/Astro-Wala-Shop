import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Send, Sparkles, ShieldCheck, Truck, RotateCcw, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPolicies, selectAllPolicies } from "../store/policySlice";
import { fetchFooterSettings, selectFooterSettings } from "../store/footerSlice";
import Editable from "./editable/Editable";

const badgeIcons = {
  shield: ShieldCheck,
  truck: Truck,
  return: RotateCcw,
  verified: BadgeCheck,
};

const sortByPosition = (items = []) =>
  [...items].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));

const isExternalLink = (to = "") => /^https?:\/\//i.test(to);

const hiddenPolicySlugs = new Set(["payments", "about"]);

const isHiddenPolicyLink = (link = {}) => {
  const slug = String(link.slug || link.to || "")
    .split("/")
    .filter(Boolean)
    .pop()
    ?.toLowerCase();
  const label = String(link.label || link.title || "").trim().toLowerCase();

  return hiddenPolicySlugs.has(slug) || label === "payments" || label === "about us";
};

const FooterLink = ({ to, children, className }) => {
  if (isExternalLink(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
};

export default function Footer() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const policies = useSelector(selectAllPolicies);
  const footerSettings = useSelector(selectFooterSettings);

  const sortedPolicies = sortByPosition(policies || []);
  const trustBadges = sortByPosition(footerSettings.trustBadges || [])
    .filter((badge) => badge.enabled)
    .map((badge) => ({ ...badge, icon: badgeIcons[badge.icon] || ShieldCheck }));

  useEffect(() => {
    dispatch(fetchPolicies());
    dispatch(fetchFooterSettings());
  }, [dispatch]);
  
  const columns = sortByPosition(footerSettings.sections || [])
    .filter((section) => section.enabled)
    .map((section) => {
      const configuredLinks = sortByPosition(section.links || []).filter((link) => link.enabled);

      return {
        ...section,
        links:
          section.key === "policy" && configuredLinks.length === 0
            ? sortedPolicies
                .filter((p) => !isHiddenPolicyLink(p))
                .map((p) => ({ label: p.title, to: `/info/${p.slug}` }))
            : section.key === "policy"
              ? configuredLinks.filter((link) => !isHiddenPolicyLink(link))
              : configuredLinks,
      };
    });

  const contact = footerSettings.contact || {};
  const phoneHref = `tel:${String(contact.phone || "").replace(/[^\d+]/g, "")}`;
  const mailHref = `mailto:${contact.email || ""}`;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  return (
    <Editable as="footer" kind="button" group="footer-bg" label="Footer" className="bg-[#172337] text-gray-300 mt-10">
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustBadges.map((b) => (
            <div key={b.label} className="flex items-center gap-2.5 text-sm">
              <b.icon size={18} className="text-gold-light shrink-0" />
              <Editable as="span" kind="button" group="footer-bg" label="Footer" className="text-gray-300">
                {b.label}
              </Editable>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        {columns.map((col) => (
          <div key={col.title}>
            <Editable as="h4" kind="button" group="footer-bg" label="Footer" className="text-gray-300 text-xs font-semibold mb-3 tracking-wide">
              {col.title}
            </Editable>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <FooterLink to={l.to} className="hover:text-white transition-colors">
                    <Editable as="span" kind="button" group="footer-bg" label="Footer">
                      {l.label}
                    </Editable>
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <Editable as="h4" kind="button" group="footer-bg" label="Footer" className="text-gray-300 text-xs font-semibold mb-3 tracking-wide">
            GET IN TOUCH
          </Editable>
          <ul className="space-y-2.5 text-gray-400">
            <li>
              <a href={phoneHref} className="flex items-start gap-2 hover:text-white transition-colors">
                <Phone size={14} className="mt-0.5 shrink-0" />
                <Editable as="span" kind="button" group="footer-bg" label="Footer">
                  {contact.phone}
                </Editable>
              </a>
            </li>
            <li>
              <a href={mailHref} className="flex items-start gap-2 hover:text-white transition-colors">
                <Mail size={14} className="mt-0.5 shrink-0" />
                <Editable as="span" kind="button" group="footer-bg" label="Footer">
                  {contact.email}
                </Editable>
              </a>
            </li>
            <li>
              <a
                href={contact.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-white transition-colors"
              >
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <Editable as="span" kind="button" group="footer-bg" label="Footer">
                  {String(contact.address || "")
                    .split("\n")
                    .map((line, index) => (
                      <span key={`${line}-${index}`} className="block">
                        {line}
                      </span>
                    ))}
                </Editable>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <Editable
              as="span"
              kind="button"
              group="footer-bg"
              label="Footer"
              className="text-white font-display font-bold text-lg italic flex items-center gap-1"
            >
              <Sparkles size={16} className="text-gold-light" />
              Astro<span className="text-gold-light">Wala Shop</span>
            </Editable>
          </div>
          {footerSettings.newsletterEnabled === false ? null : subscribed ? (
            <p className="text-sm text-green-400">Subscribed! Watch your inbox for updates.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-gold-light w-full md:w-64"
              />
              <Editable
                as="button"
                kind="button"
                group="footer-bg"
                label="Footer"
                type="submit"
                className="bg-gold text-brand-dark font-semibold text-sm px-4 py-2 rounded-sm flex items-center gap-1.5 shrink-0 hover:opacity-90"
              >
                <Send size={14} /> Subscribe
              </Editable>
            </form>
          )}
        </div>
      </div>
    </Editable>
  );
}
