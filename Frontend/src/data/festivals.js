

export const festivals = [
  {
    id: "makar-sankranti",
    name: "Makar Sankranti",
    emoji: "🪁",
    start: { month: 0, day: 10 },
    end: { month: 0, day: 15 },
    countdownFrom: 7,
    banner: "Makar Sankranti Special — Til-Gud Gifting Kits Live Now",
    gradient: "from-amber-500 via-orange-500 to-yellow-400",
    accent: "#E58A1F",
  },
  {
    id: "vasant-panchami",
    name: "Vasant Panchami",
    emoji: "🌼",
    start: { month: 1, day: 1 },
    end: { month: 1, day: 4 },
    countdownFrom: 5,
    banner: "Vasant Panchami — Saraswati Puja Kits & Yellow Sapphire Offers",
    gradient: "from-yellow-400 via-amber-400 to-lime-400",
    accent: "#D9A521",
  },
  {
    id: "holi",
    name: "Holi",
    emoji: "🎨",
    start: { month: 2, day: 8 },
    end: { month: 2, day: 14 },
    countdownFrom: 10,
    banner: "Holi Hai! Rangoli Colours & Pooja Kits at Festive Prices",
    gradient: "from-pink-500 via-fuchsia-500 to-yellow-400",
    accent: "#D6336C",
  },
  {
    id: "ram-navami",
    name: "Ram Navami",
    emoji: "🏹",
    start: { month: 3, day: 13 },
    end: { month: 3, day: 17 },
    countdownFrom: 7,
    banner: "Ram Navami — Special Pooja Samagri Kits Now Live",
    gradient: "from-orange-500 via-red-500 to-amber-400",
    accent: "#C8941F",
  },
  {
    id: "raksha-bandhan",
    name: "Raksha Bandhan",
    emoji: "🪢",
    start: { month: 7, day: 12 },
    end: { month: 7, day: 19 },
    countdownFrom: 10,
    banner: "Raksha Bandhan — Bracelets & Rakhi Gifting Bundles Live",
    gradient: "from-rose-500 via-pink-500 to-amber-400",
    accent: "#C2185B",
  },
  {
    id: "ganesh-chaturthi",
    name: "Ganesh Chaturthi",
    emoji: "🐘",
    start: { month: 7, day: 22 },
    end: { month: 8, day: 6 },
    countdownFrom: 10,
    banner: "Ganesh Chaturthi — Brass Ganesha Idols & Modak Thalis Live",
    gradient: "from-orange-500 via-amber-500 to-red-400",
    accent: "#C8941F",
  },
  {
    id: "navratri",
    name: "Navratri",
    emoji: "🪔",
    start: { month: 8, day: 25 },
    end: { month: 9, day: 5 },
    countdownFrom: 10,
    banner: "Navratri Nine Nights — Yantras & Vastu Specials Live Now",
    gradient: "from-red-600 via-rose-500 to-orange-400",
    accent: "#9C1C3A",
  },
  {
    id: "dussehra",
    name: "Dussehra",
    emoji: "🏹",
    start: { month: 9, day: 6 },
    end: { month: 9, day: 9 },
    countdownFrom: 5,
    banner: "Dussehra — Victory of Good over Evil, Protection Bracelets on Offer",
    gradient: "from-amber-500 via-red-500 to-orange-400",
    accent: "#B8451F",
  },
  {
    id: "diwali",
    name: "Diwali",
    emoji: "🪔",
    start: { month: 9, day: 18 },
    end: { month: 9, day: 27 },
    countdownFrom: 15,
    banner: "Diwali Dhamaka — Pooja Samagri, Idols & Gemstones up to 40% Off",
    gradient: "from-amber-500 via-yellow-400 to-orange-500",
    accent: "#C8941F",
  },
  {
    id: "christmas",
    name: "Christmas & New Year",
    emoji: "🎄",
    start: { month: 11, day: 18 },
    end: { month: 11, day: 31 },
    countdownFrom: 12,
    banner: "Year-End Sale — Annual Horoscope Reports 2027 Now Available",
    gradient: "from-emerald-600 via-green-500 to-red-500",
    accent: "#1E5631",
  },
];

// Returns the festival that is currently "active" (today falls in its
// start–end window), or null if no festival is active right now.
export function getActiveFestival(today = new Date()) {
  const month = today.getMonth();
  const day = today.getDate();

  return (
    festivals.find((f) => {
      const { start, end } = f;
      if (start.month === end.month) {
        return month === start.month && day >= start.day && day <= end.day;
      }
      // Window spans two months (e.g. Ganesh Chaturthi Aug→Sep)
      if (month === start.month) return day >= start.day;
      if (month === end.month) return day <= end.day;
      return false;
    }) || null
  );
}

// Returns the next upcoming festival and how many days away it is, for the
// countdown banner. Looks up to 365 days ahead.
export function getUpcomingFestival(today = new Date()) {
  let closest = null;
  let closestDays = Infinity;

  for (const f of festivals) {
    const startThisYear = new Date(today.getFullYear(), f.start.month, f.start.day);
    let diffDays = Math.ceil((startThisYear - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      const startNextYear = new Date(today.getFullYear() + 1, f.start.month, f.start.day);
      diffDays = Math.ceil((startNextYear - today) / (1000 * 60 * 60 * 24));
    }
    if (diffDays < closestDays) {
      closestDays = diffDays;
      closest = f;
    }
  }

  return closest ? { festival: closest, daysAway: closestDays } : null;
}
