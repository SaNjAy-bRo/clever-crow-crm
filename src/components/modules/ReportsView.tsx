import React, { useState } from "react";
import {
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Users,
  CheckCircle,
  FileText,
  Clock,
  Briefcase,
  Activity,
  Award
} from "lucide-react";

interface ReportsViewProps {
  clients: any[];
  activities: any[];
  followUps: any[];
  meetings: any[];
  proposals: any[];
  targets: any[];
  userRole: string;
}

export default function ReportsView({
  clients,
  activities,
  followUps,
  meetings,
  proposals,
  targets,
  userRole
}: ReportsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"daily" | "weekly" | "monthly">("daily");

  // Date constants
  const now = new Date();
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Helper: Export to CSV (Client-side)
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 1. DAILY REPORT CALCULATIONS ---
  const dailyLeadsAdded = clients.filter(c => new Date(c.createdAt) >= todayStart).length;
  
  const dailyCalls = activities.filter(a => {
    const isCall = a.action.toLowerCase().includes("call") || a.details.toLowerCase().includes("call");
    return new Date(a.createdAt) >= todayStart && isCall;
  });

  const dailyWhatsapp = activities.filter(a => {
    const isWa = a.action.toLowerCase().includes("whatsapp") || a.details.toLowerCase().includes("whatsapp");
    return new Date(a.createdAt) >= todayStart && isWa;
  });

  const dailyMeetingsBooked = meetings.filter(m => new Date(m.createdAt) >= todayStart).length;
  const dailyFollowupsDone = followUps.filter(f => new Date(f.updatedAt) >= todayStart && f.status === "Completed").length;
  const dailyHotLeadsCreated = clients.filter(c => new Date(c.createdAt) >= todayStart && c.temperature === "Hot").length;

  const exportDailyReport = () => {
    const data = [{
      "Report Date": now.toLocaleDateString(),
      "Leads Added": dailyLeadsAdded,
      "Calls Made": dailyCalls.length,
      "WhatsApp Sent": dailyWhatsapp.length,
      "Meetings Booked": dailyMeetingsBooked,
      "Follow-ups Completed": dailyFollowupsDone,
      "Hot Leads Created": dailyHotLeadsCreated
    }];
    downloadCSV(data, `Daily_Sales_Report_${now.toISOString().split("T")[0]}`);
  };

  // --- 2. WEEKLY REPORT CALCULATIONS ---
  const weeklyLeadsAdded = clients.filter(c => new Date(c.createdAt) >= startOfWeek).length;
  const weeklyMeetingsDone = meetings.filter(m => new Date(m.date) >= startOfWeek && m.status === "Completed").length;
  const weeklyProposalsSent = proposals.filter(p => new Date(p.date) >= startOfWeek && p.status === "Sent").length;
  
  const weeklyPipeline = clients.filter(c => new Date(c.createdAt) >= startOfWeek).reduce((s, c) => s + (c.dealValue || c.value || 0), 0);
  
  const weeklyRevenueWon = clients.filter(c => {
    const isWon = c.status === "Closed Won";
    const isRecent = new Date(c.updatedAt) >= startOfWeek;
    return isWon && isRecent;
  }).reduce((s, c) => s + (c.advanceAmount || 0) + (c.paymentStatus === "Fully collected" ? c.balanceAmount : 0), 0);

  const weeklyLostReasons = clients.filter(c => c.status === "Closed Lost" && new Date(c.updatedAt) >= startOfWeek).map(c => ({
    Lead: c.businessName,
    Reason: c.lostReason || "No details"
  }));

  const exportWeeklyReport = () => {
    const data = [{
      "Week Start": startOfWeek.toLocaleDateString(),
      "Leads Added": weeklyLeadsAdded,
      "Meetings Completed": weeklyMeetingsDone,
      "Proposals Sent": weeklyProposalsSent,
      "Pipeline Created (₹)": weeklyPipeline,
      "Revenue Closed (₹)": weeklyRevenueWon
    }];
    downloadCSV(data, `Weekly_Sales_Report_${now.toISOString().split("T")[0]}`);
  };

  // --- 3. MONTHLY REPORT CALCULATIONS ---
  const monthlyLeads = clients.filter(c => new Date(c.createdAt) >= startOfMonth && new Date(c.createdAt) <= endOfMonth);
  const monthlyWonLeads = clients.filter(c => {
    const d = c.clientStartDate ? new Date(c.clientStartDate) : new Date(c.updatedAt);
    return c.status === "Closed Won" && d >= startOfMonth && d <= endOfMonth;
  });
  const monthlyLostLeads = clients.filter(c => c.status === "Closed Lost" && new Date(c.updatedAt) >= startOfMonth && new Date(c.updatedAt) <= endOfMonth);

  const conversionRate = monthlyLeads.length > 0 
    ? Math.round((monthlyWonLeads.length / monthlyLeads.length) * 100) 
    : 0;

  const monthlyCollectedRevenue = clients.filter(c => {
    const d = c.clientStartDate ? new Date(c.clientStartDate) : new Date(c.updatedAt);
    return c.status === "Closed Won" && d >= startOfMonth && d <= endOfMonth;
  }).reduce((s, c) => s + (c.advanceAmount || 0) + (c.paymentStatus === "Fully collected" || c.paymentStatus === "Fully Paid" ? c.balanceAmount : 0), 0);

  // Group by Lead Source
  const sourcePerformance: Record<string, number> = {};
  monthlyLeads.forEach(c => {
    const s = c.source || "Other";
    sourcePerformance[s] = (sourcePerformance[s] || 0) + 1;
  });

  // Group by Industry
  const industryPerformance: Record<string, number> = {};
  monthlyLeads.forEach(c => {
    const ind = c.industry || "General";
    industryPerformance[ind] = (industryPerformance[ind] || 0) + 1;
  });

  const exportMonthlyReport = () => {
    const data = [{
      "Month": now.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      "Leads Created": monthlyLeads.length,
      "Deals Won": monthlyWonLeads.length,
      "Deals Lost": monthlyLostLeads.length,
      "Conversion Rate (%)": conversionRate,
      "Revenue Collected (₹)": monthlyCollectedRevenue
    }];
    downloadCSV(data, `Monthly_Sales_Report_${now.getFullYear()}_${now.getMonth()+1}`);
  };

  // Export raw leads to CSV
  const exportAllLeads = () => {
    const data = clients.map(c => ({
      "Business Name": c.businessName,
      "Contact Person": c.name,
      "Phone": c.phoneNumber,
      "WhatsApp": c.whatsappNumber || "",
      "Email": c.email || "",
      "City": c.city || "",
      "Category": c.category || "",
      "Source": c.source || "",
      "Pipeline Stage": c.status,
      "Deal Value": c.dealValue || c.value || 0,
      "Advance Paid": c.advanceAmount || 0,
      "Balance Due": c.balanceAmount || 0,
      "GST Required": c.gstRequired ? "Yes" : "No",
      "Owner Email": c.dealOwnerEmail || "",
      "Date Added": new Date(c.createdAt).toLocaleDateString()
    }));
    downloadCSV(data, `All_CRM_Leads_Dump_${now.toISOString().split("T")[0]}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Reports & Sales Performance</h2>
          <p className="text-xs text-slate-400 mt-1">Generate performance summaries, review BDM pipelines, and export CSV ledger sheets.</p>
        </div>

        <button
          onClick={exportAllLeads}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-750 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-xs shadow-md shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export All Leads (CSV)</span>
        </button>
      </div>

      {/* Report Type Select */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs pb-1 shrink-0">
        <button
          onClick={() => setActiveSubTab("daily")}
          className={`pb-2.5 font-bold border-b-2 px-1 transition-all ${
            activeSubTab === "daily" ? "text-amber-400 border-amber-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Daily Report Summary
        </button>
        <button
          onClick={() => setActiveSubTab("weekly")}
          className={`pb-2.5 font-bold border-b-2 px-1 transition-all ${
            activeSubTab === "weekly" ? "text-amber-400 border-amber-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Weekly Operational Metrics
        </button>
        <button
          onClick={() => setActiveSubTab("monthly")}
          className={`pb-2.5 font-bold border-b-2 px-1 transition-all ${
            activeSubTab === "monthly" ? "text-amber-400 border-amber-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Monthly Targets vs Achieved
        </button>
      </div>

      {/* Report Dashboard Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md">
        
        {activeSubTab === "daily" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Daily Action Checklist ({now.toLocaleDateString()})</h3>
              <button onClick={exportDailyReport} className="text-amber-400 flex items-center space-x-1.5 text-xs font-bold hover:underline">
                <Download className="w-3.5 h-3.5" />
                <span>Export Daily Report</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Prospects Created</span>
                <span className="text-2xl font-black text-white block mt-1">{dailyLeadsAdded}</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Outbound Calls</span>
                <span className="text-2xl font-black text-white block mt-1">{dailyCalls.length}</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">WhatsApp Sent</span>
                <span className="text-2xl font-black text-white block mt-1">{dailyWhatsapp.length}</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Follow-ups Logged</span>
                <span className="text-2xl font-black text-emerald-450 block mt-1">{dailyFollowupsDone}</span>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "weekly" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Weekly Conversion Pipeline ({startOfWeek.toLocaleDateString()} to Present)</h3>
              <button onClick={exportWeeklyReport} className="text-amber-400 flex items-center space-x-1.5 text-xs font-bold hover:underline">
                <Download className="w-3.5 h-3.5" />
                <span>Export Weekly Report</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Prospects Added</span>
                <span className="text-2xl font-black text-white block mt-1">{weeklyLeadsAdded}</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Meetings Completed</span>
                <span className="text-2xl font-black text-white block mt-1">{weeklyMeetingsDone}</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Proposals Created</span>
                <span className="text-2xl font-black text-white block mt-1">{weeklyProposalsSent}</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Revenue Closed (₹)</span>
                <span className="text-2xl font-black text-emerald-450 block mt-1">₹{weeklyRevenueWon.toLocaleString()}</span>
              </div>
            </div>

            {weeklyLostReasons.length > 0 && (
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <h4 className="text-xs font-bold text-white uppercase mb-3">Lost Deals Feedback Log</h4>
                <div className="space-y-2">
                  {weeklyLostReasons.map((l, i) => (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-slate-300 font-semibold">{l.Lead}</span>
                      <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 border border-red-500/20 rounded-full text-[10px]">
                        {l.Reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "monthly" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Monthly KPI Target Analytics</h3>
              <button onClick={exportMonthlyReport} className="text-amber-400 flex items-center space-x-1.5 text-xs font-bold hover:underline">
                <Download className="w-3.5 h-3.5" />
                <span>Export Monthly Report</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Monthly Leads Created</span>
                <span className="text-2xl font-black text-white block mt-1">{monthlyLeads.length}</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Conversion Rate</span>
                <span className="text-2xl font-black text-white block mt-1">{conversionRate}%</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Closed Deals</span>
                <span className="text-2xl font-black text-emerald-450 block mt-1">{monthlyWonLeads.length} won</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Cash Collected</span>
                <span className="text-2xl font-black text-indigo-400 block mt-1">₹{monthlyCollectedRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Best Lead sources */}
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
                <h4 className="text-xs font-bold text-white uppercase mb-3">Best Performing Lead Sources</h4>
                <div className="space-y-2">
                  {Object.entries(sourcePerformance).map(([source, count]) => (
                    <div key={source} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{source}</span>
                      <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{count} prospects</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Industry verticals */}
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
                <h4 className="text-xs font-bold text-white uppercase mb-3">Top Industry Verticals</h4>
                <div className="space-y-2">
                  {Object.entries(industryPerformance).map(([ind, count]) => (
                    <div key={ind} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{ind}</span>
                      <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{count} leads</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
