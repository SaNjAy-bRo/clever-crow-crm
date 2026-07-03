import React, { useState } from "react";
import {
  Briefcase,
  CheckSquare,
  Square,
  FileText,
  User,
  Calendar,
  Building,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from "lucide-react";

interface ClientsViewProps {
  clients: any[];
  userRole: string;
  userEmail: string;
  onUpdateLead: (id: string, payload: any) => Promise<void>;
}

export default function ClientsView({
  clients,
  userRole,
  userEmail,
  onUpdateLead
}: ClientsViewProps) {
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const isBdm = userRole === "bdm" || userRole === "telecaller";
  const myClients = clients.filter(c => {
    const isConverted = c.isConvertedClient === true || c.status === "Closed Won";
    const isOwner = !isBdm || c.dealOwnerEmail === userEmail;
    return isConverted && isOwner;
  });

  // Checklist templates
  const websiteChecklist = [
    "Logo", "Domain access", "Hosting access", "Content", 
    "Photos", "Contact details", "Social links", "Reference websites"
  ];

  const marketingChecklist = [
    "Meta Business access", "Google Ads access", "Page access", 
    "Instagram access", "Ad budget confirmation", "Creative assets", 
    "Landing page", "Target locations"
  ];

  const ecommerceChecklist = [
    "Product list", "Product photos", "Pricing", "Stock details", 
    "Delivery/shipping details", "Payment gateway documents", "Return policy"
  ];

  const hospitalityChecklist = [
    "Property photos", "Room details", "Amenities", "Packages", 
    "Booking contact", "Google Maps link", "OTA links", "Guest reviews"
  ];

  // Helper to determine which checklists to show based on category or service interest
  const getRequiredChecklists = (client: any) => {
    let interests: string[] = [];
    try {
      interests = JSON.parse(client.serviceInterests || "[]");
    } catch (e) {
      interests = [];
    }

    const lists: { name: string; items: string[] }[] = [];

    // Check interests or categories
    const isWebsite = interests.some(i => i.toLowerCase().includes("web") || i.toLowerCase().includes("dev"));
    const isMarketing = interests.some(i => i.toLowerCase().includes("marketing") || i.toLowerCase().includes("ads") || i.toLowerCase().includes("seo"));
    const isEcommerce = interests.some(i => i.toLowerCase().includes("e-commerce") || i.toLowerCase().includes("store"));
    const isHospitality = client.category === "Hotel" || client.category === "Resort" || client.category === "Villa" || client.category === "Homestay" || interests.some(i => i.toLowerCase().includes("hospitality"));

    if (isWebsite) lists.push({ name: "Website Onboarding Checklist", items: websiteChecklist });
    if (isMarketing) lists.push({ name: "Digital Marketing Onboarding Checklist", items: marketingChecklist });
    if (isEcommerce) lists.push({ name: "E-commerce Onboarding Checklist", items: ecommerceChecklist });
    if (isHospitality || lists.length === 0) lists.push({ name: "Hospitality Growth Checklist", items: hospitalityChecklist });

    return lists;
  };

  const handleToggleTask = async (client: any, task: string, currentStatus: boolean) => {
    let checklistObj: Record<string, boolean> = {};
    try {
      checklistObj = JSON.parse(client.onboardingChecklist || "{}");
    } catch (e) {
      checklistObj = {};
    }

    checklistObj[task] = !currentStatus;

    try {
      await onUpdateLead(client.id, {
        ...client,
        onboardingChecklist: JSON.stringify(checklistObj)
      });
      // Update selected client details view in state
      if (selectedClient && selectedClient.id === client.id) {
        setSelectedClient({
          ...client,
          onboardingChecklist: JSON.stringify(checklistObj)
        });
      }
    } catch (err) {
      console.error("Failed to update onboarding checklist:", err);
    }
  };

  const getCompletedCount = (client: any, items: string[]) => {
    let checklistObj: Record<string, boolean> = {};
    try {
      checklistObj = JSON.parse(client.onboardingChecklist || "{}");
    } catch (e) {
      checklistObj = {};
    }
    return items.filter(item => checklistObj[item] === true).length;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left List Pane */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg h-[calc(100vh-12rem)] flex flex-col">
        <div className="pb-3 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Converted Clients ({myClients.length})</h2>
          <p className="text-[10px] text-slate-400 mt-1">Select a client to manage project onboarding progress.</p>
        </div>

        <div className="mt-4 overflow-y-auto flex-1 space-y-2 pr-1">
          {myClients.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No active client onboardings found.</p>
          ) : (
            myClients.map(client => {
              const checklists = getRequiredChecklists(client);
              const totalItems = checklists.reduce((sum, list) => sum + list.items.length, 0);
              const totalCompleted = checklists.reduce((sum, list) => sum + getCompletedCount(client, list.items), 0);
              const percent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
              const isSelected = selectedClient?.id === client.id;

              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected 
                      ? "bg-amber-400/10 border-amber-400/20 text-amber-400" 
                      : "bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-350"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">{client.category}</span>
                      <h4 className="text-xs font-bold text-white mt-1 truncate">{client.businessName}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{client.name}</p>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded shrink-0">
                      {percent}%
                    </span>
                  </div>
                  
                  {/* Miniature progress indicator bar */}
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-3">
                    <div className="bg-amber-400 h-full" style={{ width: `${percent}%` }} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Details/Checklist Panel */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg h-[calc(100vh-12rem)] flex flex-col">
        {selectedClient ? (
          <div className="flex-1 overflow-y-auto pr-1 space-y-6 flex flex-col h-full">
            
            {/* Header info card */}
            <div className="pb-4 border-b border-slate-800 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider block bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded w-fit">
                  {selectedClient.category} Client
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1.5">{selectedClient.businessName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Contact: {selectedClient.name} | Phone: {selectedClient.phoneNumber}</p>
              </div>
              <div className="text-xs text-slate-400 bg-slate-950 px-3.5 py-1.5 border border-slate-850 rounded-xl flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Started: {selectedClient.clientStartDate ? new Date(selectedClient.clientStartDate).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>

            {/* Checklists */}
            <div className="flex-1 space-y-6 overflow-y-auto">
              {getRequiredChecklists(selectedClient).map(list => {
                let checklistObj: Record<string, boolean> = {};
                try {
                  checklistObj = JSON.parse(selectedClient.onboardingChecklist || "{}");
                } catch (e) {
                  checklistObj = {};
                }

                const completed = getCompletedCount(selectedClient, list.items);
                const pct = Math.round((completed / list.items.length) * 100);

                return (
                  <div key={list.name} className="space-y-3 bg-slate-950/30 p-4 border border-slate-850 rounded-2xl">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                      <h4 className="text-xs font-bold text-white">{list.name}</h4>
                      <span className="text-[10px] text-amber-400 font-bold">{completed}/{list.items.length} Checked</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {list.items.map(task => {
                        const isDone = checklistObj[task] === true;
                        return (
                          <button
                            key={task}
                            onClick={() => handleToggleTask(selectedClient, task, isDone)}
                            className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all ${
                              isDone 
                                ? "bg-slate-900/60 border-slate-850 text-slate-400" 
                                : "bg-slate-950 border-slate-850 text-slate-200 hover:border-slate-800"
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle className="w-4 h-4 text-emerald-450 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-650 shrink-0" />
                            )}
                            <span className={`text-[11px] truncate ${isDone ? "line-through text-slate-500" : ""}`}>
                              {task}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <Briefcase className="w-12 h-12 text-slate-650" />
            <h3 className="text-sm font-bold text-slate-400 mt-4">No Client Selected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">Click on any client on the left pane to view their category-specific onboarding checklist status.</p>
          </div>
        )}
      </div>

    </div>
  );
}
