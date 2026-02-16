'use client';

import { useState, useEffect, useTransition } from "react";
import { assignUniversityAction } from "@/actions/application.actions";
import { useRouter } from "next/navigation";
import { Loader2, Search, Check, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function UniversitySelector({ 
  applicationId, 
  onSuccess 
}: { 
  applicationId: string; 
  onSuccess?: () => void; 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [universities, setUniversities] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    async function loadUniversities() {
      try {
        const res = await fetch('/api/universities');
        const data = await res.json();
        const unis = Array.isArray(data) ? data : data?.universities || [];
        setUniversities(unis);
      } catch (e) {
        toast.error("Erreur de chargement");
      }
    }
    loadUniversities();
  }, []);

  const filtered = universities.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.city?.toLowerCase().includes(search.toLowerCase()) ||
    u.country?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (uniId: string, uniName: string) => {
    startTransition(async () => {
      const result = await assignUniversityAction(applicationId, uniId);
      if (result?.success) {
        toast.success(`Assignée : ${uniName}`);
        setSearch("");
        setShowList(false);
        router.refresh(); 
        if (onSuccess) onSuccess();
      } else {
        toast.error(result?.error || "Erreur d'assignation");
      }
    });
  };

  return (
    <div className="relative w-full max-w-md italic">
      {/* BARRE DE RECHERCHE */}
      <div className="relative z-40">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
          {isPending ? <Loader2 size={18} className="animate-spin text-[#db9b16]" /> : <Search size={18} />}
        </div>
        
        <input 
          type="text"
          placeholder="RECHERCHER UNE INSTITUTION..."
          className={cn(
            "w-full pl-12 pr-12 py-4 bg-white border-2 rounded-2xl text-[13px] font-black uppercase outline-none transition-all",
            showList ? "border-[#db9b16] shadow-xl" : "border-slate-50 shadow-sm",
            isPending && "opacity-50"
          )}
          value={search}
          onChange={(e) => {setSearch(e.target.value); setShowList(true);}}
          onFocus={() => setShowList(true)}
        />

        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors">
            <X size={16} strokeWidth={3} />
          </button>
        )}
      </div>

{showList && (
        <>
          <div className="fixed inset-0 z-30 bg-slate-900/10 backdrop-blur-[2px]" onClick={() => setShowList(false)} />
          
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header - Reste fixe en haut */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white/90 backdrop-blur-md">
              <span className="text-[10px] font-black text-[#db9b16] uppercase tracking-[0.2em]">Sélection directe</span>
              <span className="text-[9px] font-bold text-slate-300 uppercase">{filtered.length} Établissements</span>
            </div>
            
            {/* Zone de Scroll avec Correction Scrollbar */}
            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              <div className="p-3 space-y-1">
                {filtered.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(u.id, u.name)}
                    className="w-full text-left px-5 py-4 hover:bg-slate-50 rounded-[1.8rem] flex items-center justify-between group transition-all"
                  >
                    <div className="flex flex-col pr-4">
                      <h4 className="font-black text-slate-900 text-[13px] uppercase tracking-tight group-hover:text-[#db9b16] transition-colors">
                        {u.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                        <MapPin size={10} className="text-[#db9b16]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{u.city}, {u.country}</span>
                      </div>
                    </div>
                    <Check size={16} className="text-[#db9b16] opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 flex-shrink-0" strokeWidth={4} />
                  </button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">
                  Aucun résultat trouvé
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* STYLE CSS POUR CACHER LE GROS SCROLLBAR GRIS */}
      <style jsx>{`
        .custom-scrollbar {
          /* Firefox */
          scrollbar-width: thin;
          scrollbar-color: #db9b1620 transparent;
        }

        /* Chrome, Edge, Safari */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px; /* Très fin */
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 15px; /* Éloigne le scroller des bords arrondis */
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #db9b1640; /* Couleur orange translucide */
          border-radius: 10px;
        }

        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #db9b16; /* Devient plein au survol */
        }
      `}</style>
    </div>
  );
}