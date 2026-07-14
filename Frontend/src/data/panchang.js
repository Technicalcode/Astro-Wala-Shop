export const todayPanchang = {
  date: "20 June 2026",
  tithi: "Shukla Paksha Panchami",
  nakshatra: "Pushya",
  yoga: "Shubha",
  sunrise: "5:32 AM",
  sunset: "7:18 PM",
  rahuKaal: "4:42 PM – 6:18 PM",
  auspicious: "Abhijit Muhurat: 11:48 AM – 12:34 PM",
};

export const zodiacSigns = [
  { id: "aries", name: "Aries", hindi: "Mesh", dates: "Mar 21 – Apr 19", symbol: "♈" },
  { id: "taurus", name: "Taurus", hindi: "Vrishabha", dates: "Apr 20 – May 20", symbol: "♉" },
  { id: "gemini", name: "Gemini", hindi: "Mithun", dates: "May 21 – Jun 20", symbol: "♊" },
  { id: "cancer", name: "Cancer", hindi: "Kark", dates: "Jun 21 – Jul 22", symbol: "♋" },
  { id: "leo", name: "Leo", hindi: "Singh", dates: "Jul 23 – Aug 22", symbol: "♌" },
  { id: "virgo", name: "Virgo", hindi: "Kanya", dates: "Aug 23 – Sep 22", symbol: "♍" },
  { id: "libra", name: "Libra", hindi: "Tula", dates: "Sep 23 – Oct 22", symbol: "♎" },
  { id: "scorpio", name: "Scorpio", hindi: "Vrishchik", dates: "Oct 23 – Nov 21", symbol: "♏" },
  { id: "sagittarius", name: "Sagittarius", hindi: "Dhanu", dates: "Nov 22 – Dec 21", symbol: "♐" },
  { id: "capricorn", name: "Capricorn", hindi: "Makar", dates: "Dec 22 – Jan 19", symbol: "♑" },
  { id: "aquarius", name: "Aquarius", hindi: "Kumbh", dates: "Jan 20 – Feb 18", symbol: "♒" },
  { id: "pisces", name: "Pisces", hindi: "Meen", dates: "Feb 19 – Mar 20", symbol: "♓" },
];

const sampleHoroscopes = [
  "A good day to start new conversations — Mercury favours clear communication.",
  "Financial decisions made today carry long-term benefit. Avoid impulsive spending.",
  "Focus on health and routine. A short walk will lift your mood significantly.",
  "Relationships take centre stage — an honest conversation resolves an old misunderstanding.",
  "Career matters look promising; a senior person may notice your recent effort.",
  "Travel plans firm up. Double-check documents before finalising bookings.",
];

export const getDailyHoroscope = (signId) => {
  const idx = zodiacSigns.findIndex((z) => z.id === signId);
  return sampleHoroscopes[idx % sampleHoroscopes.length];
};
