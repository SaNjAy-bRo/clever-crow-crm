import React, { useState } from "react";
import { Settings, Plus, Trash2, Edit2, UserPlus, AlertCircle, ShieldAlert, CheckCircle } from "lucide-react";

interface WhitelistViewProps {
  whitelist: any[];
  currentUserEmail: string;
  onAddWhitelist: (entry: any) => Promise<void>;
  onDeleteWhitelist: (id: string) => Promise<void>;
  onUpdateRole: (id: string, role: string) => Promise<void>;
}

export default function WhitelistView({
  whitelist,
  currentUserEmail,
  onAddWhitelist,
  onDeleteWhitelist,
  onUpdateRole
}: WhitelistViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "bdm"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roleLabels: Record<string, string> = {
    admin: "Admin / Founder",
    manager: "Sales Manager",
    bdm: "Sales Executive (BDM)",
    telecaller: "Telecaller / Lead Gen",
    team_member: "Proposal Team"
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) {
      setError("Email address is required");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onAddWhitelist(form);
      setIsAddOpen(false);
      setForm({ email: "", name: "", role: "bdm" });
    } catch (err: any) {
      setError(err.message || "Failed to whitelist email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (id: string, email: string, newRole: string) => {
    if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
      alert("You cannot demote yourself from admin status.");
      return;
    }
    try {
      await onUpdateRole(id, newRole);
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
      alert("You cannot remove yourself from the access list.");
      return;
    }
    if (!confirm(`Are you sure you want to remove access for ${email}?`)) {
      return;
    }
    try {
      await onDeleteWhitelist(id);
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">System User Access (Whitelist)</h2>
          <p className="text-xs text-slate-400 mt-1">Control who can authenticate using Google Sign-in and manage authorization roles.</p>
        </div>

        <button
          onClick={() => {
            setForm({ email: "", name: "", role: "bdm" });
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-black px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-xs shadow-md shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Authorize Google Account</span>
        </button>
      </div>

      {/* Access list Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg overflow-hidden">
        <div className="pb-3 border-b border-slate-800 mb-4 flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Authorized System Accounts</h3>
          <span className="text-[10px] text-slate-400">Total active users: {whitelist.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-850">
                <th className="pb-2.5 font-semibold">User Details</th>
                <th className="pb-2.5 font-semibold">Google Account Email</th>
                <th className="pb-2.5 font-semibold">System Role Permission</th>
                <th className="pb-2.5 font-semibold text-right">Delete Account</th>
              </tr>
            </thead>
            <tbody>
              {whitelist.map(entry => {
                const isSelf = entry.email.toLowerCase() === currentUserEmail.toLowerCase();
                return (
                  <tr key={entry.id} className="border-b border-slate-850 hover:bg-slate-950/20">
                    <td className="py-3.5 font-semibold text-slate-200">
                      {entry.name || "Anonymous User"}
                      {isSelf && <span className="ml-2 text-[9px] bg-amber-400 text-black font-extrabold px-1.5 py-0.5 rounded">YOU</span>}
                    </td>
                    <td className="py-3.5 text-slate-400 font-mono">{entry.email}</td>
                    <td className="py-3.5">
                      <select
                        disabled={isSelf}
                        value={entry.role}
                        onChange={(e) => handleRoleChange(entry.id, entry.email, e.target.value)}
                        className="bg-slate-950 border border-slate-800 py-1.5 px-3 rounded-lg text-xs text-slate-300 focus:outline-none disabled:opacity-50"
                      >
                        <option value="admin">Admin / Founder</option>
                        <option value="manager">Sales Manager</option>
                        <option value="bdm">Sales Executive (BDM)</option>
                        <option value="telecaller">Telecaller / Lead Gen</option>
                        <option value="team_member">Team Member / Proposal Team</option>
                      </select>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(entry.id, entry.email)}
                        disabled={isSelf}
                        className="p-1.5 hover:bg-red-950/20 text-slate-500 hover:text-red-400 rounded-lg transition-all disabled:opacity-20"
                      >
                        <Trash2 className="w-4 h-4 inline-block" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorize Account Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Authorize Google Account</h3>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              {error && <p className="text-xs text-red-400">{error}</p>}

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">User Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Google Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@clevercrowstrategies.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 py-2 px-3 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">System Authorization Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                >
                  <option value="admin">Admin / Founder</option>
                  <option value="manager">Sales Manager</option>
                  <option value="bdm">Sales Executive (BDM)</option>
                  <option value="telecaller">Telecaller / Lead Gen</option>
                  <option value="team_member">Team Member / Proposal Team</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Authorizing..." : "Confirm Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
