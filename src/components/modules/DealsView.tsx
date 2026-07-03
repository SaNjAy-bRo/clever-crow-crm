import React, { useState } from "react";
import {
  IndianRupee,
  Calendar,
  Filter,
  CheckCircle,
  PlusCircle,
  FileText,
  DollarSign,
  AlertCircle,
  Clock,
  Briefcase,
  TrendingUp,
  Percent
} from "lucide-react";

interface DealsViewProps {
  clients: any[];
  userRole: string;
  userEmail: string;
  onUpdateLead: (id: string, payload: any) => Promise<void>;
}

export default function DealsView({
  clients,
  userRole,
  userEmail,
  onUpdateLead
}: DealsViewProps) {
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Payment Form State
  const [payForm, setPayForm] = useState({
    dealValue: "0",
    advanceAmount: "0",
    balanceAmount: "0",
    paymentStatus: "Pending",
    invoiceStatus: "Draft",
    gstRequired: false,
    collectionDate: "",
    expectedBalanceDate: "",
    dealStatus: "Advance received",
    incentiveEligible: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const dealStatuses = [
    "Won but payment pending", "Advance received", 
    "Work started", "Balance pending", "Fully collected", "Lost"
  ];

  const paymentStatuses = ["Pending", "Advance Paid", "Fully Paid", "Refunded"];
  const invoiceStatuses = ["Draft", "Sent", "Paid", "Cancelled"];

  const isBdm = userRole === "bdm" || userRole === "telecaller";
  const myClosedWonDeals = clients.filter(c => {
    const isWon = c.status === "Closed Won";
    const isOwner = !isBdm || c.dealOwnerEmail === userEmail;
    return isWon && isOwner;
  });

  // Calculate summaries
  const totalClosedDealValue = myClosedWonDeals.reduce((s, d) => s + (d.dealValue || d.value || 0), 0);
  const totalAdvancesCollected = myClosedWonDeals.reduce((s, d) => s + (d.advanceAmount || 0), 0);
  const totalBalancePending = myClosedWonDeals.reduce((s, d) => s + (d.balanceAmount || 0), 0);
  
  const totalActualCollected = myClosedWonDeals.reduce((sum, c) => {
    const adv = c.advanceAmount || 0;
    const bal = c.paymentStatus === "Fully collected" || c.paymentStatus === "Fully Paid" ? c.balanceAmount : 0;
    return sum + adv + bal;
  }, 0);

  const openPaymentModal = (deal: any) => {
    setSelectedDeal(deal);
    setPayForm({
      dealValue: String(deal.dealValue || deal.value || 0),
      advanceAmount: String(deal.advanceAmount || 0),
      balanceAmount: String(deal.balanceAmount || 0),
      paymentStatus: deal.paymentStatus || "Pending",
      invoiceStatus: deal.invoiceStatus || "Draft",
      gstRequired: deal.gstRequired || false,
      collectionDate: deal.collectionDate ? new Date(deal.collectionDate).toISOString().split("T")[0] : "",
      expectedBalanceDate: deal.expectedBalanceDate ? new Date(deal.expectedBalanceDate).toISOString().split("T")[0] : "",
      dealStatus: deal.dealStatus || "Advance received",
      incentiveEligible: deal.incentiveEligible || false
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;
    setIsSubmitting(true);
    setError("");
    try {
      const dv = parseFloat(payForm.dealValue) || 0;
      const adv = parseFloat(payForm.advanceAmount) || 0;
      const bal = parseFloat(payForm.balanceAmount) || 0;

      await onUpdateLead(selectedDeal.id, {
        ...selectedDeal,
        dealValue: dv,
        value: dv,
        advanceAmount: adv,
        balanceAmount: bal,
        paymentStatus: payForm.paymentStatus,
        invoiceStatus: payForm.invoiceStatus,
        gstRequired: payForm.gstRequired,
        collectionDate: payForm.collectionDate ? new Date(payForm.collectionDate).toISOString() : null,
        expectedBalanceDate: payForm.expectedBalanceDate ? new Date(payForm.expectedBalanceDate).toISOString() : null,
        dealStatus: payForm.dealStatus,
        incentiveEligible: payForm.incentiveEligible
      });

      setIsPaymentModalOpen(false);
      setSelectedDeal(null);
    } catch (err: any) {
      setError(err.message || "Failed to log payments");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">Deals & Revenue Tracking</h2>
        <p className="text-xs text-slate-400 mt-1">Review closed deal sizes, logged collections, GST status, and BDM incentive eligibility.</p>
      </div>

      {/* Revenue Summaries Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Total Won Pipeline</span>
          <span className="text-2xl font-black text-white block mt-1.5">₹{totalClosedDealValue.toLocaleString()}</span>
          <span className="text-[9px] text-slate-500 mt-2 block">Value of all Closed Won deals</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Advances Collected</span>
          <span className="text-2xl font-black text-emerald-450 block mt-1.5">₹{totalAdvancesCollected.toLocaleString()}</span>
          <span className="text-[9px] text-emerald-400 mt-2 block">Advances received at closure</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Balance Pending</span>
          <span className="text-2xl font-black text-amber-500 block mt-1.5">₹{totalBalancePending.toLocaleString()}</span>
          <span className="text-[9px] text-amber-400 mt-2 block">Outstanding accounts receivable</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Total Collected</span>
          <span className="text-2xl font-black text-indigo-400 block mt-1.5">₹{totalActualCollected.toLocaleString()}</span>
          <span className="text-[9px] text-indigo-400 mt-2 block">KPI revenue count (collected only)</span>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden">
        <div className="pb-3 border-b border-slate-800 mb-4 flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Closed Deals Ledger</h3>
          <span className="text-[10px] text-slate-400">Total closed deals: {myClosedWonDeals.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-850">
                <th className="pb-2.5 font-semibold">Client / Business</th>
                <th className="pb-2.5 font-semibold text-center">GST Check</th>
                <th className="pb-2.5 font-semibold text-center">Collection Status</th>
                <th className="pb-2.5 font-semibold text-right">Deal Size</th>
                <th className="pb-2.5 font-semibold text-right">Advance Paid</th>
                <th className="pb-2.5 font-semibold text-right">Balance Due</th>
                <th className="pb-2.5 font-semibold text-center">Incentive</th>
                <th className="pb-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myClosedWonDeals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-slate-500 py-6 text-center">No closed won deals found. Close a lead as "Closed Won" first.</td>
                </tr>
              ) : (
                myClosedWonDeals.map(deal => (
                  <tr key={deal.id} className="border-b border-slate-850 hover:bg-slate-950/20">
                    <td className="py-3.5">
                      <span className="font-bold text-white block">{deal.businessName}</span>
                      <span className="text-[10px] text-slate-400 block">{deal.name}</span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        deal.gstRequired ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-950 text-slate-500"
                      }`}>
                        {deal.gstRequired ? "GST 18%" : "No GST"}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        deal.dealStatus === "Fully collected" || deal.paymentStatus === "Fully Paid"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-450"
                          : "bg-amber-400/10 border-amber-400/20 text-amber-400"
                      }`}>
                        {deal.dealStatus || "Advance received"}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-white">₹{(deal.dealValue || deal.value).toLocaleString()}</td>
                    <td className="py-3.5 text-right text-emerald-400 font-bold">₹{(deal.advanceAmount || 0).toLocaleString()}</td>
                    <td className="py-3.5 text-right text-amber-500 font-bold">₹{(deal.balanceAmount || 0).toLocaleString()}</td>
                    <td className="py-3.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        deal.incentiveEligible ? "bg-amber-400 text-black" : "bg-slate-950 text-slate-500"
                      }`}>
                        {deal.incentiveEligible ? "Eligible" : "No"}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => openPaymentModal(deal)}
                        className="px-3 py-1 bg-slate-950 border border-slate-850 hover:bg-slate-800 hover:text-white rounded-lg text-[10px] font-bold text-slate-300 transition-all"
                      >
                        Edit Collection
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Collection Modal */}
      {isPaymentModalOpen && selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Payments & Collections</h3>
            <p className="text-xs text-slate-450 mt-1">Client: {selectedDeal.businessName}</p>

            <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-4">
              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Deal Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={payForm.dealValue}
                    onChange={(e) => setPayForm({ ...payForm, dealValue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Advance Collected (₹) *</label>
                  <input
                    type="number"
                    required
                    value={payForm.advanceAmount}
                    onChange={(e) => setPayForm({ ...payForm, advanceAmount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-emerald-450 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Balance Remaining (₹) *</label>
                  <input
                    type="number"
                    required
                    value={payForm.balanceAmount}
                    onChange={(e) => setPayForm({ ...payForm, balanceAmount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Collection Status Stage</label>
                  <select
                    value={payForm.dealStatus}
                    onChange={(e) => setPayForm({ ...payForm, dealStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {dealStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Advance Date</label>
                  <input
                    type="date"
                    value={payForm.collectionDate}
                    onChange={(e) => setPayForm({ ...payForm, collectionDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Expected Balance Date</label>
                  <input
                    type="date"
                    value={payForm.expectedBalanceDate}
                    onChange={(e) => setPayForm({ ...payForm, expectedBalanceDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Payment Status</label>
                  <select
                    value={payForm.paymentStatus}
                    onChange={(e) => setPayForm({ ...payForm, paymentStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Invoice Status</label>
                  <select
                    value={payForm.invoiceStatus}
                    onChange={(e) => setPayForm({ ...payForm, invoiceStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 py-2 px-3 rounded-xl text-xs text-slate-350 focus:outline-none"
                  >
                    {invoiceStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <label className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payForm.gstRequired}
                    onChange={(e) => setPayForm({ ...payForm, gstRequired: e.target.checked })}
                    className="accent-amber-400"
                  />
                  <span>GST Invoice Required? (18% tax will apply)</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payForm.incentiveEligible}
                    onChange={(e) => setPayForm({ ...payForm, incentiveEligible: e.target.checked })}
                    className="accent-amber-400"
                  />
                  <span>BDM Incentive Eligible? (Eligible on payment collections)</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedDeal(null);
                  }}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Logging..." : "Confirm Payment Logs"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
