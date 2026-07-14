import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Wallet,
  MessageCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../store/authSlice";
import {
  fetchReferralStats,
  selectMyCode,
  selectMyReferralCount,
  selectMyWalletCredit,
  REWARD_PER_REFERRAL,
  NEW_USER_DISCOUNT,
} from "../store/referralSlice";
import Editable from "../components/editable/Editable";
import { useEffect } from "react";

export default function Referral() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const myCode = useSelector(selectMyCode);
  const myReferralCount = useSelector(selectMyReferralCount);
  const myWalletCredit = useSelector(selectMyWalletCredit);
  const rewardPerReferral = REWARD_PER_REFERRAL;
  const newUserDiscount = NEW_USER_DISCOUNT;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchReferralStats());
    }
  }, [dispatch, user]);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://astrowala.shop";
  const shareMessage = myCode
    ? `🔮 Hey! Use my Astro Wala Shop referral code *${myCode}* and get ₹${newUserDiscount} off your first order! ✨\n\nShop here: ${siteUrl}/signup?ref=${myCode}`
    : "";

  const handleCopy = () => {
    if (!myCode) return;
    navigator.clipboard?.writeText(myCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsappShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ── Logged-out state ── */
  if (!user) {
    return (
      <Editable
        as="div"
        kind="button"
        id="referral-loggedout-card"
        label="Refer & Earn — Logged Out Card"
        className="max-w-lg mx-auto bg-white rounded-md shadow-card p-8 text-center mt-6"
      >
        <Gift size={40} className="mx-auto text-brand mb-3" />
        <Editable
          as="h1"
          id="referral-loggedout-heading"
          label="Refer & Earn Heading (logged out)"
          className="font-display font-semibold text-xl text-gray-900 mb-2"
        >
          Refer &amp; Earn
        </Editable>
        <Editable
          as="p"
          id="referral-loggedout-desc"
          label="Refer & Earn Description (logged out)"
          className="text-sm text-gray-500 mb-5"
        >
          Log in to get your personal referral code and start earning rewards.
        </Editable>
        <Editable
          as={Link}
          to="/login"
          kind="button"
          id="referral-loggedout-btn"
          label="Login to Continue Button"
          className="inline-block bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm hover:bg-brand-dark transition-colors"
        >
          Login to Continue
        </Editable>
      </Editable>
    );
  }

  /* ── Logged-in state ── */
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">

      {/* ── Hero Banner ── */}
      <Editable
        as="div"
        kind="button"
        id="referral-hero-bg"
        label="Referral Hero Banner Background"
        className="bg-gradient-to-r from-brand to-brand-light rounded-md shadow-card p-6 sm:p-8 text-white text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-constellation opacity-50" />
        <div className="relative">
          <Gift size={36} className="mx-auto mb-3 text-gold-light" />
          <Editable
            as="h1"
            id="referral-hero-heading"
            label="Referral Hero Heading"
            className="font-display font-bold text-2xl sm:text-3xl mb-2"
          >
            Refer Friends, Earn Rewards
          </Editable>
          <Editable
            as="p"
            id="referral-hero-desc"
            label="Referral Hero Description"
            className="text-sm text-white/85 max-w-md mx-auto"
          >
            Give ₹{newUserDiscount} off to your friends, get ₹{rewardPerReferral} wallet
            credit for yourself — every single time.
          </Editable>
        </div>
      </Editable>

      {/* ── Referral Code Box ── */}
      <Editable
        as="div"
        kind="button"
        id="referral-code-card"
        label="Referral Code Card Background"
        className="bg-white rounded-md shadow-card p-5 sm:p-6"
      >
        <Editable
          as="p"
          id="referral-code-label"
          label="Referral Code Label"
          className="text-xs text-gray-500 mb-2"
        >
          Your unique referral code
        </Editable>
        <div className="flex flex-wrap items-center gap-3">
          <Editable
            as="div"
            kind="button"
            id="referral-code-box"
            label="Referral Code Box Background"
            className="flex-1 min-w-[180px] border-2 border-dashed border-brand/40 rounded-md px-4 py-3 bg-brand/5 text-center"
          >
            <Editable
              as="span"
              id="referral-code-text"
              label="Referral Code Text"
              className="font-display font-bold text-xl tracking-wider text-brand"
            >
              {myCode}
            </Editable>
          </Editable>

          <Editable
            as="button"
            kind="button"
            id="referral-copy-btn"
            label="Copy Code Button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-3 rounded-md transition-colors"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Code"}
          </Editable>

          <Editable
            as="button"
            kind="button"
            id="referral-whatsapp-btn"
            label="Share on WhatsApp Button"
            onClick={handleWhatsappShare}
            className="flex items-center gap-1.5 bg-[#25D366] hover:opacity-90 text-white text-sm font-medium px-4 py-3 rounded-md transition-opacity"
          >
            <MessageCircle size={16} />
            Share on WhatsApp
          </Editable>
        </div>
      </Editable>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Friends referred */}
        <Editable
          as="div"
          kind="button"
          id="referral-friends-card"
          label="Friends Referred Card Background"
          className="bg-white rounded-md shadow-card p-5 flex items-center gap-3"
        >
          <Editable
            as="div"
            kind="button"
            id="referral-friends-icon-bg"
            label="Friends Icon Background"
            className="h-11 w-11 rounded-full bg-brand/10 flex items-center justify-center shrink-0"
          >
            <Users size={20} className="text-brand" />
          </Editable>
          <div>
            <Editable
              as="p"
              id="referral-friends-count"
              label="Friends Referred Count"
              className="text-2xl font-display font-bold text-gray-900"
            >
              {myReferralCount}
            </Editable>
            <Editable
              as="p"
              id="referral-friends-label"
              label="Friends Referred Label"
              className="text-xs text-gray-500"
            >
              Friends referred
            </Editable>
          </div>
        </Editable>

        {/* Wallet credit */}
        <Editable
          as="div"
          kind="button"
          id="referral-wallet-card"
          label="Wallet Credit Card Background"
          className="bg-white rounded-md shadow-card p-5 flex items-center gap-3"
        >
          <Editable
            as="div"
            kind="button"
            id="referral-wallet-icon-bg"
            label="Wallet Icon Background"
            className="h-11 w-11 rounded-full bg-gold/10 flex items-center justify-center shrink-0"
          >
            <Wallet size={20} className="text-gold-dark" />
          </Editable>
          <div>
            <Editable
              as="p"
              id="referral-wallet-amount"
              label="Wallet Credit Amount"
              className="text-2xl font-display font-bold text-gray-900"
            >
              ₹{myWalletCredit}
            </Editable>
            <Editable
              as="p"
              id="referral-wallet-label"
              label="Wallet Credit Label"
              className="text-xs text-gray-500"
            >
              Wallet credit earned
            </Editable>
          </div>
        </Editable>
      </div>

      {/* ── How It Works ── */}
      <Editable
        as="div"
        kind="button"
        id="referral-how-card"
        label="How It Works Card Background"
        className="bg-white rounded-md shadow-card p-5 sm:p-6"
      >
        <Editable
          as="h2"
          id="referral-how-heading"
          label="How It Works Heading"
          className="font-display font-semibold text-lg text-gray-900 mb-4"
        >
          How it works
        </Editable>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              icon: <Share2 size={18} />,
              title: "Share your code",
              desc: "Send your referral code to friends and family via WhatsApp or any app.",
              iconKey: "referral-step1-icon",
              titleKey: "referral-step-title",
              descKey: "referral-step-desc",
            },
            {
              icon: <Gift size={18} />,
              title: "They get ₹150 off",
              desc: "Your friend enters your code at signup and gets an instant discount.",
              iconKey: "referral-step2-icon",
              titleKey: "referral-step-title",
              descKey: "referral-step-desc",
            },
            {
              icon: <Wallet size={18} />,
              title: "You earn ₹100",
              desc: "Once they place their first order, ₹100 is credited to your wallet.",
              iconKey: "referral-step3-icon",
              titleKey: "referral-step-title",
              descKey: "referral-step-desc",
            },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-start gap-2">
              <Editable
                as="div"
                kind="button"
                id={step.iconKey}
                label={`Step ${i + 1} Icon Background`}
                className="h-9 w-9 rounded-full bg-brand text-white flex items-center justify-center"
              >
                {step.icon}
              </Editable>
              <Editable
                as="p"
                group="referral-step-title"
                label="Step Title"
                className="font-semibold text-sm text-gray-900"
              >
                {step.title}
              </Editable>
              <Editable
                as="p"
                group="referral-step-desc"
                label="Step Description"
                className="text-xs text-gray-500 leading-relaxed"
              >
                {step.desc}
              </Editable>
            </div>
          ))}
        </div>
      </Editable>

      {/* ── Footer note ── */}
      <Editable
        as="p"
        id="referral-footer-note"
        label="Referral Footer Note"
        className="text-[11px] text-gray-400 text-center pb-2"
      >
        Wallet credit is applied automatically at your next checkout. Terms and conditions apply.
      </Editable>
    </div>
  );
}
