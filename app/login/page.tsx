"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // SIGN UP LOGIC
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        alert("Sign Up Error: " + error.message);
      } else {
        alert("Success! Check your email for a confirmation link to activate your account.");
      }
    } else {
      // LOGIN LOGIC
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Login Error: " + error.message);
      } else {
        // Redirect to Account/Library page after login
        router.push("/account");
      }
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0f172a] text-slate-100 font-sans">
      <div className="w-full max-w-md">
        <header className="mb-10 text-center">
          <Link href="/" className="text-blue-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors mb-4 inline-block">← Back to Generator</Link>
          <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
            {isSignUp ? "Join the Crew" : "Welcome Back"}
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4">
            {isSignUp ? "Create an account to save and submit games" : "Access your private activity library"}
          </p>
        </header>

        <form onSubmit={handleAuth} className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col gap-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 block mb-3 ml-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold transition-all" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@email.com"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 block mb-3 ml-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold transition-all" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-blue-600 hover:text-white font-black py-5 rounded-2xl transition-all uppercase tracking-[0.2em] text-xs shadow-xl">
            {loading ? "Processing..." : isSignUp ? "Create Account" : "Enter Dashboard"}
          </button>

          <div className="text-center mt-2">
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
            >
              {isSignUp ? "Already have an account? Log In" : "Need an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}