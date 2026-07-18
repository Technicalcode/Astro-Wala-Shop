import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { User, MapPin, Package, LogOut, Undo2, MessageSquare, Wallet } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { logout } from "../../store/authSlice";
import Editable from "../../components/editable/Editable";
import { backendUrl, fetchWithAuth, readApiResponse } from "../../config/api";
import { showErrorPopup, showInfoPopup } from "../../utils/notificationCenter";

const getReturnProductName = (returnRequest) =>
  returnRequest?.productSnapshot?.name || returnRequest?.product?.name || "this item";

const RETURN_STATUS_NOTICES = {
  approved: {
    title: "Return accepted",
    message: (name) => `${name} return request has been accepted successfully.`,
    type: "info",
  },
  pickup_scheduled: {
    title: "Return pickup scheduled",
    message: (name) => `Courier pickup has been scheduled for ${name}. Please keep the return item ready for the shipper.`,
    type: "info",
  },
  received: {
    title: "Return item received",
    message: (name) => `${name} has been received by the seller team. Refund processing will start soon.`,
    type: "info",
  },
  refunded: {
    title: "Refund processed",
    message: (name) => `${name} refund has been processed successfully.`,
    type: "info",
  },
  rejected: {
    title: "Return request rejected",
    message: (name, returnRequest) =>
      `${name} return request was rejected.${returnRequest.adminNote ? ` Reason: ${returnRequest.adminNote}` : ""}`,
    type: "error",
  },
};

export default function AccountLayout() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role === "admin") return undefined;

    let ignore = false;

    const checkReturnUpdates = async () => {
      try {
        const response = await fetchWithAuth(`${backendUrl}/api/v1/returns/my`);
        const data = await readApiResponse(response);
        if (!response.ok || ignore) return;

        (data.data || [])
          .filter((returnRequest) => RETURN_STATUS_NOTICES[returnRequest.status])
          .forEach((returnRequest) => {
            const noticeKey = `return-${returnRequest.status}-notice:${returnRequest._id || returnRequest.id}`;
            if (sessionStorage.getItem(noticeKey)) return;

            const notice = RETURN_STATUS_NOTICES[returnRequest.status];
            const productName = getReturnProductName(returnRequest);
            sessionStorage.setItem(noticeKey, "shown");

            if (notice.type === "error") {
              showErrorPopup(notice.message(productName, returnRequest), { title: notice.title });
            } else {
              showInfoPopup(notice.message(productName, returnRequest), { title: notice.title });
            }
          });
      } catch {
        // The shared API handler shows connection errors when needed.
      }
    };

    checkReturnUpdates();
    const interval = window.setInterval(checkReturnUpdates, 30000);
    window.addEventListener("focus", checkReturnUpdates);

    return () => {
      ignore = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", checkReturnUpdates);
    };
  }, [user]);

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
