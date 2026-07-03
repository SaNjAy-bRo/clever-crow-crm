import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Mail,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  MapPin,
  FileText,
  ChevronRight,
  Filter,
  UserCheck,
  ChevronDown
} from "lucide-react";

interface FollowUpsViewProps {
  clients: any[];
  followUps: any[];
  userRole: string;
  userEmail: string;
  onAddFollowUp: (followUp: any) => Promise<void>;
  onUpdateFollowUp: (id: string, payload: any) => Promise<void>;
}

export default function FollowUpsView({
  clients,
  followUps,
  userRole,
  userEmail,
  onAddFollowUp,
  onUpdateFollowUp
}: FollowUpsViewProps) {
  // Tabs for follow-ups
  const [activeSubTab, setActiveSubTab] = useState<"today" | "overdue" | "upcoming" | "all">("today");
  
  // Modals & form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<any | null>(null);

  const initialFormState = {
    clientId: "",
    date: "",
    time: "",
    type: "Call",
    notes: "",
    nextAction: "",
    status: "Pending"
  };

  const [form, setForm] = useState(initialFormState);
  const [statusForm, setStatusForm] = useState({
    status: "Completed",
    notes: "",
    nextAction: "",
    scheduleNext: false,
    nextDate: "",
    nextTime: "",
    nextType: "Call"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const followUpTypes = ["Call", "WhatsApp", "Email", "Meeting", "Site visit", "Proposal follow-up"];
  const followUpStatuses = ["Pending", "Completed", "Missed", "Rescheduled", "No response", "Call back later"];

  // Filter based on BDM
  const isBdm = userRole === "bdm" || userRole === "telecaller";
  const myFollowUps = isBdm 
    ? followUps.filter(f => f.client?.dealOwnerEmail === userEmail) 
    : followUps;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Group follow-ups
  const todayFollowUps = myFollowUps.filter(f => {
    const d = new Date(f.date);
    return d >= todayStart && d <= todayEnd && f.status === "Pending";
  });

  const overdueFollowUps = myFollowUps.filter(f => {
    const d = new Date(f.date);
    return d < todayStart && f.status === "Pending";
  });

  const upcomingFollowUps = myFollowUps.filter(f => {
    const d = new Date(f.date);
    return d > todayEnd && f.status === "Pending";
  });

  const displayList = 
    activeSubTab === "today" ? todayFollowUps :
    activeSubTab === "overdue" ? overdueFollowUps :
    activeSubTab === "upcoming" ? upcomingFollowUps : 
    myFollowUps;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.date || !form.time || !form.type) {
      setError("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const combinedDateTime = new Date(`${form.date}T${form.time}`);
      await onAddFollowUp({
        clientId: form.clientId,
        date: combinedDateTime.toISOString(),
        type: form.type,
        notes: form.notes,
        nextAction: form.nextAction,
        status: "Pending"
      });
      setIsAddOpen(false);
      setForm(initialFormState);
    } catch (err: any) {
      setError(err.message || "Failed to create follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUp) return;
    setIsSubmitting(true);
    setError("");
    try {
      // 1. Update the current follow-up status
      await onUpdateFollowUp(selectedFollowUp.id, {
        status: statusForm.status,
        notes: statusForm.notes,
        nextAction: statusForm.nextAction
      });

      // 2. Optional: Schedule another follow-up
      if (statusForm.scheduleNext && statusForm.nextDate && statusForm.nextTime) {
        const nextCombined = new Date(`${statusForm.nextDate}T${statusForm.nextTime}`);
        await onAddFollowUp({
          clientId: selectedFollowUp.clientId,
          date: nextCombined.toISOString(),
          type: statusForm.nextType,
          notes: "",
          nextAction: statusForm.nextAction,
          status: "Pending"
        });
      }

      setIsStatusOpen(false);
      setSelectedFollowUp(null);
      setStatusForm({
        status: "Completed",
        notes: "",
        nextAction: "",
        scheduleNext: false,
        nextDate: "",
        nextTime: "",
        nextType: "Call"
      });
    } catch (err: any) {
      setError(err.message || "Failed to update follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Call": return Phone;
      case "WhatsApp": return MessageSquare;
      case "Email": return Mail;
      case "Meeting": return Video;
      case "Site visit": return MapPin;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and schedule button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Follow-Up Management</h2>
          <p className="text-xs text-slate-400 mt-1">First-action panel. Track daily activity calls, reminders, and timelines.</p>
        </div>
        <button
          onClick={() => {
            setForm(initialFormState);
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-black px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-xs shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Follow-Up</span>
        </button>
      </div>

      {/* Sub tabs for Today, Overdue, Upcoming */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs pb-1 shrink-0">
        <button
          onClick={() => setActiveSubTab("today")}
          className={`pb-2.5 font-bold border-b-2 px-1 relative transition-all ${
            activeSubTab === "today" 
              ? "text-amber-400 border-amber-400" 
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Today's Tasks
          {todayFollowUps.length > 0 && (
            <span className="ml-1.5 bg-amber-400 text-black font-extrabold px-1.5 py-0.5 rounded-full text-[9px] animate-pulse">
              {todayFollowUps.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("overdue")}
          className={`pb-2.5 font-bold border-b-2 px-1 transition-all ${
            activeSubTab === "overdue" 
              ? "text-red-400 border-red-500" 
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Overdue Reminders
          {overdueFollowUps.length > 0 && (
            <span className="ml-1.5 bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded-full text-[9px]">
              {overdueFollowUps.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("upcoming")}
          className={`pb-2.5 font-bold border-b-2 px-1 transition-all ${
            activeSubTab === "upcoming" 
              ? "text-slate-200 border-indigo-400" 
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveSubTab("all")}
          className={`pb-2.5 font-bold border-b-2 px-1 transition-all ${
            activeSubTab === "all" 
              ? "text-slate-200 border-slate-400" 
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          All History
        </button>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {displayList.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-850 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-xs mt-3">No follow-ups scheduled in this category.</p>
          </div>
        ) : (
          displayList.map(fu => {
            const Icon = getIcon(fu.type);
            const isPending = fu.status === "Pending";
            const isCompleted = fu.status === "Completed";
            
            const fuDate = new Date(fu.date);
            const dateStr = fuDate.toLocaleDateString();
            const timeStr = fuDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={fu.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition-all shadow-md">
                
                {/* Left Side: Client, Date, Action */}
                <div className="flex items-start space-x-4 min-w-0">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-amber-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white truncate">{fu.client?.businessName || "Unknown"}</h4>
                      <span className="text-[9px] text-slate-400">({fu.client?.name})</span>
                    </div>
                    <p className="text-xs text-slate-350 mt-1 truncate">Next step: {fu.nextAction || "No action set"}</p>
                    {fu.notes && <p className="text-[10px] text-slate-500 mt-1 italic">Notes: {fu.notes}</p>}
                    
                    <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{dateStr}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Status and actions */}
                <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    fu.status === "Pending" ? "bg-amber-400/10 border-amber-400/20 text-amber-400" :
                    fu.status === "Completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}>
                    {fu.status}
                  </span>
                  
                  {isPending && (
                    <button
                      onClick={() => {
                        setSelectedFollowUp(fu);
                        setIsStatusOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-black rounded-lg text-[10px] font-bold transition-all"
                    >
                      Update Action
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add Followup modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Schedule Follow-Up</h3>
            
            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              {error && <p className="text-xs text-red-400">{error}</p>}
              
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Select Client *</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">-- Select Prospect --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName} ({c.name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Follow-Up Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  {followUpTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Next Action *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discuss onboarding details / share quotation"
                  value={form.nextAction}
                  onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Notes / Context</label>
                <textarea
                  placeholder="Any details of past conversations..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-850 text-slate-400 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Followup Status modal */}
      {isStatusOpen && selectedFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Follow-Up Result</h3>
            <p className="text-xs text-slate-400 mt-1">Lead: {selectedFollowUp.client?.businessName}</p>

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4">
              {error && <p className="text-xs text-red-400">{error}</p>}
              
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Outcome Status *</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                >
                  {followUpStatuses.filter(s => s !== "Pending").map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Notes / Call Feedback *</label>
                <textarea
                  required
                  placeholder="Provide brief summary of client response..."
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none h-20 resize-none"
                />
              </div>

              {/* Schedule Next FollowUp Toggle */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <label className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusForm.scheduleNext}
                    onChange={(e) => setStatusForm({ ...statusForm, scheduleNext: e.target.checked })}
                    className="accent-amber-400"
                  />
                  <span>Schedule next follow-up call/meeting?</span>
                </label>

                {statusForm.scheduleNext && (
                  <div className="space-y-3 pt-2 border-t border-slate-850 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-500 block mb-1">Next Date</span>
                        <input
                          type="date"
                          required
                          value={statusForm.nextDate}
                          onChange={(e) => setStatusForm({ ...statusForm, nextDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 py-1.5 px-2 rounded-lg text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block mb-1">Next Time</span>
                        <input
                          type="time"
                          required
                          value={statusForm.nextTime}
                          onChange={(e) => setStatusForm({ ...statusForm, nextTime: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 py-1.5 px-2 rounded-lg text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-1">Next Type</span>
                      <select
                        value={statusForm.nextType}
                        onChange={(e) => setStatusForm({ ...statusForm, nextType: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-850 py-1.5 px-2 rounded-lg text-xs text-slate-300 focus:outline-none"
                      >
                        {followUpTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-1">Next Action description</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. WhatsApp proposal PDF"
                        value={statusForm.nextAction}
                        onChange={(e) => setStatusForm({ ...statusForm, nextAction: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 py-1.5 px-2 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusOpen(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-850 text-slate-400 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Saving..." : "Log Result"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
