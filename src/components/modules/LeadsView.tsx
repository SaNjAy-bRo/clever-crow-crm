import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Phone,
  MessageSquare,
  Mail,
  Globe,
  MapPin,
  Flame,
  User,
  Users,
  Info,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  ArrowUpDown,
  Building,
  CheckCircle,
  XCircle,
  Eye,
  PlusCircle,
  TrendingUp,
  Map
} from "lucide-react";

interface LeadsViewProps {
  clients: any[];
  userRole: string;
  userEmail: string;
  whitelist: any[];
  onAddLead: (lead: any) => Promise<void>;
  onUpdateLead: (id: string, lead: any) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  isAddOpen: boolean;
  setIsAddOpen: (val: boolean) => void;
}

export default function LeadsView({
  clients,
  userRole,
  userEmail,
  whitelist,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  isAddOpen,
  setIsAddOpen
}: LeadsViewProps) {
  // Filters & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bdmFilter, setBdmFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [tempFilter, setTempFilter] = useState("all");
  
  // Sort State
  const [sortBy, setSortBy] = useState<"createdAt" | "dealValue" | "score">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Lead Details Panel / Modal
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Lost Reason Modal State
  const [isLostReasonOpen, setIsLostReasonOpen] = useState(false);
  const [lostLeadId, setLostLeadId] = useState<string | null>(null);
  const [lostReasonValue, setLostReasonValue] = useState("");

  // GPS Map Location Picker States
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [tempCoords, setTempCoords] = useState<{lat: number, lng: number} | null>(null);
  const [tempAddress, setTempAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const mapRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);

  // Load Leaflet dynamically when modal opens
  React.useEffect(() => {
    if (!isMapModalOpen) return;
    
    if ((window as any).L) {
      setMapLoaded(true);
      return;
    }

    // Load stylesheet
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load Leaflet JS script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapLoaded(true);
    document.body.appendChild(script);
  }, [isMapModalOpen]);

  // Reverse geocoding using Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          "Accept-Language": "en"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTempAddress(data.display_name || "");
      } else {
        setTempAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (e) {
      console.error("Geocoding error:", e);
      setTempAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  // Search places using Nominatim
  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const { lat, lon, display_name } = results[0];
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lon);
          
          mapRef.current.setView([latitude, longitude], 15);
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          }
          setTempCoords({ lat: latitude, lng: longitude });
          setTempAddress(display_name);
        } else {
          alert("Location not found");
        }
      }
    } catch (err) {
      console.error("Map search error:", err);
    }
  };

  // Initialize Map Picker inside Modal
  React.useEffect(() => {
    if (!mapLoaded || !isMapModalOpen) return;

    const timer = setTimeout(() => {
      const L = (window as any).L;
      if (!L) return;

      if (mapRef.current) {
        mapRef.current.remove();
      }

      // Default coords: Goa (Panjim)
      const defaultLat = 15.4909;
      const defaultLng = 73.8278;

      const map = L.map("map-picker-container").setView([defaultLat, defaultLng], 12);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
      }).addTo(map);

      // Fix CDN Leaflet marker icon asset mapping
      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      // Add draggable picker marker
      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      markerRef.current = marker;
      setTempCoords({ lat: defaultLat, lng: defaultLng });

      // Click event for pinning
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setTempCoords({ lat, lng });
        reverseGeocode(lat, lng);
      });

      // Drag event for pinning
      marker.on("dragend", (e: any) => {
        const position = marker.getLatLng();
        setTempCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      // Fetch browser geolocation to center immediately
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 15);
            marker.setLatLng([latitude, longitude]);
            setTempCoords({ lat: latitude, lng: longitude });
            reverseGeocode(latitude, longitude);
          },
          () => {
            reverseGeocode(defaultLat, defaultLng);
          },
          { enableHighAccuracy: true }
        );
      } else {
        reverseGeocode(defaultLat, defaultLng);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [mapLoaded, isMapModalOpen]);

  const handleGetLocation = () => {
    setIsMapModalOpen(true);
  };

  const handleRecenterGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        }
        setTempCoords({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
        setGpsLoading(false);
      },
      (error) => {
        console.error("GPS recenter error:", error);
        alert(`Failed to fetch location: ${error.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapBlur = () => {
    let val = leadForm.googleMap.trim();
    if (!val) return;
    
    const coordRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
    if (coordRegex.test(val)) {
      setLeadForm(prev => ({
        ...prev,
        googleMap: `https://www.google.com/maps?q=${val.replace(/\s+/g, "")}`
      }));
    }
  };

  // BDM email list for filter
  const bdmList = whitelist.filter(u => u.role === "bdm" || u.role === "admin" || u.role === "manager");

  // Form State
  const initialFormState = {
    name: "",
    businessName: "",
    phoneNumber: "",
    whatsappNumber: "",
    email: "",
    website: "",
    instagram: "",
    googleMap: "",
    city: "",
    area: "",
    industry: "",
    category: "Hotel",
    source: "Google Maps",
    serviceInterests: [] as string[],
    status: "New Prospect",
    address: "",
    notes: "",
    serviceDetails: "",
    dealValue: "0",
    dealOwnerEmail: userEmail,
  };

  const [leadForm, setLeadForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Business Type Categories
  const categories = [
    "Hotel", "Resort", "Villa", "Homestay", "Restaurant", 
    "E-commerce brand", "Retail store", "Real estate", 
    "Education", "Healthcare", "Manufacturing", "Other"
  ];

  // Lead Sources
  const sources = [
    "Google Maps", "Instagram", "LinkedIn", "Referral", 
    "Existing connection", "Walk-in", "Cold call", 
    "Website enquiry", "Meta Ads", "Google Ads", 
    "Event / networking", "Other"
  ];

  // Services offered (Multi-select)
  const serviceOptions = [
    "Website Development", "Hospitality Growth Package", 
    "Digital Marketing", "Meta Ads", "Google Ads", "SEO", 
    "WhatsApp Automation", "CRM / Dashboard", "E-commerce Website", 
    "Mobile App", "Web App", "Branding", "Other"
  ];

  const pipelineStages = [
    "New Prospect", "Contacted", "Interested", "Meeting Scheduled", 
    "Discovery Done", "Proposal Required", "Proposal Sent", 
    "Follow-Up", "Negotiation", "Closed Won", "Closed Lost", 
    "Not Interested", "Future Follow-Up"
  ];

  // Filter based on BDM assignment
  const isBdm = userRole === "bdm" || userRole === "telecaller";
  const myLeads = isBdm ? clients.filter(c => c.dealOwnerEmail === userEmail) : clients;

  // Filter and Search logic
  const filteredLeads = myLeads.filter(lead => {
    const matchesSearch = 
      lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phoneNumber.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.city && lead.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesBdm = bdmFilter === "all" || lead.dealOwnerEmail === bdmFilter;
    const matchesCategory = categoryFilter === "all" || lead.category === categoryFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const matchesTemp = tempFilter === "all" || lead.temperature === tempFilter;

    return matchesSearch && matchesStatus && matchesBdm && matchesCategory && matchesSource && matchesTemp;
  });

  // Sort logic
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === "createdAt") {
      valA = new Date(a.createdAt).getTime();
      valB = new Date(b.createdAt).getTime();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleServiceToggle = (service: string) => {
    const current = [...leadForm.serviceInterests];
    if (current.includes(service)) {
      setLeadForm({ ...leadForm, serviceInterests: current.filter(s => s !== service) });
    } else {
      setLeadForm({ ...leadForm, serviceInterests: [...current, service] });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    try {
      const interestsStr = JSON.stringify(leadForm.serviceInterests);
      await onAddLead({
        ...leadForm,
        value: parseFloat(leadForm.dealValue) || 0,
        dealValue: parseFloat(leadForm.dealValue) || 0,
        serviceInterests: interestsStr,
      });
      setIsAddOpen(false);
      setLeadForm(initialFormState);
    } catch (err: any) {
      setFormError(err.message || "Failed to add lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setIsSubmitting(true);
    setFormError("");
    try {
      const interestsStr = JSON.stringify(leadForm.serviceInterests);
      await onUpdateLead(selectedLead.id, {
        ...leadForm,
        value: parseFloat(leadForm.dealValue) || 0,
        dealValue: parseFloat(leadForm.dealValue) || 0,
        serviceInterests: interestsStr,
      });
      setIsEditOpen(false);
      setSelectedLead(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to update lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerEdit = (lead: any) => {
    setSelectedLead(lead);
    let parsedInterests = [];
    try {
      parsedInterests = JSON.parse(lead.serviceInterests || "[]");
    } catch (e) {
      parsedInterests = [];
    }
    setLeadForm({
      name: lead.name,
      businessName: lead.businessName,
      phoneNumber: lead.phoneNumber,
      whatsappNumber: lead.whatsappNumber || "",
      email: lead.email || "",
      website: lead.website || "",
      instagram: lead.instagram || "",
      googleMap: lead.googleMap || "",
      city: lead.city || "",
      area: lead.area || "",
      industry: lead.industry || "",
      category: lead.category || "Hotel",
      source: lead.source || "Google Maps",
      serviceInterests: parsedInterests,
      status: lead.status,
      address: lead.address || "",
      notes: lead.notes || "",
      serviceDetails: lead.serviceDetails || "",
      dealValue: String(lead.dealValue || lead.value || 0),
      dealOwnerEmail: lead.dealOwnerEmail || userEmail,
    });
    setIsEditOpen(true);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    if (newStatus === "Closed Lost") {
      setLostLeadId(leadId);
      setLostReasonValue("");
      setIsLostReasonOpen(true);
      return;
    }

    try {
      const lead = clients.find(c => c.id === leadId);
      if (!lead) return;
      
      const payload: any = {
        ...lead,
        status: newStatus,
      };

      if (newStatus === "Closed Won") {
        payload.isConvertedClient = true;
        payload.clientStartDate = new Date().toISOString();
        payload.dealStatus = "Advance received";
      }

      await onUpdateLead(leadId, payload);
    } catch (error) {
      console.error("Failed to change lead status:", error);
    }
  };

  const submitLostReason = async () => {
    if (!lostLeadId || !lostReasonValue) return;
    try {
      const lead = clients.find(c => c.id === lostLeadId);
      if (!lead) return;

      await onUpdateLead(lostLeadId, {
        ...lead,
        status: "Closed Lost",
        lostReason: lostReasonValue,
        dealStatus: "Lost"
      });
      setIsLostReasonOpen(false);
      setLostLeadId(null);
    } catch (error) {
      console.error("Failed to update status to lost:", error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Leads & Prospects</h2>
          <p className="text-xs text-slate-400 mt-1">Manage pipeline stages, update contacts, and evaluate lead scores.</p>
        </div>
        <button
          onClick={() => {
            setLeadForm(initialFormState);
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-black px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-amber-400/15 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* Advanced Filters Dashboard */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by business, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Stages</option>
            {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Temperature Filter */}
        <select
          value={tempFilter}
          onChange={(e) => setTempFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">All Temperatures</option>
          <option value="Hot">🔥 Hot</option>
          <option value="Warm">☀️ Warm</option>
          <option value="Cold">❄️ Cold</option>
        </select>
      </div>

      {/* Sorting bar */}
      <div className="flex justify-between items-center bg-slate-950 border border-slate-900 px-4 py-2.5 rounded-xl text-[11px] text-slate-400">
        <span>Showing {sortedLeads.length} leads</span>
        <div className="flex items-center space-x-4">
          <button onClick={() => handleSort("createdAt")} className="flex items-center space-x-1.5 hover:text-white transition-all font-semibold">
            <ArrowUpDown className="w-3 h-3" />
            <span>Date Added</span>
          </button>
          <button onClick={() => handleSort("dealValue")} className="flex items-center space-x-1.5 hover:text-white transition-all font-semibold">
            <ArrowUpDown className="w-3 h-3" />
            <span>Deal Value</span>
          </button>
          <button onClick={() => handleSort("score")} className="flex items-center space-x-1.5 hover:text-white transition-all font-semibold">
            <ArrowUpDown className="w-3 h-3" />
            <span>Lead Score</span>
          </button>
        </div>
      </div>

      {/* Lead Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedLeads.length === 0 ? (
          <div className="md:col-span-3 text-center py-12 bg-slate-900 border border-slate-850 rounded-2xl">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-xs mt-3">No prospects match your current search criteria.</p>
          </div>
        ) : (
          sortedLeads.map(lead => {
            const hasHotTemp = lead.temperature === "Hot";
            const hasWarmTemp = lead.temperature === "Warm";
            
            let services: string[] = [];
            try {
              services = JSON.parse(lead.serviceInterests || "[]");
            } catch (e) {
              services = [];
            }

            return (
              <div key={lead.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg">
                <div>
                  {/* Top Header Card */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded w-fit">
                        {lead.category || "General"}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5 truncate">{lead.businessName}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{lead.name}</p>
                    </div>
                    {/* Temperature Badge */}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border flex items-center space-x-1 shrink-0 ${
                      hasHotTemp ? "bg-red-500/10 border-red-500/20 text-red-400" :
                      hasWarmTemp ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                      "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    }`}>
                      {hasHotTemp ? "🔥 Hot" : hasWarmTemp ? "☀️ Warm" : "❄️ Cold"}
                    </span>
                  </div>

                  {/* Pipeline Stage Select */}
                  <div className="mt-4">
                    <span className="text-[10px] text-slate-500 block font-semibold">Pipeline Stage</span>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 py-1.5 px-3 rounded-lg text-xs text-slate-300 focus:outline-none"
                    >
                      {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Lead Services list */}
                  {services.length > 0 && (
                    <div className="mt-4">
                      <span className="text-[10px] text-slate-500 block font-semibold">Services Requested</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {services.slice(0, 3).map(s => (
                          <span key={s} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                        {services.length > 3 && (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">
                            +{services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Score details */}
                  <div className="mt-4 flex justify-between items-center py-2 border-y border-slate-800/60">
                    <span className="text-[10px] text-slate-500 font-semibold">System Score</span>
                    <span className="text-xs font-black text-white">{lead.score} / 100</span>
                  </div>
                </div>

                {/* Bottom Actions and Social Links */}
                <div className="mt-5 space-y-3 shrink-0">
                  
                  {/* Quick support buttons */}
                  <div className="flex justify-between items-center bg-slate-950 p-2 rounded-xl border border-slate-850">
                    <a href={`tel:${lead.phoneNumber}`} title="Call Client" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${lead.whatsappNumber || lead.phoneNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp Chat"
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} title="Email Client" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-all">
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {lead.website && (
                      <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" title="Website link" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-all">
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {lead.instagram && (
                      <a href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram}`} target="_blank" rel="noopener noreferrer" title="Instagram Profile" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-pink-400 transition-all">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                      </a>
                    )}
                    {lead.googleMap && (
                      <a href={lead.googleMap} target="_blank" rel="noopener noreferrer" title="Google Map location" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-all">
                        <MapPin className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Edit & Details Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsDetailsOpen(true);
                      }}
                      className="flex items-center justify-center space-x-1.5 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => triggerEdit(lead)}
                      className="flex items-center justify-center space-x-1.5 py-1.5 bg-amber-400/10 hover:bg-amber-400/25 border border-amber-400/20 text-amber-400 rounded-lg text-[10px] font-bold transition-all"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Update</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lost Reason Dialog Modal */}
      {isLostReasonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Lost Lead Feedback</h3>
            <p className="text-xs text-slate-400 mt-2">Please select the reason for closing this lead as lost:</p>
            
            <div className="mt-4 space-y-2">
              {[
                "No budget", "Not interested", "Already has agency", 
                "Price too high", "No response", "Requirement postponed", 
                "Went with competitor", "Not decision maker", "Service not fit", 
                "Bad lead quality"
              ].map(reason => (
                <label key={reason} className="flex items-center space-x-3 text-xs text-slate-300 hover:text-white cursor-pointer py-1">
                  <input
                    type="radio"
                    name="lostReason"
                    value={reason}
                    checked={lostReasonValue === reason}
                    onChange={(e) => setLostReasonValue(e.target.value)}
                    className="accent-amber-400"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsLostReasonOpen(false);
                  setLostLeadId(null);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={submitLostReason}
                disabled={!lostReasonValue}
                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:pointer-events-none text-white rounded-lg text-xs font-bold"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-2xl shadow-2xl my-8 relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
            
            <h3 className="text-base font-extrabold text-white">
              {isAddOpen ? "Create Prospect Lead" : `Update Lead Details`}
            </h3>

            <form onSubmit={isAddOpen ? handleAddSubmit : handleEditSubmit} className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Grid sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.businessName}
                    onChange={(e) => setLeadForm({ ...leadForm, businessName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Hilton Goa"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.phoneNumber}
                    onChange={(e) => setLeadForm({ ...leadForm, phoneNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={leadForm.whatsappNumber}
                    onChange={(e) => setLeadForm({ ...leadForm, whatsappNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="Same as phone if empty"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. purchase@hilton.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Website URL</label>
                  <input
                    type="text"
                    value={leadForm.website}
                    onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. hilton.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">City</label>
                  <input
                    type="text"
                    value={leadForm.city}
                    onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Panaji"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Area / Location</label>
                  <input
                    type="text"
                    value={leadForm.area}
                    onChange={(e) => setLeadForm({ ...leadForm, area: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Candolim"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Business Type Category</label>
                  <select
                    value={leadForm.category}
                    onChange={(e) => setLeadForm({ ...leadForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Lead Source</label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Budget / Deal Value (₹)</label>
                  <input
                    type="number"
                    value={leadForm.dealValue}
                    onChange={(e) => setLeadForm({ ...leadForm, dealValue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. 150000"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Lead Status</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Multi-select Services */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-3">Service Interest (Select All That Apply)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {serviceOptions.map(opt => {
                    const isChecked = leadForm.serviceInterests.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleServiceToggle(opt)}
                        className={`px-3 py-2 rounded-xl text-[10px] border font-bold text-left transition-all ${
                          isChecked 
                            ? "bg-amber-400/10 text-amber-400 border-amber-400/30" 
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Links and locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Instagram Link / Handle</label>
                  <input
                    type="text"
                    value={leadForm.instagram}
                    onChange={(e) => setLeadForm({ ...leadForm, instagram: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. @hilton_goa"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Google Maps Link / Coordinates</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={leadForm.googleMap}
                      onChange={(e) => setLeadForm({ ...leadForm, googleMap: e.target.value })}
                      onBlur={handleMapBlur}
                      className="w-full bg-slate-950 border border-slate-850 p-2.5 pr-22 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      placeholder="e.g. 15.4909, 73.8278 or maps link"
                    />
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="absolute right-1 bg-amber-400 hover:bg-amber-500 text-black px-2 py-1.5 rounded-lg text-[9px] font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95 border-none"
                      title="Locate client on interactive map"
                    >
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>Locate on Map</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Physical Address</label>
                <textarea
                  value={leadForm.address}
                  onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 h-16 resize-none"
                  placeholder="Street details..."
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Prospect Notes & Requirements</label>
                <textarea
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 h-20 resize-none"
                  placeholder="Notes about budget, timelines, conversation summaries..."
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:pointer-events-none text-black rounded-xl text-xs font-bold transition-all"
                >
                  {isSubmitting ? "Saving..." : isAddOpen ? "Create Prospect" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Side Drawer Panel */}
      {isDetailsOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl relative animate-slide-up">
            <button
              onClick={() => {
                setIsDetailsOpen(false);
                setSelectedLead(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded w-fit">
                  {selectedLead.category || "General"}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-2">{selectedLead.businessName}</h3>
                <p className="text-xs text-slate-400 mt-1">Lead status: <span className="text-amber-400 font-bold">{selectedLead.status}</span></p>
              </div>

              {/* Scoring breakdown details */}
              <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-2xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-xs font-extrabold text-white">Lead Evaluation (Score)</span>
                  <span className="text-xs text-amber-400 font-black">{selectedLead.score} / 100</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <CheckCircle className={`w-3.5 h-3.5 ${selectedLead.score >= 50 ? "text-emerald-400" : "text-slate-600"}`} />
                    <span>Urgent: {selectedLead.score >= 35 ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Flame className={`w-3.5 h-3.5 ${selectedLead.temperature === "Hot" ? "text-red-500" : "text-slate-600"}`} />
                    <span>Temp: {selectedLead.temperature}</span>
                  </div>
                </div>
              </div>

              {/* Details segments */}
              <div className="space-y-4">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850 pb-1">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Contact Name</span>
                    <span className="text-white font-medium block mt-0.5">{selectedLead.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone Number</span>
                    <span className="text-white font-medium block mt-0.5">{selectedLead.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email ID</span>
                    <span className="text-white font-medium block mt-0.5 truncate">{selectedLead.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">City</span>
                    <span className="text-white font-medium block mt-0.5">{selectedLead.city || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">BDM Owner</span>
                    <span className="text-white font-medium block mt-0.5 truncate">{selectedLead.dealOwnerEmail || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Lead Source</span>
                    <span className="text-white font-medium block mt-0.5">{selectedLead.source}</span>
                  </div>
                </div>
              </div>

              {/* Service Interests */}
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850 pb-1">Service Interests</h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(() => {
                    try {
                      const arr = JSON.parse(selectedLead.serviceInterests || "[]");
                      if (arr.length === 0) return <span className="text-slate-500 text-xs">No services selected</span>;
                      return arr.map((s: string) => (
                        <span key={s} className="text-xs bg-slate-800 text-slate-350 border border-slate-700/30 px-2 py-1 rounded-lg">
                          {s}
                        </span>
                      ));
                    } catch (e) {
                      return <span className="text-slate-500 text-xs">None</span>;
                    }
                  })()}
                </div>
              </div>

              {/* Requirement Notes */}
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850 pb-1">Notes & Description</h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  {selectedLead.notes || "No requirements description noted."}
                </p>
              </div>

              {/* Physical Address */}
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850 pb-1">Physical Address</h4>
                <p className="text-xs text-slate-300 mt-2">
                  {selectedLead.address || "No physical address provided."}
                </p>
              </div>

              {/* Lost Reason if applicable */}
              {selectedLead.status === "Closed Lost" && selectedLead.lostReason && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Lost Lead Reason</span>
                  <p className="text-xs text-slate-200 mt-1 font-semibold">{selectedLead.lostReason}</p>
                </div>
              )}
            </div>

            {/* Quick action triggers */}
            <div className="pt-4 border-t border-slate-800 flex justify-between space-x-2 shrink-0">
              <button
                onClick={() => {
                  setIsDetailsOpen(false);
                  triggerEdit(selectedLead);
                }}
                className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl text-xs font-bold transition-all text-center"
              >
                Update Leads Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Location Picker Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Pinpoint Client Location</h3>
                <p className="text-[10px] text-slate-400 mt-1">Drag the marker or search to locate the client business</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/40 hover:bg-slate-800 transition-all cursor-pointer border-none"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Map Search Form */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-800">
              <form onSubmit={handleMapSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, area, hotel, or street name..."
                  className="flex-1 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border-none"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Map Container */}
            <div className="relative">
              <div
                id="map-picker-container"
                className="h-80 w-full bg-slate-950 z-10"
                style={{ minHeight: "320px" }}
              />
              
              {/* Floating GPS Recenter Button */}
              {mapLoaded && (
                <button
                  type="button"
                  onClick={handleRecenterGps}
                  disabled={gpsLoading}
                  className="absolute bottom-4 right-4 z-20 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-800 text-black disabled:text-slate-500 p-2.5 rounded-full shadow-lg transition-all active:scale-95 border-none cursor-pointer flex items-center justify-center"
                  title="Recenter to my current GPS location"
                >
                  <MapPin className="w-5 h-5 shrink-0" />
                </button>
              )}

              {!mapLoaded && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-slate-400 text-xs z-20">
                  Loading map interface...
                </div>
              )}
            </div>

            {/* Selected Address Info */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-800 space-y-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Resolved Address</span>
                <p className="text-xs text-white font-medium bg-slate-950 border border-slate-850 p-2.5 rounded-xl min-h-12 leading-relaxed">
                  {tempAddress || "Locating coordinates..."}
                </p>
              </div>
              
              <div className="flex justify-between items-center gap-3">
                <div className="text-[10px] text-slate-400">
                  Coordinates: <span className="text-amber-400 font-mono font-bold">
                    {tempCoords ? `${tempCoords.lat.toFixed(6)}, ${tempCoords.lng.toFixed(6)}` : "None"}
                  </span>
                </div>
                
                <div className="flex space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!tempCoords}
                    onClick={() => {
                      if (tempCoords) {
                        setLeadForm(prev => ({
                          ...prev,
                          googleMap: `https://www.google.com/maps?q=${tempCoords.lat},${tempCoords.lng}`,
                          address: tempAddress || prev.address // Fill address field with geocoded text!
                        }));
                      }
                      setIsMapModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-black transition-all active:scale-95 disabled:opacity-50 cursor-pointer border-none"
                  >
                    Confirm Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
