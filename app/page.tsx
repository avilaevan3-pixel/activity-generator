"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- QUICK CHIPS ---
const QUICK_TAGS = [
  "No Prep", "Teamwork", "Relay", "Circle Game", 
  "Quiet", "Funny", "Competitive", "Trust"
];

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
  const [hasSearched, setHasSearched] = useState(false);
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

  const handleFavorite = async (activityId: number) => {
    if (!user) return alert("Please login to save favorites!");
    const { error } = await supabase.from("favorites").insert([{ user_id: user.id, activity_id: activityId }]);
    if (error) alert(error.code === '23505' ? "Already in library!" : "Error saving.");
    else alert("Saved to Library! ✨");
  };

  // --- SEARCH LOGIC ---
  const handleGenerate = async () => {
    setLoading(true);
    setHasSearched(true);
    
    let query = supabase.from('activities').select('*').eq('status', 'approved');

    // Apply Filters
    if (selectedAges.length > 0) query = query.overlaps('age_group', [...selectedAges, "any"]);
    if (selectedCats.length > 0) query = query.overlaps('category', selectedCats);
    if (selectedSizes.length > 0) query = query.overlaps('group_size', [...selectedSizes, "any"]);
    if (materialFilter !== "any") query = query.eq('materials', materialFilter);

    // Specific Search
    if (searchTag.trim() !== "") {
      const term = searchTag.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term.toLowerCase()}}`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setActivities(data.sort(() => Math.random() - 0.5));
      if (data.length > 0) {
        supabase.rpc('increment_popularity', { game_ids: data.map((g: any) => g.id) });
      }
    }
    setLoading(false);
  };

  const addTag = (tag: string) => {
    setSearchTag(tag);
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
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[80%] md:w-[50%] h-[50%] bg-blue-600/10 blur-[100px] md:blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[80%] md:w-[50%] h-[50%] bg-purple-600/10 blur-[100px] md:blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* UPDATED BRANDING NAVBAR */}
        <nav className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="text-5xl md:text-6xl font-black italic text-white uppercase tracking-tighter leading-none">
              EAG
            </span>
            <span className="text-[9px] md:text-[10px] font-black text-blue-500 tracking-[0.3em] uppercase mt-1">
              Evan's Activity Generator
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

        {/* MAIN CONTROL PANEL */}
        <div className="bg-white/5 backdrop-blur-3xl p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 shadow-2xl mb-16">
          
          {/* SECTION 1: PRIMARY FILTERS (First) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
            <div className="space-y-8">
               <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4">Core Categories</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {["Active Sport", "Art", "Icebreaker", "Quiet / Indoor", "Learning Lab", "Adapted / Sensory"].map(c => (
                      <FilterButton key={c} color="purple" label={c} isSelected={selectedCats.includes(c)} onClick={() => setSelectedCats(prev => prev.includes(c) ? prev.filter(i => i !== c) : [...prev, c])} />
                    ))}
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4">Ages</label>
                  <div className="flex flex-wrap gap-2">
                    {["4-5", "6-8", "9-12", "13+"].map(a => (
                      <FilterButton key={a} label={a} isSelected={selectedAges.includes(a)} onClick={() => setSelectedAges(prev => prev.includes(a) ? prev.filter(i => i !== a) : [...prev, a])} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4">Group Size</label>
                  <div className="flex flex-wrap gap-2">
                    {["2-10", "11-24", "25+"].map(s => (
                      <FilterButton key={s} color="green" label={s} isSelected={selectedSizes.includes(s)} onClick={() => setSelectedSizes(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s])} />
                    ))}
                  </div>
                </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="w-full h-px bg-white/5 mb-10"></div>

          {/* SECTION 2: SPECIFIC SEARCH (Last) */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full">
                    <div className="flex justify-between items-baseline mb-4">
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Specific Search</label>
                        <span className="text-[9px] text-slate-600 italic hidden sm:block">
                             *Disclaimer: Best to leave blank. Only use for specific items.
                        </span>
                    </div>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Optional: Type 'Tag', 'Ball', 'Funny'..." 
                            className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/40 text-sm transition-all uppercase placeholder:normal-case placeholder:text-slate-600"
                            value={searchTag}
                            onChange={(e) => setSearchTag(e.target.value)}
                        />
                         {searchTag && (
                            <button onClick={() => setSearchTag("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">✕</button>
                        )}
                    </div>
                     <span className="text-[9px] text-slate-600 italic block sm:hidden mt-2">
                         *Filters work best. Only use keywords for specific items.
                    </span>
                </div>
                
                <button 
                    onClick={handleGenerate} 
                    className="w-full md:w-auto px-10 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-500/20 active:scale-[0.98] whitespace-nowrap h-[54px]"
                >
                    {loading ? "..." : "Generate Activities"}
                </button>
            </div>

            {/* QUICK CHIPS (Optional Helper) */}
            <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_TAGS.map(tag => (
                <button 
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[8px] uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-all"
                >
                    {tag}
                </button>
                ))}
            </div>
          </div>

        </div>

        {/* RESULTS GRID OR EMPTY STATE */}
        {activities.length > 0 ? (
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
        ) : (
          hasSearched && !loading && (
            <div className="text-center py-20 opacity-50">
              <h3 className="text-xl font-bold text-slate-400 mb-2">No activities found</h3>
              <p className="text-sm text-slate-600">Try clearing the text search or selecting fewer filters.</p>
            </div>
          )
        )}

        {/* FOOTER */}
        <footer className="py-20 text-center border-t border-white/5">
          <Link href="/admin" className="text-slate-800 hover:text-blue-500 text-[10px] font-black uppercase tracking-[0.5em] transition-colors">
            — Admin Terminal —
          </Link>
        </footer>
      </div>
    </main>
  );
}