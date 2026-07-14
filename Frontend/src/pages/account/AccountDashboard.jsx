import { useSelector, useDispatch } from "react-redux";
import { getUserDisplayName, selectUser } from "../../store/authSlice";
import { fetchReferralStats, selectWalletBalance } from "../../store/referralSlice";
import { useEffect } from "react";
import Editable from "../../components/editable/Editable";
import { Link } from "react-router-dom";
import { Sparkles, User as UserIcon, MapPin, Package, Wallet, ArrowRight } from "lucide-react";

export default function AccountDashboard() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const displayName = getUserDisplayName(user);
  const walletBalance = useSelector(selectWalletBalance);

  useEffect(() => {
    if (user) {
      dispatch(fetchReferralStats());
    }
  }, [dispatch, user]);

  return (
    <div className="flex flex-col gap-6">
      <Editable as="div" id="acc-dash-heading-wrapper" label="Dashboard Heading Wrapper" className="flex items-center gap-3 bg-gradient-to-r from-brand-dark to-brand p-6 rounded-2xl shadow-md text-white">
        <div className="p-3 bg-white/10 rounded-full">
          <Sparkles className="text-gold-light" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">
            Welcome back, {displayName}!
          </h1>
          <p className="text-white/80 text-sm mt-1">Manage your orders, profile, and wallet easily.</p>
        </div>
      </Editable>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Profile Card */}
        <Editable as="div" kind="button" id="acc-dash-profile-card" label="Dashboard Profile Card" className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <UserIcon size={20} />
              </div>
              <h3 className="font-display font-semibold text-gray-900 text-lg">Profile Details</h3>
            </div>
            <p className="text-sm text-gray-600 mb-1"><strong className="font-medium text-gray-800">Name:</strong> {displayName}</p>
            <p className="text-sm text-gray-600 mb-4"><strong className="font-medium text-gray-800">Email:</strong> {user?.email}</p>
          </div>
          <Link to="/account/profile" className="inline-flex items-center gap-2 text-sm text-brand font-semibold group-hover:text-brand-dark transition-colors w-fit">
            Edit Profile <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </Editable>

        {/* Addresses Card */}
        <Editable as="div" kind="button" id="acc-dash-address-card" label="Dashboard Address Card" className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <MapPin size={20} />
              </div>
              <h3 className="font-display font-semibold text-gray-900 text-lg">Saved Addresses</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              You have <strong className="text-gray-900">{user?.addresses?.length || 0}</strong> saved address(es) for quick checkout.
            </p>
          </div>
          <Link to="/account/addresses" className="inline-flex items-center gap-2 text-sm text-brand font-semibold group-hover:text-brand-dark transition-colors w-fit">
            Manage Addresses <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </Editable>

        {/* Orders Card */}
        <Editable as="div" kind="button" id="acc-dash-orders-card" label="Dashboard Orders Card" className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Package size={20} />
              </div>
              <h3 className="font-display font-semibold text-gray-900 text-lg">Recent Orders</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              View your order history, track recent shipments, and manage returns.
            </p>
          </div>
          <Link to="/account/orders" className="inline-flex items-center gap-2 text-sm text-brand font-semibold group-hover:text-brand-dark transition-colors w-fit">
            View My Orders <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </Editable>

        {/* Wallet Balance Card */}
        <Editable as="div" kind="button" id="acc-dash-wallet-card" label="Dashboard Wallet Card" className="bg-gradient-to-br from-brand-dark to-[#1a1120] p-6 rounded-xl shadow-md border border-gold-light/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gold-light/20 text-gold-light rounded-lg backdrop-blur-sm">
                <Wallet size={20} />
              </div>
              <h3 className="font-display font-semibold text-white text-lg">My Wallet Balance</h3>
            </div>
            <p className="text-3xl font-display font-bold text-gold-light mb-2">₹{walletBalance}</p>
            <p className="text-sm text-white/70 mb-4 leading-relaxed max-w-[85%]">
              Earned from referrals. Automatically applied to your next order.
            </p>
          </div>
          <Link to="/refer-and-earn" className="relative z-10 inline-flex items-center gap-2 text-sm text-gold-light font-semibold group-hover:text-white transition-colors w-fit bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            Refer & Earn More <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </Editable>
      </div>
    </div>
  );
}
