import { Link } from "react-router-dom";
import { Star, Circle, Video } from "lucide-react";
import Editable from "./editable/Editable";

export default function AstrologerCard({ astrologer }) {
  return (
    <Editable
      as="div"
      kind="button"
      group="astrologer-card-bg"
      label="Astrologer Card Background"
      className="bg-white rounded-md shadow-card p-4 flex flex-col gap-3"
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <img
            src={astrologer.photo}
            alt={astrologer.name}
            className="w-16 h-16 rounded-full object-cover"
            loading="lazy"
          />
          <Circle
            size={11}
            className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${
              astrologer.online ? "text-green-500 fill-green-500" : "text-gray-300 fill-gray-300"
            }`}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Editable as="p" group="astrologer-card-text" label="Astrologer Name" className="font-semibold text-gray-900 leading-tight">
              {astrologer.name}
            </Editable>
            {astrologer.videoEnabled && (
              <Editable
                as="span"
                kind="button"
                group="astrologer-card-discount"
                label="Highlight Badge"
                className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "#1A4B8C", color: "#ffffff" }}
              >
                <Video size={9} /> Video
              </Editable>
            )}
          </div>
          <Editable as="p" group="astrologer-card-specialization" label="Specialization" className="text-xs text-gray-500 mt-0.5">
            {astrologer.specialization.join(" • ")}
          </Editable>
          <div className="flex items-center gap-1 mt-1">
            <Editable
              as="span"
              kind="button"
              group="astrologer-card-rating"
              label="Rating"
              className="inline-flex items-center gap-1 px-1 rounded"
              style={{ color: "#C8941F" }}
            >
              <Star size={13} fill="currentColor" strokeWidth={0} />
              <span className="text-xs font-medium">{astrologer.rating}</span>
            </Editable>
            <span className="text-xs text-gray-400">
              ({astrologer.ratingCount.toLocaleString("en-IN")})
            </span>
          </div>
        </div>
      </div>

      <Editable as="p" group="astrologer-card-bio" label="Bio" className="text-xs text-gray-600 line-clamp-2">{astrologer.bio}</Editable>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <Editable as="span" group="astrologer-card-experience" label="Experience">{astrologer.experience} yrs experience</Editable>
        <Editable as="span" group="astrologer-card-languages" label="Languages">{astrologer.languages.join(", ")}</Editable>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Editable as="span" group="astrologer-card-price" label="Price" className="font-semibold text-gray-900">
          ₹{astrologer.pricePerMinute}/min
        </Editable>
        <Editable
          as={Link}
          to={`/astrologer/${astrologer.id}`}
          kind="button"
          group="astrologer-card-btn"
          label="Button (Background & Text)"
          className={`text-xs font-semibold px-4 py-1.5 rounded-sm ${
            astrologer.online
              ? "bg-cta-buy text-white hover:opacity-90"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {astrologer.online ? "Book Now" : "Notify Me"}
        </Editable>
      </div>
    </Editable>
  );
}
