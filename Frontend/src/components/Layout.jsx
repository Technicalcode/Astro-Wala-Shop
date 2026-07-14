import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AdminColorPicker from "./AdminColorPicker";
import AskAstroBot from "./AskAstroBot";
import FomoNotification from "./FomoNotification";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-site-theme">
      <AdminColorPicker />
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4">
        <Outlet />
      </main>
      <Footer />
      <AskAstroBot />
      <FomoNotification />
    </div>
  );
}
