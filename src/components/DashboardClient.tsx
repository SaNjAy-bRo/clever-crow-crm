"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/modules/Sidebar";
import DashboardView from "@/components/modules/DashboardView";
import LeadsView from "@/components/modules/LeadsView";
import FollowUpsView from "@/components/modules/FollowUpsView";
import MeetingsView from "@/components/modules/MeetingsView";
import ProposalsView from "@/components/modules/ProposalsView";
import DealsView from "@/components/modules/DealsView";
import TargetsView from "@/components/modules/TargetsView";
import ClientsView from "@/components/modules/ClientsView";
import ActivitiesView from "@/components/modules/ActivitiesView";
import ReportsView from "@/components/modules/ReportsView";
import TemplatesView from "@/components/modules/TemplatesView";
import WhitelistView from "@/components/modules/WhitelistView";
import { Menu, Zap, LayoutGrid, Users, Calendar, Video, MoreHorizontal, Sun, Moon } from "lucide-react";

interface Client {
  id: string;
  name: string;
  phoneNumber: string;
  businessName: string;
  address: string;
  notes: string;
  serviceDetails: string;
  status: string;
  value: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  dealValue?: number;
  advanceAmount?: number;
  balanceAmount?: number;
  paymentStatus?: string;
  invoiceStatus?: string;
  gstRequired?: boolean;
  collectionDate?: string | null;
  expectedBalanceDate?: string | null;
  dealOwnerEmail?: string | null;
  incentiveEligible?: boolean;
  dealStatus?: string | null;
  score?: number;
  temperature?: string;
  lostReason?: string | null;
  isConvertedClient?: boolean;
  clientStartDate?: string | null;
  projectManager?: string | null;
  projectStatus?: string | null;
  renewalDate?: string | null;
  onboardingChecklist?: string;
}

interface ActivityLog {
  id: string;
  clientId: string | null;
  userEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

interface WhitelistEntry {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

interface DashboardClientProps {
  initialClients: Client[];
  initialActivities: ActivityLog[];
  initialWhitelist: WhitelistEntry[];
  currentUserEmail: string;
  currentUserRole: string;
  currentUserName: string;
}

export default function DashboardClient({
  initialClients,
  initialActivities,
  initialWhitelist,
  currentUserEmail,
  currentUserRole,
  currentUserName
}: DashboardClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>(initialWhitelist);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };
  
  // Custom schedules and tables state
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);

