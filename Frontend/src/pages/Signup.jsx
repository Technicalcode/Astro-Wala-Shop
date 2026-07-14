import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LoaderCircle, Sparkles, Gift } from "lucide-react";
import { useDispatch } from "react-redux";
import { signup } from "../store/authSlice";
import { NEW_USER_DISCOUNT } from "../store/referralSlice";
import Editable from "../components/editable/Editable";
import { showErrorPopup } from "../utils/notificationCenter";

export default function Signup() {
  const dispatch = useDispatch();
  const newUserDiscount = NEW_USER_DISCOUNT;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: "",
    password: "",
    referralCode: searchParams.get("ref") || "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await dispatch(signup(form));
      if (!res.ok) {
        setError(res.error);
        showErrorPopup(res.error, {
          title: "Account could not be created",
          details: `Email: ${form.email}`,
        });
        return;
      }
      navigate("/login"); // After signup, redirect to login
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center py-8">
      <div className="bg-white rounded-md shadow-card overflow-hidden flex max-w-3xl w-full">
        <Editable
          as="div"
          kind="button"
          id="signup-panel-bg"
          label="Signup Side Panel Background"
          className="bg-brand text-white p-8 w-72 hidden md:flex flex-col"
        >
          <Editable
            as="span"
            id="signup-panel-logo"
            label="Signup Panel Logo Text"
            className="font-display font-bold text-2xl italic flex items-center gap-1 mb-3"
          >
            <Sparkles size={20} className="text-gold-light" /> Astro Wala Shop
          </Editable>
          <Editable
            as="p"
            id="signup-panel-desc"
            label="Signup Panel Description"
            className="text-white/85 text-sm"
          >
            Create an account for faster checkout, order tracking, and personalised horoscope picks.
          </Editable>
        </Editable>

        <form onSubmit={handleSubmit} className="p-8 flex-1 flex flex-col gap-4">
          <Editable
            as="h1"
            id="signup-heading"
            label="Signup Page Heading"
            className="text-lg font-semibold text-gray-900"
          >
            Create your account
          </Editable>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
          <input
            type="email"
            required
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand"
          />
          <div className="relative">
            <Gift size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Referral Code (Optional)"
              value={form.referralCode}
              onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
              className="w-full border border-gray-300 rounded pl-9 pr-3 py-2.5 text-sm focus:outline-brand"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" required id="terms" className="accent-brand" />
            <Editable as="label" htmlFor="terms" id="signup-terms-label" label="Terms Label" className="text-xs text-gray-600">
              I accept the <Link to="/info/terms" className="text-brand hover:underline">Terms and Conditions</Link>
            </Editable>
          </div>
          <Editable
            as="button"
            kind="button"
            id="signup-submit-btn"
            label="Sign Up Submit Button"
            type="submit"
            disabled={submitting}
            className="bg-cta-buy text-white font-semibold py-2.5 rounded-sm text-sm uppercase tracking-wide mt-2 flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting && <LoaderCircle size={17} className="animate-spin" />}
            {submitting ? "Creating account..." : "Sign Up"}
          </Editable>
          <p className="text-sm text-gray-600 text-center mt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-brand font-medium">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
