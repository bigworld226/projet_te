import React from "react";
import { GraduationCap, MapPin, Banknote, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface UniversityProposal {
  id: string;
  name: string;
  city: string;
  summary?: string;
  costRange?: string;
}

export function ProposalsList({ proposals }: { proposals: UniversityProposal[] }) {

  if (!proposals?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
        <SearchX className="text-slate-300 mb-4" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
          Aucune offre d'université trouvée
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-6">
      {proposals.map((univ) => (
        <li 
          key={univ.id} 
          className="group relative border border-slate-100 rounded-[2rem] p-6 bg-white shadow-sm hover:shadow-xl hover:shadow-[#db9b16]/5 hover:border-[#db9b16]/20 transition-all duration-300 overflow-hidden"
        >
          {/* Accentuation visuelle sur le côté */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-transparent group-hover:bg-[#db9b16] transition-all" />

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#db9b16]/10 rounded-xl text-[#db9b16]">
                  <GraduationCap size={20} />
                </div>
                <h2 className="font-black text-xl text-slate-900 leading-tight group-hover:text-[#db9b16] transition-colors">
                  {univ.name}
                </h2>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">
                  <MapPin size={12} className="text-[#db9b16]" />
                  {univ.city}
                </span>
                
                {univ.costRange && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full">
                    <Banknote size={12} />
                    {univ.costRange}
                  </span>
                )}
              </div>

              {univ.summary && (
                <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-2">
                  {univ.summary}
                </p>
              )}
            </div>

            {/* Bouton d'action rapide (Optionnel) */}
            <button className="md:self-center bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-4 rounded-2xl hover:bg-[#db9b16] transition-all active:scale-95 shadow-lg">
              Voir les détails
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}