import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { getUserSavedName, selectUser, updateUser } from "../../store/authSlice";
import Editable from "../../components/editable/Editable";
import SaveToast from "../../components/SaveToast";
import {
  backendUrl,
  fetchWithAuth,
  hasAuthCredentials,
  readApiResponse,
} from "../../config/api";
import {
  normalizeProfileAddress,
  saveDeliveryProfile,
} from "../../utils/checkoutAddress";

const emptyForm = {
  name: "",
  email: "",
  gender: "",
  phone: "",
  line: "",
  city: "",
  state: "",
  pincode: "",
  bio: "",
};

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
];

const getProfileForm = (profile, userSession) => {
  const address = normalizeProfileAddress(profile) || {};

  return {
    ...emptyForm,
    email: userSession?.email || "",
    name: profile?.fullName || address.name || getUserSavedName(userSession) || "",
    gender: profile?.gender || "",
    phone: address.phone || "",
    line: address.line || "",
    city: address.city || "",
    state: address.state || "",
    pincode: address.pincode || "",
    bio: profile?.bio || "",
  };
};

export default function AccountProfile() {
  const userSession = useSelector(selectUser);
  const dispatch = useDispatch();
  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);
  const [status, setStatus] = useState(""); // "loading", "saving", "success", "error", "no_changes"
  const [errorMsg, setErrorMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!userSession?.email) return;

      setForm((current) => ({
        ...current,
        email: userSession.email,
        name: current.name || getUserSavedName(userSession) || "",
      }));

      if (!hasAuthCredentials()) return;

      setStatus("loading");
      try {
        const res = await fetchWithAuth(`${backendUrl}/api/v1/user/profile/get-profile`);
        const data = await readApiResponse(res);

        if (!cancelled) {
          const profileForm = getProfileForm(data.data, userSession);
          setForm(profileForm);
          setInitialForm(profileForm);
          setStatus("");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userSession]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Input Validations
    const nameRegex = /^[A-Za-z\s]{3,50}$/;
    if (!nameRegex.test(form.name.trim())) {
      setErrorMsg("Please enter a valid Full Name (only alphabets, minimum 3 characters).");
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(form.phone)) {
      setErrorMsg("Please enter a valid 10-digit Indian Mobile Number starting with 6-9.");
      return;
    }

    if (form.line.trim().length < 10) {
      setErrorMsg("Please enter a complete and detailed Address (minimum 10 characters).");
      return;
    }

    const locationRegex = /^[A-Za-z\s]{3,50}$/;
    if (!locationRegex.test(form.city.trim())) {
      setErrorMsg("Please enter a valid City name (only alphabets, minimum 3 characters).");
      return;
    }
    if (!locationRegex.test(form.state.trim())) {
      setErrorMsg("Please enter a valid State name (only alphabets, minimum 3 characters).");
      return;
    }

    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(form.pincode)) {
      setErrorMsg("Please enter a valid 6-digit Indian Pincode.");
      return;
    }

    if (JSON.stringify(form) === JSON.stringify(initialForm)) {
      setStatus("no_changes");
      setTimeout(() => setStatus(""), 3000);
      return;
    }
    setStatus("saving");

    try {
      await saveDeliveryProfile(
        {
          name: form.name,
          phone: form.phone,
          line: form.line,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        { gender: form.gender, bio: form.bio },
      );

      dispatch(
        updateUser(userSession.email, {
          name: form.name,
          bio: form.bio,
          gender: form.gender,
          addresses: [
            {
              name: form.name,
              phone: form.phone,
              line: form.line,
              city: form.city,
              state: form.state,
              pincode: form.pincode,
              isDefault: true,
              isFilled: true,
            },
          ],
        }),
      );

      setStatus("success");
      setInitialForm(form);
      setShowToast(true);
      setTimeout(() => setStatus(""), 3000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
    <Editable as="div" kind="button" id="acc-profile-bg" label="Profile Form Background" className="bg-white rounded-md shadow-card p-6">
      <Editable as="h1" id="acc-profile-heading" label="Profile Heading" className="text-xl font-semibold text-gray-900 mb-6">
        Edit Profile
      </Editable>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-4 font-medium border border-red-100">{errorMsg}</div>
      )}

      {status === "loading" && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm mb-4">Loading profile details...</div>
      )}
      {status === "error" && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-4">Failed to save profile details.</div>
      )}

      <form onSubmit={handleSubmit} onChange={() => { if (status === "no_changes" || status === "success") setStatus(""); }} className="flex flex-col gap-4 max-w-2xl">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
          <input
            required
            pattern="[A-Za-z\s]{3,50}"
            title="Only letters and spaces allowed (minimum 3 characters)"
            value={form.name}
            placeholder="Full Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full bg-white"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
            <input
              disabled
              value={form.email}
              className="border border-gray-200 bg-gray-50 text-gray-500 rounded px-3 py-2 text-sm w-full cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Number</label>
          <input
            required
            value={form.phone}
            pattern="[6-9][0-9]{9}"
            title="10-digit mobile number starting with 6-9"
            maxLength={10}
            placeholder="10-digit Mobile Number"
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
          <input
            required
            minLength={10}
            value={form.line}
            placeholder="Address (House No, Street, Area)"
            onChange={(e) => setForm({ ...form, line: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
            <input
              required
              pattern="[A-Za-z\s]{3,50}"
              title="City name should contain only letters and be at least 3 characters long"
              value={form.city}
              placeholder="City"
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
            <select
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full bg-white"
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
            <input
              required
              pattern="[1-9][0-9]{5}"
              title="Valid 6-digit Indian PIN code"
              value={form.pincode}
              maxLength={6}
              placeholder="Pincode"
              onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full resize-none"
          />
        </div>

        <div className="flex items-center gap-4 mt-2">
          <Editable
            as="button"
            kind="button"
            id="acc-profile-submit-btn"
            label="Save Profile Button"
            type="submit"
            disabled={status === "saving" || status === "loading"}
            className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === "saving" ? "Saving..." : "Save Changes"}
          </Editable>
          
          {status === "success" && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-[fadeIn_0.3s_ease-out]">
              <CheckCircle size={16} />
              <span>Successfully saved!</span>
            </div>
          )}
          {status === "no_changes" && (
            <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium animate-[fadeIn_0.3s_ease-out]">
              <CheckCircle size={16} />
              <span>No changes to save.</span>
            </div>
          )}
        </div>
      </form>
    </Editable>

    {/* Save Success Toast */}
    <SaveToast
      show={showToast}
      onClose={() => setShowToast(false)}
      message="Profile saved successfully!"
    />
    </>
  );
}
