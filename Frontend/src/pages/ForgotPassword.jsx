import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import Editable from "../components/editable/Editable";
import { useDispatch } from "react-redux";
import { forgetPassword } from "../store/authSlice";
import { showErrorPopup } from "../utils/notificationCenter";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(forgetPassword({ email }));
    if (!res.ok) {
      showErrorPopup(res.error || "Failed to send reset link.", {
        title: "Reset link was not sent",
        details: `Email: ${email}`,
      });
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="flex justify-center py-8">
      <div className="bg-white rounded-md shadow-card overflow-hidden flex max-w-3xl w-full">
        <Editable
          as="div"
          kind="button"
          id="forgot-pwd-panel-bg"
          label="Forgot Password Panel Background"
          className="bg-brand text-white p-8 w-72 hidden md:flex flex-col"
        >
          <Editable
            as="span"
            id="forgot-pwd-panel-logo"
            label="Logo Text"
            className="font-display font-bold text-2xl italic flex items-center gap-1 mb-3"
          >
            <Sparkles size={20} className="text-gold-light" /> Astro Wala Shop
          </Editable>
          <Editable
            as="p"
            id="forgot-pwd-panel-desc"
            label="Panel Description"
            className="text-white/85 text-sm"
          >
            Don't worry, we've got you covered. Enter your email to reset your password.
          </Editable>
        </Editable>

        <div className="p-8 flex-1 flex flex-col gap-4">
          <Editable
            as={Link}
            to="/login"
            id="forgot-pwd-back"
            label="Back to Login Link"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand transition-colors w-fit"
          >
            <ArrowLeft size={14} /> Back to login
          </Editable>

          <Editable
            as="h1"
            id="forgot-pwd-heading"
            label="Heading"
            className="text-lg font-semibold text-gray-900 mt-2"
          >
            Reset your password
          </Editable>

          {submitted ? (
            <Editable
              as="div"
              id="forgot-pwd-success"
              label="Success Message"
              className="bg-green-50 text-green-800 p-4 rounded-md text-sm"
            >
              If an account exists for <strong>{email}</strong>, we have sent a password reset link to it. 
              <br/><br/>
              <em>Demo tip: Click below to simulate resetting your password.</em>
              <Link to="/reset-password?token=demo123" className="block mt-3 text-brand font-medium underline">
                Simulate Reset Password
              </Link>
            </Editable>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Editable
                as="p"
                id="forgot-pwd-text"
                label="Instructions"
                className="text-sm text-gray-600"
              >
                Please enter the email address you used to register.
              </Editable>
              
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-brand"
              />
              
              <Editable
                as="button"
                kind="button"
                id="forgot-pwd-submit-btn"
                label="Submit Button"
                type="submit"
                className="bg-cta-buy text-white font-semibold py-2.5 rounded-sm text-sm uppercase tracking-wide mt-2 hover:opacity-90 transition-opacity"
              >
                Send Reset Link
              </Editable>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
