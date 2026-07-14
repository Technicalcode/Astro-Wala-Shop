import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, updateUser, getFullUser } from "../../store/authSlice";
import { Plus, Edit2, Trash2, Star, Clock, MapPin, Calendar } from "lucide-react";
import Editable from "../../components/editable/Editable";

export default function AccountBirthProfiles() {
  const userSession = useSelector(selectUser);
  const dispatch = useDispatch();
  const [profiles, setProfiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({ id: "", name: "", relation: "Self", date: "", time: "", place: "" });

  useEffect(() => {
    if (userSession?.email) {
      const fullUser = getFullUser(userSession.email);
      if (fullUser) {
        setProfiles(fullUser.birthProfiles || []);
      }
    }
  }, [userSession]);

  const saveToRedux = (newProfiles) => {
    dispatch(updateUser(userSession.email, { birthProfiles: newProfiles }));
    setProfiles(newProfiles);
  };

  const handleAddNew = () => {
    setForm({ id: "", name: "", relation: "Self", date: "", time: "", place: "" });
    setIsEditing(true);
  };

  const handleEdit = (profile) => {
    setForm(profile);
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    const updated = profiles.filter(p => p.id !== id);
    saveToRedux(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updated = [...profiles];

    if (form.id) {
      const idx = updated.findIndex(p => p.id === form.id);
      if (idx !== -1) updated[idx] = form;
    } else {
      updated.push({ ...form, id: "bp-" + Date.now() });
    }

    saveToRedux(updated);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Editable as="div" kind="button" id="acc-birth-form-bg" label="Birth Profile Form Background" className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{form.id ? "Edit Birth Profile" : "Add New Birth Profile"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
            <input required placeholder="E.g., Rahul Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Relation</label>
            <select value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full bg-white">
              <option>Self</option>
              <option>Spouse</option>
              <option>Child</option>
              <option>Parent</option>
              <option>Friend</option>
              <option>Other</option>
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Time of Birth</label>
              <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Place of Birth (City, State, Country)</label>
            <input required placeholder="E.g., New Delhi, India" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-full" />
          </div>
          
          <div className="flex gap-3 mt-2">
            <Editable as="button" kind="button" id="acc-birth-save-btn" label="Save Profile Button" type="submit" className="bg-brand text-white text-sm font-semibold px-6 py-2 rounded-sm hover:opacity-90">
              Save Profile
            </Editable>
            <button type="button" onClick={() => setIsEditing(false)} className="border border-gray-300 text-gray-700 text-sm font-semibold px-6 py-2 rounded-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </Editable>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Editable as="h1" id="acc-birth-heading" label="Birth Profiles Heading" className="text-xl font-semibold text-gray-900">
          Birth Profiles
        </Editable>
        <Editable as="button" kind="button" id="acc-birth-add-btn" label="Add New Profile Button" onClick={handleAddNew} className="flex items-center gap-1 bg-brand text-white text-sm font-semibold px-4 py-2 rounded-sm hover:opacity-90">
          <Plus size={16} /> Add New Profile
        </Editable>
      </div>

      <Editable as="p" id="acc-birth-desc" label="Birth Profiles Description" className="text-sm text-gray-600 mb-2">
        Save your family's birth details here for faster checkout when ordering Kundli or astrological reports.
      </Editable>

      {profiles.length === 0 ? (
        <div className="bg-white rounded-md shadow-card p-8 text-center text-gray-500">
          No birth profiles saved yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <Editable as="div" kind="button" id={`acc-birth-card`} label="Birth Profile Card Background" key={profile.id} className="bg-white rounded-md shadow-card p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Star size={16} className="text-brand fill-brand/20" /> {profile.name}
                  </h3>
                  <span className="text-[11px] font-medium text-brand bg-brand/10 px-2 py-0.5 rounded mt-1 inline-block">
                    {profile.relation}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1.5 mb-4 bg-gray-50 p-3 rounded">
                <p className="flex items-center gap-2"><Calendar size={14} className="text-gray-400" /> {profile.date}</p>
                <p className="flex items-center gap-2"><Clock size={14} className="text-gray-400" /> {profile.time}</p>
                <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> {profile.place}</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-medium border-t border-gray-100 pt-3">
                <button onClick={() => handleEdit(profile)} className="text-blue-600 hover:underline flex items-center gap-1">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(profile.id)} className="text-red-600 hover:underline flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </Editable>
          ))}
        </div>
      )}
    </div>
  );
}
