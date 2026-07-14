import { useState, useEffect } from "react";
import { fetchWithAuth, backendUrl, readApiResponse } from "../../config/api";
import { Users, Wallet, CheckCircle, Save, Percent, Gift, Search, Trash2 } from "lucide-react";
import { showErrorPopup, showInfoPopup } from "../../utils/notificationCenter";
import PageLoadingState from "../../components/PageLoadingState";

export default function AdminReferrals() {
  const [stats, setStats] = useState({ totalSignupsViaReferral: 0, totalWalletCreditGiven: 0 });
  const [settings, setSettings] = useState({ signupDiscountType: 'fixed', signupDiscountAmount: 150, referrerRewardAmount: 100 });
  const [details, setDetails] = useState({ referrers: [], discountUsers: [] });
  const [referrerSearch, setReferrerSearch] = useState("");
  const [discountSearch, setDiscountSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, settingsRes, detailsRes] = await Promise.all([
        fetchWithAuth(`${backendUrl}/api/v1/referral/admin/stats`),
        fetchWithAuth(`${backendUrl}/api/v1/referral/admin/settings`),
        fetchWithAuth(`${backendUrl}/api/v1/referral/admin/details`),
      ]);
      const statsData = await readApiResponse(statsRes);
      const settingsData = await readApiResponse(settingsRes);
      const detailsData = await readApiResponse(detailsRes);
      
      if (statsData.success) {
        setStats(statsData.stats);
      }
      if (settingsData.success) {
        setSettings(settingsData.settings);
      }
      if (detailsData.success) {
        setDetails({ referrers: detailsData.referrers, discountUsers: detailsData.discountUsers });
      }
    } catch (error) {
      console.error("Failed to fetch referral data", error);
      showErrorPopup(error, { title: "Failed to load referral data" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/referral/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = await readApiResponse(res);
      if (data.success) {
        showInfoPopup("Referral settings updated successfully!");
        setSettings(data.settings);
      } else {
        showErrorPopup(data.message || "Failed to update settings");
      }
    } catch (error) {
      console.error(error);
      showErrorPopup(error, { title: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReferrer = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this referrer record (resets to 0)?")) return;
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/referral/admin/referrer/${userId}`, { method: "DELETE" });
      const data = await readApiResponse(res);
      if (data.success) {
        showInfoPopup("Referrer record deleted");
        fetchData();
      } else {
        showErrorPopup(data.message || "Failed to delete");
      }
    } catch (error) {
      showErrorPopup(error, { title: "Error deleting referrer" });
    }
  };

  const handleDeleteDiscountUser = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this discount record?")) return;
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/referral/admin/discount/${couponId}`, { method: "DELETE" });
      const data = await readApiResponse(res);
      if (data.success) {
        showInfoPopup("Discount record deleted");
        fetchData();
      } else {
        showErrorPopup(data.message || "Failed to delete");
      }
    } catch (error) {
      showErrorPopup(error, { title: "Error deleting discount record" });
    }
  };

  if (loading) return <PageLoadingState label="Loading Referral Dashboard..." />;

  const filteredReferrers = details.referrers.filter(r => 
    r.name.toLowerCase().includes(referrerSearch.toLowerCase()) || 
    r.email.toLowerCase().includes(referrerSearch.toLowerCase())
  );

  const filteredDiscountUsers = details.discountUsers.filter(d => 
    d.name.toLowerCase().includes(discountSearch.toLowerCase()) || 
    d.email.toLowerCase().includes(discountSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-full">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3">
              Referrals & Rewards
            </h1>
            <p className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed">
              Manage your referral program, configure rewards, and track successful signups.
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-6 relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
              <Users size={28} className="drop-shadow-sm" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Signups via Referral</p>
              <p className="text-4xl font-black text-gray-900 tracking-tight">{stats.totalSignupsViaReferral}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-6 relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
              <Wallet size={28} className="drop-shadow-sm" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Wallet Credit Distributed</p>
              <p className="text-4xl font-black text-gray-900 tracking-tight">₹{stats.totalWalletCreditGiven}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle size={22} className="text-brand" /> Referral Configuration
          </h2>
        </div>
        <div className="p-6 md:p-8">
          <div className="max-w-2xl flex flex-col gap-8">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 relative group transition-colors hover:border-brand/30 hover:bg-brand/5">
              <div className="absolute top-5 right-5 text-gray-300 group-hover:text-brand/20 transition-colors">
                <Percent size={40} />
              </div>
              <label className="block text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                New User Signup Discount ({settings.signupDiscountType === 'percentage' ? '%' : '₹'})
              </label>
              <p className="text-sm text-gray-500 mb-4 pr-12">The discount given to a new user when they sign up using a referral link.</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md relative z-10">
                <select
                  value={settings.signupDiscountType || 'fixed'}
                  onChange={(e) => setSettings({ ...settings, signupDiscountType: e.target.value })}
                  className="w-full sm:w-1/3 border border-gray-200 text-sm font-medium rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white shadow-sm outline-none transition-all cursor-pointer"
                >
                  <option value="fixed">Fixed (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                <input 
                  type="number"
                  min="0"
                  value={settings.signupDiscountAmount}
                  onChange={(e) => setSettings({ ...settings, signupDiscountAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full sm:w-2/3 border border-gray-200 text-sm font-medium rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white shadow-sm outline-none transition-all"
                  placeholder={settings.signupDiscountType === 'percentage' ? "E.g. 10 for 10%" : "E.g. 150 for ₹150"}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 relative group transition-colors hover:border-brand/30 hover:bg-brand/5">
              <div className="absolute top-5 right-5 text-gray-300 group-hover:text-brand/20 transition-colors">
                <Gift size={40} />
              </div>
              <label className="block text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                Referrer Wallet Reward (₹)
              </label>
              <p className="text-sm text-gray-500 mb-4 pr-12">The wallet credit amount given to the person who shared the link, ONLY after the new user places their first order.</p>
              <div className="relative z-10 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">₹</span>
                </div>
                <input 
                  type="number"
                  min="0"
                  value={settings.referrerRewardAmount}
                  onChange={(e) => setSettings({ ...settings, referrerRewardAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full border border-gray-200 text-sm font-medium rounded-xl pl-8 pr-4 py-3 focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white shadow-sm outline-none transition-all"
                  placeholder="E.g. 100"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-brand text-white font-bold px-8 py-3.5 rounded-xl hover:bg-brand/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 self-start mt-2 w-full sm:w-auto"
            >
              {saving ? "Saving..." : <><Save size={18} /> Save Settings</>}
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Top Referrers */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 shrink-0">
              <Users size={18} className="text-blue-600" /> Referrers & Earners
            </h3>
            <div className="relative w-full sm:w-auto group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none transition-colors group-focus-within:text-brand">
                <Search size={16} className="text-gray-400 group-focus-within:text-brand transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search name/email..." 
                value={referrerSearch}
                onChange={(e) => setReferrerSearch(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block w-full pl-10 p-2 transition-all outline-none shadow-sm hover:border-gray-300 sm:w-56"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-3 px-5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">User Name</th>
                  <th className="py-3 px-5 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-center">Referrals</th>
                  <th className="py-3 px-5 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-right">Earned (₹)</th>
                  <th className="py-3 px-5 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReferrers.length === 0 ? (
                  <tr><td colSpan="4" className="py-12 text-center text-gray-500 font-medium">No referrers found</td></tr>
                ) : (
                  filteredReferrers.map((user, idx) => (
                    <tr key={idx} className="group transition-all duration-200 hover:bg-blue-50/40">
                      <td className="py-3 px-5">
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        <p className="text-[10px] text-blue-600 font-mono mt-1 font-bold bg-blue-50 inline-block px-1.5 py-0.5 rounded">Code: {user.referralCode}</p>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex justify-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                            {user.totalReferrals}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right font-black text-emerald-600 text-base">₹{user.totalEarned}</td>
                      <td className="py-3 px-5 text-right">
                        <button 
                          onClick={() => handleDeleteReferrer(user.userId)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors inline-flex opacity-0 group-hover:opacity-100"
                          title="Delete Referrer Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discount Users */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 shrink-0">
              <Percent size={18} className="text-purple-600" /> Users who used Discount
            </h3>
            <div className="relative w-full sm:w-auto group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none transition-colors group-focus-within:text-brand">
                <Search size={16} className="text-gray-400 group-focus-within:text-brand transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search name/email..." 
                value={discountSearch}
                onChange={(e) => setDiscountSearch(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block w-full pl-10 p-2 transition-all outline-none shadow-sm hover:border-gray-300 sm:w-56"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-3 px-5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">User Name</th>
                  <th className="py-3 px-5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Date Used</th>
                  <th className="py-3 px-5 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-right">Discount (₹)</th>
                  <th className="py-3 px-5 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDiscountUsers.length === 0 ? (
                  <tr><td colSpan="4" className="py-12 text-center text-gray-500 font-medium">No discounts found</td></tr>
                ) : (
                  filteredDiscountUsers.map((user, idx) => (
                    <tr key={idx} className="group transition-all duration-200 hover:bg-purple-50/40">
                      <td className="py-3 px-5">
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        <p className="text-[10px] text-purple-600 font-mono mt-1 font-bold bg-purple-50 inline-block px-1.5 py-0.5 rounded">Coupon: {user.couponCode}</p>
                      </td>
                      <td className="py-3 px-5 text-gray-600 font-medium text-xs">
                        {new Date(user.usedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-5 text-right font-black text-purple-600 text-base">₹{user.discountAmount}</td>
                      <td className="py-3 px-5 text-right">
                        <button 
                          onClick={() => handleDeleteDiscountUser(user.couponId)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors inline-flex opacity-0 group-hover:opacity-100"
                          title="Delete Discount Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
