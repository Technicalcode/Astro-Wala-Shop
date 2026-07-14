import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Circle, ChevronRight, CheckCircle2, MessageCircle, Phone, Video } from "lucide-react";
import { getAstrologerById } from "../data/astrologers";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../store/authSlice";
import { placeOrder } from "../store/ordersSlice";
import VideoCallScreen from "../components/VideoCallScreen";

const DURATIONS = [5, 10, 15, 30];
const SLOTS = ["Now", "5:00 PM", "6:30 PM", "8:00 PM", "Tomorrow 10:00 AM"];
const MODES = [
  { id: "chat", label: "Chat", icon: MessageCircle, multiplier: 1 },
  { id: "call", label: "Call", icon: Phone, multiplier: 1.2 },
  { id: "video", label: "Video", icon: Video, multiplier: 1.4 },
];

export default function AstrologerDetail() {
  const { id } = useParams();
  const astrologer = getAstrologerById(id);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const [duration, setDuration] = useState(10);
  const [slot, setSlot] = useState("Now");
  const [mode, setMode] = useState("chat");
  const [confirmed, setConfirmed] = useState(null);
  const [inCall, setInCall] = useState(false);

  if (!astrologer) {
    return <p className="text-gray-600 py-10 text-center">Astrologer not found.</p>;
  }

  const activeMode = MODES.find((m) => m.id === mode);
  const total = Math.round(duration * astrologer.pricePerMinute * activeMode.multiplier);

  const handleConfirm = () => {
    if (!user) {
      navigate("/login", { state: { from: `/astrologer/${id}` } });
      return;
    }
    const order = {
      id: "AM" + Date.now().toString().slice(-8),
      items: [
        {
          id: astrologer.id,
          name: `${duration}-min ${activeMode.label} consultation with ${astrologer.name}`,
          price: total,
          mrp: total,
          qty: 1,
          image: astrologer.photo,
        },
      ],
      address: { name: user.name, line: "Live consultation — no shipping address", city: "", state: "", pincode: "" },
      paymentMethod: "upi",
      total,
      userEmail: user.email,
      status: "Confirmed",
      placedAt: new Date().toISOString(),
    };
    dispatch(placeOrder(order));
    setConfirmed({ order, slot });
    if (mode === "video" && slot === "Now") {
      setInCall(true);
    }
  };

  if (inCall) {
    return (
      <VideoCallScreen
        astrologer={astrologer}
        durationMin={duration}
        onEnd={() => setInCall(false)}
      />
    );
  }

  if (confirmed) {
    return (
      <div className="bg-white rounded-md shadow-card py-14 px-6 flex flex-col items-center text-center max-w-lg mx-auto">
        <CheckCircle2 size={52} className="text-green-600 mb-4" />
        <h1 className="text-lg font-display font-semibold text-gray-900">Session Booked!</h1>
        <p className="text-sm text-gray-500 mt-2">
          Your {duration}-minute {activeMode.label.toLowerCase()} session with {astrologer.name} is
          confirmed for <span className="font-medium text-gray-700">{confirmed.slot}</span>.
        </p>
        <p className="text-xs text-gray-400 mt-1">Booking ref: #{confirmed.order.id}</p>
        <div className="flex gap-3 mt-7 flex-wrap justify-center">
          {mode === "video" && slot === "Now" && (
            <button
              onClick={() => setInCall(true)}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-6 py-2.5 rounded-sm flex items-center gap-1.5"
            >
              <Video size={15} /> Rejoin Video Call
            </button>
          )}
          <Link to="/account/orders" className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm">
            View My Bookings
          </Link>
          <Link to="/astrologers" className="border border-gray-300 text-gray-700 text-sm font-semibold px-6 py-2.5 rounded-sm">
            Browse More
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>Consult {astrologer.name} | AstroMart</title>
        <meta name="description" content={`Book a live session with ${astrologer.name}, specializing in ${astrologer.specialization.join(", ")}.`} />
      </Helmet>
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link to="/" className="hover:text-brand">Home</Link>
        <ChevronRight size={12} />
        <Link to="/astrologers" className="hover:text-brand">Astrologers</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700">{astrologer.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white rounded-md shadow-card p-5">
          <div className="flex gap-4">
            <div className="relative shrink-0">
              <img loading="lazy" src={astrologer.photo} alt={astrologer.name} className="w-24 h-24 rounded-full object-cover" />
              <Circle
                size={14}
                className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${
                  astrologer.online ? "text-green-500 fill-green-500" : "text-gray-300 fill-gray-300"
                }`}
              />
            </div>
            <div>
              <h1 className="text-lg font-display font-semibold text-gray-900">{astrologer.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{astrologer.specialization.join(" • ")}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Star size={14} className="text-gold fill-gold" />
                <span className="text-sm font-medium text-gray-700">{astrologer.rating}</span>
                <span className="text-xs text-gray-400">
                  ({astrologer.ratingCount.toLocaleString("en-IN")} reviews) • {astrologer.orders.toLocaleString("en-IN")} consultations
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {astrologer.experience} years experience • {astrologer.languages.join(", ")}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-5 leading-relaxed">{astrologer.bio}</p>
        </div>

        <div className="w-full md:w-80 shrink-0 bg-white rounded-md shadow-card p-5 h-fit">
          <h3 className="font-semibold text-gray-900 mb-3">Book a Session</h3>

          <p className="text-xs text-gray-500 mb-2">Consultation mode</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {MODES.map((m) => {
              const disabled = m.id === "video" && !astrologer.videoEnabled;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => !disabled && setMode(m.id)}
                  disabled={disabled}
                  title={disabled ? "Video not available for this astrologer" : undefined}
                  className={`flex flex-col items-center gap-1 py-2 rounded text-[11px] font-medium border transition-colors ${
                    mode === m.id
                      ? "bg-brand text-white border-brand"
                      : disabled
                      ? "border-gray-100 text-gray-300 cursor-not-allowed"
                      : "border-gray-200 text-gray-600 hover:border-brand/40"
                  }`}
                >
                  <Icon size={15} />
                  {m.label}
                  {m.multiplier > 1 && (
                    <span className={mode === m.id ? "text-white/70" : "text-gray-400"}>
                      {Math.round((m.multiplier - 1) * 100)}% extra
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-500 mb-2">Duration</p>
          <div className="flex gap-2 mb-4">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-3 py-1.5 rounded text-xs font-medium border ${
                  duration === d ? "bg-brand text-white border-brand" : "border-gray-200 text-gray-600"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 mb-2">Choose a slot</p>
          <div className="flex flex-col gap-1.5 mb-4">
            {SLOTS.map((s) => (
              <label
                key={s}
                className={`flex items-center gap-2 border rounded px-3 py-2 text-sm cursor-pointer ${
                  slot === s ? "border-brand bg-brand/5" : "border-gray-200"
                }`}
              >
                <input type="radio" name="slot" checked={slot === s} onChange={() => setSlot(s)} className="accent-brand" />
                {s}
              </label>
            ))}
          </div>

          <div className="flex justify-between text-sm text-gray-700 border-t border-dashed border-gray-200 pt-3 mb-3">
            <span>
              ₹{astrologer.pricePerMinute}/min × {duration} min
              {activeMode.multiplier > 1 && ` (${activeMode.label})`}
            </span>
            <span className="font-semibold text-gray-900">₹{total.toLocaleString("en-IN")}</span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!astrologer.online}
            className="w-full bg-cta-buy text-white font-semibold py-2.5 rounded-sm text-sm uppercase tracking-wide disabled:opacity-50"
          >
            {astrologer.online ? "Confirm Booking" : "Currently Offline"}
          </button>
        </div>
      </div>
    </div>
  );
}
