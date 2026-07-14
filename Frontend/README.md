# AstroMart 🔮 — Flipkart-style Astrology E-Commerce (React)

A frontend-only e-commerce demo built with **React + Vite + Tailwind CSS + React Router**, styled in
Flipkart's familiar blue/yellow layout but selling astrology products: gemstones, rudraksha, yantras,
pooja samagri, chakra bracelets, vastu items, kundli reports, and live astrologer consultations.

All data is mock data living in `src/data/`. There is **no backend** — cart, login, orders and the
seller dashboard all persist to your browser's `localStorage`, so it survives a page refresh but is
local to your machine only.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To create a production build:

```bash
npm run build
npm run preview
```

## What's inside

- **Home** — hero banner carousel, a "Today's Panchang" strip with a quick zodiac horoscope picker,
  category grid, and horizontally-scrolling product rails per category.
- **Category / Listing pages** — sidebar filters (price, rating, brand) + sort.
- **Product detail** — image gallery, pricing with discount %, highlights, Add to Cart / Buy Now.
- **Cart & Checkout** — quantity controls, price breakdown, 2-step checkout (address → payment),
  order confirmation screen.
- **Astrologer consultations** — browse astrologers by specialization, view profile, pick a duration
  and slot, and "book" a live session (saved to your order history).
- **Login / Signup** — customer accounts stored in `localStorage` (plain demo auth, not secure —
  do not reuse a real password).
- **My Orders** — order history for the logged-in customer, including booked consultations.
- **Seller Dashboard** (`/seller-login`) — overview stats, full product CRUD (add/edit/delete — these
  changes show up live on the storefront), and order status management.

### Demo seller login

```
Email:    seller@astromart.in
Password: seller123
```
(Pre-filled on the `/seller-login` page — just click "Login to Dashboard".)

## Project structure

```
src/
  data/        -> mock products, astrologers, categories, panchang
  context/     -> CartContext, AuthContext, OrdersContext, ProductsContext
  components/  -> Navbar, Footer, ProductCard, BannerCarousel, PanchangStrip, ...
  pages/       -> Home, ProductListing, ProductDetail, Cart, Checkout, Orders, ...
  pages/admin/ -> AdminLayout, AdminDashboard, AdminProducts, AdminOrders
```

## Extending this into a real store

This is a UI/UX demo. To make it production-ready you'd want to add:
- A real backend (Node/Express, Django, etc.) + database for products, users, and orders
- Real authentication (hashed passwords, sessions/JWT) instead of localStorage
- A payment gateway (Razorpay/Stripe) instead of the mock checkout
- Image uploads instead of placeholder image URLs
- Real-time astrologer availability and a calling/chat integration for consultations

Happy to help build any of these out next -- just ask.
