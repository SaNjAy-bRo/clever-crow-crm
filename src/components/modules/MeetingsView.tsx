import React, { useState } from "react";
import {
  Video,
  Clock,
  Calendar,
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  ChevronDown,
  User,
  ExternalLink
} from "lucide-react";

interface MeetingsViewProps {
  clients: any[];
  meetings: any[];
  userRole: string;
  userEmail: string;
  onAddMeeting: (meeting: any) => Promise<void>;
  onUpdateMeeting: (id: string, payload: any) => Promise<void>;
  onAddFollowUp: (followUp: any) => Promise<void>;
}

export default function MeetingsView({
  clients,
  meetings,
  userRole,
  userEmail,
  onAddMeeting,
  onUpdateMeeting,
  onAddFollowUp
}: MeetingsViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAmfOpen, setIsAmfOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);

  const initialFormState = {
    clientId: "",
    date: "",
    time: "",
    type: "Google Meet",
    location: "",
    agenda: "",
    notes: "",
    assignedTo: userEmail,
    status: "Scheduled"
  };

  const [form, setForm] = useState(initialFormState);
  
  // After Meeting Form (AMF) State
  const [amfForm, setAmfForm] = useState({
    status: "Completed",
    notes: "",
    requirementSummary: "",
    nextStep: "",
    clientNeeds: "",
    budgetIdea: "",
    urgency: "Medium",
    decisionMaker: "",
    competitor: "",
    proposalRequired: false,
    scheduleFollowUp: false,
    followUpDate: "",
    followUpTime: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const meetingTypes = ["Phone call", "Google Meet", "Office meeting", "Client office visit", "Field visit"];
  const meetingStatuses = ["Scheduled", "Completed", "Cancelled", "Rescheduled", "No show"];

  const isBdm = userRole === "bdm" || userRole === "telecaller";
  const myMeetings = isBdm
    ? meetings.filter(m => m.assignedTo === userEmail || m.client?.dealOwnerEmail === userEmail)
    : meetings;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.date || !form.time || !form.agenda) {
      setError("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const combined = new Date(`${form.date}T${form.time}`);
      await onAddMeeting({
        clientId: form.clientId,
        date: combined.toISOString(),
        type: form.type,
        location: form.location,
        agenda: form.agenda,
        notes: form.notes,
        assignedTo: form.assignedTo,
        status: "Scheduled"
      });
      setIsAddOpen(false);
      setForm(initialFormState);
    } catch (err: any) {
      setError(err.message || "Failed to book meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    setIsSubmitting(true);
    setError("");
    try {
      // 1. Update Meeting Status and fill the After Meeting Form (AMF) fields
      await onUpdateMeeting(selectedMeeting.id, {
        status: amfForm.status,
        notes: amfForm.notes,
        requirementSummary: amfForm.requirementSummary,
        nextStep: amfForm.nextStep,
        afterMeetingUpdated: true,
        clientNeeds: amfForm.clientNeeds,
        budgetIdea: amfForm.budgetIdea,
        urgency: amfForm.urgency,
        decisionMaker: amfForm.decisionMaker,
        competitor: amfForm.competitor,
        proposalRequired: amfForm.proposalRequired,
      });

      // 2. Schedule Follow-up if requested
      if (amfForm.scheduleFollowUp && amfForm.followUpDate && amfForm.followUpTime) {
        const nextCombined = new Date(`${amfForm.followUpDate}T${amfForm.followUpTime}`);
        await onAddFollowUp({
          clientId: selectedMeeting.clientId,
          date: nextCombined.toISOString(),
          type: "Call",
          notes: "After Meeting Follow-up Call",
          nextAction: amfForm.nextStep || "Discuss details",
          status: "Pending"
        });
      }

      setIsAmfOpen(false);
      setSelectedMeeting(null);
    } catch (err: any) {
      setError(err.message || "Failed to submit After Meeting Form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Meeting Management</h2>
          <p className="text-xs text-slate-400 mt-1">Book Google Meets, register visits, and log client requirements.</p>
        </div>
        <button
          onClick={() => {
            setForm(initialFormState);
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-black px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-xs shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Book a Meeting</span>
        </button>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {myMeetings.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-850 rounded-2xl">
            <Video className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-xs mt-3">No meetings scheduled.</p>
          </div>
        ) : (
          myMeetings.map(m => {
            const isPending = m.status === "Scheduled";
            const meetDate = new Date(m.date);
            const dateStr = meetDate.toLocaleDateString();
            const timeStr = meetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={m.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-all shadow-md">
                
                {/* Left Section: Details */}
                <div className="flex items-start space-x-4 min-w-0">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-indigo-400 shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white truncate">{m.client?.businessName || "Unknown"}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">({m.client?.name})</span>
                    </div>
                    <p className="text-xs text-slate-350 mt-1 font-semibold">Agenda: {m.agenda}</p>
                    {m.notes && <p className="text-[10px] text-slate-500 mt-1">Notes: {m.notes}</p>}
                    
                    {/* Location / Meet links */}
                    {m.type === "Google Meet" && (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-blue-400 bg-blue-500/5 px-2 py-0.5 border border-blue-500/10 rounded-full mt-2 font-semibold">
                        <span>Google Meet Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}

                    <div className="flex items-center space-x-4 mt-2.5 text-[10px] text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{dateStr}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{timeStr}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{m.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center space-x-3 shrink-0 self-end md:self-auto">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    m.status === "Scheduled" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                    m.status === "Completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}>
                    {m.status}
                  </span>

                  {isPending && (
                    <button
                      onClick={() => {
                        setSelectedMeeting(m);
                        setAmfForm({
                          status: "Completed",
                          notes: "",
                          requirementSummary: "",
                          nextStep: "",
                          clientNeeds: m.clientNeeds || "",
                          budgetIdea: m.budgetIdea || "",
                          urgency: m.urgency || "Medium",
                          decisionMaker: m.decisionMaker || "",
                          competitor: m.competitor || "",
                          proposalRequired: m.proposalRequired || false,
                          scheduleFollowUp: false,
                          followUpDate: "",
                          followUpTime: ""
                        });
                        setIsAmfOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-black rounded-lg text-[10px] font-bold transition-all"
                    >
                      After Meeting Form
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Book Meeting Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Book a Meeting</h3>
            
            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              {error && <p className="text-xs text-red-400">{error}</p>}

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Select Prospect *</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">-- Choose Prospect --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName} ({c.name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Meeting Date *</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Meeting Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {meetingTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Location / Link</label>
                  <input
                    type="text"
                    placeholder="Location or URL"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Meeting Agenda *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discovery call & requirement analysis"
                  value={form.agenda}
                  onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Pre-meeting Notes</label>
                <textarea
                  placeholder="Details/context of prior calls..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none h-20 resize-none"
                />
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
                  {isSubmitting ? "Booking..." : "Book Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* After Meeting Form (AMF) Modal */}
      {isAmfOpen && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative my-8 flex flex-col max-h-[90vh]">
            <h3 className="text-base font-extrabold text-white">After Meeting Form</h3>
            <p className="text-xs text-slate-400 mt-1">Lead: <span className="font-bold text-white">{selectedMeeting.client?.businessName}</span></p>

            <form onSubmit={handleAmfSubmit} className="flex-1 overflow-y-auto mt-4 pr-2 space-y-4">
              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Meeting Outcome Status *</label>
                  <select
                    value={amfForm.status}
                    onChange={(e) => setAmfForm({ ...amfForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {meetingStatuses.filter(s => s !== "Scheduled").map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Client Urgency</label>
                  <select
                    value={amfForm.urgency}
                    onChange={(e) => setAmfForm({ ...amfForm, urgency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="High">Immediate / High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Client Requirements (What client needs) *</label>
                <textarea
                  required
                  placeholder="e.g. Website development in Next.js + Instagram Growth package"
                  value={amfForm.clientNeeds}
                  onChange={(e) => setAmfForm({ ...amfForm, clientNeeds: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Budget Idea (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 250000"
                    value={amfForm.budgetIdea}
                    onChange={(e) => setAmfForm({ ...amfForm, budgetIdea: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Decision Maker Met *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Met CMD directly / Partner"
                    value={amfForm.decisionMaker}
                    onChange={(e) => setAmfForm({ ...amfForm, decisionMaker: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Competitor agency (if any)</label>
                  <input
                    type="text"
                    placeholder="e.g. Agency X / None"
                    value={amfForm.competitor}
                    onChange={(e) => setAmfForm({ ...amfForm, competitor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-4">
                  <input
                    type="checkbox"
                    id="proposalCheck"
                    checked={amfForm.proposalRequired}
                    onChange={(e) => setAmfForm({ ...amfForm, proposalRequired: e.target.checked })}
                    className="accent-amber-400"
                  />
                  <label htmlFor="proposalCheck" className="text-xs text-slate-350 cursor-pointer font-semibold">
                    Proposal Required?
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Next Action Step</label>
                <input
                  type="text"
                  placeholder="e.g. Send website scope presentation by Monday"
                  value={amfForm.nextStep}
                  onChange={(e) => setAmfForm({ ...amfForm, nextStep: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              {/* Schedule FollowUp Call */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <label className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amfForm.scheduleFollowUp}
                    onChange={(e) => setAmfForm({ ...amfForm, scheduleFollowUp: e.target.checked })}
                    className="accent-amber-400"
                  />
                  <span>Schedule follow-up call immediately?</span>
                </label>

                {amfForm.scheduleFollowUp && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850 animate-in fade-in duration-200">
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-1">Follow-up Date</span>
                      <input
                        type="date"
                        required
                        value={amfForm.followUpDate}
                        onChange={(e) => setAmfForm({ ...amfForm, followUpDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 py-1.5 px-2 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-1">Time</span>
                      <input
                        type="time"
                        required
                        value={amfForm.followUpTime}
                        onChange={(e) => setAmfForm({ ...amfForm, followUpTime: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 py-1.5 px-2 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAmfOpen(false);
                    setSelectedMeeting(null);
                  }}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-black rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Submitting..." : "Save AMF Summary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
