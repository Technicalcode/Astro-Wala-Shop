import { Star, Quote } from "lucide-react";
import { testimonials } from "../data/testimonials";
import Editable from "./editable/Editable";

export default function TestimonialsSection() {
  return (
    <Editable
      as="div"
      kind="button"
      id="testimonial-frame"
      label="Testimonial Section Frame"
      className="bg-white rounded-md shadow-card p-4 md:p-5"
    >
      <Editable as="h3" id="testimonial-frame-title" label="Testimonial Section Title" className="font-display font-semibold text-lg text-gray-900 mb-1">
        What customers are saying
      </Editable>
      <Editable as="p" id="testimonial-frame-paragraph" label="Testimonial Section Paragraph" className="text-xs text-gray-500 mb-4">
        Real feedback from recent Astro Wala Shop orders
      </Editable>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
        {testimonials.map((t) => (
          <Editable
            as="div"
            key={t.id}
            kind="button"
            group="testimonial-card-bg"
            label="Testimonial Card Background"
            className="shrink-0 w-72 border border-gray-100 rounded-md p-4 flex flex-col gap-3"
          >
            <Quote size={18} className="text-brand/30" />
            <Editable as="p" group="testimonial-card-text" label="Testimonial Text" className="text-sm text-gray-600 leading-relaxed line-clamp-4">
              {t.text}
            </Editable>
            <div className="flex items-center gap-2 mt-1">
              <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover" loading="lazy" />
              <div>
                <Editable as="p" group="testimonial-card-title" label="Card Title (Customer Name)" className="text-sm font-medium text-gray-900">
                  {t.name}
                </Editable>
                <p className="text-xs text-gray-500">{t.location}</p>
              </div>
            </div>
            <Editable as="div" group="testimonial-card-rating" label="Rating" className="flex gap-0.5" style={{ color: "#C8941F" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  fill="currentColor"
                  strokeWidth={0}
                  style={i < t.rating ? undefined : { color: "#e5e7eb" }}
                />
              ))}
            </Editable>
          </Editable>
        ))}
      </div>
    </Editable>
  );
}
