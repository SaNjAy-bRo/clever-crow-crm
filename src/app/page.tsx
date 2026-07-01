import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SignInForm from "@/components/SignInForm";
import { ShieldAlert, TrendingUp, Users, Shield, Layers } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { error } = await searchParams;

  // If already logged in, redirect straight to the dashboard (unless we were sent back with an AccessDenied error)
  if (session && session.user && !error) {
    redirect("/dashboard");
  }

  // Handle specific NextAuth error codes
  const hasError = !!error;
  const isAccessDenied = error === "AccessDenied" || error === "Callback" || error === "CredentialsSignin";

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-black">
      
      {/* Left side: Premium Brand & Hero Section */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-16 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 relative overflow-hidden">
        {/* Decorative Grid Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
        
        {/* Top Header */}
        <div className="flex items-center space-x-3 z-10">
          <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
            <svg
              className="w-6 h-6 text-slate-950 font-bold"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 10h12" />
              <path d="M4 14h9" />
              <path d="M19 6a3 3 0 0 1-3-3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9Z" />
              <path d="M12 2v4" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              Clever Crow <span className="text-amber-400">Strategies</span>
            </span>
            <div className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
              Client Tracking & Operations
            </div>
          </div>
        </div>

        {/* Central Hero Content */}
        <div className="my-auto py-12 lg:py-0 z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>SaaS Operations Platform v1.2</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Intelligent client <br />
            tracking for <span className="text-amber-400 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 bg-clip-text text-transparent">smart growth.</span>
          </h1>
          <p className="mt-6 text-slate-400 text-base lg:text-lg leading-relaxed">
            Monitor client metrics, track ongoing service details, log account activity, and view financial performance indicators in one highly secure workspace.
          </p>

          {/* Features Checklist */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <div className="p-1 bg-amber-400/10 rounded border border-amber-400/20">
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <span>Comprehensive client profiles</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <div className="p-1 bg-blue-500/10 rounded border border-blue-500/20">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <span>Real-time deal analytics</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <div className="p-1 bg-blue-500/10 rounded border border-blue-500/20">
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <span>Actionable activity histories</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <div className="p-1 bg-amber-400/10 rounded border border-amber-400/20">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <span>Secure Whitelist Control</span>
            </div>
          </div>
        </div>

        {/* Footer Brand Info */}
        <div className="text-xs text-slate-500 z-10">
          © {new Date().getFullYear()} Clever Crow Strategies. All rights reserved. Confidential Internal System.
        </div>
      </div>

      {/* Right side: Secure Authentication Card */}
      <div className="w-full lg:w-[480px] bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-center items-center p-8 lg:p-12 relative">
        <div className="w-full max-w-sm flex flex-col">
          
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">System Sign In</h2>
            <p className="text-sm text-slate-400 mt-2">
              Authenticate using your whitelisted Google account.
            </p>
          </div>

          {/* Secure Whitelist Notice */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-6 text-xs text-slate-400 flex items-start space-x-3 leading-relaxed">
            <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Whitelist Verification Active:</span> Only predefined Clever Crow email addresses are granted access. Any external logins will be automatically rejected.
            </div>
          </div>

          {/* Error Banner */}
          {hasError && (
            <div className="p-4 bg-red-950/50 border border-red-500/30 rounded-2xl mb-6 flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                {isAccessDenied ? (
                  <>
                    <p className="font-semibold text-red-200">Access Denied</p>
                    <p className="text-red-400 mt-1">
                      Your email address is not whitelisted. Please contact your system admin to grant access.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-red-200">Authentication Error</p>
                    <p className="text-red-400 mt-1">
                      An unexpected error occurred during login. Please try again.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Login Actions */}
          <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 flex flex-col space-y-4">
            <SignInForm />
          </div>

          <div className="mt-8 text-center text-xs text-slate-500 leading-relaxed font-semibold">
            Contact your system administrator to authorize new Google accounts.
          </div>
        </div>
      </div>
    </div>
  );
}
