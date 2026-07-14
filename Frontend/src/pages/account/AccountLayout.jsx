import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { User, MapPin, Package, LogOut, Undo2, MessageSquare, Wallet } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import Editable from "../../components/editable/Editable";

export default function AccountLayout() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/account", end: true, icon: User },
    { name: "My Orders", path: "/account/orders", icon: Package },
    { name: "My Returns", path: "/account/returns", icon: Undo2 },
    { name: "My Reviews", path: "/account/reviews", icon: MessageSquare },
    { name: "Manage Addresses", path: "/account/addresses", icon: MapPin },
    { name: "Refer & Earn", path: "/refer-and-earn", icon: Wallet },
    { name: "Profile Settings", path: "/account/profile", icon: User },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      {user?.role !== "admin" && (
        <Editable
          as="aside"
          kind="button"
          id="account-sidebar-bg"
          label="Account Sidebar Background"
          className="w-full md:w-64 shrink-0 h-fit"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <Editable
              as="div"
              id="account-sidebar-header"
              label="Account Sidebar Header"
              className="p-5 bg-gradient-to-r from-brand-dark to-brand text-white border-b border-brand-dark/20"
            >
              <h2 className="font-display font-semibold text-lg tracking-wide">My Account</h2>
            </Editable>

            <nav className="flex flex-col p-3 gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? "text-brand bg-brand/10 font-semibold shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <item.icon size={18} className="shrink-0" />
                  {item.name}
                </NavLink>
              ))}

              <div className="my-2 border-t border-gray-100"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
              >
                <LogOut size={18} className="text-red-500" />
                Logout
              </button>
            </nav>
          </div>
        </Editable>
      )}

      {/* Main Content Area */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
