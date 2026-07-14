import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Editable from "../components/editable/Editable";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetPassword } from "../store/authSlice";
import { showErrorPopup } from "../utils/notificationCenter";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      showErrorPopup("The password and confirmation do not match.", {
        title: "Passwords do not match",
      });
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      showErrorPopup("Password must be at least 8 characters long.", {
        title: "Password is too short",
      });
      return;
    }
    
    const res = await dispatch(resetPassword({ token, newPassword: password }));
    if (!res.ok) {
      setError(res.error || "Failed to reset password.");
      showErrorPopup(res.error || "Failed to reset password.", {
        title: "Password reset failed",
        details: "The reset link may be invalid or expired.",
      });
      return;
    }

    setError("");
    setSubmitted(true);
    
    // Simulate successful password reset
    setTimeout(() => {
      navigate("/login");
    }, 3000);
  };

  return (
    <div className="flex justify-center py-8">
      <div className="bg-white rounded-md shadow-card overflow-hidden flex max-w-3xl w-full">
        <Editable
          as="div"
          kind="button"
          id="reset-pwd-panel-bg"
          label="Reset Password Panel Background"
          className="bg-brand text-white p-8 w-72 hidden md:flex flex-col"
        >
          <Editable
            as="span"
            id="reset-pwd-panel-logo"
            label="Logo Text"
            className="font-display font-bold text-2xl italic flex items-center gap-1 mb-3"
          >
            <Sparkles size={20} className="text-gold-light" /> Astro Wala Shop
          </Editable>
          <Editable
            as="p"
            id="reset-pwd-panel-desc"
            label="Panel Description"
            className="text-white/85 text-sm"
          >
            Create a new, strong password that you don't use on other websites.
          </Editable>
        </Editable>

        <div className="p-8 flex-1 flex flex-col justify-center gap-4">
          <Editable
            as="h1"
            id="reset-pwd-heading"
            label="Heading"
            className="text-lg font-semibold text-gray-900"
          >
            Create new password
          </Editable>

          {submitted ? (
            <Editable
              as="div"
              id="reset-pwd-success"
              label="Success Message"
              className="bg-green-50 text-green-800 p-4 rounded-md text-sm text-center"
            >
              Your password has been reset successfully! 
              <br/><br/>
              Redirecting you to login...
              <Link to="/login" className="block mt-3 text-brand font-medium underline">
                Click here if you are not redirected
              </Link>
            </Editable>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand w-full"
                />
              </div>
              
              <Editable
                as="button"
                kind="button"
                id="reset-pwd-submit-btn"
                label="Submit Button"
                type="submit"
                className="bg-cta-buy text-white font-semibold py-2.5 rounded-sm text-sm uppercase tracking-wide mt-2 hover:opacity-90 transition-opacity"
              >
                Save New Password
              </Editable>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
