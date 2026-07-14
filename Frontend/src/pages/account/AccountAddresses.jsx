import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, updateUser, getFullUser } from "../../store/authSlice";
import { Plus, Edit2, Trash2, MapPin } from "lucide-react";
import Editable from "../../components/editable/Editable";

export default function AccountAddresses() {
  const userSession = useSelector(selectUser);
  const dispatch = useDispatch();
  const [addresses, setAddresses] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({ id: "", name: "", phone: "", pincode: "", line: "", city: "", state: "", isDefault: false });

  useEffect(() => {
    if (userSession?.email) {
      const fullUser = getFullUser(userSession.email);
      if (fullUser) {
        setAddresses(fullUser.addresses || []);
      }
    }
  }, [userSession]);

  const saveToRedux = (newAddresses) => {
    dispatch(updateUser(userSession.email, { addresses: newAddresses }));
    setAddresses(newAddresses);
  };

  const handleAddNew = () => {
    setForm({ id: "", name: "", phone: "", pincode: "", line: "", city: "", state: "", isDefault: addresses.length === 0 });
    setIsEditing(true);
  };

  const handleEdit = (addr) => {
    setForm(addr);
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true;
    }
    saveToRedux(updated);
  };

  const handleSetDefault = (id) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    saveToRedux(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updated = [...addresses];
    
    // If setting this to default, unset others
    if (form.isDefault) {
      updated = updated.map(a => ({ ...a, isDefault: false }));
    }

    if (form.id) {
      const idx = updated.findIndex(a => a.id === form.id);
      if (idx !== -1) updated[idx] = form;
    } else {
      updated.push({ ...form, id: "addr-" + Date.now() });
    }

    saveToRedux(updated);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Editable as="div" kind="button" id="acc-addr-form-bg" label="Address Form Background" className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{form.id ? "Edit Address" : "Add New Address"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
          <input required placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand" />
          <input required placeholder="10-digit Mobile Number" value={form.phone} maxLength={10} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand" />
          <input required placeholder="Address (House No, Street, Area)" value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand" />
          <div className="flex gap-3">
            <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-brand" />
            <input required placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-brand" />
          </div>
          <input required placeholder="Pincode" value={form.pincode} maxLength={6} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} className="border border-gray-300 rounded px-3 py-2 text-sm w-32 focus:outline-brand" />
          
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer w-fit mt-1">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-brand" />
            Make this my default address
          </label>

          <div className="flex gap-3 mt-2">
            <Editable as="button" kind="button" id="acc-addr-save-btn" label="Save Address Button" type="submit" className="bg-brand text-white text-sm font-semibold px-6 py-2 rounded-sm hover:opacity-90">
              Save Address
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
        <Editable as="h1" id="acc-addr-heading" label="Addresses Heading" className="text-xl font-semibold text-gray-900">
          Manage Addresses
        </Editable>
        <Editable as="button" kind="button" id="acc-addr-add-btn" label="Add New Address Button" onClick={handleAddNew} className="flex items-center gap-1 bg-brand text-white text-sm font-semibold px-4 py-2 rounded-sm hover:opacity-90">
          <Plus size={16} /> Add New Address
        </Editable>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-md shadow-card p-8 text-center text-gray-500">
          No addresses saved yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Editable as="div" kind="button" id={`acc-addr-card`} label="Address Card Background" key={addr.id} className={`bg-white rounded-md shadow-card p-4 border-l-4 ${addr.isDefault ? "border-brand" : "border-transparent"}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin size={16} className="text-brand" /> {addr.name}
                  {addr.isDefault && <span className="bg-brand/10 text-brand text-[10px] uppercase font-bold px-2 py-0.5 rounded">Default</span>}
                </h3>
              </div>
              <div className="text-sm text-gray-600 mb-3 space-y-0.5">
                <p>{addr.line}</p>
                <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                <p>Phone: {addr.phone}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium border-t border-gray-100 pt-3">
                <button onClick={() => handleEdit(addr)} className="text-blue-600 hover:underline flex items-center gap-1">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(addr.id)} className="text-red-600 hover:underline flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr.id)} className="text-gray-500 hover:text-brand hover:underline ml-auto">
                    Set as Default
                  </button>
                )}
              </div>
            </Editable>
          ))}
        </div>
      )}
    </div>
  );
}
