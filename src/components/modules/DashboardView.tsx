import React from "react";
import {
  Users,
  Calendar,
  Video,
  FileText,
  TrendingUp,
  Flame,
  Award,
  Zap,
  Activity,
  PhoneCall,
  ChevronRight,
  MessageSquare,
  MapPin,
  Clock,
  PlusCircle,
  FileCheck,
  IndianRupee
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DashboardViewProps {
  clients: any[];
  activities: any[];
  followUps: any[];
  meetings: any[];
  proposals: any[];
  targets: any[];
  userRole: string;
  userEmail: string;
  userName: string;
  setActiveTab: (tab: string) => void;
  onOpenAddLead?: () => void;
}

export default function DashboardView({
  clients,
  activities,
  followUps,
  meetings,
  proposals,
  targets,
  userRole,
  userEmail,
  userName,
  setActiveTab,
  onOpenAddLead
}: DashboardViewProps) {
  
  // Date Helpers
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  // Filter lists based on role
  const isBdm = userRole === "bdm" || userRole === "telecaller";
  const myClients = isBdm ? clients.filter(c => c.dealOwnerEmail === userEmail) : clients;
  const myFollowUps = isBdm ? followUps.filter(f => f.client?.dealOwnerEmail === userEmail) : followUps;
  const myMeetings = isBdm ? meetings.filter(m => m.assignedTo === userEmail || m.client?.dealOwnerEmail === userEmail) : meetings;
  const myProposals = isBdm ? proposals.filter(p => p.sentBy === userEmail || p.client?.dealOwnerEmail === userEmail) : proposals;
  const myActivities = isBdm ? activities.filter(a => a.userEmail === userEmail) : activities;

  // Basic Metrics
  const totalProspects = myClients.length;
  
  const newLeadsToday = myClients.filter(c => {
    const d = new Date(c.createdAt);
    return d >= todayStart && d <= todayEnd;
  }).length;

  const followUpsDueToday = myFollowUps.filter(f => {
    const d = new Date(f.date);
    return d >= todayStart && d <= todayEnd && f.status === "Pending";
  }).length;

  const meetingsBookedToday = myMeetings.filter(m => {
    const d = new Date(m.date);
    return d >= todayStart && d <= todayEnd;
  }).length;

  // Monthly revenue calculations (collected revenue)
  const monthlyRevenueCollected = myClients.reduce((sum, c) => {
    const d = new Date(c.updatedAt);
    if (c.status === "Closed Won" && d >= thisMonthStart) {
      const adv = c.advanceAmount || 0;
      const bal = c.paymentStatus === "Fully collected" || c.paymentStatus === "Fully Paid" ? c.balanceAmount : 0;
      return sum + adv + bal;
    }
    return sum;
  }, 0);

  // Targets KPI
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();
  
  const bdmTargets = targets.filter(t => t.month === currentMonthNum && t.year === currentYearNum);
  const myTargetObj = bdmTargets.find(t => t.bdmEmail === userEmail);

  // Summarize overall targets
  const targetRevenue = isBdm ? (myTargetObj?.revenueTarget || 400000) : (bdmTargets.reduce((s, t) => s + t.revenueTarget, 0) || 400000);
  const achievedPercent = Math.min(Math.round((monthlyRevenueCollected / targetRevenue) * 100), 100) || 0;

  // Today's Followups matching exact styling
  const todayFollowUpsList = myFollowUps.filter(f => {
    const d = new Date(f.date);
    return d >= todayStart && d <= todayEnd && f.status === "Pending";
  }).slice(0, 3);

  // Hot Leads matching exact styling
  const hotLeadsList = myClients.filter(c => c.temperature === "Hot" && c.status !== "Closed Won" && c.status !== "Closed Lost").slice(0, 3);

  // Pipeline Counts for pipeline summary
  const getStageCount = (stage: string) => {
    return myClients.filter(c => c.status === stage).length;
  };

  const [greeting, setGreeting] = React.useState("Good day");
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good morning");
    else if (hr < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    
    setIsMounted(true);
  }, []);

  const statusPieData = [
    { name: "New", value: getStageCount("New Prospect"), color: "#fBBF24" },
    { name: "Contacted", value: getStageCount("Contacted"), color: "#60a5fa" },
    { name: "Interested", value: getStageCount("Interested"), color: "#f97316" },
    { name: "Meeting", value: getStageCount("Meeting Scheduled"), color: "#a78bfa" },
    { name: "Proposal", value: getStageCount("Proposal Sent") + getStageCount("Proposal Required"), color: "#06b6d4" },
    { name: "Negotiation", value: getStageCount("Negotiation"), color: "#c084fc" },
    { name: "Won", value: getStageCount("Closed Won"), color: "#34d399" },
    { name: "Lost", value: getStageCount("Closed Lost"), color: "#f87171" }
  ].filter(item => item.value > 0);

  const getFollowUpBadgeColor = (type: string) => {
    switch (type) {
      case "Call": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Meeting": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans pb-10">
      
      {/* 1. Header Greeting Section */}
      <div className="flex justify-between items-center gap-4 bg-slate-900 border border-slate-800 p-4 md:p-5 rounded-2xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
        <div className="min-w-0">
          <h2 className="text-lg md:text-2xl font-light text-white leading-tight">
            {greeting}
            {userName && !userName.toLowerCase().includes("tester") && (
              <>
                , <span className="text-amber-400 font-extrabold">{userName}</span>
              </>
            )} 👋
          </h2>
          <p className="text-[10px] md:text-xs text-slate-450 mt-1 flex items-center space-x-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-semibold text-slate-350">{userRole === "admin" ? "Founder & Admin" : "Goa BDM"}</span>
          </p>
        </div>
        
        {/* Buttons / Badges */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => {
              setActiveTab("leads");
              if (onOpenAddLead) onOpenAddLead();
            }}
            className="flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-500 text-black px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-bold transition-all active:scale-95 text-[10px] md:text-xs shadow-md cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Add Client</span>
          </button>
          
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950/60 border border-slate-850 px-3.5 py-2.5 rounded-xl">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wider">CRM Active</span>
          </div>
        </div>
      </div>

      {/* 2. Monthly Target vs Achieved Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-center pb-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Monthly Target vs Achieved</span>
          <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 border border-slate-850 rounded-lg">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3.5 sm:gap-4 mt-4 pb-4 border-b border-slate-800/60">
          <div className="flex justify-between items-center sm:block">
            <span className="text-slate-400 text-xs sm:text-[10px]">Target</span>
            <span className="text-lg font-black text-white mt-0.5 sm:mt-1">₹{targetRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center sm:block">
            <span className="text-slate-400 text-xs sm:text-[10px]">Achieved</span>
            <span className="text-lg font-black text-emerald-450 mt-0.5 sm:mt-1">₹{monthlyRevenueCollected.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center sm:block sm:text-right">
            <span className="text-slate-400 text-xs sm:text-[10px] sm:block">Achievement</span>
            <span className="text-lg font-black text-amber-400 mt-0.5 sm:mt-1">{achievedPercent}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${achievedPercent}%` }} />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>₹{Math.max(0, targetRevenue - monthlyRevenueCollected).toLocaleString()} more to go</span>
          </div>
        </div>
      </div>

      {/* 3. Stats Grid (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* New Leads */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 md:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center space-y-2.5 sm:space-y-0 sm:space-x-3.5 shadow-md">
          <div className="p-2 md:p-2.5 bg-amber-400/10 rounded-lg md:rounded-xl border border-amber-400/20 text-amber-400 shrink-0">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase block tracking-wider">New Leads</span>
            <span className="text-lg md:text-xl font-black text-white block mt-0.5 leading-none">{totalProspects}</span>
            <span className="text-[8px] md:text-[9px] text-emerald-450 font-bold block mt-1.5 leading-none">
              +{newLeadsToday} added today
            </span>
          </div>
        </div>

        {/* Meetings */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 md:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center space-y-2.5 sm:space-y-0 sm:space-x-3.5 shadow-md">
          <div className="p-2 md:p-2.5 bg-blue-500/10 rounded-lg md:rounded-xl border border-blue-500/20 text-blue-400 shrink-0">
            <Video className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Meetings</span>
            <span className="text-lg md:text-xl font-black text-white block mt-0.5 leading-none">{myMeetings.filter(m => m.status === "Completed").length}</span>
            <span className="text-[8px] md:text-[9px] text-blue-450 font-bold block mt-1.5 leading-none">
              {meetingsBookedToday} booked today
            </span>
          </div>
        </div>

        {/* Proposals */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 md:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center space-y-2.5 sm:space-y-0 sm:space-x-3.5 shadow-md">
          <div className="p-2 md:p-2.5 bg-indigo-500/10 rounded-lg md:rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
            <FileText className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Proposals</span>
            <span className="text-lg md:text-xl font-black text-white block mt-0.5 leading-none">{myProposals.length}</span>
            <span className="text-[8px] md:text-[9px] text-indigo-400 font-bold block mt-1.5 leading-none">
              In negotiation stages
            </span>
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 md:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center space-y-2.5 sm:space-y-0 sm:space-x-3.5 shadow-md">
          <div className="p-2 md:p-2.5 bg-emerald-500/10 rounded-lg md:rounded-xl border border-emerald-500/20 text-emerald-450 shrink-0">
            <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Revenue Count</span>
            <span className="text-lg md:text-xl font-black text-white block mt-0.5 leading-none">₹{monthlyRevenueCollected.toLocaleString()}</span>
            <span className="text-[8px] md:text-[9px] text-emerald-450 font-bold block mt-1.5 leading-none">
              Collected this month
            </span>
          </div>
        </div>

      </div>

      {/* 4. Today's Follow-Ups Section */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Today's Follow-Ups</h3>
          <button onClick={() => setActiveTab("followups")} className="text-[10px] text-amber-400 font-bold hover:underline">
            View all
          </button>
        </div>

        <div className="space-y-3">
          {todayFollowUpsList.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No followups scheduled for today.</p>
          ) : (
            todayFollowUpsList.map(fu => {
              const fuTime = new Date(fu.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={fu.id} className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{fu.client?.businessName || "Unknown"}</h4>
                    <span className="text-[10px] text-slate-450 block truncate mt-0.5">
                      {fu.client?.category || "Other"} • {fu.client?.area || "N/A"} • {fu.client?.city || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">{fuTime}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getFollowUpBadgeColor(fu.type)}`}>
                      {fu.type}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Hot Leads Section */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Hot Leads</h3>
          <button onClick={() => setActiveTab("leads")} className="text-[10px] text-amber-400 font-bold hover:underline">
            View all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {hotLeadsList.length === 0 ? (
            <p className="text-xs text-slate-500 py-2 sm:col-span-3">No hot leads found.</p>
          ) : (
            hotLeadsList.map(lead => {
              let interests: string[] = [];
              try {
                interests = JSON.parse(lead.serviceInterests || "[]");
              } catch (e) {
                interests = [];
              }
              return (
                <div key={lead.id} className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start space-x-1.5">
                      <Flame className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <h4 className="text-xs font-bold text-white truncate">{lead.businessName}</h4>
                    </div>
                    <span className="text-[9px] text-slate-450 uppercase font-bold block mt-1">{lead.category || "General"}</span>
                    {interests.length > 0 && (
                      <span className="inline-block mt-2 text-[9px] bg-amber-400/5 text-amber-400 px-2 py-0.5 border border-amber-400/10 rounded">
                        Interested in {interests[0]}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-850 text-[10px] text-slate-400">
                    Stage: <span className="text-white font-bold">{lead.status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Quick Actions Grid */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800/80 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => {
              setActiveTab("leads");
              if (onOpenAddLead) onOpenAddLead();
            }}
            className="flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-850 hover:border-amber-400/30 rounded-xl text-center transition-all group cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-slate-350">Add Prospect</span>
          </button>
          
          <button
            onClick={() => setActiveTab("followups")}
            className="flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-850 hover:border-amber-400/30 rounded-xl text-center transition-all group"
          >
            <PhoneCall className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-slate-350">Log Call</span>
          </button>

          <button
            onClick={() => setActiveTab("meetings")}
            className="flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-850 hover:border-amber-400/30 rounded-xl text-center transition-all group"
          >
            <Video className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-slate-350">Book Meeting</span>
          </button>

          <button
            onClick={() => setActiveTab("proposals")}
            className="flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-850 hover:border-amber-400/30 rounded-xl text-center transition-all group"
          >
            <FileCheck className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-slate-350">Send Proposal</span>
          </button>
        </div>
      </div>

      {/* 7. Pipeline Summary Chart */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pipeline Summary</h3>
          <button onClick={() => setActiveTab("leads")} className="text-[10px] text-amber-400 font-bold hover:underline">
            View full pipeline
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
          {/* Donut Chart Container */}
          <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
            {isMounted && statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xs">
                No active leads
              </div>
            )}
            
            {statusPieData.length > 0 && (
              <div className="absolute text-center flex flex-col justify-center">
                <span className="text-2xl font-black text-white">{totalProspects}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Total</span>
              </div>
            )}
          </div>

          {/* Legends */}
          <div className="flex-1 w-full">
            {statusPieData.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {statusPieData.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-slate-950/40 border border-slate-850 p-2 rounded-xl transition-all hover:border-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-350 truncate">
                      {item.name}: <strong className="text-white font-black">{item.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-505 text-xs text-center py-4">
                Add clients to build your sales funnel pipeline.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
