"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddActivity() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [easier, setEasier] = useState("");
  const [harder, setHarder] = useState("");
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]); // RESTORED
  const [materialLevel, setMaterialLevel] = useState("Low Prep");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
      else {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        setUserRole(profile?.role || "contributor");
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, [router]);

  const toggleSelection = (item: string, list: string[], setList: any) => {
    if (list.includes(item)) setList(list.filter((i) => i !== item));
    else setList([...list, item]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAges.length === 0 || selectedCats.length === 0 || selectedSizes.length === 0) {
      alert("Please select Age, Category, and Group Size!");
      return;
    }
    setLoading(true);
    const initialStatus = userRole === 'admin' ? 'approved' : 'pending';
    const { error } = await supabase.from("activities").insert([
      { title, description, age_group: selectedAges, category: selectedCats, group_size: selectedSizes, materials: materialLevel, status: initialStatus, make_it_easier: easier, make_it_harder: harder },
    ]);
    if (!error) {
      alert(userRole === 'admin' ? "Activity Live! ✨" : "Submitted for Review! 🕒");
      router.push("/");
    }
    setLoading(false);
  };

  if (checkingAuth) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-blue-500 font-black text-2xl animate-pulse italic uppercase tracking-tighter">Verifying...</div>;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-12 selection:bg-blue-500 selection:text-white">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-3xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <Link href="/" className="group text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 inline-flex items-center gap-2 hover:text-white transition-all">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Engine
            </Link>
            <h1 className="text-6xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">Contribute <br/><span className="text-blue-500">Content</span></h1>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${userRole === 'admin' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Access: {userRole}</span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="bg-slate-900/30 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4 ml-1">Activity Title</label>
              <input required placeholder="TITLE" className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xl font-black text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-700 uppercase italic" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4 ml-1">Target Ages</label>
                <div className="flex flex-wrap gap-2">
                  {["4-5", "6-8", "9-12", "13+"].map(a => (
                    <button key={a} type="button" onClick={() => toggleSelection(a, selectedAges, setSelectedAges)} className={`flex-1 py-4 rounded-xl text-xs font-black transition-all border ${selectedAges.includes(a) ? "bg-blue-600 text-white border-blue-400" : "bg-white/5 text-slate-500 border-white/5"}`}>{a}</button>
                  ))}
                </div>
              </div>
              {/* RESTORED GROUP SIZE SELECTION */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4 ml-1">Group Size</label>
                <div className="flex flex-wrap gap-2">
                  {["2-10", "11-24", "25+"].map(s => (
                    <button key={s} type="button" onClick={() => toggleSelection(s, selectedSizes, setSelectedSizes)} className={`flex-1 py-4 rounded-xl text-xs font-black transition-all border ${selectedSizes.includes(s) ? "bg-green-600 text-white border-green-400" : "bg-white/5 text-slate-500 border-white/5"}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4 ml-1">Categories</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {["Active Sport", "Art", "Icebreaker", "Quiet / Indoor", "Learning Lab", "Adapted / Sensory"].map(c => (
                  <button key={c} type="button" onClick={() => toggleSelection(c, selectedCats, setSelectedCats)} className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${selectedCats.includes(c) ? "bg-white text-black border-white" : "bg-white/5 text-slate-500 border-white/5"}`}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/30 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
            <textarea required placeholder="Instructions..." className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 h-48 text-slate-200 font-medium outline-none focus:border-blue-500 transition-all resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <textarea placeholder="Make it easier..." className="w-full bg-green-500/5 border border-green-500/10 rounded-2xl p-5 h-32 text-slate-300 text-sm outline-none focus:border-green-500 transition-all resize-none" value={easier} onChange={(e) => setEasier(e.target.value)} />
              <textarea placeholder="Make it harder..." className="w-full bg-red-500/5 border border-red-500/10 rounded-2xl p-5 h-32 text-slate-300 text-sm outline-none focus:border-red-500 transition-all resize-none" value={harder} onChange={(e) => setHarder(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 py-8 rounded-[2.5rem] transition-all hover:bg-blue-500 shadow-2xl shadow-blue-500/20">
            <span className="text-lg font-black uppercase tracking-[0.3em] text-white">{loading ? "Syncing..." : userRole === 'admin' ? "Publish to Live Feed" : "Submit for Approval"}</span>
          </button>
        </form>
      </div>
    </main>
  );
}