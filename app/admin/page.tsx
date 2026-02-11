"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // EDIT MODAL STATE
  const [editingGame, setEditingGame] = useState<any>(null);

  const stats = {
    total: activities.length,
    pending: activities.filter(a => a.status === 'pending').length,
    totalViews: activities.reduce((sum, a) => sum + (a.popularity || 0), 0),
    active: activities.filter(a => a.category?.includes("Active Sport")).length,
    art: activities.filter(a => a.category?.includes("Art")).length,
    icebreaker: activities.filter(a => a.category?.includes("Icebreaker")).length,
    quiet: activities.filter(a => a.category?.includes("Quiet / Indoor")).length,
    learning: activities.filter(a => a.category?.includes("Learning Lab")).length,
    adapted: activities.filter(a => a.category?.includes("Adapted / Sensory")).length,
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== 'admin' && profile?.role !== 'moderator') {
        router.push("/");
        return;
      }
      setUserRole(profile?.role || "contributor");
      fetchActivities();
    };
    checkUser();
  }, [router]);

  const fetchActivities = async () => {
    const { data } = await supabase.from("activities").select("*").order("status", { ascending: false });
    setActivities(data || []);
    setLoading(false);
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("activities")
      .update({
        title: editingGame.title,
        description: editingGame.description,
        make_it_easier: editingGame.make_it_easier,
        make_it_harder: editingGame.make_it_harder
      })
      .eq("id", editingGame.id);

    if (!error) {
      setEditingGame(null);
      fetchActivities();
    }
  };

  const handleApprove = async (id: number) => {
    await supabase.from("activities").update({ status: 'approved' }).eq("id", id);
    fetchActivities();
  };

  const handleDelete = async (id: number) => {
    if (userRole !== 'admin') return alert("Admin access required.");
    if (window.confirm("Delete permanently?")) {
      await supabase.from("activities").delete().eq("id", id);
      fetchActivities();
    }
  };

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-blue-500 font-black animate-pulse uppercase tracking-[0.5em]">Syncing Terminal...</div>;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-12 text-left">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">Terminal <br/><span className="text-blue-500">Master</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Auth Level: {userRole}</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link href="/add" className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">+ Add New</Link>
            <Link href="/" className="flex-1 md:flex-none bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">Exit</Link>
          </div>
        </header>

        {/* STATS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-12">
          {Object.entries(stats).map(([key, val]) => (
            <div key={key} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">{key}</span>
              <span className="text-2xl font-black">{val}</span>
            </div>
          ))}
        </div>

        {/* MODERATION LIST */}
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Identity & Specs</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activities.map(game => (
                  <tr key={game.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <p className="font-black uppercase italic text-white tracking-tight text-lg">{game.title}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[7px] font-black bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 uppercase">Ages: {game.age_group?.join(', ')}</span>
                        <span className="text-[7px] font-black bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 uppercase">Size: {game.group_size?.join(', ')}</span>
                        <span className="text-[7px] font-black bg-white/5 text-slate-500 px-2 py-1 rounded border border-white/5 uppercase">{game.popularity || 0} hits</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${game.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse'}`}>
                        {game.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex gap-2 justify-end">
                        {game.status === 'pending' && <button onClick={() => handleApprove(game.id)} className="bg-blue-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase">Approve</button>}
                        <button onClick={() => setEditingGame(game)} className="bg-white/5 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase border border-white/10 hover:bg-white/10">Edit</button>
                        <button onClick={() => handleDelete(game.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${userRole === 'admin' ? 'text-red-500 bg-red-900/10 hover:bg-red-600 hover:text-white' : 'text-slate-700 cursor-not-allowed'}`}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl space-y-6">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Edit Activity</h2>
            
            <div className="space-y-4">
              <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-bold outline-none focus:border-blue-500" value={editingGame.title} onChange={e => setEditingGame({...editingGame, title: e.target.value})} />
              <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-32 outline-none focus:border-blue-500" value={editingGame.description} onChange={e => setEditingGame({...editingGame, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <textarea className="bg-green-500/5 border border-green-500/10 rounded-xl p-4 h-24 text-xs" value={editingGame.make_it_easier} onChange={e => setEditingGame({...editingGame, make_it_easier: e.target.value})} placeholder="Easier..." />
                <textarea className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 h-24 text-xs" value={editingGame.make_it_harder} onChange={e => setEditingGame({...editingGame, make_it_harder: e.target.value})} placeholder="Harder..." />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleUpdate} className="flex-1 bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs">Save Changes</button>
              <button onClick={() => setEditingGame(null)} className="flex-1 bg-white/5 py-4 rounded-2xl font-black uppercase text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}