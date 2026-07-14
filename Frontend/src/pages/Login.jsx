import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useDispatch } from "react-redux";
import { login } from "../store/authSlice";
import Editable from "../components/editable/Editable";
import { showErrorPopup } from "../utils/notificationCenter";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await dispatch(login(form));
      if (!res.ok) {
        setError(res.error);
        showErrorPopup(res.error, {
          title: "Login failed",
          details: `Email: ${form.email}`,
        });
        return;
      }
      // Redirect by the account's actual role, regardless of which login form was used.
      if (res.user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(location.state?.from || "/", { replace: true });
      }
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
          id="login-panel-bg"
          label="Login Side Panel Background"
          className="bg-brand text-white p-8 w-72 hidden md:flex flex-col"
        >
          <Editable
            as="span"
            id="login-panel-logo"
            label="Login Panel Logo Text"
            className="font-display font-bold text-2xl italic flex items-center gap-1 mb-3"
          >
            <Sparkles size={20} className="text-gold-light" /> Astro Wala Shop
          </Editable>
          <Editable
            as="p"
            id="login-panel-desc"
            label="Login Panel Description"
            className="text-white/85 text-sm"
          >
            Login to access certified gemstones, astrologer consultations, and your order history.
          </Editable>
        </Editable>

        <form onSubmit={handleSubmit} className="p-8 flex-1 flex flex-col gap-4">
          <Editable
            as="h1"
            id="login-heading"
            label="Login Page Heading"
            className="text-lg font-semibold text-gray-900"
          >
            Login to your account
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
          <div className="flex flex-col">
            <input
              type="password"
              required
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand"
            />
            <div className="flex justify-end mt-1">
              <Editable
                as={Link}
                to="/forgot-password"
                id="login-forgot-password-link"
                label="Forgot Password Link"
                className="text-xs text-brand hover:underline font-medium"
              >
                Forgot Password?
              </Editable>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 -mt-1">
            Demo tip: sign up first, then log in with the same email &amp; password.
          </p>
          <Editable
            as="button"
            kind="button"
            id="login-submit-btn"
            label="Login Submit Button"
            type="submit"
            disabled={submitting}
            className="bg-cta-buy text-white font-semibold py-2.5 rounded-sm text-sm uppercase tracking-wide mt-2 flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting && <LoaderCircle size={17} className="animate-spin" />}
            {submitting ? "Logging in..." : "Login"}
          </Editable>
          <p className="text-sm text-gray-600 text-center mt-2">
            New to Astro Wala Shop?{" "}
            <Link to="/signup" className="text-brand font-medium">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
