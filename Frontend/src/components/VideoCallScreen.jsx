import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

export default function VideoCallScreen({ astrologer, durationMin, onEnd }) {
  const [secondsLeft, setSecondsLeft] = useState(durationMin * 60);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          onEnd();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      {/* Astrologer "video" feed — simulated with photo + subtle pulse */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-800 to-gray-950">
        <div className="absolute inset-0 bg-constellation opacity-20" />
        <div className="flex flex-col items-center gap-3 relative">
          <div className="relative">
            <img loading="lazy"
              src={astrologer.photo}
              alt={astrologer.name}
              className="h-32 w-32 sm:h-40 sm:w-40 rounded-full object-cover ring-4 ring-white/10"
            />
            <span className="absolute inset-0 rounded-full ring-2 ring-green-400 animate-ping opacity-40" />
          </div>
          <p className="text-white font-display font-semibold text-lg">{astrologer.name}</p>
          <p className="text-white/50 text-xs">Live video consultation</p>
        </div>

        {/* Self preview */}
        <div className="absolute bottom-24 right-4 sm:right-6 w-24 h-32 sm:w-32 sm:h-40 rounded-md bg-gray-800 border border-white/10 flex items-center justify-center overflow-hidden">
          {camOn ? (
            <span className="text-white/40 text-[11px] text-center px-2">Your camera preview</span>
          ) : (
            <VideoOff size={20} className="text-white/30" />
          )}
        </div>

        {/* Timer */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm text-white text-xs font-mono px-3 py-1.5 rounded-full">
          {mm}:{ss} remaining
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/80 backdrop-blur-sm py-5 flex items-center justify-center gap-4">
        <button
          onClick={() => setMicOn((v) => !v)}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
            micOn ? "bg-white/15 text-white" : "bg-white text-gray-900"
          }`}
          aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button
          onClick={onEnd}
          className="h-14 w-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
          aria-label="End call"
        >
          <PhoneOff size={22} />
        </button>
        <button
          onClick={() => setCamOn((v) => !v)}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
            camOn ? "bg-white/15 text-white" : "bg-white text-gray-900"
          }`}
          aria-label={camOn ? "Turn camera off" : "Turn camera on"}
        >
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
      </div>
    </div>
  );
}
