import { useEffect, useMemo, useState } from "react";
import { Search, ShieldAlert, ShieldCheck, Mail, Calendar, Users, Phone, Wallet, Link as LinkIcon } from "lucide-react";
import Editable from "../../components/editable/Editable";
import { backendUrl, fetchWithAuth, readApiResponse } from "../../config/api";

const getDisplayName = (user) => {
  const profile = user.profile || {};
  const profileName =
    profile.fullName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return profileName || user.email?.split("@")[0] || "User";
};

const normalizeUser = (user = {}) => ({
  id: user.id || user._id,
  name: getDisplayName(user),
  email: user.email || "",
  role: user.role || "user",
  joined: user.createdAt || new Date().toISOString(),
  status: user.isActive === false ? "blocked" : "active",
  orders: Number(user.ordersCount || user.orders || 0),
  isVerified: Boolean(user.isVerified),
  phoneNumber: user.profile?.phoneNumber || "",
  walletBalance: user.walletBalance || 0,
  totalReferrals: user.totalReferrals || 0,
  referralCode: user.referralCode || "",
});

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState("");
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/admin/all-users`);
      const data = await readApiResponse(res);

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers((data.users || []).map(normalizeUser));
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phoneNumber.toLowerCase().includes(query),
    );
  }, [searchTerm, users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);
  const showingStart = filteredUsers.length === 0 ? 0 : pageStart + 1;
  const showingEnd = Math.min(pageStart + PAGE_SIZE, filteredUsers.length);

  const toggleUserStatus = async (user) => {
    if (["admin", "superAdmin", "orderManager"].includes(user.role)) return;

    const shouldBlock = user.status === "active";
    const confirmed = confirm(
      shouldBlock
        ? `Block ${user.email}? They will not be able to log in.`
        : `Unblock ${user.email}?`,
    );

    if (!confirmed) return;

    setActionUserId(user.id);
    try {
      const res = await fetchWithAuth(
        `${backendUrl}/api/v1/admin/${shouldBlock ? "block" : "unblock"}/${user.id}`,
        { method: "PUT" },
      );
      const data = await readApiResponse(res);

      if (!res.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      const updatedUser = normalizeUser(data.user);
      setUsers((currentUsers) =>
        currentUsers.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setActionUserId("");
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Editable as="h1" id="admin-users-heading" kind="button" label="Users Heading" className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3">
              <Users size={36} className="text-amber-400" />
              User Management
            </Editable>
            <Editable as="p" id="admin-users-sub" kind="button" label="Users Subtext" className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed">
              View registered users, track their orders and wallet balances, and manage account access.
            </Editable>
          </div>

          <div className="shrink-0 relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none transition-colors group-focus-within:text-brand">
              <Search size={18} className="text-white/50 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm transition-all"
            />
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute top-10 right-20 w-20 h-20 bg-amber-400/20 blur-2xl rounded-full pointer-events-none"></div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 bg-white/50 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-brand shadow-inner">
            <Users size={20} />
          </div>
          <Editable
            as="h3"
            id="admin-users-card-heading"
            kind="button"
            label="Card Heading"
            className="font-semibold text-gray-900 text-xl"
          >
            Registered Users Directory
          </Editable>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="text-left bg-gray-50/50">
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">User Details</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Role & Status</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Orders</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Joined Date</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Wallet / Referrals</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <div className="w-12 h-12 border-4 border-indigo-100 border-t-brand rounded-full animate-spin mb-4"></div>
                       <p className="text-gray-500 font-medium">Loading users data...</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-red-600 font-medium bg-red-50/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert size={32} className="text-red-400" />
                      {error}
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
                      <Search size={36} />
                    </div>
                    <p className="text-gray-500 text-base font-medium">No users found matching your search.</p>
                  </td>
                </tr>
              )}

              {!loading && !error && paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-indigo-50/40 transition-colors group">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Editable as="span" group="admin-user-name" kind="button" label="User Name" className={`font-bold text-base truncate ${user.status === "blocked" ? "text-gray-400 line-through" : "text-gray-900 group-hover:text-brand transition-colors"}`}>
                          {user.name}
                        </Editable>
                        <span className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 truncate">
                          <Mail size={12} className="text-gray-400" /> {user.email}
                        </span>
                        {user.phoneNumber && (
                          <span className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 truncate">
                            <Phone size={12} className="text-gray-400" /> {user.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex flex-col items-start gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg capitalize border shadow-sm ${user.role === "admin" || user.role === "superAdmin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        {user.role}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border shadow-sm ${user.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 font-bold shadow-inner group-hover:bg-white group-hover:border-indigo-100 group-hover:text-brand transition-all">
                      {user.orders}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-sm text-gray-600 font-medium flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-fit group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                      <Calendar size={14} className="text-gray-400" /> {new Date(user.joined).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <Wallet size={14} className="text-emerald-500" /> ₹{user.walletBalance.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded w-fit border border-gray-100">
                        <Users size={12} className="text-blue-500" /> {user.totalReferrals} referred
                      </span>
                      {user.referralCode && (
                         <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                           <LinkIcon size={10} className="text-gray-400" /> {user.referralCode}
                         </span>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right">
                    {!["admin", "superAdmin", "orderManager"].includes(user.role) ? (
                      <button
                        onClick={() => toggleUserStatus(user)}
                        disabled={actionUserId === user.id}
                        className={`text-sm font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 w-fit ml-auto shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm ${
                          user.status === "active"
                            ? "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                            : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {user.status === "active" ? (
                          <><ShieldAlert size={16}/> {actionUserId === user.id ? "Blocking..." : "Block User"}</>
                        ) : (
                          <><ShieldCheck size={16}/> {actionUserId === user.id ? "Unblocking..." : "Unblock User"}</>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                        Admin protected
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-gray-500 font-medium">
              Showing {showingStart} to {showingEnd} of {filteredUsers.length} users
            </span>
            <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                Previous
              </button>
              <span className="font-medium text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm text-sm">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
