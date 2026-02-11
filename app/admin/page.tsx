"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- SECURITY CONFIGURATION ---
// REPLACE THIS with your actual email address(es)
const ADMIN_EMAILS = ["avilaevan3@gmail.com"]; 

export default function AdminConsole() {
  const router = useRouter();

  // --- STATE ---
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [activities, setActivities] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Analytics State
  const [stats, setStats] = useState<any>({ 
    total: 0, 
    pending: 0, 
    catBreakdown: {},
    ageBreakdown: {},
    prepBreakdown: {},
    gapReport: []
  });

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  // --- INITIAL SECURITY CHECK ---
  useEffect(() => {
    const checkUser = async () => {
      setCheckingAuth(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not logged in at all
        setAuthorized(false);
      } else if (session.user.email && ADMIN_EMAILS.includes(session.user.email)) {
        // Logged in AND email matches the whitelist
        setAuthorized(true);
        fetchData(); // Only fetch data if authorized
      } else {
        // Logged in, but wrong email
        setAuthorized(false);
      }
      
      setCheckingAuth(false);
    };

    checkUser();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const approved = data.filter(g => g.status === 'approved');
      const pendingGames = data.filter(g => g.status === 'pending');
      
      setActivities(approved);
      setPending(pendingGames);
      
      // Analytics Logic
      const cats: any = {};
      const ages: any = {};
      const prep: any = {};
      
      approved.forEach(game => {
        game.category?.forEach((c: string) => cats[c] = (cats[c] || 0) + 1);
        game.age_group?.forEach((a: string) => ages[a] = (ages[a] || 0) + 1);
        const p = game.materials || "Unknown";
        prep[p] = (prep[p] || 0) + 1;
      });

      const gaps = [];
      if ((ages["4-5"] || 0) < approved.length * 0.1) gaps.push("Low on '4-5 Year Old' content");
      if ((cats["Learning Lab"] || 0) < approved.length * 0.15) gaps.push("Low on 'Learning Lab' activities");
      if ((prep["No Materials"] || 0) < approved.length * 0.2) gaps.push("Need more 'No Materials' games");

      setStats({
        total: approved.length,
        pending: pendingGames.length,
        catBreakdown: cats,
        ageBreakdown: ages,
        prepBreakdown: prep,
        gapReport: gaps.length > 0 ? gaps : ["Database is healthy!"]
      });
    }
    setLoading(false);
  };

  // --- ACTIONS ---
  const handleApprove = async (id: number) => {
    const { error } = await supabase.from('activities').update({ status: 'approved' }).eq('id', id);
    if (!error) {
      alert("Approved! It is now live.");
      fetchData(); 
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Are you sure you want to delete this activity?")) return;
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (!error) fetchData();
  };

  const openEditor = (game: any) => {
    setEditForm(game);
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!editForm) return;
    const { error } = await supabase
      .from('activities')
      .update({
        title: editForm.title,
        description: editForm.description,
        make_it_easier: editForm.make_it_easier,
        make_it_harder: editForm.make_it_harder
      })
      .eq('id', editForm.id);

    if (!error) {
      setIsEditing(false);
      setEditForm(null);
      fetchData();
      alert("Changes saved successfully!");
    } else {
      alert("Error saving changes.");
    }
  };

  // --- COMPONENT: STAT BAR ---
  const StatBar = ({ label, value, total, color = "bg-blue-500" }: any) => {
    const percent = Math.round((value / total) * 100) || 0;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
          <span>{label}</span>
          <span>{value} ({percent}%)</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    );
  };

  // --- UNAUTHORIZED STATE ---
  if (checkingAuth) {
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-500 text-xs font-black uppercase tracking-widest">Scanning Retina...</div>;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl text-center max-w-md w-full">
          <h1 className="text-3xl font-black text-red-500 mb-2 uppercase italic">Access Denied</h1>
          <p className="text-slate-400 mb-6 text-sm">You are not authorized to view the Master Terminal.</p>
          <div className="flex flex-col gap-3">
             <Link href="/login" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all">
                Login as Admin
             </Link>
             <Link href="/" className="text-slate-600 text-xs hover:text-white transition-colors">
                Return to Generator
             </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHORIZED DASHBOARD ---
  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-12 relative">
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <nav className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter">MASTER TERMINAL</h1>
            <p className="text-blue-500 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Admin Command Center v2.0</p>
          </div>
          <Link href="/" className="px-6 py-2 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Live Site</Link>
        </nav>

        {/* ANALYTICS DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* TOTALS */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Total Database</p>
              <span className="text-5xl font-black text-white">{stats.total}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">{stats.pending} Pending Review</p>
            </div>
          </div>

          {/* CATEGORIES */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black mb-4">Category Balance</p>
            <StatBar label="Active Sport" value={stats.catBreakdown["Active Sport"] || 0} total={stats.total} color="bg-blue-500" />
            <StatBar label="Art" value={stats.catBreakdown["Art"] || 0} total={stats.total} color="bg-purple-500" />
            <StatBar label="Learning" value={stats.catBreakdown["Learning Lab"] || 0} total={stats.total} color="bg-green-500" />
            <StatBar label="Sensory" value={stats.catBreakdown["Adapted / Sensory"] || 0} total={stats.total} color="bg-pink-500" />
          </div>

          {/* AGE & PREP */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
             <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black mb-4">Demographics</p>
             <StatBar label="4-5 Years" value={stats.ageBreakdown["4-5"] || 0} total={stats.total} color="bg-orange-500" />
             <StatBar label="13+ Teens" value={stats.ageBreakdown["13+"] || 0} total={stats.total} color="bg-red-500" />
             <div className="w-full h-px bg-white/10 my-4"></div>
             <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black mb-4">Logistics</p>
             <StatBar label="No Materials" value={stats.prepBreakdown["No Materials"] || 0} total={stats.total} color="bg-emerald-400" />
          </div>

          {/* GAP REPORT */}
          <div className="bg-gradient-to-br from-red-500/10 to-purple-500/10 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <p className="text-red-400 text-[10px] uppercase tracking-[0.2em] font-black mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Gap Report
            </p>
            <div className="space-y-3">
              {stats.gapReport.map((gap: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-slate-500 text-xs">⚠</span>
                  <p className="text-xs font-bold text-slate-300 leading-tight">{gap}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PENDING QUEUE */}
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
                        <div className="grid grid-cols-3 gap-2">
                           <button onClick={() => handleApprove(item.id)} className="bg-green-500 hover:bg-green-400 text-black font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider">Approve</button>
                           <button onClick={() => openEditor(item)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider">Edit</button>
                           <button onClick={() => handleDelete(item.id)} className="bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider">Reject</button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* THE VAULT */}
        <div>
           <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">The Vault</h2>
              <div className="relative w-full md:w-96">
                 <input type="text" placeholder="Search database..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
           </div>

           <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                       <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Title</th>
                       <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden md:table-cell">Desc</th>
                       <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {filteredActivities.slice(0, 50).map((game) => (
                       <tr key={game.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4">
                             <div className="font-bold text-white text-sm">{game.title}</div>
                             <div className="text-[10px] text-slate-500">{game.category?.[0]}</div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                             <div className="text-xs text-slate-400 truncate max-w-xs">{game.description}</div>
                          </td>
                          <td className="p-4 text-right">
                             <div className="flex justify-end gap-2">
                                <button onClick={() => openEditor(game)} className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-wider px-3 py-1 bg-blue-500/10 rounded hover:bg-blue-500/20">Edit</button>
                                <button onClick={() => handleDelete(game.id)} className="text-slate-600 hover:text-red-500 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded hover:bg-red-500/10">Delete</button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* EDITOR MODAL */}
        {isEditing && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
             <div className="bg-[#0f172a] border border-white/10 p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <h2 className="text-2xl font-black text-white uppercase italic mb-6">Edit Activity</h2>
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Title</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-blue-500" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Description</label>
                      <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-blue-500" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2 block">Make it Easier</label>
                         <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-300 text-xs outline-none focus:border-green-500" value={editForm.make_it_easier || ''} onChange={(e) => setEditForm({...editForm, make_it_easier: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2 block">Make it Harder</label>
                         <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-300 text-xs outline-none focus:border-red-500" value={editForm.make_it_harder || ''} onChange={(e) => setEditForm({...editForm, make_it_harder: e.target.value})} />
                      </div>
                   </div>
                </div>
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-white/10">
                   <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white">Cancel</button>
                   <button onClick={saveEdit} className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Save Changes</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </main>
  );
}