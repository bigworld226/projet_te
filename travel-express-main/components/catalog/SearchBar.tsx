'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // On initialise avec la valeur actuelle de l'URL
  const [query, setQuery] = useState(searchParams.get('search') || '');

  // Synchronise le champ si l'URL change (ex: bouton retour navigateur)
  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }

    // On pousse vers l'URL racine avec les nouveaux paramètres
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white p-2 rounded-full shadow-2xl shadow-[#db9b16]/10 max-w-2xl mx-auto flex items-center border border-slate-100 relative z-20 hover:shadow-[#db9b16]/20 transition-all duration-300 focus-within:border-[#db9b16]/50 focus-within:ring-4 focus-within:ring-[#db9b16]/5 group">
      
      {/* Icône de recherche avec feedback au focus */}
      <div className="pl-6 pr-4 text-slate-400 group-focus-within:text-[#db9b16] transition-colors">
        <Search size={22} strokeWidth={2.5} />
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Quelle ville ou université cherchez-vous ?"
        className="flex-1 h-12 outline-none text-slate-900 placeholder:text-slate-400 font-bold bg-transparent text-sm md:text-base"
      />

      <div className="hidden md:block h-8 w-px bg-slate-100 mx-2"></div>
      
      {/* Bouton Filtres (Optionnel : pourra ouvrir un drawer plus tard) */}
      <button 
        type="button"
        className="hidden md:flex items-center gap-2 px-6 py-3 hover:bg-[#db9b16]/5 rounded-full text-slate-500 hover:text-[#db9b16] font-bold text-sm transition-all active:scale-95"
      >
        <SlidersHorizontal size={16} />
        Filtres
      </button>

      {/* Bouton d'action principal */}
      <button 
        onClick={handleSearch}
        className="bg-[#db9b16] hover:bg-[#c48a14] text-white h-12 w-12 md:w-auto md:px-10 rounded-full font-black uppercase tracking-tighter text-sm shadow-lg shadow-[#db9b16]/30 transition-all flex items-center justify-center gap-2 active:scale-90"
      >
        <span className="hidden md:inline">Explorer</span>
        <Search size={20} className="md:hidden" strokeWidth={3} />
      </button>
    </div>
  );
}