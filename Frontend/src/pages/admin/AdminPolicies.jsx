import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, FileText, ShieldAlert } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  addPolicy,
  deletePolicy,
  fetchPolicies,
  selectAllPolicies,
  selectPoliciesError,
  selectPoliciesLoading,
  selectPoliciesSaving,
  updatePolicy,
} from "../../store/policySlice";
import Editable from "../../components/editable/Editable";

export default function AdminPolicies() {
  const dispatch = useDispatch();
  const policies = useSelector(selectAllPolicies);
  const loading = useSelector(selectPoliciesLoading);
  const saving = useSelector(selectPoliciesSaving);
  const error = useSelector(selectPoliciesError);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const emptyForm = { id: "", slug: "", title: "", heading: "", content: "", position: 0 };
  const [form, setForm] = useState(emptyForm);

  const sortedPolicies = [...policies].sort((a, b) => a.position - b.position);

  useEffect(() => {
    dispatch(fetchPolicies());
  }, [dispatch]);

  const openAdd = () => {
    setForm({ ...emptyForm, position: policies.length + 1 });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({ ...p });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this policy?")) return;

    try {
      await dispatch(deletePolicy(id)).unwrap();
    } catch (err) {
      alert(err || "Failed to delete policy");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      id: editingId,
      slug: form.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      position: Number(form.position)
    };

    try {
      if (editingId) {
        await dispatch(updatePolicy(payload)).unwrap();
      } else {
        await dispatch(addPolicy(payload)).unwrap();
      }
      setShowForm(false);
    } catch (err) {
      alert(err || "Failed to save policy");
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Editable as="h1" id="admin-policy-heading" kind="button" label="Policies Heading" className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3">
              <FileText size={36} className="text-amber-400" />
              Store Policies
            </Editable>
            <Editable as="p" id="admin-policy-sub" kind="button" label="Policies Subtext" className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed">
              Manage {policies.length} dynamic legal and informational policies displayed in the footer.
            </Editable>
          </div>
          <div className="shrink-0 flex flex-wrap items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all backdrop-blur-sm shadow-sm"
            >
              Discard Changes
            </button>
            <button
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all backdrop-blur-sm shadow-sm"
            >
              Save Changes
            </button>
            <Editable as="button" onClick={openAdd} id="admin-add-policy-btn" kind="button" label="Add Policy Button" className="bg-white text-brand hover:bg-indigo-50 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 ml-2">
              <Plus size={18} /> Add New Policy
            </Editable>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 backdrop-blur-sm px-4 py-3 text-sm text-red-700 flex items-center gap-2 font-medium">
          <ShieldAlert size={18} className="text-red-500" />
          {error}
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-white/50 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-brand shadow-inner">
            <FileText size={20} />
          </div>
          <Editable as="h3" id="admin-policies-card-heading" kind="button" label="Card Heading" className="font-semibold text-gray-900 text-xl">
            Active Policies
          </Editable>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left bg-gray-50/50">
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs w-20">Pos</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Title (Footer Link)</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">URL Slug</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Heading (Page H1)</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan="5" className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                     <div className="w-12 h-12 border-4 border-indigo-100 border-t-brand rounded-full animate-spin mb-4"></div>
                     <p className="text-gray-500 font-medium">Loading policies...</p>
                  </div>
                </td>
              </tr>
            )}
            {sortedPolicies.map((p) => (
              <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors group">
                <td className="py-5 px-6">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 text-gray-700 font-bold shadow-inner group-hover:bg-white group-hover:text-brand transition-all">
                    {p.position}
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-brand group-hover:bg-indigo-50 transition-colors">
                      <FileText size={16} />
                    </div>
                    <span className="font-bold text-gray-900 group-hover:text-brand transition-colors">{p.title}</span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="text-brand font-mono text-xs px-2.5 py-1.5 bg-indigo-50 rounded-md border border-indigo-100 group-hover:bg-white transition-colors">/info/{p.slug}</span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-gray-600 font-medium">{p.heading}</span>
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-brand hover:bg-indigo-50 rounded-lg transition-colors">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && policies.length === 0 && (
              <tr>
                <td colSpan="5" className="py-20 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
                    <FileText size={36} />
                  </div>
                  <p className="text-gray-500 text-base font-medium">No policies found. Add one to show in the footer.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>


      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Editable as="div" kind="button" id="admin-policy-modal-bg" label="Policy Modal Background" className="bg-white rounded-2xl w-full max-w-2xl p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-8">
               <div className="p-3 bg-indigo-50 text-brand rounded-xl">
                 {editingId ? <Pencil size={24} /> : <Plus size={24} />}
               </div>
               <h2 className="font-display font-bold text-2xl text-gray-900">{editingId ? "Edit Policy" : "Create New Policy"}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Title (Footer Link Name)</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Terms of Use" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL Slug</label>
                  <div className="flex relative">
                     <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-500 sm:text-sm font-mono">/info/</span>
                     <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. terms" className="flex-1 min-w-0 w-full bg-gray-50 border border-gray-200 rounded-none rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Page Heading (H1)</label>
                  <input required value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} placeholder="e.g. Terms & Conditions" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Footer Position (Order)</label>
                  <input type="number" required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Policy Content (Paragraphs)</label>
                <textarea 
                  required 
                  value={form.content} 
                  onChange={(e) => setForm({ ...form, content: e.target.value })} 
                  rows={10} 
                  placeholder="Enter the policy content here. Use double newlines for separate paragraphs."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300 resize-y"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all">
                  Cancel
                </button>
                <Editable as="button" id="admin-policy-save-btn" kind="button" label="Save Policy Button" type="submit" disabled={saving} className="bg-brand text-white hover:bg-brand-dark font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-all shadow-md hover:shadow-lg">
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Policy"}
                </Editable>
              </div>
            </form>
          </Editable>
        </div>
      )}
    </div>
  );
}
