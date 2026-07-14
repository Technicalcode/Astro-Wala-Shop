const avatar = (label, bg) =>
  `https://placehold.co/80x80/${bg}/FFFFFF?text=${encodeURIComponent(label)}&font=poppins`;

export const testimonials = [
  {
    id: 1,
    name: "Anita Verma",
    location: "Lucknow, UP",
    rating: 5,
    avatar: avatar("AV", "6B1E3C"),
    text: "Ordered a Blue Sapphire for my husband — the lab certificate matched exactly and delivery was quick. Genuinely felt like a trustworthy purchase.",
  },
  {
    id: 2,
    name: "Rohit Sharma",
    location: "Pune, MH",
    rating: 5,
    avatar: avatar("RS", "1A4B8C"),
    text: "Booked a session with Pandit Raghunath ji for career guidance. He was precise and the call connected right on time. Will book again.",
  },
  {
    id: 3,
    name: "Sneha Iyer",
    location: "Chennai, TN",
    rating: 4,
    avatar: avatar("SI", "A8782E"),
    text: "The Diwali pooja kit had everything we needed, no last-minute shopping. The printed vidhi booklet was a nice touch for first-timers like us.",
  },
  {
    id: 4,
    name: "Karan Mehta",
    location: "Ahmedabad, GJ",
    rating: 5,
    avatar: avatar("KM", "2E6B5C"),
    text: "Got my Kundli Matching report within a few hours of ordering. Detailed and easy to understand, helped settle a lot of family questions.",
  },
];
