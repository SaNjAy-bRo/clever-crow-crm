"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  LogOut,
  UserPlus,
  MapPin,
  Phone,
  Briefcase,
  Clock,
  Shield,
  X,
  CheckCircle,
  BarChart2,
  FileText,
  AlertCircle,
  PlusCircle,
  Trash,
  UserCheck,
  RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from "recharts";

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
  activities?: ActivityLog[];
}

interface ActivityLog {
  id: string;
  clientId: string | null;
  userEmail: string;
  action: string;
  details: string;
  createdAt: string;
  client?: {
    name: string;
    businessName: string;
  } | null;
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
  currentUserName?: string | null;
}

const getCurrencySymbol = (code: string) => {
  return "₹";
};

const convertToINR = (value: number, currency: string) => {
  return value;
};

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
  
  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState<"clients" | "analytics" | "activities" | "whitelist">("clients");
  
  // Clients Tab Search/Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Activity History Tab Advanced Filters
  const [activitySearch, setActivitySearch] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [activityOperatorFilter, setActivityOperatorFilter] = useState("all");
  
  // Modals & Panels State
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);
  const [isAddWhitelistOpen, setIsAddWhitelistOpen] = useState(false);
  
  // Form States
  const [clientForm, setClientForm] = useState({
    name: "",
    phoneNumber: "",
    businessName: "",
    address: "",
    notes: "",
    serviceDetails: "",
    status: "lead",
    value: "0",
    currency: "INR" // Default currency is INR (Rupees)
  });
  
  const [whitelistForm, setWhitelistForm] = useState({
    email: "",
    name: "",
    role: "user"
  });
  
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hydration state for Recharts
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const refreshData = async () => {
    try {
      const clientsRes = await fetch("/api/clients");
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data);
      }
      
      const activitiesRes = await fetch("/api/activities");
      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data);
      }
      
      const whitelistRes = await fetch("/api/whitelist");
      if (whitelistRes.ok) {
        const data = await whitelistRes.json();
        setWhitelist(data);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError("");
    
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clientForm,
          value: parseFloat(clientForm.value) || 0
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create client");
      }
      
      setClientForm({
        name: "",
        phoneNumber: "",
        businessName: "",
        address: "",
        notes: "",
        serviceDetails: "",
        status: "lead",
        value: "0",
        currency: "INR"
      });
      setIsAddClientOpen(false);
      await refreshData();
    } catch (err: any) {
      setApiError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerEditClient = (client: Client) => {
    setSelectedClient(client);
    setClientForm({
      name: client.name,
      phoneNumber: client.phoneNumber,
      businessName: client.businessName,
      address: client.address,
      notes: client.notes,
      serviceDetails: client.serviceDetails,
      status: client.status,
      value: client.value.toString(),
      currency: client.currency || "INR"
    });
    setIsClientDetailsOpen(false);
    setIsEditClientOpen(true);
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    
    setIsSubmitting(true);
    setApiError("");
    
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clientForm,
          value: parseFloat(clientForm.value) || 0
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update client");
      }
      
      setIsEditClientOpen(false);
      setSelectedClient(null);
      await refreshData();
    } catch (err: any) {
      setApiError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Delete this client account permanently? This will remove all associated logs.")) return;
    
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete client");
      }
      
      setIsClientDetailsOpen(false);
      await refreshData();
    } catch (err: any) {
      alert(err.message || "An error occurred while deleting");
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError("");
    
    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(whitelistForm)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add email to whitelist");
      }
      
      setWhitelistForm({ email: "", name: "", role: "user" });
      setIsAddWhitelistOpen(false);
      await refreshData();
    } catch (err: any) {
      setApiError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveWhitelist = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from the whitelist?`)) return;
    
    try {
      const res = await fetch(`/api/whitelist?id=${id}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to remove whitelist entry");
      }
      
      await refreshData();
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  const openClientDetails = (client: Client) => {
    setSelectedClient(client);
    setIsClientDetailsOpen(true);
  };

  // Filtered Clients list
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.serviceDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.notes.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filtered Activity Logs List
  const filteredActivities = activities.filter((log) => {
    const matchesSearch = 
      log.details.toLowerCase().includes(activitySearch.toLowerCase()) ||
      log.action.toLowerCase().includes(activitySearch.toLowerCase()) ||
      (log.client?.name && log.client.name.toLowerCase().includes(activitySearch.toLowerCase())) ||
      (log.client?.businessName && log.client.businessName.toLowerCase().includes(activitySearch.toLowerCase()));
      
    const matchesOperator = activityOperatorFilter === "all" || log.userEmail.toLowerCase() === activityOperatorFilter.toLowerCase();
    
    let matchesType = true;
    if (activityTypeFilter !== "all") {
      if (activityTypeFilter === "creations") {
        matchesType = log.action === "Created Client";
      } else if (activityTypeFilter === "updates") {
        matchesType = log.action === "Updated Client" || log.action.includes("Updated");
      } else if (activityTypeFilter === "deletions") {
        matchesType = log.action === "Deleted Client" || log.action.includes("Deleted");
      } else if (activityTypeFilter === "whitelist") {
        matchesType = log.action.includes("Whitelist");
      }
    }

    return matchesSearch && matchesOperator && matchesType;
  });

  // Compile a unique list of operators from activity logs
  const operators = Array.from(new Set(activities.map(log => log.userEmail.toLowerCase())));

  // Calculate stats in INR (Rupees)
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "active").length;
  const leadClients = clients.filter(c => c.status === "lead").length;
  const completedClients = clients.filter(c => c.status === "completed").length;
  
  // Consolidated Stats in Rupees (₹)
  const totalValueINR = clients.reduce((acc, c) => acc + c.value, 0);
  const activeValueINR = clients.filter(c => c.status === "active").reduce((acc, c) => acc + c.value, 0);
  const avgValueINR = totalClients > 0 ? totalValueINR / totalClients : 0;
  const successRate = totalClients > 0 ? Math.round((completedClients / totalClients) * 100) : 0;

  // Chart Data (Values in Rupees)
  const statusChartData = [
    { name: "Leads", value: clients.filter(c => c.status === "lead").reduce((acc, c) => acc + c.value, 0) },
    { name: "Active", value: clients.filter(c => c.status === "active").reduce((acc, c) => acc + c.value, 0) },
    { name: "Completed", value: clients.filter(c => c.status === "completed").reduce((acc, c) => acc + c.value, 0) },
    { name: "Inactive", value: clients.filter(c => c.status === "inactive").reduce((acc, c) => acc + c.value, 0) }
  ];

  const statusPieData = [
    { name: "Leads", value: leadClients, color: "#3B82F6" },      // Strategy Blue
    { name: "Active", value: activeClients, color: "#FBBF24" },    // Cyber Yellow
    { name: "Completed", value: completedClients, color: "#10B981" }, // Green
    { name: "Inactive", value: clients.filter(c => c.status === "inactive").length, color: "#6B7280" } // Gray
  ].filter(item => item.value > 0);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 font-sans pb-20 md:pb-0">
      {/* Top Header */}
      <header className="hidden md:flex bg-slate-900 border-b border-slate-800 px-6 py-4 items-center justify-between">
        <img src="/CSS.svg" alt="Clever Crow Strategies Logo" className="h-9 w-9 object-contain bg-white p-1 rounded-full" />

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-sm font-semibold text-white block">
              {currentUserName || currentUserEmail.split("@")[0]}
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest flex items-center justify-end space-x-1">
              <Shield className="w-3 h-3" />
              <span>{currentUserRole}</span>
            </span>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-3.5 py-2 bg-slate-800 hover:bg-red-950/40 text-slate-350 hover:text-red-400 border border-slate-700/50 hover:border-red-900/50 rounded-xl transition-all text-xs font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center">
          <img src="/CSS.svg" alt="Clever Crow Strategies Logo" className="h-8 w-8 object-contain bg-white p-1 rounded-full" />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs font-bold text-slate-400 hover:text-red-400 flex items-center space-x-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Container */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-5 md:space-y-6">
        
        {/* Navigation Tabs */}
        <div className="hidden md:flex justify-between items-center bg-slate-900 p-2 rounded-2xl border border-slate-800/80">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab("clients")}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "clients" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clients List</span>
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "activities" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Activity History</span>
            </button>
            <button
              onClick={() => setActiveTab("whitelist")}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "whitelist" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Access Whitelist</span>
            </button>
          </div>

          <div>
            {activeTab === "clients" && (
              <button
                onClick={() => {
                  setApiError("");
                  setIsAddClientOpen(true);
                }}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Add Client</span>
              </button>
            )}
            {activeTab === "whitelist" && currentUserRole === "admin" && (
              <button
                onClick={() => {
                  setApiError("");
                  setIsAddWhitelistOpen(true);
                }}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
              >
                <UserPlus className="w-4 h-4" />
                <span>Whitelist Email</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content 1: Clients List */}
        {activeTab === "clients" && (
          <div className="space-y-5 md:space-y-6">
            
            {/* Stats Summary Cards (INR Rupees Based) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 md:gap-4">
              
              {/* Card 1: Total Accounts */}
              <div className="bg-slate-900 border border-slate-800/80 p-4 md:p-5 rounded-2xl relative overflow-hidden">
                <span className="text-xs font-normal text-slate-400 uppercase tracking-wider">Total Clients</span>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mt-1">{totalClients}</h3>
                <div className="mt-2 text-[10px] md:text-xs text-slate-400 flex items-center space-x-1.5">
                  <span className="text-emerald-400 font-semibold">{activeClients} Active</span>
                  <span>•</span>
                  <span>{leadClients} Leads</span>
                </div>
              </div>

              {/* Card 2: Revenue Pipeline */}
              <div className="bg-slate-900 border border-slate-800/80 p-4 md:p-5 rounded-2xl relative overflow-hidden">
                <span className="text-xs font-normal text-slate-400 uppercase tracking-wider">Pipeline</span>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-light text-amber-400 mt-1">
                  ₹{totalValueINR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h3>
                <div className="mt-2 text-[10px] md:text-xs text-slate-400">
                  Total value in Rupees
                </div>
              </div>

              {/* Card 3: Avg Deal */}
              <div className="bg-slate-900 border border-slate-800/80 p-4 md:p-5 rounded-2xl relative overflow-hidden">
                <span className="text-xs font-normal text-slate-400 uppercase tracking-wider">Avg Deal</span>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mt-1">
                  ₹{avgValueINR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h3>
                <div className="mt-2 text-[10px] md:text-xs text-slate-400">
                  Based on {totalClients} clients
                </div>
              </div>

              {/* Card 4: Success Rate (Win Rate) */}
              <div className="bg-slate-900 border border-slate-800/80 p-4 md:p-5 rounded-2xl relative overflow-hidden">
                <span className="text-xs font-normal text-slate-400 uppercase tracking-wider">Success Rate</span>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mt-1">
                  {successRate}%
                </h3>
                <div className="mt-2 text-[10px] md:text-xs text-slate-455">
                  {completedClients} of {totalClients} closed projects
                </div>
              </div>

              {/* Card 5: Access Status */}
              <div className="bg-slate-900 border border-slate-800/80 p-4 md:p-5 rounded-2xl relative col-span-2 md:col-span-1">
                <span className="text-xs font-normal text-slate-400 uppercase tracking-wider">Access Status</span>
                <h3 className="text-base md:text-lg font-normal text-emerald-400 mt-2 flex items-center space-x-1 uppercase">
                  <Shield className="w-4 h-4" />
                  <span>Secure Mode</span>
                </h3>
                <div className="mt-2 text-[10px] text-slate-400 flex justify-between items-center">
                  <span>Role: <strong className="text-white uppercase">{currentUserRole}</strong></span>
                </div>
              </div>
            </div>

            {/* Desktop Visualizations (INR Converted Values) */}
            <div className="hidden md:grid grid-cols-3 gap-6">
              {/* Bar Chart Box */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl col-span-2">
                <div className="mb-4">
                  <h4 className="text-sm font-normal text-white uppercase tracking-wider">Pipeline by Stage</h4>
                </div>
                <div className="h-56">
                  {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }}
                          formatter={(value: any) => [`₹${value.toLocaleString()}`, "Pipeline (INR Equivalent)"]}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {statusChartData.map((entry, index) => {
                            let color = "#3B82F6"; // Lead: Blue
                            if (entry.name === "Active") color = "#FBBF24"; // Active: Yellow
                            if (entry.name === "Completed") color = "#10B981"; // Completed: Green
                            if (entry.name === "Inactive") color = "#6B7280"; // Inactive: Gray
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full animate-shimmer rounded-2xl bg-slate-850" />
                  )}
                </div>
              </div>

              {/* Pie Chart Box */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-normal text-white uppercase tracking-wider">Account Ratios</h4>
                </div>
                <div className="h-36 relative flex items-center justify-center">
                  {isMounted && statusPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={50}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-slate-500 text-xs">No client data</span>
                  )}
                  {statusPieData.length > 0 && (
                    <div className="absolute text-center flex flex-col justify-center">
                      <span className="text-xl font-black text-white">{totalClients}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Total</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-850 pt-2">
                  {statusPieData.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-455 truncate">{item.name}: <strong className="text-white">{item.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Clients Management Workspace */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl md:rounded-3xl overflow-hidden">
              
              {/* Search & filters */}
              <div className="p-4 md:p-5 border-b border-slate-800/80 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-450 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search client, business, service..."
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:border-amber-400 focus:outline-none transition-all placeholder:text-slate-500"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute right-3 top-3.5 text-slate-455 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2.5">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full md:w-auto bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:border-amber-400 focus:outline-none font-semibold transition-all"
                  >
                    <option value="all">All Stages</option>
                    <option value="lead">Leads</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <button
                    onClick={() => {
                      setApiError("");
                      setIsAddClientOpen(true);
                    }}
                    className="md:hidden p-2.5 bg-blue-600 text-white rounded-xl shadow-md active:scale-95 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-xs font-normal uppercase tracking-widest border-b border-slate-850">
                      <th className="py-4 px-6">Client & Business</th>
                      <th className="py-4 px-6">Contact Details</th>
                      <th className="py-4 px-6">Service details</th>
                      <th className="py-4 px-6 text-center">Stage</th>
                      <th className="py-4 px-6 text-right">Value</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/80">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => {
                        let statusColorBg = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                        let statusText = "Lead";
                        
                        if (client.status === "active") {
                          statusColorBg = "bg-amber-400/10 text-amber-400 border-amber-400/20";
                          statusText = "Active";
                        } else if (client.status === "completed") {
                          statusColorBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                          statusText = "Completed";
                        } else if (client.status === "inactive") {
                          statusColorBg = "bg-slate-800 text-slate-400 border-slate-700/50";
                          statusText = "Inactive";
                        }

                        const symbol = getCurrencySymbol(client.currency || "INR");

                        return (
                          <tr
                            key={client.id}
                            className="hover:bg-slate-850/40 transition-colors cursor-pointer group"
                            onClick={() => openClientDetails(client)}
                          >
                            <td className="py-4 px-6">
                              <div className="font-normal text-white text-base group-hover:text-amber-400 transition-colors">
                                {client.name}
                              </div>
                              <div className="text-slate-400 text-xs mt-0.5">
                                {client.businessName}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-slate-350 text-xs flex items-center">
                                <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                                {client.phoneNumber}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-200 text-xs">
                              {client.serviceDetails}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${statusColorBg}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-normal text-slate-100 text-base">
                              {symbol}{client.value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                            </td>
                            <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => triggerEditClient(client)}
                                  className="p-2 bg-slate-850 hover:bg-amber-400/10 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-450/30 rounded-lg transition-all active:scale-[0.98]"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="p-2 bg-slate-850 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/50 rounded-lg transition-all active:scale-[0.98]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                          No clients found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Grid View */}
              <div className="md:hidden p-4 space-y-3">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => {
                    let statusBg = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                    let statusText = "Lead";
                    
                    if (client.status === "active") {
                      statusBg = "bg-amber-450/10 text-amber-400 border-amber-400/20";
                      statusText = "Active";
                    } else if (client.status === "completed") {
                      statusBg = "bg-emerald-500/10 text-emerald-450 border-emerald-500/20";
                      statusText = "Completed";
                    } else if (client.status === "inactive") {
                      statusBg = "bg-slate-800 text-slate-400 border-slate-700/50";
                      statusText = "Inactive";
                    }

                    const symbol = getCurrencySymbol(client.currency || "INR");

                    return (
                      <div
                        key={client.id}
                        onClick={() => openClientDetails(client)}
                        className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col space-y-3 cursor-pointer hover:border-amber-400/30 transition-all active:scale-[0.99]"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-normal text-white text-base">{client.name}</h4>
                            <span className="text-slate-450 text-xs block mt-0.5">{client.businessName}</span>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${statusBg}`}>
                            {statusText}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-900/60">
                          <span className="text-slate-400 truncate max-w-[150px]">{client.serviceDetails}</span>
                          <span className="font-normal text-white text-sm">{symbol}{client.value.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No clients found.
                  </div>
                )}
              </div>

              {/* Table Footer */}
              <div className="bg-slate-950/60 px-5 py-3.5 border-t border-slate-850 text-xs text-slate-500 flex justify-between items-center">
                <span>Showing {filteredClients.length} of {totalClients} clients</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Mobile Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <h3 className="text-sm font-normal text-white uppercase tracking-wider mb-4">Pipeline by Stage</h3>
              <div className="h-60">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }}
                        formatter={(value: any) => [`₹${value.toLocaleString()}`, "Pipeline (INR)"]}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {statusChartData.map((entry, index) => {
                          let color = "#3B82F6";
                          if (entry.name === "Active") color = "#FBBF24";
                          if (entry.name === "Completed") color = "#10B981";
                          if (entry.name === "Inactive") color = "#6B7280";
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full animate-shimmer rounded-2xl bg-slate-850" />
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col space-y-4">
              <h3 className="text-sm font-normal text-white uppercase tracking-wider">Account Ratios</h3>
              <div className="h-36 relative flex items-center justify-center">
                {isMounted && statusPieData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {statusPieData.length > 0 && (
                  <div className="absolute text-center flex flex-col justify-center">
                    <span className="text-xl font-black text-white">{totalClients}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Total</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                {statusPieData.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-400">{item.name}: <strong className="text-white">{item.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Activity History (Professional Redesign & Filters) */}
        {activeTab === "activities" && (
          <div className="space-y-4">
            
            {/* Filter Control Dashboard (Professional Audit Controls) */}
            <div className="bg-slate-900 border border-slate-800 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row gap-3">
              {/* Search log details */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-450 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Search logs by action, details, or client..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:border-amber-400 focus:outline-none transition-all placeholder:text-slate-500"
                />
                {activitySearch && (
                  <button onClick={() => setActivitySearch("")} className="absolute right-3 top-3.5 text-slate-455 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Type Filter */}
              <div className="w-full md:w-48">
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-400 transition-all font-semibold"
                >
                  <option value="all">All Actions</option>
                  <option value="creations">Client Creations</option>
                  <option value="updates">Client Updates</option>
                  <option value="deletions">Client Deletions</option>
                  <option value="whitelist">Security changes</option>
                </select>
              </div>

              {/* Operator Email Filter */}
              <div className="w-full md:w-56">
                <select
                  value={activityOperatorFilter}
                  onChange={(e) => setActivityOperatorFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-400 transition-all font-semibold"
                >
                  <option value="all">All Operators</option>
                  {operators.map((opEmail) => (
                    <option key={opEmail} value={opEmail}>{opEmail}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Redesigned Audit Logs Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl p-5 space-y-4">
              <div className="relative border-l-2 border-slate-800 pl-5.5 ml-2.5 space-y-4">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((log) => {
                    let indicatorColor = "bg-slate-850 border-slate-700 text-slate-400";
                    let icon = <FileText className="w-3.5 h-3.5" />;
                    
                    if (log.action === "Created Client") {
                      indicatorColor = "bg-emerald-500/10 border-emerald-500/30 text-emerald-450";
                      icon = <PlusCircle className="w-3.5 h-3.5" />;
                    } else if (log.action === "Updated Client" || log.action.includes("Updated")) {
                      indicatorColor = "bg-amber-400/10 border-amber-400/30 text-amber-400";
                      icon = <Edit2 className="w-3.5 h-3.5" />;
                    } else if (log.action === "Deleted Client" || log.action.includes("Deleted")) {
                      indicatorColor = "bg-red-500/10 border-red-500/30 text-red-400";
                      icon = <Trash className="w-3.5 h-3.5" />;
                    } else if (log.action.includes("Whitelist")) {
                      indicatorColor = "bg-purple-500/10 border-purple-500/30 text-purple-400";
                      icon = <Shield className="w-3.5 h-3.5" />;
                    }

                    return (
                      <div key={log.id} className="relative group">
                        {/* Timeline Icon Node */}
                        <span className={`absolute -left-[35px] top-1.5 w-7 h-7 rounded-full bg-slate-950 border-2 flex items-center justify-center transition-colors ${indicatorColor}`}>
                          {icon}
                        </span>
                        
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850/80 hover:border-slate-800 transition-colors">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 text-[11px] text-slate-450">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-white tracking-wide text-xs">{log.action}</span>
                              {log.client && (
                                <span className="text-slate-400">
                                  for <strong className="text-slate-200 font-bold">{log.client.name}</strong> ({log.client.businessName})
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center shrink-0">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className="text-xs md:text-sm text-slate-300 mt-2 font-medium">
                            {log.details}
                          </p>
                          
                          <div className="text-[9px] text-slate-500 mt-2 flex items-center justify-end font-bold uppercase tracking-wider">
                            <span>Operator: <span className="text-slate-400 ml-1 underline">{log.userEmail}</span></span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-500 text-xs py-4">
                    No matching activity logs found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security Whitelist panel */}
        {activeTab === "whitelist" && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-normal text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span>Access Whitelist</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Governs access to this CRM. Standard users are restricted from editing this list.
                </p>
              </div>
              
              {currentUserRole !== "admin" && (
                <span className="px-2.5 py-1 bg-red-950/20 text-red-400 border border-red-900/30 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  Read-Only Access
                </span>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-xs font-normal uppercase tracking-widest border-b border-slate-850">
                      <th className="py-4 px-5">User</th>
                      <th className="py-4 px-5">Email Address</th>
                      <th className="py-4 px-5 text-center">Role</th>
                      {currentUserRole === "admin" && (
                        <th className="py-4 px-5 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/80">
                    {whitelist.map((entry) => {
                      const isSelf = entry.email.toLowerCase() === currentUserEmail.toLowerCase();
                      
                      return (
                        <tr key={entry.id} className="hover:bg-slate-850/20 transition-colors">
                          <td className="py-3.5 px-5 font-normal text-white text-base">
                            {entry.name || "Pending Account"}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="font-mono text-slate-350">{entry.email}</span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${
                              entry.role === "admin"
                                ? "bg-amber-400/10 text-amber-400 border-amber-400/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}>
                              {entry.role}
                            </span>
                          </td>
                          {currentUserRole === "admin" && (
                            <td className="py-3.5 px-5 text-right">
                              <button
                                onClick={() => handleRemoveWhitelist(entry.id, entry.email)}
                                disabled={isSelf}
                                className="p-1.5 bg-slate-850 hover:bg-red-950/40 text-slate-455 hover:text-red-400 border border-slate-800 hover:border-red-900/50 rounded-lg transition-all disabled:opacity-30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 py-2.5 px-6 flex items-center justify-between z-40 shadow-2xl">
        <button
          onClick={() => setActiveTab("clients")}
          className={`flex flex-col items-center space-y-1 ${activeTab === "clients" ? "text-amber-400" : "text-slate-450"}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Clients</span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex flex-col items-center space-y-1 ${activeTab === "analytics" ? "text-amber-400" : "text-slate-450"}`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`flex flex-col items-center space-y-1 ${activeTab === "activities" ? "text-amber-400" : "text-slate-450"}`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">History</span>
        </button>
        <button
          onClick={() => setActiveTab("whitelist")}
          className={`flex flex-col items-center space-y-1 ${activeTab === "whitelist" ? "text-amber-400" : "text-slate-450"}`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Whitelist</span>
        </button>
      </nav>

      {/* --- ADD CLIENT MODAL / DRAWER (Mobile Responsive Sheet) --- */}
      {isAddClientOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end bg-black/70 backdrop-blur-sm p-0">
          <div className="absolute inset-0 -z-10" onClick={() => setIsAddClientOpen(false)} />
          
          <div className="w-full h-[90vh] md:h-full max-w-lg bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 rounded-t-3xl md:rounded-none p-5 md:p-6 flex flex-col justify-between overflow-y-auto animate-slide-up md:animate-in md:slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <h3 className="text-lg font-normal text-white uppercase tracking-wider">Create Account</h3>
                <button
                  onClick={() => setIsAddClientOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {apiError && (
                <div className="mt-3.5 p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400">
                  {apiError}
                </div>
              )}

              {/* Form fields */}
              <form onSubmit={handleAddClient} id="add-client-form" className="mt-5 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder:text-slate-650"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Business Name</label>
                  <input
                    type="text"
                    required
                    value={clientForm.businessName}
                    onChange={(e) => setClientForm({ ...clientForm, businessName: e.target.value })}
                    placeholder="e.g. Acme Corporation"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder:text-slate-650"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={clientForm.phoneNumber}
                      onChange={(e) => setClientForm({ ...clientForm, phoneNumber: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder:text-slate-650"
                    />
                  </div>
                  
                  {/* Currency Selection / Deal value */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Pipeline Value</label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-850 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 bg-slate-950">
                      <span className="bg-slate-900 text-slate-400 text-sm px-3.5 py-3 flex items-center border-r border-slate-850 font-bold select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        required
                        value={clientForm.value}
                        onChange={(e) => setClientForm({ ...clientForm, value: e.target.value })}
                        min="0"
                        placeholder="0"
                        className="flex-1 bg-transparent text-slate-100 px-3.5 py-3 text-sm focus:outline-none placeholder:text-slate-650"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Business Address</label>
                  <input
                    type="text"
                    required
                    value={clientForm.address}
                    onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                    placeholder="123 Corporate Way, City, Country"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder:text-slate-650"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Service Details</label>
                  <input
                    type="text"
                    required
                    value={clientForm.serviceDetails}
                    onChange={(e) => setClientForm({ ...clientForm, serviceDetails: e.target.value })}
                    placeholder="e.g. SEO & Content Marketing Package"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder:text-slate-650"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Account Status</label>
                  <select
                    value={clientForm.status}
                    onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  >
                    <option value="lead">Lead</option>
                    <option value="active">Active Account</option>
                    <option value="completed">Completed Project</option>
                    <option value="inactive">Inactive Account</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Operational Notes</label>
                  <textarea
                    rows={3}
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    placeholder="Provide details on contact interactions..."
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder:text-slate-650"
                  />
                </div>
              </form>
            </div>

            <div className="mt-6 pt-3.5 border-t border-slate-800 flex items-center space-x-3 shrink-0 pb-10 md:pb-0">
              <button
                type="button"
                onClick={() => setIsAddClientOpen(false)}
                className="flex-1 px-4 py-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-client-form"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT CLIENT MODAL / DRAWER (Mobile Responsive Sheet) --- */}
      {isEditClientOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end bg-black/70 backdrop-blur-sm p-0">
          <div className="absolute inset-0 -z-10" onClick={() => { setIsEditClientOpen(false); setSelectedClient(null); }} />
          
          <div className="w-full h-[90vh] md:h-full max-w-lg bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 rounded-t-3xl md:rounded-none p-5 md:p-6 flex flex-col justify-between overflow-y-auto animate-slide-up md:animate-in md:slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <h3 className="text-lg font-normal text-white uppercase tracking-wider">Modify Account</h3>
                <button
                  onClick={() => {
                    setIsEditClientOpen(false);
                    setSelectedClient(null);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {apiError && (
                <div className="mt-3.5 p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleEditClient} id="edit-client-form" className="mt-5 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Business Name</label>
                  <input
                    type="text"
                    required
                    value={clientForm.businessName}
                    onChange={(e) => setClientForm({ ...clientForm, businessName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={clientForm.phoneNumber}
                      onChange={(e) => setClientForm({ ...clientForm, phoneNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-855 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all"
                    />
                  </div>
                  
                  {/* Currency Selection / Deal value */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Pipeline Value</label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-855 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 bg-slate-950">
                      <span className="bg-slate-900 text-slate-400 text-sm px-3.5 py-3 flex items-center border-r border-slate-855 font-bold select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        required
                        value={clientForm.value}
                        onChange={(e) => setClientForm({ ...clientForm, value: e.target.value })}
                        min="0"
                        className="flex-1 bg-transparent text-slate-100 px-3.5 py-3 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Business Address</label>
                  <input
                    type="text"
                    required
                    value={clientForm.address}
                    onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Service Details</label>
                  <input
                    type="text"
                    required
                    value={clientForm.serviceDetails}
                    onChange={(e) => setClientForm({ ...clientForm, serviceDetails: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Account Status</label>
                  <select
                    value={clientForm.status}
                    onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  >
                    <option value="lead">Lead</option>
                    <option value="active">Active Account</option>
                    <option value="completed">Completed Project</option>
                    <option value="inactive">Inactive Account</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Operational Notes</label>
                  <textarea
                    rows={3}
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  />
                </div>
              </form>
            </div>

            <div className="mt-6 pt-3.5 border-t border-slate-800 flex items-center space-x-3 shrink-0 pb-10 md:pb-0">
              <button
                type="button"
                onClick={() => {
                  setIsEditClientOpen(false);
                  setSelectedClient(null);
                }}
                className="flex-1 px-4 py-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-client-form"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CLIENT DETAILS DISPLAY (Mobile Responsive Sheet) --- */}
      {isClientDetailsOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end bg-black/70 backdrop-blur-sm p-0">
          <div className="absolute inset-0 -z-10" onClick={() => { setIsClientDetailsOpen(false); setSelectedClient(null); }} />
          
          <div className="w-full h-[90vh] md:h-full max-w-lg bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 rounded-t-3xl md:rounded-none p-5 md:p-6 flex flex-col justify-between overflow-y-auto animate-slide-up md:animate-in md:slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-normal text-white">{selectedClient.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedClient.businessName}</p>
                </div>
                <button
                  onClick={() => {
                    setIsClientDetailsOpen(false);
                    setSelectedClient(null);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-2 gap-3.5 bg-slate-950 p-4 rounded-xl border border-slate-855">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450">Pipeline Value</span>
                    <p className="text-xl font-black text-amber-400 mt-0.5">
                      {getCurrencySymbol(selectedClient.currency || "INR")}{selectedClient.value.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450">Account Stage</span>
                    <div className="mt-0.5">
                      <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${
                        selectedClient.status === "active"
                          ? "bg-amber-400/10 text-amber-400 border-amber-400/20"
                          : selectedClient.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                          : selectedClient.status === "inactive"
                          ? "bg-slate-800 text-slate-400 border-slate-700/50"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {selectedClient.status === "active" ? "Active" : selectedClient.status === "completed" ? "Completed" : selectedClient.status === "inactive" ? "Inactive" : "Lead"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start space-x-3">
                    <Phone className="w-4 h-4 text-slate-450 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Phone</span>
                      <a href={`tel:${selectedClient.phoneNumber}`} className="text-white hover:text-amber-400 font-medium block mt-0.5">{selectedClient.phoneNumber}</a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-slate-450 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Business Address</span>
                      <span className="text-slate-200 block mt-0.5 leading-relaxed">{selectedClient.address}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Briefcase className="w-4 h-4 text-slate-450 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Service Program</span>
                      <span className="text-slate-200 block font-medium mt-0.5">{selectedClient.serviceDetails}</span>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-800" />

                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block mb-1.5">Operations Notes</span>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-xs text-slate-300 leading-relaxed min-h-20 whitespace-pre-wrap">
                    {selectedClient.notes || <span className="text-slate-650 italic">No notes recorded.</span>}
                  </div>
                </div>

                <hr className="border-slate-800" />

                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block mb-2">Audit Logs</span>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {selectedClient.activities && selectedClient.activities.length > 0 ? (
                      selectedClient.activities.map((act) => (
                        <div key={act.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px]">
                          <div className="flex justify-between items-center text-slate-455">
                            <span className="font-semibold text-slate-350">{act.action}</span>
                            <span>{new Date(act.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-400 mt-1">{act.details}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-600 italic">No logs recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3.5 border-t border-slate-800 flex items-center space-x-3 shrink-0 pb-10 md:pb-0">
              <button
                onClick={() => triggerEditClient(selectedClient)}
                className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-855 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Modify</span>
              </button>
              <button
                onClick={() => handleDeleteClient(selectedClient.id)}
                className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-3 bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 text-red-400 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD TO WHITELIST MODAL --- */}
      {isAddWhitelistOpen && currentUserRole === "admin" && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0">
          <div className="absolute inset-0 -z-10" onClick={() => setIsAddWhitelistOpen(false)} />
          
          <div className="w-full md:max-w-md bg-slate-900 border-t md:border border-slate-800 p-5 md:p-6 rounded-t-3xl md:rounded-3xl relative animate-slide-up md:animate-in md:zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddWhitelistOpen(false)}
              className="absolute right-4 top-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-normal text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Whitelist Account</span>
            </h3>

            {apiError && (
              <div className="mt-3.5 p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400">
                {apiError}
              </div>
            )}

            <form onSubmit={handleAddWhitelist} id="add-whitelist-form" className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">User Full Name (Optional)</label>
                <input
                  type="text"
                  value={whitelistForm.name}
                  onChange={(e) => setWhitelistForm({ ...whitelistForm, name: e.target.value })}
                  placeholder="e.g. Sanjay Kumar"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder:text-slate-650"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Google Email Address</label>
                <input
                  type="email"
                  required
                  value={whitelistForm.email}
                  onChange={(e) => setWhitelistForm({ ...whitelistForm, email: e.target.value })}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder:text-slate-650"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 pl-0.5">Access Role</label>
                <select
                  value={whitelistForm.role}
                  onChange={(e) => setWhitelistForm({ ...whitelistForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 px-3.5 py-3 rounded-xl text-sm focus:outline-none transition-all"
                >
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Modify Whitelist)</option>
                </select>
              </div>
            </form>

            <div className="mt-6 flex items-center space-x-3 pb-8 md:pb-0">
              <button
                type="button"
                onClick={() => setIsAddWhitelistOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-whitelist-form"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Grant Access"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
