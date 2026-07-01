"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Shield } from "lucide-react";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    if (!email) {
      setErrorMsg("Please enter an email address.");
      setIsLoading(false);
      return;
    }

    try {
      // Trigger NextAuth credentials sign in
      const res = await signIn("credentials", {
        email: email.trim(),
        redirect: false, // Don't redirect automatically so we can catch authentication failures
        callbackUrl: "/dashboard"
      });

      if (res?.error) {
        // NextAuth returned an error (e.g. CredentialsSignin meaning authorize returned null)
        setErrorMsg("Access Denied: Your email is not whitelisted.");
        setIsLoading(false);
      } else if (res?.url) {
        // Sign-in successful, redirect to callbackUrl
        window.location.href = res.url;
      }
    } catch (err) {
      console.error("Sign-in submission error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Whitelisted Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sanjay@clevercrowstrategies.com"
          disabled={isLoading}
          className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-4 py-3 rounded-2xl text-sm focus:border-amber-400 focus:outline-none transition-all placeholder:text-slate-650 disabled:opacity-50"
        />
      </div>

      {errorMsg && (
        <div className="text-red-400 text-xs font-medium pl-1 bg-red-950/20 border border-red-900/30 p-3 rounded-xl">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-2 px-5 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-amber-400/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Shield className="w-4 h-4 text-slate-950" />
            <span className="transition-transform group-hover:translate-x-0.5">
              Secure Sign In
            </span>
          </>
        )}
      </button>
    </form>
  );
}
