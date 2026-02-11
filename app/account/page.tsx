"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AccountPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      const { data } = await supabase.from("favorites").select("activity_id, activities(*)").eq("user_id", session.user.id);
      setFavorites(data?.map(f => f.activities) || []);
    }
    setLoading(false);
  };

  const handleRemove = async (id: number) => {
    const { error } = await supabase.from("favorites").delete().eq("activity_id", id).eq("user_id", user.id);
    if (!error) {
      setFavorites(favorites.filter(f => f.id !== id));
    }
  };

  const handlePrintLibrary = () => {
    const printWindow = window.open('', '_blank');
    const content = favorites.map((game) => `
      <div style="margin-bottom: 40px; page-break-inside: avoid; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
        <h2 style="text-transform: uppercase; margin-bottom: 5px;">${game.title}</h2>
        <p style="font-size: 11px; color: #666; margin-bottom: 15px;">CATEGORY: ${game.category?.join(' • ')} | AGES: ${game.age_group?.join(', ')}</p>
        <p style="font-size: 14px; line-height: 1.5;">${game.description}</p>
        <div style="margin-top: 15px; background: #f4f4f4; padding: 10px; border-radius: 5px; font-size: 12px;">
          <strong>Easier:</strong> ${game.make_it_easier || 'N/A'} | <strong>Harder:</strong> ${game.make_it_harder || 'N/A'}
        </div>
      </div>
    `).join('');

    printWindow?.document.write(`
      <html>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1 style="text-align: center; text-transform: uppercase;">My Activity Library</h1>
          <p style="text-align: center; font-size: 12px; color: #666;">Total Activities: ${favorites.length}</p>
          <hr style="margin-bottom: 30px;"/>
          ${content}
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-500 font-black">LOADING YOUR LIBRARY...</div>;

  return (
    <main className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <Link href="/" className="text-blue-400 text-[10px] font-black uppercase mb-2 block tracking-widest">← Return to Generator</Link>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter">My Library</h1>
          </div>
          {favorites.length > 0 && (
            <button onClick={handlePrintLibrary} className="bg-white text-black text-xs font-black uppercase px-8 py-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
              Print Library (${favorites.length})
            </button>
          )}
        </header>

        <div className="flex flex-col gap-4">
          {favorites.map(game => (
            <div key={game.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex justify-between items-center hover:border-slate-700 transition-all">
              <div>
                <h3 className="text-lg font-bold uppercase">{game.title}</h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{game.category?.join(' • ')}</span>
              </div>
              <button 
                onClick={() => handleRemove(game.id)} 
                className="w-10 h-10 flex items-center justify-center bg-red-900/20 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition-all text-xs font-black"
                title="Remove from favorites"
              >
                ✕
              </button>
            </div>
          ))}
          {favorites.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-500 font-black uppercase tracking-widest">Your library is currently empty.</p>
              <Link href="/" className="text-blue-500 text-[10px] font-black uppercase mt-4 block">Go favorite some activities!</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}