"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- CONFIGURATION ---
const ADMIN_CODE = "york2026"; // Change this to whatever password you want

export default function AdminConsole() {
  const router = useRouter();

  // --- STATE ---
  const [authorized, setAuthorized] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, topCategory: "N/A" });

  // --- INITIAL LOAD ---
  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    // Optional: Check if user is logged in via Supabase too
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
       // You could force redirect to login, or just rely on the code below
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch EVERYTHING
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const approvedGames = data.filter(g => g.status === 'approved');
      const pendingGames = data.filter(g => g.status === 'pending');
      
      setActivities(approvedGames);
      setPending(pendingGames);
      
      // Calculate Stats
      const categories = approvedGames.flatMap(g => g.category || []);
      const mode = categories.sort((a,b) =>
        categories.filter(v => v===a).length - categories.filter(v => v===b).length
      ).pop();

      setStats({
        total: approvedGames.length,
        pending: pendingGames.length,
        topCategory: mode || "None"
      });
    }
    setLoading(false);
  };

  // --- ACTIONS ---
  const handleApprove = async (id: number) => {
    const { error } = await supabase.from('activities').update({ status: 'approved' }).eq('id', id);
    if (!error) {
      alert("Approved! It is now live.");
      fetchData(); // Refresh
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Are you sure you want to delete this activity?")) return;
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (!error) {
      fetchData(); // Refresh
    }
  };

  // --- FILTERED LIST FOR THE VAULT ---
  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- ACCESS GATE ---
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl text-center max-w-md w-full">
          <h1 className="text-3xl font-black text-white mb-2 uppercase italic">Restricted Access</h1>
          <p className="text-slate-400 mb-6 text-sm">Enter the Command Code to access the Master Terminal.</p>
          <input 
            type="password" 
            placeholder="Access Code"
            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-center text-white tracking-widest outline-none focus:border-blue-500 mb-4"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
          />
          <button 
            onClick={() => inputCode === ADMIN_CODE ? setAuthorized(true) : alert("Access Denied")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all"
          >
            Authenticate
          </button>
          <div className="mt-8">
            <Link href="/" className="text-slate-600 text-xs hover:text-white transition-colors">← Return to Generator</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-12 relative">
      {/* BACKGROUND EFFECTS */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* NAVBAR */}
        <nav className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter">
              MASTER TERMINAL
            </h1>
            <p className="text-blue-500 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">
              Admin Command Center
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="px-6 py-2 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              Live Site
            </Link>
            <button onClick={() => setAuthorized(false)} className="text-red-500 text-xs font-black uppercase tracking-widest hover:text-red-400">
              Lock Terminal
            </button>
          </div>
        </nav>

        {/* SECTION 1: HUD STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Database Size</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{stats.total}</span>
              <span className="text-sm text-slate-400 font-bold">Activities</span>
            </div>
          </div>
          <div className={`bg-white/5 border p-6 rounded-3xl backdrop-blur-md transition-colors ${stats.pending > 0 ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10'}`}>
            <p className={`${stats.pending > 0 ? 'text-yellow-400' : 'text-slate-500'} text-[10px] uppercase tracking-[0.2em] font-black mb-2`}>Pending Review</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-black ${stats.pending > 0 ? 'text-yellow-400' : 'text-white'}`}>{stats.pending}</span>
              <span className="text-sm text-slate-400 font-bold">Submissions</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Dominant Category</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-400">{stats.topCategory}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: PENDING QUEUE (Visual Cards) */}
        {pending.length > 0 && (
          <div className="mb-16">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <h2 className="text-xl font-black uppercase tracking-widest text-white">Incoming Transmissions</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pending.map((item) => (
                  <div key={item.id} className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-3xl relative overflow-hidden group">
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                           <span className="bg-yellow-500/20 text-yellow-300 text-[9px] font-black uppercase px-2 py-1 rounded">Pending</span>
                           <span className="text-slate-500 text-[10px] font-mono">ID: {item.id}</span>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic leading-none mb-2">{item.title}</h3>
                        <p className="text-slate-400 text-xs mb-6 line-clamp-3">"{item.description}"</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                           <button 
                              onClick={() => handleApprove(item.id)}
                              className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                            >
                              Approve
                           </button>
                           <button 
                              onClick={() => handleDelete(item.id)}
                              className="bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/50 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                            >
                              Reject
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* SECTION 3: THE VAULT (Data Grid) */}
        <div>
           <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">The Vault</h2>
              <div className="relative w-full md:w-96">
                 <input 
                    type="text" 
                    placeholder="Search database..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">
                    {filteredActivities.length} GAMES
                 </span>
              </div>
           </div>

           <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                       <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Title</th>
                       <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Category</th>
                       <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden md:table-cell">Age</th>
                       <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {filteredActivities.slice(0, 50).map((game) => (
                       <tr key={game.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4">
                             <div className="font-bold text-white text-sm">{game.title}</div>
                             <div className="text-[10px] text-slate-500 truncate max-w-[200px] md:hidden">{game.description}</div>
                          </td>
                          <td className="p-4">
                             <div className="flex flex-wrap gap-1">
                                {game.category?.slice(0,2).map((c: string) => (
                                   <span key={c} className="bg-blue-500/10 text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-500/20">{c}</span>
                                ))}
                             </div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                             <span className="text-xs text-slate-400 font-mono">{game.age_group?.join(", ")}</span>
                          </td>
                          <td className="p-4 text-right">
                             <button 
                                onClick={() => handleDelete(game.id)}
                                className="text-slate-600 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-wider px-3 py-1 rounded hover:bg-red-500/10"
                             >
                                Delete
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
              {filteredActivities.length > 50 && (
                 <div className="p-4 text-center text-[10px] text-slate-500 uppercase tracking-widest border-t border-white/5">
                    Showing top 50 results of {filteredActivities.length}
                 </div>
              )}
           </div>
        </div>

      </div>
    </main>
  );
}