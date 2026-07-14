// Real product photos sourced from Unsplash (free to use, hotlinked via Unsplash's CDN).
const img = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&h=800&q=80`;

let _id = 100;
const nextId = () => String(_id++);

const makeProduct = (p) => ({
  id: nextId(),
  rating: 4.5,
  ratingCount: 1200,
  assured: true,
  badge: null,
  stock: 25,
  images: [p.image, p.image, p.image],
  variants: p.variants ? p.variants : [{
    name: "Size",
    options: (p.category === "gemstones" ? ["3.25 Ratti", "5.25 Ratti", "7.25 Ratti"]
      : p.category === "rudraksha" ? ["Regular", "Premium (Large)"]
      : p.category === "bracelets" ? ["Free Size", "Medium", "Large"]
      : p.category === "pooja" ? ["100g", "250g", "500g"]
      : p.category === "yantras" || p.category === "vastu" ? ["3x3 Inch", "6x6 Inch"]
      : p.category === "reports" ? ["Digital PDF"]
      : ["Standard"]).map(opt => ({ name: opt, price: p.price || 0, mrp: p.mrp || 0 }))
  }],
  reviews: [
    { id: 1, user: "Amit Sharma", rating: 5, text: "Excellent product, very authentic!", date: "10 Oct 2025" },
    { id: 2, user: "Priya Singh", rating: 4, text: "Good quality, fast delivery.", date: "12 Oct 2025" }
  ],
  ...p,
});

export const products = [
  // ---------------- GEMSTONES ----------------
  makeProduct({
    name: "Natural Ceylon Blue Sapphire (Neelam) – 5.25 Ratti",
    category: "gemstones",
    brand: "Astro Wala Shop Ratna",
    price: 8499,
    mrp: 14999,
    rating: 4.4,
    ratingCount: 842,
    badge: "Bestseller",
    image: img("photo-1613843351058-1dd06fda7c02"),
    description:
      "Untreated, natural Ceylon Blue Sapphire for Shani (Saturn) — comes with a government-approved lab certificate.",
    highlights: [
      "Lab certified (IGI equivalent report included)",
      "Panchdhatu silver ring, adjustable size",
      "Recommended for Saturn (Shani) dasha relief",
      "Energised by Vedic mantra before dispatch",
    ],
  }),
  makeProduct({
    name: "Original Yellow Sapphire (Pukhraj) – 6 Ratti, Ceylon",
    category: "gemstones",
    brand: "Astro Wala Shop Ratna",
    price: 6999,
    mrp: 11999,
    rating: 4.3,
    ratingCount: 530,
    image: img("photo-1602887148362-29eff3ff8620"),
    description:
      "Premium Ceylon Pukhraj for Jupiter (Guru) — brings clarity, wisdom and prosperity.",
    highlights: [
      "Natural, unheated gemstone",
      "Comes in gold-plated panchdhatu ring",
      "Ideal for Jupiter mahadasha",
      "7-day return if certificate fails verification",
    ],
  }),
  makeProduct({
    name: "Natural Red Coral (Moonga) – 8 Ratti, Italian",
    category: "gemstones",
    brand: "Navratna House",
    price: 3299,
    mrp: 5499,
    rating: 4.2,
    ratingCount: 312,
    image: img("photo-1709252790050-dce1ad9401c7"),
    description: "Triple-A grade Italian Moonga for Mars (Mangal) — boosts courage and vitality.",
    highlights: ["100% natural coral", "Copper ring included", "Suitable for Mangal dosha"],
  }),
  makeProduct({
    name: "Emerald (Panna) – 4.5 Ratti, Zambian",
    category: "gemstones",
    brand: "Navratna House",
    price: 5999,
    mrp: 9999,
    rating: 4.1,
    ratingCount: 198,
    image: img("photo-1679395281035-192e42db19ac"),
    description: "Zambian Panna for Mercury (Budh) — sharpens intellect and communication.",
    highlights: ["Natural, eye-clean stone", "Silver ring, adjustable", "Lab certificate included"],
  }),
  makeProduct({
    name: "Ruby (Manik) – 5 Ratti, Mozambique",
    category: "gemstones",
    brand: "Astro Wala Shop Ratna",
    price: 4499,
    mrp: 7999,
    rating: 4.3,
    ratingCount: 276,
    image: img("photo-1772047678464-a31500f09874"),
    description: "Deep red Mozambique Manik for the Sun (Surya) — strengthens leadership and confidence.",
    highlights: ["Natural heated ruby", "Gold-plated ring", "Best for Sun in 6th/8th/12th house"],
  }),
  makeProduct({
    name: "Diamond Substitute – White Zircon, 2 Carat",
    category: "gemstones",
    brand: "Navratna House",
    price: 1899,
    mrp: 2999,
    rating: 4.0,
    ratingCount: 154,
    image: img("photo-1611955167811-4711904bb9f8"),
    description: "Affordable Venus (Shukra) substitute stone with brilliant sparkle.",
    highlights: ["Budget-friendly Shukra remedy", "Silver setting", "Lightweight, daily wear"],
  }),

  // ---------------- RUDRAKSHA ----------------
  makeProduct({
    name: "5 Mukhi Rudraksha Mala – 108+1 Beads, Nepal",
    category: "rudraksha",
    brand: "Himalaya Rudraksha",
    price: 1299,
    mrp: 1999,
    rating: 4.6,
    ratingCount: 2104,
    badge: "Bestseller",
    image: img("photo-1562960364-f47d48567cf0"),
    description: "Authentic Nepal-origin 5 Mukhi Rudraksha mala for daily jaap and meditation.",
    highlights: [
      "Lab certified Nepali Rudraksha",
      "Strung on pure cotton thread",
      "Ruling planet: Jupiter",
      "Ideal for stress relief & focus",
    ],
  }),
  makeProduct({
    name: "1 Mukhi Rudraksha (Nepal) – Collector's Piece",
    category: "rudraksha",
    brand: "Himalaya Rudraksha",
    price: 18999,
    mrp: 24999,
    rating: 4.7,
    ratingCount: 89,
    badge: "Rare",
    image: img("photo-1613498509814-5927a34a47cf"),
    description: "Rare, certified 1 Mukhi Rudraksha representing Lord Shiva — for spiritual seekers.",
    highlights: ["X-ray & lab certified", "Comes with silver capping", "Highly auspicious, limited stock"],
  }),
  makeProduct({
    name: "7 Mukhi Rudraksha for Lakshmi Puja",
    category: "rudraksha",
    brand: "Shiv Shakti Rudraksha",
    price: 899,
    mrp: 1499,
    rating: 4.4,
    ratingCount: 410,
    image: img("photo-1607182324626-7cd70522abc1"),
    description: "Associated with Goddess Lakshmi — worn for wealth and removing financial obstacles.",
    highlights: ["Ruling planet: Saturn", "Silver pendant cap", "Comes with puja vidhi booklet"],
  }),
  makeProduct({
    name: "Rudraksha Bracelet – 6mm Beads, Unisex",
    category: "rudraksha",
    brand: "Shiv Shakti Rudraksha",
    price: 449,
    mrp: 799,
    rating: 4.3,
    ratingCount: 980,
    image: img("photo-1607182324676-7d2b42022a23"),
    description: "Elastic Rudraksha bracelet for everyday wear, men & women.",
    highlights: ["Adjustable stretch fit", "Natural beads", "Combo of 2 available"],
  }),
  makeProduct({
    name: "Panchmukhi Rudraksha Set of 5 – Loose Beads",
    category: "rudraksha",
    brand: "Himalaya Rudraksha",
    price: 599,
    mrp: 999,
    rating: 4.2,
    ratingCount: 233,
    image: img("photo-1631832724508-ea8df04ad455"),
    description: "Set of 5 loose 5-Mukhi beads for custom mala-making or pooja.",
    highlights: ["Sold as pack of 5", "Nepal origin", "Free thread included"],
  }),

  // ---------------- YANTRAS & IDOLS ----------------
  makeProduct({
    name: "Shree Yantra – Pure Brass, Energised, 4 inch",
    category: "yantras",
    brand: "Divine Murti",
    price: 799,
    mrp: 1299,
    rating: 4.5,
    ratingCount: 670,
    badge: "Bestseller",
    image: img("photo-1606285461069-80ba562575dd"),
    description: "Energised Shree Yantra for wealth, abundance and removing financial blocks at home or office.",
    highlights: ["Pure brass casting", "Pran-pratishtha done by Pandit", "Comes with stand & cloth"],
  }),
  makeProduct({
    name: "Kuber Yantra – Copper, for Business Growth",
    category: "yantras",
    brand: "Divine Murti",
    price: 549,
    mrp: 899,
    rating: 4.3,
    ratingCount: 312,
    image: img("photo-1662720868850-e60cefb03201"),
    description: "Copper Kuber Yantra to invite prosperity in business and trade.",
    highlights: ["Solid copper", "Activated as per Vedic rituals", "Ideal for shop/office entrance"],
  }),
  makeProduct({
    name: "Brass Ganesha Idol – Hand Carved, 6 inch",
    category: "yantras",
    brand: "Divine Murti",
    price: 1199,
    mrp: 1899,
    rating: 4.6,
    ratingCount: 540,
    image: img("photo-1759674886957-b1becf59f9e5"),
    description: "Intricately hand-carved brass Ganesha idol — remover of obstacles.",
    highlights: ["Hand-finished detailing", "Ideal for home temple or gifting", "Weight: 850g"],
  }),
  makeProduct({
    name: "Navgraha Yantra Set – 9 Planet Energised Plates",
    category: "yantras",
    brand: "Vedic Crafts",
    price: 1499,
    mrp: 2299,
    rating: 4.4,
    ratingCount: 145,
    image: img("photo-1729335511904-9b8690184935"),
    description: "Complete set of 9 yantras for balancing all planetary energies.",
    highlights: ["Set of 9 copper plates", "Comes with puja guide", "Energised on auspicious tithi"],
  }),
  makeProduct({
    name: "Marble Laxmi-Ganesh Idol Pair – 5 inch",
    category: "yantras",
    brand: "Vedic Crafts",
    price: 1799,
    mrp: 2599,
    rating: 4.5,
    ratingCount: 220,
    image: img("photo-1729335511883-29eade10006b"),
    description: "Hand-painted marble-dust idols of Laxmi and Ganesh, perfect for Diwali pooja.",
    highlights: ["Pair of 2 idols", "Hand-painted finish", "Comes in gift box"],
  }),

  // ---------------- POOJA SAMAGRI ----------------
  makeProduct({
    name: "Complete Diwali Pooja Samagri Kit (28 items)",
    category: "pooja",
    brand: "Astro Wala Shop Pooja",
    price: 699,
    mrp: 1099,
    rating: 4.5,
    ratingCount: 1980,
    badge: "Festive Pick",
    image: img("photo-1635192592106-77a5aacbe1a3"),
    description: "Everything you need for Diwali Laxmi-Ganesh puja in one box, with a printed vidhi booklet.",
    highlights: [
      "28 essential items included",
      "Printed Hindi/English vidhi guide",
      "Ideal for home or office puja",
    ],
  }),
  makeProduct({
    name: "Pure Cow Ghee Diya Wicks (Pack of 100)",
    category: "pooja",
    brand: "Gau Seva Products",
    price: 199,
    mrp: 299,
    rating: 4.4,
    ratingCount: 860,
    image: img("photo-1605292356183-a77d0a9c9d1d"),
    description: "Cotton diya wicks dipped in pure cow ghee, for daily aarti.",
    highlights: ["100% natural cotton", "Long burning time", "Pack of 100"],
  }),
  makeProduct({
    name: "Sandalwood Incense Sticks – Agarbatti, 12 Packs",
    category: "pooja",
    brand: "Gau Seva Products",
    price: 349,
    mrp: 549,
    rating: 4.3,
    ratingCount: 1340,
    image: img("photo-1512917860049-18d416baa831"),
    description: "Premium sandalwood agarbatti — slow burning with rich, calming fragrance.",
    highlights: ["12 packs x 20 sticks", "Charcoal-free", "Long-lasting aroma"],
  }),
  makeProduct({
    name: "Panchpatra Set with Spoon – Pure Brass",
    category: "pooja",
    brand: "Astro Wala Shop Pooja",
    price: 449,
    mrp: 699,
    rating: 4.4,
    ratingCount: 290,
    image: img("photo-1605378229010-11aedbb01b24"),
    description: "Traditional brass panchpatra and spoon for daily puja rituals.",
    highlights: ["Solid brass construction", "Easy to clean", "Comes with velvet pouch"],
  }),
  makeProduct({
    name: "Rangoli Colour Powder Set – 12 Shades",
    category: "pooja",
    brand: "Gau Seva Products",
    price: 249,
    mrp: 399,
    rating: 4.2,
    ratingCount: 410,
    image: img("photo-1772047678453-710bec5c6b38"),
    description: "Vibrant, skin-safe rangoli powders for festive floor art.",
    highlights: ["12 vivid colours", "Fine powder texture", "Resealable pouches"],
  }),

  // ---------------- BRACELETS & MALAS ----------------
  makeProduct({
    name: "7 Chakra Healing Bracelet – Natural Stone",
    category: "bracelets",
    brand: "ChakraVibe",
    price: 349,
    mrp: 599,
    rating: 4.3,
    ratingCount: 1560,
    badge: "Bestseller",
    image: img("photo-1743127671067-62af70aa67c2"),
    description: "Natural gemstone bracelet aligned to the 7 chakras for balance and healing.",
    highlights: ["Genuine natural stones", "Elastic, fits all wrist sizes", "Combo discount on 3+"],
  }),
  makeProduct({
    name: "Tulsi Mala – 108 Beads, Sacred Basil",
    category: "bracelets",
    brand: "Vedic Crafts",
    price: 199,
    mrp: 349,
    rating: 4.5,
    ratingCount: 720,
    image: img("photo-1639706188490-876064810182"),
    description: "Hand-strung Tulsi mala for chanting and protection, blessed at Vrindavan.",
    highlights: ["108+1 authentic Tulsi beads", "Soft cotton thread", "Ideal for daily jaap"],
  }),
  makeProduct({
    name: "Black Onyx Protection Bracelet",
    category: "bracelets",
    brand: "ChakraVibe",
    price: 299,
    mrp: 499,
    rating: 4.2,
    ratingCount: 540,
    image: img("photo-1601888238880-267580743a6d"),
    description: "Black Onyx is believed to absorb negative energy and protect against evil eye.",
    highlights: ["Natural Onyx beads", "Unisex, adjustable", "Comes with care card"],
  }),
  makeProduct({
    name: "Rose Quartz Love & Harmony Bracelet",
    category: "bracelets",
    brand: "ChakraVibe",
    price: 329,
    mrp: 549,
    rating: 4.4,
    ratingCount: 690,
    image: img("photo-1743127671060-df0140e9edf0"),
    description: "Rose Quartz is known as the stone of unconditional love and emotional healing.",
    highlights: ["AAA grade rose quartz", "Lightweight, daily wear", "Gift-ready packaging"],
  }),

  // ---------------- VASTU & FENGSHUI ----------------
  makeProduct({
    name: "Feng Shui Laughing Buddha – Brass, 5 inch",
    category: "vastu",
    brand: "Vastu Living",
    price: 599,
    mrp: 999,
    rating: 4.4,
    ratingCount: 480,
    image: img("photo-1544592218-b546f7b9ddb4"),
    description: "Brass Laughing Buddha for happiness, abundance and positive energy at home.",
    highlights: ["Solid brass", "Ideal for living room or office desk", "Comes gift-boxed"],
  }),
  makeProduct({
    name: "Vastu Pyramid Set for Home – 9 Pyramids",
    category: "vastu",
    brand: "Vastu Living",
    price: 449,
    mrp: 749,
    rating: 4.1,
    ratingCount: 230,
    image: img("photo-1554020632-57ebe4b1933f"),
    description: "Copper pyramid set to correct vastu imbalances across the 8 directions.",
    highlights: ["Set of 9 pyramids", "Includes placement guide", "Lightweight copper"],
  }),
  makeProduct({
    name: "Tortoise on Plate – Feng Shui Wealth Symbol",
    category: "vastu",
    brand: "Vastu Living",
    price: 399,
    mrp: 649,
    rating: 4.3,
    ratingCount: 310,
    image: img("photo-1609745772921-f520289e9618"),
    description: "Metal tortoise on a glass plate — a classic Feng Shui symbol for longevity and wealth.",
    highlights: ["Glass plate included", "Place facing North", "Compact desk size"],
  }),
  makeProduct({
    name: "Wind Chime – 6 Rod Metal, for Main Door",
    category: "vastu",
    brand: "Vastu Living",
    price: 249,
    mrp: 399,
    rating: 4.0,
    ratingCount: 195,
    image: img("photo-1686588896357-5b04178755e0"),
    description: "Melodious 6-rod metal wind chime to enhance positive chi at entrances.",
    highlights: ["Weather-resistant metal", "Soothing tone", "Easy to hang"],
  }),

  // ---------------- REPORTS ----------------
  makeProduct({
    name: "Detailed Janam Kundli Report (40+ pages, PDF)",
    category: "reports",
    brand: "Astro Wala Shop Reports",
    price: 299,
    mrp: 499,
    rating: 4.5,
    ratingCount: 3200,
    badge: "Bestseller",
    image: img("photo-1736117703315-d3dc5582cfb7"),
    description: "Comprehensive birth chart report covering career, marriage, health and remedies.",
    highlights: [
      "Delivered digitally within 24 hours",
      "Based on Vedic Parashari system",
      "Includes Dasha & remedies section",
    ],
    digital: true,
  }),
  makeProduct({
    name: "Marriage Compatibility (Kundli Matching) Report",
    category: "reports",
    brand: "Astro Wala Shop Reports",
    price: 399,
    mrp: 649,
    rating: 4.4,
    ratingCount: 1450,
    image: img("photo-1737317313282-02b0d8dddb7d"),
    description: "Detailed Guna Milan and compatibility analysis for prospective couples.",
    highlights: ["Ashtakoot Guna Milan score", "Mangal dosha check", "Digital PDF, 24-hr delivery"],
    digital: true,
  }),
  makeProduct({
    name: "Annual Horoscope Report 2026 – Personalised",
    category: "reports",
    brand: "Astro Wala Shop Reports",
    price: 249,
    mrp: 399,
    rating: 4.3,
    ratingCount: 980,
    image: img("photo-1737317312025-d0b8f9f687ec"),
    description: "Month-by-month predictions for career, finance, love and health for the year ahead.",
    highlights: ["Personalised to your birth chart", "Covers all 12 months", "Digital PDF delivery"],
    digital: true,
  }),
  makeProduct({
    name: "Career & Business Astrology Report",
    category: "reports",
    brand: "Astro Wala Shop Reports",
    price: 349,
    mrp: 599,
    rating: 4.2,
    ratingCount: 540,
    image: img("photo-1552321043-21830a856e1e"),
    description: "In-depth analysis of career strengths, ideal fields and favourable timing for switches.",
    highlights: ["Includes favourable career windows", "Business vs job analysis", "Digital PDF delivery"],
    digital: true,
  }),

  // --- NEWLY ADDED 2 CARDS PER CATEGORY ---
  makeProduct({
    name: "Natural Pearl (Moti) – 4 Ratti",
    category: "gemstones",
    brand: "Astro Wala Shop Ratna",
    price: 1999, mrp: 2999, rating: 4.6, ratingCount: 450,
    image: img("photo-1611955167811-4711904bb9f8"),
    description: "Original Basra Pearl for Moon (Chandra) — brings calmness and emotional balance.",
    highlights: ["Natural Pearl", "Silver Ring", "Lab Certified"]
  }),
  makeProduct({
    name: "Hessonite (Gomed) – 6 Ratti",
    category: "gemstones",
    brand: "Navratna House",
    price: 2499, mrp: 4599, rating: 4.2, ratingCount: 310,
    image: img("photo-1772047678464-a31500f09874"),
    description: "Ceylonese Gomed for Rahu — overcomes hidden obstacles.",
    highlights: ["Unheated Gomed", "Panchdhatu Ring", "Lab Certified"]
  }),
  
  makeProduct({
    name: "Gauri Shankar Rudraksha",
    category: "rudraksha",
    brand: "Himalaya Rudraksha",
    price: 4999, mrp: 7999, rating: 4.8, ratingCount: 120,
    badge: "Bestseller",
    image: img("photo-1562960364-f47d48567cf0"),
    description: "Symbol of Shiva and Parvati — brings harmony in relationships.",
    highlights: ["Nepal Origin", "Silver Capping", "Lab Certified"]
  }),
  makeProduct({
    name: "10 Mukhi Rudraksha (Nepal)",
    category: "rudraksha",
    brand: "Shiv Shakti Rudraksha",
    price: 2499, mrp: 3999, rating: 4.5, ratingCount: 200,
    image: img("photo-1631832724508-ea8df04ad455"),
    description: "Represents Lord Vishnu — protects from negative energies.",
    highlights: ["100% Original", "Puja Vidhi included", "Lab Certified"]
  }),

  makeProduct({
    name: "Saraswati Yantra – Brass",
    category: "yantras",
    brand: "Divine Murti",
    price: 699, mrp: 1199, rating: 4.7, ratingCount: 340,
    image: img("photo-1662720868850-e60cefb03201"),
    description: "Enhances knowledge, memory, and concentration.",
    highlights: ["Pure Brass", "Energised", "Ideal for students"]
  }),
  makeProduct({
    name: "Mahamrityunjay Yantra – Copper",
    category: "yantras",
    brand: "Vedic Crafts",
    price: 599, mrp: 999, rating: 4.6, ratingCount: 410,
    image: img("photo-1606285461069-80ba562575dd"),
    description: "Bestows health, longevity, and protects from diseases.",
    highlights: ["Solid Copper", "Activated with mantras", "Pocket size"]
  }),

  makeProduct({
    name: "Navagraha Shanti Havan Kit",
    category: "pooja",
    brand: "Astro Wala Shop Pooja",
    price: 899, mrp: 1499, rating: 4.8, ratingCount: 560,
    image: img("photo-1635192592106-77a5aacbe1a3"),
    description: "Complete havan samagri kit for Navagraha Shanti.",
    highlights: ["108 Herbs mix", "Pure Mango Wood", "Printed Guide"]
  }),
  makeProduct({
    name: "Brass Akhand Diya – Large",
    category: "pooja",
    brand: "Gau Seva Products",
    price: 499, mrp: 899, rating: 4.5, ratingCount: 890,
    image: img("photo-1605292356183-a77d0a9c9d1d"),
    description: "Heavy brass akhand diya for long uninterrupted burning.",
    highlights: ["Borosilicate Glass cover", "Stays lit for 24hrs", "Easy clean"]
  }),

  makeProduct({
    name: "Tiger Eye Courage Bracelet",
    category: "bracelets",
    brand: "ChakraVibe",
    price: 299, mrp: 499, rating: 4.4, ratingCount: 1120,
    image: img("photo-1601888238880-267580743a6d"),
    description: "Tiger Eye stone boosts confidence and takes away fear.",
    highlights: ["Natural Stone", "Stretchable", "Unisex"]
  }),
  makeProduct({
    name: "Amethyst Calming Bracelet",
    category: "bracelets",
    brand: "ChakraVibe",
    price: 349, mrp: 599, rating: 4.7, ratingCount: 950,
    image: img("photo-1743127671060-df0140e9edf0"),
    description: "Amethyst heals the mind and relieves stress and anxiety.",
    highlights: ["AAA Grade Amethyst", "Gift Box", "Daily Wear"]
  }),

  makeProduct({
    name: "Crystal Lotus – Feng Shui",
    category: "vastu",
    brand: "Vastu Living",
    price: 499, mrp: 899, rating: 4.5, ratingCount: 630,
    badge: "Bestseller",
    image: img("photo-1544592218-b546f7b9ddb4"),
    description: "Crystal Lotus attracts positive energy and romance in the house.",
    highlights: ["Clear Glass Crystal", "Sparkling cuts", "Centerpiece"]
  }),
  makeProduct({
    name: "Vastu Gomati Chakra (Set of 11)",
    category: "vastu",
    brand: "Vastu Living",
    price: 249, mrp: 399, rating: 4.4, ratingCount: 420,
    image: img("photo-1554020632-57ebe4b1933f"),
    description: "Natural Gomati Chakras for bringing wealth and prosperity.",
    highlights: ["100% Natural", "Kept in cash box", "Energised"]
  }),

  makeProduct({
    name: "Health & Wellness Astrology Report",
    category: "reports",
    brand: "Astro Wala Shop Reports",
    price: 299, mrp: 499, rating: 4.3, ratingCount: 310,
    image: img("photo-1736117703315-d3dc5582cfb7"),
    description: "Detailed medical astrology report highlighting prone health issues and remedies.",
    highlights: ["Vedic analysis", "Dietary suggestions", "PDF Delivery"],
    digital: true
  }),
  makeProduct({
    name: "Numerology Name Analysis Report",
    category: "reports",
    brand: "Astro Wala Shop Reports",
    price: 199, mrp: 399, rating: 4.5, ratingCount: 550,
    image: img("photo-1737317313282-02b0d8dddb7d"),
    description: "Check if your name vibration matches your birth date for success.",
    highlights: ["Chaldean Numerology", "Lucky numbers & colors", "PDF Delivery"],
    digital: true
  }),
];

export const getProductsByCategory = (categoryId) =>
  products.filter((p) => p.category === categoryId);

export const getProductById = (id) => products.find((p) => p.id === id);

export const searchProducts = (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
  );
};
