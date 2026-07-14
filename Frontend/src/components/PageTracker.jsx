import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { backendUrl } from "../config/api";

const getPageNameFromPath = (pathname) => {
  if (pathname === "/") return "Home Page";
  if (pathname === "/shop") return "Shop Page";
  if (pathname === "/cart") return "Cart Page";
  if (pathname === "/about") return "About Us Page";
  if (pathname === "/contact") return "Contact Page";
  if (pathname.startsWith("/product/")) return "Product Detail Page";
  if (pathname.startsWith("/category/")) return "Category Page";
  if (pathname === "/login") return "Login Page";
  if (pathname === "/register") return "Register Page";
  if (pathname.startsWith("/user")) return "User Dashboard";
  if (pathname.startsWith("/admin")) return "Admin Panel";
  
  // fallback for generic names
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + " Page";
  }
  return "Unknown Page";
};

export default function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    // Only track non-admin pages to keep data focused on actual customers
    if (location.pathname.startsWith("/admin")) return;

    const path = location.pathname;
    const name = getPageNameFromPath(path);

    // Track Page View
    fetch(`${backendUrl}/api/v1/analytics/track-page`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path, name }),
    }).catch(() => {});

    // Track Visitor Daily Traffic
    const today = new Date().toISOString().split("T")[0];
    const lastVisitDate = localStorage.getItem("lastVisitDate");

    if (lastVisitDate !== today) {
      // User hasn't been counted today
      const isReturning = !!localStorage.getItem("deviceId");
      
      if (!isReturning) {
        // Generate a random ID for new visitors
        localStorage.setItem("deviceId", Math.random().toString(36).substring(2) + Date.now().toString(36));
      }

      fetch(`${backendUrl}/api/v1/analytics/track-visitor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: isReturning ? "returning" : "new" }),
      }).then((res) => {
        if (res.ok) {
          localStorage.setItem("lastVisitDate", today);
        }
      }).catch(() => {});
    }

  }, [location]);

  return null;
}
