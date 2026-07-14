import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Store } from "lucide-react";
import { useDispatch } from "react-redux";
import { login, logout } from "../store/authSlice";
import Editable from "../components/editable/Editable";
import { showErrorPopup } from "../utils/notificationCenter";

export default function SellerLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await dispatch(login(form));

    if (!res.ok) {
      setError(res.error);
      showErrorPopup(res.error, {
        title: "Admin login failed",
        details: `Email: ${form.email}`,
      });
      return;
    }

    if (res.user.role !== "admin") {
      dispatch(logout());
      const message = "This account doesn't have admin access. Please use the regular login page.";
      setError(message);
      showErrorPopup(message, {
        title: "Admin access required",
        status: 403,
      });
      return;
    }

    navigate("/admin", { replace: true });
  };

  return (
    <div className="flex justify-center py-12">
      <Editable
        as="div"
        kind="button"
        id="seller-login-card"
        label="Admin Login Card Background"
        className="bg-white rounded-md shadow-card p-8 max-w-sm w-full"
      >
        <div className="flex flex-col items-center mb-5">
          <Editable
            as="div"
            kind="button"
            id="seller-login-icon-bg"
            label="Admin Login Icon Background"
            className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mb-2"
          >
            <Store size={22} className="text-brand" />
          </Editable>
          <Editable
            as="h1"
            id="seller-login-heading"
            label="Admin Login Heading"
            className="text-lg font-semibold text-gray-900"
          >
            Admin Login
          </Editable>
          <Editable
            as="p"
            id="seller-login-desc"
            label="Admin Login Description"
            className="text-xs text-gray-500 text-center mt-1"
          >
            Manage your products, inventory, orders, and store settings.
          </Editable>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
          <input
            type="email"
            required
            placeholder="Admin Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand"
          />
          <Editable
            as="button"
            kind="button"
            id="seller-login-btn"
            label="Admin Login Submit Button"
            type="submit"
            className="bg-brand text-white font-semibold py-2.5 rounded-sm text-sm uppercase tracking-wide mt-1"
          >
            Login to Dashboard
          </Editable>
        </form>
        <p className="text-sm text-center mt-3">
          <Link to="/" className="text-brand">Back to store</Link>
        </p>
      </Editable>
    </div>
  );
}