  // Navigation states
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fetch initial extra datasets
  const refreshCRMData = async () => {
    try {
      const [leadsRes, actRes, wlRes, fuRes, meetRes, propRes, targetRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/activities"),
        fetch("/api/whitelist"),
        fetch("/api/followups"),
        fetch("/api/meetings"),
        fetch("/api/proposals"),
        fetch("/api/targets")
      ]);

      if (leadsRes.ok) setClients(await leadsRes.json());
      if (actRes.ok) setActivities(await actRes.json());
      if (wlRes.ok) setWhitelist(await wlRes.json());
      if (fuRes.ok) setFollowUps(await fuRes.json());
      if (meetRes.ok) setMeetings(await meetRes.json());
      if (propRes.ok) setProposals(await propRes.json());
      if (targetRes.ok) setTargets(await targetRes.json());

    } catch (error) {
      console.error("Error loading CRM datasets:", error);
    }
  };

  useEffect(() => {
    refreshCRMData();
  }, []);

  // Compute Today's Pending Follow-ups Count for Sidebar Badge
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const isBdm = currentUserRole === "bdm" || currentUserRole === "telecaller";
  const myFollowUps = isBdm 
    ? followUps.filter(f => f.client?.dealOwnerEmail === currentUserEmail) 
    : followUps;

  const todayFollowUpCount = myFollowUps.filter(f => {
    const d = new Date(f.date);
    return d >= todayStart && d <= todayEnd && f.status === "Pending";
  }).length;

  // --- LEAD HANDLERS ---
  const handleAddLead = async (leadData: any) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create lead");
    }
    await refreshCRMData();
  };

  const handleUpdateLead = async (id: string, leadData: any) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update lead");
    }
    await refreshCRMData();
  };

  const handleDeleteLead = async (id: string) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete lead");
    }
    await refreshCRMData();
  };

  // --- FOLLOW-UP HANDLERS ---
  const handleAddFollowUp = async (fuData: any) => {
    const res = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fuData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to schedule follow-up");
    }
    await refreshCRMData();
  };

  const handleUpdateFollowUp = async (id: string, payload: any) => {
    const res = await fetch("/api/followups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update follow-up");
    }
    await refreshCRMData();
  };

  // --- MEETING HANDLERS ---
  const handleAddMeeting = async (meetData: any) => {
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meetData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to book meeting");
    }
    await refreshCRMData();
  };

  const handleUpdateMeeting = async (id: string, payload: any) => {
    const res = await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update meeting");
    }
    await refreshCRMData();
  };

  // --- PROPOSAL HANDLERS ---
  const handleAddProposal = async (propData: any) => {
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create proposal");
    }
    await refreshCRMData();
  };

  const handleUpdateProposal = async (id: string, payload: any) => {
    const res = await fetch("/api/proposals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update proposal");
    }
    await refreshCRMData();
  };

  // --- TARGET HANDLERS ---
  const handleSaveTarget = async (targetData: any) => {
    const res = await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save target");
    }
    await refreshCRMData();
  };

  // --- WHITELIST HANDLERS ---
  const handleAddWhitelist = async (wlData: any) => {
    const res = await fetch("/api/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wlData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to authorize account");
    }
    await refreshCRMData();
  };

  const handleDeleteWhitelist = async (id: string) => {
    const res = await fetch(`/api/whitelist?id=${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to remove whitelist account");
    }
    await refreshCRMData();
  };

  const handleUpdateWhitelistRole = async (id: string, role: string) => {
    const res = await fetch("/api/whitelist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update role");
    }
    await refreshCRMData();
  };

  // Switch Render View
  const renderActiveModule = () => {
    // Role-based client-side tab guards
    const tabRoleMap: Record<string, string[]> = {
      dashboard: ["admin", "manager", "bdm", "telecaller", "team_member"],
      leads: ["admin", "manager", "bdm", "telecaller"],
      followups: ["admin", "manager", "bdm"],
      meetings: ["admin", "manager", "bdm", "telecaller"],
      proposals: ["admin", "manager", "bdm", "team_member"],
      deals: ["admin", "manager", "bdm"],
      targets: ["admin", "manager", "bdm"],
      clients: ["admin", "manager", "bdm", "team_member"],
      activities: ["admin", "manager", "bdm"],
      reports: ["admin", "manager"],
      templates: ["admin", "manager", "bdm", "telecaller"],
      whitelist: ["admin"]
    };

    const allowedRoles = tabRoleMap[activeTab] || [];
    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUserRole)) {
      // Fallback component if tab is restricted for this user role
      return (
        <DashboardView
          clients={clients}
          activities={activities}
          followUps={followUps}
          meetings={meetings}
          proposals={proposals}
          targets={targets}
          userRole={currentUserRole}
          userEmail={currentUserEmail}
          userName={currentUserName}
          setActiveTab={setActiveTab}
          onOpenAddLead={() => setIsAddLeadOpen(true)}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            clients={clients}
            activities={activities}
            followUps={followUps}
            meetings={meetings}
            proposals={proposals}
            targets={targets}
            userRole={currentUserRole}
            userEmail={currentUserEmail}
            userName={currentUserName}
            setActiveTab={setActiveTab}
            onOpenAddLead={() => setIsAddLeadOpen(true)}
          />
        );
      case "leads":
        return (
          <LeadsView
            clients={clients}
            userRole={currentUserRole}
            userEmail={currentUserEmail}
            whitelist={whitelist}
            onAddLead={handleAddLead}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            isAddOpen={isAddLeadOpen}
            setIsAddOpen={setIsAddLeadOpen}
          />
        );
      case "followups":
        return (
          <FollowUpsView
            clients={clients}
            followUps={followUps}
            userRole={currentUserRole}
            userEmail={currentUserEmail}
            onAddFollowUp={handleAddFollowUp}
            onUpdateFollowUp={handleUpdateFollowUp}
          />
        );
      case "meetings":
        return (
          <MeetingsView
            clients={clients}
            meetings={meetings}
            userRole={currentUserRole}
            userEmail={currentUserEmail}
            onAddMeeting={handleAddMeeting}
            onUpdateMeeting={handleUpdateMeeting}
            onAddFollowUp={handleAddFollowUp}
          />
        );
      case "proposals":
        return (
          <ProposalsView
            clients={clients}
            proposals={proposals}
            userRole={currentUserRole}
            userEmail={currentUserEmail}
            onAddProposal={handleAddProposal}
            onUpdateProposal={handleUpdateProposal}
          />
        );
      case "deals":
        return (
          <DealsView
            clients={clients}
            userRole={currentUserRole}
            userEmail={currentUserEmail}
            onUpdateLead={handleUpdateLead}
          />
        );
      case "targets":
        return (
          <TargetsView
            clients={clients}
            targets={targets}
            whitelist={whitelist}
            userRole={currentUserRole}
            userEmail={currentUserEmail}
            onSaveTarget={handleSaveTarget}
          />
        );
      case "clients":
        return (
          <ClientsView
            clients={clients}
            userRole={currentUserRole}
            userEmail={currentUserEmail}
            onUpdateLead={handleUpdateLead}
          />
        );
      case "activities":
        return (
          <ActivitiesView
            activities={activities}
            whitelist={whitelist}
            userRole={currentUserRole}
          />
        );
      case "reports":
        return (
          <ReportsView
            clients={clients}
            activities={activities}
            followUps={followUps}
            meetings={meetings}
            proposals={proposals}
            targets={targets}
            userRole={currentUserRole}
          />
        );
      case "templates":
        return <TemplatesView />;
      case "whitelist":
        return (
          <WhitelistView
            whitelist={whitelist}
            currentUserEmail={currentUserEmail}
            onAddWhitelist={handleAddWhitelist}
            onDeleteWhitelist={handleDeleteWhitelist}
            onUpdateRole={handleUpdateWhitelistRole}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Module under construction
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={currentUserRole}
        userEmail={currentUserEmail}
        userName={currentUserName}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        todayFollowUpCount={todayFollowUpCount}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Navbar Header on Mobile / Small screens */}
        <header className="flex md:hidden items-center justify-between p-4 bg-[#ffffff] border-b border-[#e2e8f0] shrink-0">
          <div className="flex items-center space-x-2">
            <img src="/logo-1.png" alt="Logo" className="h-12 w-auto object-contain" />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] transition-all cursor-pointer border border-[#e2e8f0]"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-xl bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] transition-all border border-[#e2e8f0]"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Client view content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {renderActiveModule()}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 p-2.5 shrink-0">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === "dashboard" ? "text-amber-400 font-bold" : "text-slate-405 text-slate-400"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-[9px] mt-1">Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab("leads")}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === "leads" ? "text-amber-400 font-bold" : "text-slate-405 text-slate-400"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[9px] mt-1">Leads</span>
          </button>
          
          <button
            onClick={() => setActiveTab("followups")}
            className={`flex flex-col items-center justify-center flex-1 relative ${
              activeTab === "followups" ? "text-amber-400 font-bold" : "text-slate-405 text-slate-400"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[9px] mt-1">Follow-Ups</span>
            {todayFollowUpCount > 0 && (
              <span className="absolute top-1 right-6 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("meetings")}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === "meetings" ? "text-amber-400 font-bold" : "text-slate-455 text-slate-400"
            }`}
          >
            <Video className="w-4 h-4" />
            <span className="text-[9px] mt-1">Meetings</span>
          </button>
          
          <button
            onClick={() => setIsMobileOpen(true)}
            className="flex flex-col items-center justify-center flex-1 text-slate-400"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[9px] mt-1">More</span>
          </button>
        </nav>
      </div>

    </div>
  );
}
