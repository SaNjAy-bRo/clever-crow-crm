import React, { useState } from "react";
import { History, Search, Filter, Phone, MessageSquare, Video, FileText, CheckCircle, Plus } from "lucide-react";

interface ActivitiesViewProps {
  activities: any[];
  whitelist: any[];
  userRole: string;
}

export default function ActivitiesView({ activities, whitelist, userRole }: ActivitiesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [bdmFilter, setBdmFilter] = useState("all");

  const bdmList = whitelist.filter(u => u.role === "bdm" || u.role === "admin" || u.role === "manager");

  const filteredActivities = activities.filter(act => {
    const matchesSearch = 
      act.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBdm = bdmFilter === "all" || act.userEmail === bdmFilter;

    return matchesSearch && matchesBdm;
  });

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("call")) return Phone;
    if (act.includes("whatsapp")) return MessageSquare;
    if (act.includes("meeting")) return Video;
    if (act.includes("proposal")) return FileText;
    if (act.includes("completed") || act.includes("closed")) return CheckCircle;
    return Plus;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">BDM Activities Log</h2>
        <p className="text-xs text-slate-400 mt-1">Audit trail of all BDM updates, calls connected, check-ins, and deals closed.</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        {userRole !== "bdm" && (
          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={bdmFilter}
              onChange={(e) => setBdmFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 py-2 px-4 rounded-xl text-xs text-slate-350 focus:outline-none"
            >
              <option value="all">All BDMs</option>
              {bdmList.map(b => <option key={b.email} value={b.email}>{b.name || b.email}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Log Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-md max-h-[calc(100vh-16rem)] overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-10 h-10 text-slate-650 mx-auto" />
            <p className="text-slate-400 text-xs mt-3">No activity logs recorded.</p>
          </div>
        ) : (
          filteredActivities.map(act => {
            const Icon = getActionIcon(act.action);
            const d = new Date(act.createdAt);
            const dateStr = d.toLocaleDateString();
            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={act.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-start space-x-4 hover:border-slate-800 transition-all">
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-850 text-amber-400 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-white block">{act.action}</span>
                    <span className="text-[9px] text-slate-500 shrink-0 font-medium">{dateStr} at {timeStr}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{act.details}</p>
                  <div className="flex items-center space-x-1.5 mt-2.5 text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                    <span>Logged By:</span>
                    <span className="text-slate-400">{act.userEmail}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
