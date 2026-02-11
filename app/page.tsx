"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  // --- STATE ---
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [materialFilter, setMaterialFilter] = useState("any");
  const [searchTag, setSearchTag] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // --- AUTH SESSION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- PERFORMANCE: TRENDING MEMO ---
  const trendingGames = useMemo(() => {
    return [...activities].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 2);
  }, [activities]);

  const handleFavorite = async (activityId: number) => {
    if (!user) return alert("Please login to save favorites!");
    const { error } = await supabase.from("favorites").insert([{ user_id: user.id, activity_id: activityId }]);
    if (error) alert(error.code === '23505' ? "Already in library!" : "Error saving.");
    else alert("Saved to Library! ✨");
  };

  const handleGenerate = async () => {
    setLoading(true);
    let query = supabase.from('activities').select('*').eq('status', 'approved');

    if (selectedAges.length > 0) query = query.overlaps('age_group', [...selectedAges, "any"]);
    if (selectedCats.length > 0) query = query.overlaps('category', selectedCats);
    if (selectedSizes.length > 0) query = query.overlaps('group_size', [...selectedSizes, "any"]);
    if (materialFilter !== "any") query = query.eq('materials', materialFilter);
    if (searchTag.trim() !== "") query = query.contains('tags', [searchTag.trim().toLowerCase()]);

    const { data, error } = await query;
    if (!error && data) {
      setActivities(data.sort(() => Math.random() - 0.5));
      supabase.rpc('increment_popularity', { game_ids: data.map((g: any) => g.id) });
    }
    setLoading(false);
  };

  const FilterButton = ({ label, isSelected, onClick, color = "blue" }: any) => (
    <button 
      onClick={onClick} 
      className={`px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${
        isSelected 
          ? `bg-${color}-600 text-white border-${color}-400 shadow-lg shadow-${color}-500/20 scale-105` 
          : "bg-white/5 text-slate-500 border-white/5 hover:border-white/20"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-12 relative overflow-x-hidden text-left">
      {/* BACKGROUND DEPTH ORBS */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[80%] md:w-[50%] h-[50%] bg-blue-600/10 blur-[100px] md:blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[80%] md:w-[50%] h-[50%] bg-purple-600/10 blur-[100px] md:blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* UPDATED BRANDING NAVBAR */}
        <nav className="flex flex-col sm:flex-row justify-between items-center mb-16 gap-6">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
              EVAN'S GENERATOR
            </span>
            <span className="text-[7px] md:text-[8px] font-black text-blue-500 tracking-[0.4em] uppercase mt-2">
              Community Driven Activity Generator
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 items-center">
            <Link href="/account" className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Library</Link>
            {user ? (
              <button onClick={() => supabase.auth.signOut()} className="text-red-500/50 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:text-red-400">Logout</button>
            ) : (
              <Link href="/login" className="text-blue-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest">Login</Link>
            )}
            <Link href="/add" className="bg-white text-black px-6 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-white/5">+ Submit</Link>
          </div>
        </nav>

        {/* HERO FILTER SECTION */}
        <div className="bg-white/5 backdrop-blur-3xl p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-2xl mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div>
                <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 block mb-4">Keyword Intelligence</label>
                <input 
                  type="text" 
                  placeholder="e.g. 'gym', 'strategy'..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all uppercase italic"
                  value={searchTag}
                  onChange={(e) => setSearchTag(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 block mb-4">Ages</label>
                  <div className="flex flex-wrap gap-2">
                    {["4-5", "6-8", "9-12", "13+"].map(a => (
                      <FilterButton key={a} label={a} isSelected={selectedAges.includes(a)} onClick={() => setSelectedAges(prev => prev.includes(a) ? prev.filter(i => i !== a) : [...prev, a])} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 block mb-4">Group Size</label>
                  <div className="flex flex-wrap gap-2">
                    {["2-10", "11-24", "25+"].map(s => (
                      <FilterButton key={s} color="green" label={s} isSelected={selectedSizes.includes(s)} onClick={() => setSelectedSizes(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s])} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 block mb-4">Core Categories</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                  {["Active Sport", "Art", "Icebreaker", "Quiet / Indoor", "Learning Lab", "Adapted / Sensory"].map(c => (
                    <FilterButton key={c} color="purple" label={c} isSelected={selectedCats.includes(c)} onClick={() => setSelectedCats(prev => prev.includes(c) ? prev.filter(i => i !== c) : [...prev, c])} />
                  ))}
                </div>
              </div>
              <button 
                onClick={handleGenerate} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-2xl transition-all uppercase tracking-[0.3em] text-[10px] md:text-xs shadow-2xl shadow-blue-500/20 active:scale-[0.98]"
              >
                {loading ? "Optimizing Results..." : "Initialize Generator"}
              </button>
            </div>
          </div>
        </div>

        {/* RESULTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
          {activities.map((item: any) => (
            <div key={item.id} className="group p-10 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/5 hover:border-blue-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic leading-none group-hover:text-blue-400 transition-colors">{item.title}</h2>
                  <button onClick={() => handleFavorite(item.id)} className="text-slate-700 hover:text-pink-500 transition-all text-2xl active:scale-150">♥</button>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.category?.map((c: string) => <span key={c} className="text-[7px] font-black px-3 py-1 bg-white/5 text-slate-400 rounded-full border border-white/10 uppercase tracking-widest">{c}</span>)}
                  <span className="text-[7px] font-black px-3 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/10 uppercase tracking-widest">{item.group_size?.join(", ")} Players</span>
                </div>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-10 font-medium">"{item.description}"</p>
                
                <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/5">
                  <div>
                    <span className="text-[8px] uppercase text-green-500 font-black tracking-widest block mb-2">Easier</span>
                    <p className="text-[10px] text-slate-500 leading-tight">{item.make_it_easier || 'Consult instructor'}</p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase text-red-500 font-black tracking-widest block mb-2">Harder</span>
                    <p className="text-[10px] text-slate-500 leading-tight">{item.make_it_harder || 'Consult instructor'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ADMIN TERMINAL ACCESS */}
        <footer className="py-20 text-center border-t border-white/5">
          <Link href="/admin" className="text-slate-800 hover:text-blue-500 text-[10px] font-black uppercase tracking-[0.5em] transition-colors">
            — Admin Terminal —
          </Link>
        </footer>
      </div>
    </main>
  );
}