import { Link } from "react-router-dom";
import { Sparkles, Clock } from "lucide-react";
import { useSelector } from "react-redux";
import { selectActiveFestival, selectUpcomingFestival, selectShowCountdown } from "../store/festivalSlice";
import Editable from "./editable/Editable";

export default function FestivalStrip() {
  const activeFestival = useSelector(selectActiveFestival);
  const upcoming = useSelector(selectUpcomingFestival);
  const showCountdown = useSelector(selectShowCountdown);

  if (activeFestival) {
    return (
      <Editable
        as="div"
        kind="button"
        id="festival-strip-bg"
        label="Festival Strip Background"
        className={`bg-gradient-to-r ${activeFestival.gradient} text-white text-center text-[11px] sm:text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5`}
      >
        <span aria-hidden>{activeFestival.emoji}</span>
        <Editable as="span" id="festival-strip-text" label="Festival Strip Text">
          {activeFestival.banner}
        </Editable>
        <span aria-hidden>{activeFestival.emoji}</span>
      </Editable>
    );
  }

  if (showCountdown) {
    const { festival, daysAway } = upcoming;
    return (
      <Editable
        as={Link}
        to={`/category/pooja`}
        kind="button"
        id="festival-strip-bg"
        label="Festival Strip Background"
        className={`block bg-gradient-to-r ${festival.gradient} text-white text-center text-[11px] sm:text-xs font-semibold py-1.5 px-3 hover:opacity-95 transition-opacity`}
      >
        <Editable as="span" id="festival-strip-text" label="Festival Strip Text" className="inline-flex items-center gap-1.5">
          <Clock size={12} className="shrink-0" />
          {festival.name} mein sirf{" "}
          <span className="font-bold">
            {daysAway} {daysAway === 1 ? "din" : "din"}
          </span>{" "}
          baaki
          <Sparkles size={12} className="shrink-0" />
        </Editable>
      </Editable>
    );
  }

  return null;
}
