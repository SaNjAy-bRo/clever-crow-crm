import React, { useState } from "react";
import {
  Target,
  Plus,
  Users,
  Phone,
  Video,
  FileText,
  IndianRupee,
  Calendar,
  AlertCircle,
  TrendingUp,
  Percent
} from "lucide-react";

interface TargetsViewProps {
  clients: any[];
  targets: any[];
  whitelist: any[];
  userRole: string;
  userEmail: string;
  onSaveTarget: (target: any) => Promise<void>;
}

export default function TargetsView({
  clients,
  targets,
  whitelist,
  userRole,
  userEmail,
  onSaveTarget
}: TargetsViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const initialFormState = {
    bdmEmail: "",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    revenueTarget: "300000",
    prospectTarget: "700",
    callTarget: "500",
    meetingTarget: "25",
    proposalTarget: "10",
    collectionTarget: "200000"
  };

  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const bdmList = whitelist.filter(u => u.role === "bdm" || u.role === "admin" || u.role === "manager");

  const months = [
    { val: 1, label: "January" }, { val: 2, label: "February" }, { val: 3, label: "March" },
    { val: 4, label: "April" }, { val: 5, label: "May" }, { val: 6, label: "June" },
    { val: 7, label: "July" }, { val: 8, label: "August" }, { val: 9, label: "September" },
    { val: 10, label: "October" }, { val: 11, label: "November" }, { val: 12, label: "December" }
  ];

  const years = [2026, 2027, 2028];

  const isAdminOrManager = userRole === "admin" || userRole === "manager";

  // Filter target list based on selected Month/Year
  const monthlyTargets = targets.filter(t => t.month === selectedMonth && t.year === selectedYear);
  const myTargetList = isAdminOrManager
    ? monthlyTargets
    : monthlyTargets.filter(t => t.bdmEmail === userEmail);

  // Function to calculate achievements for a BDM
  const getBdmAchievement = (email: string) => {
    // 1. Filter BDM clients
    const bdmClients = clients.filter(c => c.dealOwnerEmail === email);
    
    // 2. Count prospects added this month
    const thisMonthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const thisMonthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

    const prospectsAdded = bdmClients.filter(c => {
      const d = new Date(c.createdAt);
      return d >= thisMonthStart && d <= thisMonthEnd;
    }).length;

    // 3. Count closed won revenue collected
    const collectedRevenue = bdmClients.reduce((sum, c) => {
      const d = new Date(c.updatedAt);
      if (c.status === "Closed Won" && d >= thisMonthStart && d <= thisMonthEnd) {
        const adv = c.advanceAmount || 0;
        const bal = c.paymentStatus === "Fully collected" || c.paymentStatus === "Fully Paid" ? c.balanceAmount : 0;
        return sum + adv + bal;
      }
      return sum;
    }, 0);

    // 4. Count proposals sent
    const wonCount = bdmClients.filter(c => c.status === "Closed Won").length;

    return {
      prospects: prospectsAdded,
      revenue: collectedRevenue,
      won: wonCount
    };
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bdmEmail || !form.month || !form.year) {
      setError("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onSaveTarget(form);
      setIsAddOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save target");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Targets & KPIs</h2>
          <p className="text-xs text-slate-400 mt-1">Assign and monitor monthly sales goals, BDM performance metrics, and revenue achievements.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Month select */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-slate-905 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
          </select>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-slate-905 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {isAdminOrManager && (
            <button
              onClick={() => {
                setForm(initialFormState);
                setIsAddOpen(true);
              }}
              className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-black px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-xs shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Target</span>
            </button>
          )}
        </div>
      </div>

      {/* Targets Progress Bars */}
      <div className="space-y-6">
        {myTargetList.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-850 rounded-2xl">
            <Target className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-xs mt-3">No targets set for {months.find(m => m.val === selectedMonth)?.label} {selectedYear}.</p>
          </div>
        ) : (
          myTargetList.map(target => {
            const ach = getBdmAchievement(target.bdmEmail);
            
            // Progress percentage
            const revPercent = Math.min(Math.round((ach.revenue / target.revenueTarget) * 100), 100) || 0;
            const prospectPercent = Math.min(Math.round((ach.prospects / target.prospectTarget) * 100), 100) || 0;

            return (
              <div key={target.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-md">
                
                {/* BDM Details Header */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white block">{target.bdmEmail}</h3>
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                      Target Period: {months.find(m => m.val === target.month)?.label} {target.year}
                    </span>
                  </div>
                  <span className="text-[11px] bg-amber-400/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-400/20 font-extrabold">
                    {revPercent}% revenue achieved
                  </span>
                </div>

                {/* Progress Indicators Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Revenue Collected Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-400">
                        <IndianRupee className="w-4 h-4 text-emerald-400" />
                        <span>Collected Revenue Target</span>
                      </div>
                      <span className="font-bold text-white">
                        ₹{ach.revenue.toLocaleString()} / ₹{target.revenueTarget.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${revPercent}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Achieved: {revPercent}%</span>
                      <span>Remaining: ₹{Math.max(0, target.revenueTarget - ach.revenue).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Prospects Added Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-400">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>Prospects Added Target</span>
                      </div>
                      <span className="font-bold text-white">
                        {ach.prospects} / {target.prospectTarget}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${prospectPercent}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Achieved: {prospectPercent}%</span>
                      <span>Remaining: {Math.max(0, target.prospectTarget - ach.prospects)} leads</span>
                    </div>
                  </div>

                </div>

                {/* Sub KPI Stats counts */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-950/65 rounded-2xl border border-slate-850">
                  <div className="text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Calls Target</span>
                    <span className="text-sm font-bold text-white block mt-1">{target.callTarget}+</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Meetings Target</span>
                    <span className="text-sm font-bold text-white block mt-1">{target.meetingTarget}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Proposals Target</span>
                    <span className="text-sm font-bold text-white block mt-1">{target.proposalTarget}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Deals Won</span>
                    <span className="text-sm font-bold text-emerald-450 block mt-1">{ach.won}</span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Target Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Assign Monthly BDM Targets</h3>
            
            <form onSubmit={handleSaveSubmit} className="mt-4 space-y-4">
              {error && <p className="text-xs text-red-400">{error}</p>}

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Select BDM *</label>
                <select
                  value={form.bdmEmail}
                  onChange={(e) => setForm({ ...form, bdmEmail: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">-- Select BDM --</option>
                  {bdmList.map(b => (
                    <option key={b.email} value={b.email}>{b.name || b.email} ({b.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Target Month *</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {months.map(m => <option key={m.val} value={String(m.val)}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Target Year *</label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Revenue Target (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.revenueTarget}
                    onChange={(e) => setForm({ ...form, revenueTarget: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Collection Target (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.collectionTarget}
                    onChange={(e) => setForm({ ...form, collectionTarget: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block mb-1">Prospects Target</label>
                  <input
                    type="number"
                    value={form.prospectTarget}
                    onChange={(e) => setForm({ ...form, prospectTarget: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-1.5 px-2.5 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block mb-1">Calls Target</label>
                  <input
                    type="number"
                    value={form.callTarget}
                    onChange={(e) => setForm({ ...form, callTarget: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-1.5 px-2.5 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block mb-1">Meetings Target</label>
                  <input
                    type="number"
                    value={form.meetingTarget}
                    onChange={(e) => setForm({ ...form, meetingTarget: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-1.5 px-2.5 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
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
                  {isSubmitting ? "Assigning..." : "Assign Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
