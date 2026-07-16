import { useState, useEffect, useRef } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Sparkles, LogOut, Menu, X, Pencil, Home, FolderTree, Boxes, Tag, Star, Truck, Users, Activity, ImageIcon, FileText, MonitorSmartphone, Palette, TrendingUp, Eye, ChevronDown, Bell } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { getUserDisplayName, selectUser, logout } from "../../store/authSlice";
import { selectEditMode, toggleEditMode } from "../../store/editableStyleSlice";
import ColorEditPopover from "../../components/editable/ColorEditPopover";
import Editable from "../../components/editable/Editable";
import { backendUrl, getStoredAccessToken } from "../../config/api";

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

const NavGroup = ({ group, groupIdx, setSidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div key={groupIdx} className="mb-1">
      <div 
        className="flex items-center justify-between cursor-pointer group/title mb-2 ml-2 pr-2 py-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xs font-semibold text-white/70 uppercase tracking-widest group-hover/title:text-white transition-colors">
          {group.title}
        </h3>
        <ChevronDown 
          size={16} 
          className={`text-white/50 group-hover/title:text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>
      <div className={`flex flex-col gap-1.5 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'}`}>
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
                  : "text-white/70 hover:bg-white/10 hover:text-white"
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
  );
};

export default function AdminLayout() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const displayName = getUserDisplayName(user);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const editMode = useSelector(selectEditMode);

  // ── New User Notification State ──
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastUserCountRef = useRef(null);
  const lastUserIdsRef = useRef(null);
  const notifPanelRef = useRef(null);

  // Poll backend for new users every 30 seconds
  useEffect(() => {
    const checkNewUsers = async () => {
      try {
        const token = getStoredAccessToken();
        if (!token) return;
        const res = await fetch(`${backendUrl}/api/v1/admin/all-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const users = data.users || data.data || data || [];
        if (!Array.isArray(users)) return;

        const currentCount = users.length;
        const currentIds = new Set(users.map((u) => u._id || u.id));

        if (lastUserCountRef.current === null) {
          // First load — just save the baseline
          lastUserCountRef.current = currentCount;
          lastUserIdsRef.current = currentIds;
          return;
        }

        // Find newly joined users
        const newUsers = users.filter(
          (u) => !lastUserIdsRef.current.has(u._id || u.id)
        );

        if (newUsers.length > 0) {
          const newNotifs = newUsers.map((u) => ({
            id: Date.now() + Math.random(),
            name: u.name || u.fullName || "Someone",
            email: u.email || "",
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          }));
          setNotifications((prev) => [...newNotifs, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + newUsers.length);

          // Auto-dismiss toast after 5 seconds
          newNotifs.forEach((n) => {
            setTimeout(() => {
              setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, toastDone: true } : x));
            }, 5000);
          });
        }

        lastUserCountRef.current = currentCount;
        lastUserIdsRef.current = currentIds;
      } catch {}
    };

    checkNewUsers();
    const interval = setInterval(checkNewUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
          <NavGroup key={groupIdx} group={group} groupIdx={groupIdx} setSidebarOpen={setSidebarOpen} />
        ))}
      </Editable>

      {/* Sidebar Footer */}
      <Editable
        as="div"
        kind="button"
        id="admin-sidebar-footer"
        label="Admin Sidebar Footer Background"
        className="p-4 pb-8 border-t border-white/10"
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
    <div className="h-screen w-full flex bg-canvas overflow-hidden">
      {/* Desktop sidebar */}
      <Editable
        as="aside"
        kind="button"
        id="admin-sidebar-bg"
        label="Admin Sidebar Background"
        className="hidden md:flex w-64 bg-brand text-white flex-col shrink-0 border-r border-white/5 shadow-2xl relative z-30 sticky top-0 h-screen"
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
          <aside className="relative w-72 max-w-[80vw] bg-brand text-white flex flex-col h-full shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="relative z-10 flex flex-col h-full">
              {SidebarContent}
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
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
        <div className="sticky top-4 z-20 px-4 md:px-6 pb-2">
          <div
            className="flex flex-wrap items-center justify-between gap-3 bg-brand shadow-lg rounded-2xl px-6 py-3 border border-white/5"
          onDoubleClick={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${editMode ? 'bg-amber-900/40 text-amber-400' : 'bg-white/10 text-white/50'} transition-colors`}>
                <Pencil size={15} />
              </div>
              <span className={`text-sm font-bold ${editMode ? 'text-amber-400' : 'text-white/70'} transition-colors`}>Edit Mode</span>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={editMode}
                onChange={() => dispatch(toggleEditMode())}
                className="sr-only peer"
                aria-label="Toggle element color edit mode"
              />
              <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-amber-500 transition-all shadow-inner" />
              <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-all peer-checked:translate-x-5" />
            </label>
            
            {editMode && (
              <span className="text-xs font-medium text-amber-400/80 hidden md:inline-block ml-2 animate-pulse">
                Double-click highlighted elements to edit styles
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* ── Notification Bell ── */}
            <div className="relative" ref={notifPanelRef}>
              <button
                onClick={() => { setShowNotifPanel((p) => !p); setUnreadCount(0); }}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all shadow-sm hover:shadow-md active:scale-95"
                title="Notifications"
              >
                <Bell size={16} className="text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-lg">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifPanel && (
                <div className="absolute right-0 top-12 w-80 bg-[#1e2340] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-sm font-bold text-white">🔔 New Users</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
                      >Clear all</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-white/30 text-sm">No new users yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                            {(n.name[0] || "U").toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{n.name}</p>
                            <p className="text-xs text-white/40 truncate">{n.email}</p>
                          </div>
                          <span className="text-[10px] text-white/30 shrink-0 mt-0.5">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Editable
              as={Link}
              to="/"
              kind="button"
              id="admin-visit-store-btn"
              label="Visit Store Button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-white/10 border border-white/10 hover:bg-white/20 hover:text-amber-300 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Home size={15} />
              <Editable as="span" id="admin-visit-store-text" kind="button" label="Visit Store Text">
                Visit Store
              </Editable>
            </Editable>
          </div>

          {/* ── New User Toast Popup ── */}
          <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {notifications.filter((n) => !n.toastDone).slice(0, 3).map((n) => (
              <div
                key={n.id}
                className="pointer-events-auto flex items-center gap-3 bg-[#1e2340] border border-amber-400/30 rounded-2xl px-4 py-3 shadow-2xl animate-fade-in-up min-w-[260px]"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-white font-bold">
                  {(n.name[0] || "U").toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-amber-400 font-semibold">🎉 New User Joined!</p>
                  <p className="text-sm text-white font-bold truncate">{n.name}</p>
                  <p className="text-xs text-white/40 truncate">{n.email}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
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
