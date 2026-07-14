import { useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Sparkles, LogOut, Menu, X, Pencil, Home, FolderTree, Boxes, Tag, Star, Truck, Users, Activity, ImageIcon, FileText, MonitorSmartphone, Palette, TrendingUp, Eye } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { getUserDisplayName, selectUser, logout } from "../../store/authSlice";
import { selectEditMode, toggleEditMode } from "../../store/editableStyleSlice";
import ColorEditPopover from "../../components/editable/ColorEditPopover";
import Editable from "../../components/editable/Editable";

const navGroups = [
  {
    title: "Dashboard",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/admin/most-viewed", label: "Most Viewed", icon: TrendingUp },
    ]
  },
  {
    title: "Catalog",
    items: [
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/categories", label: "Categories", icon: FolderTree },
      { to: "/admin/inventory", label: "Inventory", icon: Boxes },
    ]
  },
  {
    title: "Sales & Marketing",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { to: "/admin/coupons", label: "Coupons", icon: Tag },
      { to: "/admin/returns", label: "Returns", icon: Truck },
    ]
  },
  {
    title: "Storefront",
    items: [
      { to: "/admin/theme", label: "Theme", icon: Palette },
      { to: "/admin/banners", label: "Banners", icon: ImageIcon },
      { to: "/admin/homepage", label: "Bestseller Category", icon: Home },
    ]
  },
  {
    title: "Audience",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/referrals", label: "Referrals", icon: Users },
      { to: "/admin/reviews", label: "Reviews", icon: Star },
    ]
  },
  {
    title: "System",
    items: [
      { to: "/admin/policies", label: "Policies", icon: FileText },
      { to: "/admin/audit-logs", label: "Audit Logs", icon: Activity },
      { to: "/admin/login-activity", label: "Login Activity", icon: MonitorSmartphone },
    ]
  }
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const displayName = getUserDisplayName(user);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const editMode = useSelector(selectEditMode);

  const SidebarContent = (
    <>
      {/* Sidebar Header */}
      <Editable
        as="div"
        kind="button"
        id="admin-sidebar-header"
        label="Admin Sidebar Header Background"
        className="p-5 border-b border-white/10 flex items-center justify-between"
      >
        <div>
          <Editable
            as="span"
            id="admin-sidebar-logo"
            kind="button"
            label="Admin Sidebar Logo Text"
            className="font-display font-bold text-xl italic flex items-center gap-1.5"
          >
            <Sparkles size={18} className="text-gold-light" /> Astro Wala Shop
          </Editable>
          <Editable
            as="p"
            id="admin-sidebar-subtitle"
            kind="button"
            label="Admin Sidebar Subtitle"
            className="text-xs text-white/60 mt-1"
          >
            Seller Dashboard
          </Editable>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/70">
          <X size={20} />
        </button>
      </Editable>

      {/* Nav Links */}
      <Editable
        as="nav"
        kind="button"
        id="admin-sidebar-nav"
        label="Admin Sidebar Nav Background"
        className="flex-1 px-4 py-6 flex flex-col gap-6 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 ml-2">
              {group.title}
            </h3>
            <div className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden ${
                      isActive 
                        ? "bg-white/10 text-white shadow-md border border-white/5" 
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-gradient-to-b from-amber-300 to-amber-500 rounded-r-md shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                      )}
                      <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-amber-400/20 text-amber-300 scale-110' : 'bg-transparent text-white/50 group-hover:text-amber-200 group-hover:scale-110'}`}>
                        <item.icon size={16} />
                      </div>
                      <Editable as="span" group="admin-nav-link" kind="button" label="Admin Nav Link Text" className="flex-1">
                        {item.label}
                      </Editable>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </Editable>

      {/* Sidebar Footer */}
      <Editable
        as="div"
        kind="button"
        id="admin-sidebar-footer"
        label="Admin Sidebar Footer Background"
        className="p-3 border-t border-white/10"
      >
        <Editable
          as="p"
          id="admin-sidebar-username"
          kind="button"
          label="Admin Username Text"
          className="text-xs text-white/50 px-3 mb-2"
        >
          {displayName}
        </Editable>
        <button
          onClick={() => { dispatch(logout()); navigate("/"); }}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-medium text-white/70 hover:bg-white/10 w-full"
        >
          <LogOut size={17} />
          <Editable as="span" id="admin-logout-text" kind="button" label="Logout Button Text">
            Logout
          </Editable>
        </button>
      </Editable>
    </>
  );

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Desktop sidebar */}
      <Editable
        as="aside"
        kind="button"
        id="admin-sidebar-bg"
        label="Admin Sidebar Background"
        className="hidden md:flex w-64 bg-gradient-to-b from-brand-dark via-indigo-950 to-slate-900 text-white flex-col shrink-0 border-r border-white/5 shadow-2xl relative z-30"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10 flex flex-col h-full">
          {SidebarContent}
        </div>
      </Editable>

      {/* Mobile drawer sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[80vw] bg-gradient-to-b from-brand-dark via-indigo-950 to-slate-900 text-white flex flex-col h-full shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="relative z-10 flex flex-col h-full">
              {SidebarContent}
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <Editable
          as="div"
          kind="button"
          id="admin-mobile-topbar"
          label="Admin Mobile Top Bar Background"
          className="md:hidden bg-brand-dark text-white flex items-center justify-between px-4 py-3 sticky top-0 z-30"
        >
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <Editable
            as="span"
            id="admin-mobile-logo"
            kind="button"
            label="Admin Mobile Logo Text"
            className="font-display font-bold text-lg italic flex items-center gap-1.5"
          >
            <Sparkles size={16} className="text-gold-light" /> Astro Wala Shop
          </Editable>
          <span className="w-6" />
        </Editable>

        {/* ── Edit Mode Toggle ── */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_12px_-10px_rgba(0,0,0,0.1)] px-5 py-3 sticky top-0 z-20"
          onDoubleClick={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${editMode ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'} transition-colors`}>
                <Pencil size={15} />
              </div>
              <span className={`text-sm font-bold ${editMode ? 'text-amber-700' : 'text-gray-600'} transition-colors`}>Edit Mode</span>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={editMode}
                onChange={() => dispatch(toggleEditMode())}
                className="sr-only peer"
                aria-label="Toggle element color edit mode"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-amber-500 transition-all shadow-inner" />
              <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-md transition-all peer-checked:translate-x-5" />
            </label>
            
            {editMode && (
              <span className="text-xs font-medium text-amber-600/80 hidden md:inline-block ml-2 animate-pulse">
                Double-click highlighted elements to edit styles
              </span>
            )}
          </div>
          
          <Editable
            as={Link}
            to="/"
            kind="button"
            id="admin-visit-store-btn"
            label="Visit Store Button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:border-brand hover:text-brand transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Home size={15} />
            <Editable as="span" id="admin-visit-store-text" kind="button" label="Visit Store Text">
              Visit Store
            </Editable>
          </Editable>
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Shared color edit popover — works across all admin pages */}
      <ColorEditPopover />
    </div>
  );
}
