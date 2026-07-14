import { ShieldCheck, Truck, RotateCcw, Headphones, Award, Lock } from "lucide-react";
import Editable from "./editable/Editable";

const features = [
  {
    icon: ShieldCheck,
    title: "Certified & Authentic",
    desc: "Every gemstone ships with an independent lab report.",
  },
  {
    icon: Award,
    title: "Verified Astrologers",
    desc: "Background-checked specialists across Vedic, Tarot & KP.",
  },
  {
    icon: Truck,
    title: "Free, Fast Delivery",
    desc: "No minimum order — delivered in 3-5 days, pan-India.",
  },
  {
    icon: RotateCcw,
    title: "7-Day Easy Returns",
    desc: "Changed your mind? Return unused items, hassle-free.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    desc: "UPI, cards & COD — your payment details stay protected.",
  },
  {
    icon: Headphones,
    title: "Real Human Support",
    desc: "Mon–Sat, 10 AM–7 PM — talk to our team, not just a bot.",
  },
];

export default function WhyChooseUs() {
  return (
    <Editable
      as="div"
      id="whychooseus-card"
      kind="button"
      label="Why Choose Us — Card Background"
      className="rounded-md shadow-card p-4 md:p-5"
    >
      <Editable
        as="h3"
        id="whychooseus-heading"
        kind="text"
        label="Why Choose Us — Heading"
        className="font-display font-semibold text-lg mb-4"
      >
        Why shop with Astro Wala Shop
      </Editable>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
              <f.icon size={18} className="text-brand" />
            </div>
            <div>
              <Editable
                as="p"
                group="whychooseus-feature-title"
                kind="text"
                label="Feature Title"
                className="text-sm font-medium"
              >
                {f.title}
              </Editable>
              <Editable
                as="p"
                group="whychooseus-feature-desc"
                kind="text"
                label="Feature Description"
                className="text-xs mt-0.5"
              >
                {f.desc}
              </Editable>
            </div>
          </div>
        ))}
      </div>
    </Editable>
  );
}