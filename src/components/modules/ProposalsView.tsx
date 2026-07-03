import React, { useState } from "react";
import {
  FileSpreadsheet,
  Clock,
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  AlertCircle,
  Percent,
  Link,
  ChevronRight,
  TrendingUp,
  FileDown
} from "lucide-react";

interface ProposalsViewProps {
  clients: any[];
  proposals: any[];
  userRole: string;
  userEmail: string;
  onAddProposal: (proposal: any) => Promise<void>;
  onUpdateProposal: (id: string, payload: any) => Promise<void>;
}

export default function ProposalsView({
  clients,
  proposals,
  userRole,
  userEmail,
  onAddProposal,
  onUpdateProposal
}: ProposalsViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);

  const initialFormState = {
    clientId: "",
    title: "",
    serviceOffered: "Website Development",
    value: "",
    date: "",
    sentBy: userEmail,
    sentTo: "",
    status: "Sent",
    expectedClosingDate: "",
    closingProbability: "50",
    notes: ""
  };

  const [form, setForm] = useState(initialFormState);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("Proposal PDF");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const serviceOptions = [
    "Website Development", "Hospitality Growth Package", 
    "Digital Marketing", "Meta Ads", "Google Ads", "SEO", 
    "WhatsApp Automation", "CRM / Dashboard", "E-commerce Website", 
    "Mobile App", "Web App", "Branding", "Other"
  ];

  const proposalStatuses = [
    "Draft", "Sent", "Viewed / discussed", "Revision needed", 
    "Negotiation", "Approved", "Rejected", "Closed Won", "Closed Lost"
  ];

  const isBdm = userRole === "bdm" || userRole === "telecaller";
  const myProposals = isBdm
    ? proposals.filter(p => p.sentBy === userEmail || p.client?.dealOwnerEmail === userEmail)
    : proposals;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.title || !form.value) {
      setError("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onAddProposal({
        ...form,
        value: parseFloat(form.value) || 0,
        closingProbability: parseFloat(form.closingProbability) || 0,
        expectedClosingDate: form.expectedClosingDate ? new Date(form.expectedClosingDate).toISOString() : null,
        date: form.date ? new Date(form.date).toISOString() : new Date().toISOString()
      });
      setIsAddOpen(false);
      setForm(initialFormState);
    } catch (err: any) {
      setError(err.message || "Failed to create proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !uploadFile) {
      setError("Please select a file to upload");
      return;
    }
    setIsSubmitting(true);
    setError("");
    setUploadSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("clientId", selectedProposal.clientId);
      formData.append("type", uploadType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const attachment = await res.json();
      
      // Update proposal with file path
      await onUpdateProposal(selectedProposal.id, {
        filePath: attachment.url
      });

      setUploadSuccess(true);
      setTimeout(() => {
        setIsUploadOpen(false);
        setSelectedProposal(null);
        setUploadFile(null);
        setUploadSuccess(false);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (propId: string, newStatus: string) => {
    try {
      await onUpdateProposal(propId, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Proposal Tracking</h2>
          <p className="text-xs text-slate-400 mt-1">Review active, sent, and pending proposals. Set closing likelihoods.</p>
        </div>
        <button
          onClick={() => {
            setForm(initialFormState);
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-black px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-xs shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Proposal</span>
        </button>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {myProposals.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-850 rounded-2xl">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-xs mt-3">No proposals sent yet.</p>
          </div>
        ) : (
          myProposals.map(p => {
            const propDate = new Date(p.date);
            const closeDate = p.expectedClosingDate ? new Date(p.expectedClosingDate).toLocaleDateString() : "N/A";
            
            return (
              <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-all shadow-md">
                
                {/* Details */}
                <div className="flex items-start space-x-4 min-w-0">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-amber-500 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white truncate">{p.client?.businessName || "Unknown"}</h4>
                      <span className="text-[10px] text-slate-400">({p.client?.name})</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 mt-1">{p.title} - <span className="text-amber-400 font-extrabold">₹{p.value.toLocaleString()}</span></p>
                    
                    {p.notes && <p className="text-[10px] text-slate-500 mt-1 italic">Notes: {p.notes}</p>}

                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[10px] text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sent: {propDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Percent className="w-3.5 h-3.5 text-slate-500" />
                        <span>Probability: {p.closingProbability}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Expected Close: {closeDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Dropdown & File link */}
                <div className="flex items-center space-x-3 shrink-0 self-end md:self-auto">
                  
                  {p.filePath ? (
                    <a
                      href={p.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download Proposal"
                      className="p-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-450 hover:text-white transition-all"
                    >
                      <FileDown className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedProposal(p);
                        setIsUploadOpen(true);
                      }}
                      className="p-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 hover:border-slate-700 rounded-xl text-slate-450 hover:text-white transition-all flex items-center space-x-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold">PDF</span>
                    </button>
                  )}

                  <select
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    className="bg-slate-950 border border-slate-800 py-1.5 px-3 rounded-lg text-xs text-slate-300 focus:outline-none"
                  >
                    {proposalStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* New Proposal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">New Proposal Record</h3>

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

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Proposal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Development & SEO Scope"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Service Offered *</label>
                  <select
                    value={form.serviceOffered}
                    onChange={(e) => setForm({ ...form, serviceOffered: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Proposal Value (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 150000"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Expected Closing Date</label>
                  <input
                    type="date"
                    value={form.expectedClosingDate}
                    onChange={(e) => setForm({ ...form, expectedClosingDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Closing Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.closingProbability}
                    onChange={(e) => setForm({ ...form, closingProbability: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Proposal Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Proposal Client Email</label>
                  <input
                    type="email"
                    placeholder="client@hilton.com"
                    value={form.sentTo}
                    onChange={(e) => setForm({ ...form, sentTo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Notes / Scope details</label>
                <textarea
                  placeholder="Details of deliverables..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none h-16 resize-none"
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
                  {isSubmitting ? "Creating..." : "Create Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Proposal File Modal */}
      {isUploadOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upload Proposal File</h3>
            <p className="text-xs text-slate-400 mt-1">Lead: {selectedProposal.client?.businessName}</p>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              {error && <p className="text-xs text-red-400">{error}</p>}
              {uploadSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-450 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>File uploaded and linked successfully!</span>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">File Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                >
                  <option value="Proposal PDF">Proposal PDF</option>
                  <option value="Quotation">Quotation</option>
                  <option value="Client brief">Client brief</option>
                  <option value="Agreement">Agreement</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Select File (PDF / Images) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    setSelectedProposal(null);
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !uploadFile}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
