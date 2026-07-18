import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useDispatch } from "react-redux";
import { googleLogin, login } from "../store/authSlice";
import Editable from "../components/editable/Editable";
import { showErrorPopup, showInfoPopup } from "../utils/notificationCenter";

export default function Login() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const googleButtonRef = useRef(null);
	const [form, setForm] = useState({ email: "", password: "" });
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [googleReady, setGoogleReady] = useState(false);
	const [googleSubmitting, setGoogleSubmitting] = useState(false);
	const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

	const finishLogin = (user) => {
		if (user?.role === "admin") {
			navigate("/admin", { replace: true });
		} else {
			navigate(location.state?.from || "/", { replace: true });
		}
	};

	useEffect(() => {
		if (!googleClientId) return undefined;

		let cancelled = false;

		const initializeGoogle = () => {
			if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;

			window.google.accounts.id.initialize({
				client_id: googleClientId,
				callback: async (response) => {
					if (!response?.credential) {
						showErrorPopup("Google did not return a login credential.", {
							title: "Google login failed",
						});
						return;
					}

					setGoogleSubmitting(true);
					const result = await dispatch(googleLogin(response.credential));
					setGoogleSubmitting(false);

					if (!result.ok) {
						showErrorPopup(result.error, { title: "Google login failed" });
						return;
					}

					finishLogin(result.user);
				},
			});

			window.google.accounts.id.renderButton(googleButtonRef.current, {
				theme: "outline",
				size: "large",
				width: googleButtonRef.current.offsetWidth || 360,
				text: "continue_with",
				shape: "rectangular",
			});
			setGoogleReady(true);
		};

		if (window.google?.accounts?.id) {
			initializeGoogle();
			return () => {
				cancelled = true;
			};
		}

		const script = document.createElement("script");
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		script.onload = initializeGoogle;
		script.onerror = () => {
			if (!cancelled) {
				showErrorPopup("Could not load Google login. Please try again.", {
					title: "Google login unavailable",
				});
			}
		};
		document.head.appendChild(script);

		return () => {
			cancelled = true;
		};
	}, [dispatch, googleClientId, location.state?.from, navigate]);

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
			finishLogin(res.user);
		} finally {
			setSubmitting(false);
		}
	};

	const handleGoogleLogin = () => {
		if (!googleClientId) {
			showInfoPopup(
				"Google login is ready in code. Please add VITE_GOOGLE_CLIENT_ID in frontend .env and GOOGLE_CLIENT_ID in backend .env.",
				{ title: "Google login setup required" },
			);
			return;
		}

		if (!window.google?.accounts?.id) {
			showInfoPopup("Google login is still loading. Please try again in a moment.", {
				title: "Google login loading",
			});
			return;
		}

		window.google.accounts.id.prompt();
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

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

					<div className="min-h-11">
						<div ref={googleButtonRef} className={googleClientId ? "w-full" : "hidden"} />
						{(!googleClientId || !googleReady) && (
							<Editable
								as="button"
								kind="button"
								id="login-google-btn"
								label="Google Login Button"
								type="button"
								onClick={handleGoogleLogin}
								disabled={googleSubmitting}
								className="flex w-full items-center justify-center gap-3 rounded-sm border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70"
								aria-label="Continue with Google"
							>
								<span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white font-bold text-blue-600">
									G
								</span>
								{googleSubmitting ? "Signing in..." : "Continue with Google"}
							</Editable>
						)}
					</div>

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
