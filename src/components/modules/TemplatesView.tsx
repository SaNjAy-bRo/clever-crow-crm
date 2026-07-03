import React, { useState } from "react";
import {
  FileCode,
  Copy,
  Check,
  MessageSquare,
  Mail,
  FileText,
  Search,
  ExternalLink
} from "lucide-react";

export default function TemplatesView() {
  const [activeSubTab, setActiveSubTab] = useState<"whatsapp" | "email" | "proposals">("whatsapp");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const whatsappTemplates = [
    {
      id: "wa_intro",
      title: "First Message / Cold Introduction",
      text: `Hello [Client Name],\n\nHope you are doing great! I am [My Name] from Clever Crow Strategies.\n\nWe specialize in hospitality growth package integrations, web development, and digital ads designed specifically to increase direct bookings and revenue. I came across [Business Name] and wanted to connect.\n\nDo you have 5 minutes for a quick introductory call tomorrow at 4 PM?\n\nBest,\n[My Name]\nClever Crow Strategies`
    },
    {
      id: "wa_followup",
      title: "Follow-up Message",
      text: `Hi [Client Name],\n\nJust checking in if you had a chance to look at my previous message regarding digital marketing strategies for [Business Name]? We'd love to share some insights on how you can grow direct sales by 25%.\n\nLet me know if we can connect for a brief 10-minute call.\n\nBest,\n[My Name]`
    },
    {
      id: "wa_meet",
      title: "Meeting Confirmation",
      text: `Hi [Client Name],\n\nThis is to confirm our meeting scheduled for [Date] at [Time].\n\nMeeting link: https://meet.google.com/xyz-abc-123\nAgenda: Discovery session & digital presence audit for [Business Name].\n\nLooking forward to speaking with you!\n\nBest,\n[My Name]\nClever Crow Strategies`
    },
    {
      id: "wa_proposal",
      title: "Proposal Sent Message",
      text: `Hi [Client Name],\n\nI have successfully sent over our detailed proposal for [Service Name] to your email address ([Client Email]).\n\nI've also attached the summary PDF here. Please let me know once you have reviewed it so we can discuss the next steps.\n\nBest regards,\n[My Name]`
    },
    {
      id: "wa_payment",
      title: "Payment Follow-up",
      text: `Hello [Client Name],\n\nHope you're well. This is a gentle reminder regarding the pending advance invoice for [Service Name] (Amount: ₹[Amount]).\n\nSharing the account details below:\nBank: Clever Crow Bank\nIFSC: CCB123456\nAcc No: 9876543210\n\nPlease share a screenshot once the payment is initiated so our development team can start work.\n\nBest,\n[My Name]`
    },
    {
      id: "wa_thanks",
      title: "Thank You / Onboarding Welcome",
      text: `Dear [Client Name],\n\nThank you for choosing Clever Crow Strategies! We've received the advance payment and are excited to begin our collaboration.\n\nOur project manager will get in touch with you shortly to share the onboarding requirements checklist.\n\nWelcome onboard!\n\nBest regards,\nClever Crow Team`
    }
  ];

  const emailTemplates = [
    {
      id: "email_intro",
      title: "Introduction Email",
      subject: "Partnership Proposal: Direct booking growth for [Business Name]",
      text: `Dear [Client Name],\n\nI hope this email finds you well.\n\nMy name is [My Name], and I represent Clever Crow Strategies. We help luxury boutique properties, hotels, and resorts drive direct guest acquisitions and build premium digital identities.\n\nI came across [Business Name] and noticed some areas where we can help you double your online booking conversions through website optimization and target ads.\n\nWould you be open to a brief 10-minute discovery call this Thursday at 3:00 PM?\n\nSincerely,\n\n[My Name]\nClever Crow Strategies`
    },
    {
      id: "email_proposal",
      title: "Proposal Details Email",
      subject: "Clever Crow Proposal: [Service Offered] for [Business Name]",
      text: `Dear [Client Name],\n\nIt was a pleasure speaking with you during our discovery session.\n\nAs discussed, please find attached our comprehensive proposal for [Service Offered] tailored specifically for [Business Name]. This proposal covers our strategy, scope of deliverables, timelines, and commercial terms.\n\nLooking forward to your feedback. Please let me know if you would like to schedule a brief call to walk through the details.\n\nBest regards,\n\n[My Name]\nClever Crow Strategies`
    },
    {
      id: "email_followup",
      title: "Follow-up Email",
      subject: "Follow-up: Digital Growth Proposal for [Business Name]",
      text: `Dear [Client Name],\n\nI hope you're having a productive week.\n\nI am writing to follow up on the proposal we sent over last Tuesday. Have you had a chance to review it with your team?\n\nI'd be happy to answer any questions or hop on a brief call to align on commercials. Please let me know your thoughts.\n\nBest regards,\n\n[My Name]\nClever Crow Strategies`
    }
  ];

  const proposalTemplates = [
    {
      id: "prop_web",
      title: "Website Development Proposal Scope",
      text: `1. Website Scope:\n   - Custom next-gen Next.js / React application framework\n   - Premium typography, dark theme UI, & custom micro-animations\n   - Responsive mobile-first grid layout\n   - On-page SEO setup (metadata, semantic headings)\n   - Instant booking widgets & contact forms\n\n2. Deliverables:\n   - 5 Page structures (Home, Services/Rooms, About, Gallery, Contact)\n   - Domain & hosting integration\n   - Content management guidance`
    },
    {
      id: "prop_marketing",
      title: "Digital Marketing Proposal Scope",
      text: `1. Marketing Strategy:\n   - Meta Ads (Facebook & Instagram campaigns targeting high-intent users)\n   - Google Ads (Local Search campaigns targeting tourist queries)\n   - Conversion tracking pixel installations\n   - Weekly graphic asset design creatives\n\n2. Key KPIs:\n   - Increased direct leads by 25%\n   - Reduced cost-per-lead (CPL) by 15%\n   - Transparent monthly reporting dashboards`
    },
    {
      id: "prop_hospitality",
      title: "Hospitality Growth Proposal Scope",
      text: `1. Hospitality Program:\n   - OTA (Booking.com, Agoda) optimization audit\n   - Google Business Profile local search rank boost\n   - WhatsApp Direct Automation (Automated replies to guest inquiries)\n   - Property showcase video & creative photo assets production`
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">Preset Message Templates</h2>
        <p className="text-xs text-slate-400 mt-1">Copy pre-written introductions, emails, or proposal scope templates instantly to clipboard.</p>
      </div>

      {/* Select Template Type */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs pb-1 shrink-0">
        <button
          onClick={() => setActiveSubTab("whatsapp")}
          className={`pb-2.5 font-bold border-b-2 px-1 transition-all flex items-center space-x-2 ${
            activeSubTab === "whatsapp" ? "text-amber-400 border-amber-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Messages</span>
        </button>
        <button
          onClick={() => setActiveSubTab("email")}
          className={`pb-2.5 font-bold border-b-2 px-1 transition-all flex items-center space-x-2 ${
            activeSubTab === "email" ? "text-amber-400 border-amber-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Outbound Emails</span>
        </button>
        <button
          onClick={() => setActiveSubTab("proposals")}
          className={`pb-2.5 font-bold border-b-2 px-1 transition-all flex items-center space-x-2 ${
            activeSubTab === "proposals" ? "text-amber-400 border-amber-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Proposal Scopes</span>
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {activeSubTab === "whatsapp" && whatsappTemplates.map(t => (
          <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-md">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t.title}</h3>
              <pre className="text-xs text-slate-300 mt-3 p-3 bg-slate-950/80 border border-slate-850 rounded-xl whitespace-pre-wrap font-mono select-all">
                {t.text}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(t.text, t.id)}
              className="mt-4 w-full flex items-center justify-center space-x-2 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 hover:text-white rounded-xl text-[10px] font-bold text-slate-350 transition-all active:scale-[0.98]"
            >
              {copiedId === t.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-450" />
                  <span className="text-emerald-400">Copied Template!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy WhatsApp Message</span>
                </>
              )}
            </button>
          </div>
        ))}

        {activeSubTab === "email" && emailTemplates.map(t => (
          <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-md">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t.title}</h3>
              <div className="mt-2 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-200">Subject: </span>{t.subject}
              </div>
              <pre className="text-xs text-slate-300 mt-3 p-3 bg-slate-950/80 border border-slate-850 rounded-xl whitespace-pre-wrap font-mono select-all">
                {t.text}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(`Subject: ${t.subject}\n\n${t.text}`, t.id)}
              className="mt-4 w-full flex items-center justify-center space-x-2 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 hover:text-white rounded-xl text-[10px] font-bold text-slate-350 transition-all active:scale-[0.98]"
            >
              {copiedId === t.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-450" />
                  <span className="text-emerald-400">Copied Template!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Subject & Body</span>
                </>
              )}
            </button>
          </div>
        ))}

        {activeSubTab === "proposals" && proposalTemplates.map(t => (
          <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-md">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t.title}</h3>
              <pre className="text-xs text-slate-300 mt-3 p-3 bg-slate-950/80 border border-slate-850 rounded-xl whitespace-pre-wrap font-mono select-all">
                {t.text}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(t.text, t.id)}
              className="mt-4 w-full flex items-center justify-center space-x-2 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 hover:text-white rounded-xl text-[10px] font-bold text-slate-350 transition-all active:scale-[0.98]"
            >
              {copiedId === t.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-450" />
                  <span className="text-emerald-400">Copied Template!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Scope details</span>
                </>
              )}
            </button>
          </div>
        ))}

      </div>

    </div>
  );
}
