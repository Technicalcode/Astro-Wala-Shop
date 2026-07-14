// Lightweight rule-based knowledge base for "Ask AstroBot".
// Matches user input against keyword sets and returns a relevant answer.
// This runs entirely client-side — no API key or backend needed.

export const botKnowledge = [
  {
    keywords: ["neelam", "blue sapphire", "shani", "saturn"],
    reply:
      "Blue Sapphire (Neelam) is worn for Saturn (Shani). It's a fast-acting, powerful stone — always get your kundli checked by an astrologer before wearing it, and try it for a 3-day trial period first. Check our Certified Gemstones section for lab-verified options.",
  },
  {
    keywords: ["pukhraj", "yellow sapphire", "guru", "jupiter"],
    reply:
      "Yellow Sapphire (Pukhraj) represents Jupiter (Guru) — it's known to bring wisdom, prosperity and good fortune. It's generally considered safe for most ascendants. We have Ceylon-origin certified Pukhraj available in our Gemstones section.",
  },
  {
    keywords: ["moonga", "red coral", "mars", "mangal"],
    reply:
      "Red Coral (Moonga) is the gemstone for Mars (Mangal) and is often recommended for courage, vitality, and Mangal Dosha remedies. Italian Moonga is considered top quality.",
  },
  {
    keywords: ["panna", "emerald", "budh", "mercury"],
    reply:
      "Emerald (Panna) is associated with Mercury (Budh) and is said to sharpen intellect and improve communication skills — great for students and business professionals.",
  },
  {
    keywords: ["manik", "ruby", "surya", "sun"],
    reply:
      "Ruby (Manik) represents the Sun (Surya) and is associated with leadership, confidence and authority. It's especially recommended when the Sun is weak in your 6th, 8th or 12th house.",
  },
  {
    keywords: ["rudraksha", "mukhi", "mala"],
    reply:
      "Rudraksha beads are used for meditation and spiritual protection. Each 'Mukhi' (face count) connects to a different planet — 5 Mukhi is the most common, ruled by Jupiter and great for daily wear. 1 Mukhi is rare and represents Lord Shiva.",
  },
  {
    keywords: ["mangal dosha", "manglik"],
    reply:
      "Mangal Dosha (Manglik Dosha) occurs when Mars is placed in certain houses of your birth chart. It's commonly checked before marriage matching. Our Marriage Compatibility (Kundli Matching) report includes a full Mangal Dosha analysis — see our Reports section.",
  },
  {
    keywords: ["kundli", "birth chart", "janam patrika"],
    reply:
      "A Kundli (birth chart) maps planetary positions at the time of your birth and is the foundation of Vedic predictions. Our Detailed Janam Kundli Report (40+ pages) covers career, marriage, health and remedies — delivered digitally within 24 hours.",
  },
  {
    keywords: ["vastu", "direction", "home", "office"],
    reply:
      "Vastu Shastra balances the energy of your living or working space. Common remedies include placing a Laughing Buddha in the living room, Vastu pyramids in the centre of the home, and wind chimes near the main door. Check our Vastu & Fengshui section.",
  },
  {
    keywords: ["yantra", "shree yantra", "kuber yantra"],
    reply:
      "Yantras are sacred geometric diagrams used for focus and energy. Shree Yantra is for wealth and abundance, while Kuber Yantra is specifically for business growth. Both are available energised and ready to use.",
  },
  {
    keywords: ["bracelet", "chakra", "rose quartz", "black onyx"],
    reply:
      "Our healing bracelets use natural gemstones — 7 Chakra for balance, Rose Quartz for love and emotional healing, and Black Onyx for protection against negative energy. All come in adjustable, unisex sizing.",
  },
  {
    keywords: ["horoscope", "daily", "today"],
    reply:
      "Your daily horoscope depends on your moon sign (Rashi). We offer a personalised Annual Horoscope Report covering all 12 months — career, finance, love and health predictions tailored to your birth chart.",
  },
  {
    keywords: ["career", "job", "business"],
    reply:
      "For career guidance, our Career & Business Astrology Report analyses your strengths, ideal fields and favourable timing for job switches or business launches — delivered as a digital PDF.",
  },
  {
    keywords: ["marriage", "compatibility", "guna milan"],
    reply:
      "Marriage compatibility in Vedic astrology uses Ashtakoot Guna Milan (out of 36 points) plus a Mangal Dosha check. Our Kundli Matching report covers both — perfect before finalising a match.",
  },
  {
    keywords: ["astrologer", "talk", "consult", "call", "chat with astrologer"],
    reply:
      "You can talk to our verified astrologers live via chat, call, or video consultation! Head to the Astrologers section to see who's online right now and book your session.",
  },
  {
    keywords: ["price", "cost", "how much"],
    reply:
      "Prices vary by product and astrologer — gemstones start around ₹1,899, rudraksha from ₹449, and live astrologer consultations from ₹12/minute. Check each product page for exact pricing.",
  },
  {
    keywords: ["refer", "referral", "invite", "earn"],
    reply:
      "You can earn rewards by referring friends! Visit the 'Refer & Earn' page from the menu, share your unique code, and both you and your friend get a discount on your next order.",
  },
  {
    keywords: ["hello", "hi", "hey", "namaste"],
    reply:
      "Namaste! 🙏 I'm AstroBot, your quick astrology assistant. Ask me about gemstones, rudraksha, kundli, vastu, or anything else Astro Wala Shop related!",
  },
  {
    keywords: ["track", "order status", "where is my order"],
    reply: "You can easily track your order by going to 'My Account' > 'Orders'. There you will find the real-time status and estimated delivery date for all your purchases.",
  },
  {
    keywords: ["return", "refund", "exchange", "policy"],
    reply: "We offer a hassle-free 7-day return policy for unused products in their original packaging. Customised items (like energized yantras) are non-returnable. You can initiate a return from your Orders page.",
  },
  {
    keywords: ["contact", "support", "help", "customer care"],
    reply: "Our support team is here to help! You can email us at support@astrowalashop.com or call our toll-free number 1800-ASTRO-WALA between 9 AM to 7 PM.",
  },
  {
    keywords: ["suggest", "best gemstone", "which gemstone"],
    reply: "The best gemstone depends on your Kundli (birth chart). Generally, Blue Sapphire is for Saturn, Yellow Sapphire for Jupiter, and Emerald for Mercury. For personalized recommendations, please check our 'Reports' section for a detailed analysis.",
  },
  {
    keywords: ["thank", "thanks", "thank you"],
    reply: "You're welcome! 🌟 Wishing you clear skies and good fortune. Anything else I can help with?",
  },
];

const fallbackReplies = [
  "That's a great question! For a detailed answer about our products or services, I'd recommend contacting our support team.",
  "I don't have a specific answer for that yet, but our customer care team is always happy to help you with your order.",
];

export function getBotReply(input) {
  const text = input.toLowerCase();
  for (const entry of botKnowledge) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      return entry.reply;
    }
  }
  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
}

export const suggestedQuestions = [
  "Suggest a gemstone for me",
  "How to track my order?",
  "What is the return policy?",
  "Contact Support",
];
