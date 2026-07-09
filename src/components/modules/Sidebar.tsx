import React from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Video,
  FileSpreadsheet,
  IndianRupee,
  Target,
  Briefcase,
  History,
  TrendingUp,
  FileCode,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  userRole: string;
  userEmail: string;
  userName: string;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
  todayFollowUpCount: number;
  theme: string;
  toggleTheme: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  userRole,
  userEmail,
  userName,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  todayFollowUpCount,
  theme,
  toggleTheme
}: SidebarProps) {
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "bdm", "telecaller", "team_member"] },
    { id: "leads", label: "Leads & Prospects", icon: Users, roles: ["admin", "manager", "bdm", "telecaller"] },
    { id: "followups", label: "Follow-Ups", icon: CalendarDays, roles: ["admin", "manager", "bdm"], badge: todayFollowUpCount > 0 ? todayFollowUpCount : undefined },
    { id: "meetings", label: "Meetings", icon: Video, roles: ["admin", "manager", "bdm", "telecaller"] },
    { id: "proposals", label: "Proposals", icon: FileSpreadsheet, roles: ["admin", "manager", "bdm", "team_member"] },
    { id: "deals", label: "Deals & Revenue", icon: IndianRupee, roles: ["admin", "manager", "bdm"] },
    { id: "targets", label: "Targets & KPIs", icon: Target, roles: ["admin", "manager", "bdm"] },
    { id: "clients", label: "Client Onboarding", icon: Briefcase, roles: ["admin", "manager", "bdm", "team_member"] },
    { id: "activities", label: "BDM Activities", icon: History, roles: ["admin", "manager", "bdm"] },
    { id: "reports", label: "Reports & Analytics", icon: TrendingUp, roles: ["admin", "manager"] },
    { id: "templates", label: "Message Templates", icon: FileCode, roles: ["admin", "manager", "bdm", "telecaller"] },
    { id: "whitelist", label: "User Access List", icon: Settings, roles: ["admin"] }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  const roleLabels: Record<string, string> = {
    admin: "Admin / Founder",
    manager: "Sales Manager",
    bdm: "Sales Executive (BDM)",
    telecaller: "Lead Gen Exec",
    team_member: "Proposal Team"
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300 font-sans">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 bg-[#ffffff] border-b border-[#e2e8f0] shrink-0">
        <div className="flex items-center space-x-3">
          <img src="/logo-1.png" alt="Logo" className="h-16 w-auto object-contain" />
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="hidden md:flex p-1.5 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] hover:text-[#0f172a] transition-all active:scale-95 border border-[#e2e8f0]"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Info details */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/30 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-black flex items-center justify-center font-bold text-sm shrink-0">
            {userName ? userName.slice(0, 2).toUpperCase() : "US"}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 animate-in fade-in duration-200">
              <span className="text-xs font-bold text-white truncate">{userName}</span>
              <span className="text-[10px] text-slate-400 truncate">{userEmail}</span>
              <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 w-fit mt-1.5">
                {roleLabels[userRole] || userRole}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? "bg-amber-400/10 text-amber-400 border border-amber-400/20 font-semibold shadow-inner" 
                  : "hover:bg-slate-800/60 hover:text-slate-100 text-slate-400"
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                {!isCollapsed && <span className="text-xs truncate">{item.label}</span>}
              </div>
              {!isCollapsed && item.badge !== undefined && (
                <span className="bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                  {item.badge}
                </span>
              )}
              {isCollapsed && isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-amber-400 rounded-r" />
              )}
            </button>
          );
        })}
      </div>

      {/* Theme Switcher Button */}
      <div className="px-3 pb-2 shrink-0">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center space-x-3 px-3 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all active:scale-[0.98] cursor-pointer"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? (
            <>
              <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
              {!isCollapsed && <span className="text-xs font-bold">Dark Theme</span>}
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              {!isCollapsed && <span className="text-xs font-bold">Light Theme</span>}
            </>
          )}
        </button>
      </div>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/20 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center justify-center space-x-3 px-3 py-2.5 bg-slate-800/50 hover:bg-red-950/20 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold">Sign Out System</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar view */}
      <aside className={`hidden md:block h-screen shrink-0 transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}>
        {navContent}
      </aside>

      {/* Mobile Drawer view */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-64 max-w-xs h-full animate-slide-up flex flex-col z-10 shadow-2xl">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-[-48px] p-2 bg-slate-900 text-white rounded-r-xl border-y border-r border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
