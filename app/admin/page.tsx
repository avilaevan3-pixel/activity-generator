"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- CONFIGURATION ---
const ADMIN_CODE = "york2026"; 

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
  
  // --- EDITING STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
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
    
    // Convert comma-separated string back to array if needed for tags/cats
    // For simplicity, we assume text inputs for title/desc. 
    // You can expand this logic for arrays if needed, but this works for main text.
    
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

  // --- FILTERED LIST ---
  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- AUTH SCREEN ---
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl text-center max-w-md w-full">
          <h1 className="text-3xl font-black text-white mb-2 uppercase italic">Restricted Access</h1>
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
             <Link href="/" className="text-slate-500 text-xs hover:text-white">Return to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-12 relative">
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
          </div>
        </nav>

        {/* SECTION 1: LIVE STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Total Activities</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{stats.total}</span>
            </div>
          </div>
          <div className={`bg-white/5 border p-6 rounded-3xl backdrop-blur-md transition-colors ${stats.pending > 0 ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10'}`}>
            <p className={`${stats.pending > 0 ? 'text-yellow-400' : 'text-slate-500'} text-[10px] uppercase tracking-[0.2em] font-black mb-2`}>Pending Review</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-black ${stats.pending > 0 ? 'text-yellow-400' : 'text-white'}`}>{stats.pending}</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Top Category</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-400">{stats.topCategory}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: PENDING QUEUE */}
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
                           <button onClick={() => handleApprove(item.id)} className="bg-green-500 hover:bg-green-400 text-black font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition-all">Approve</button>
                           <button onClick={() => openEditor(item)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition-all">Edit</button>
                           <button onClick={() => handleDelete(item.id)} className="bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition-all">Reject</button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* SECTION 3: THE VAULT */}
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
                      <input 
                         className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-blue-500"
                         value={editForm.title}
                         onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Description</label>
                      <textarea 
                         rows={4}
                         className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-blue-500"
                         value={editForm.description}
                         onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2 block">Make it Easier</label>
                         <input 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-300 text-xs outline-none focus:border-green-500"
                            value={editForm.make_it_easier || ''}
                            onChange={(e) => setEditForm({...editForm, make_it_easier: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2 block">Make it Harder</label>
                         <input 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-slate-300 text-xs outline-none focus:border-red-500"
                            value={editForm.make_it_harder || ''}
                            onChange={(e) => setEditForm({...editForm, make_it_harder: e.target.value})}
                         />
                      </div>
                   </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-white/10">
                   <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white"
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={saveEdit}
                      className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                   >
                      Save Changes
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </main>
  );
}