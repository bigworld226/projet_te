"use client";

import { useState } from "react";
import axios from "axios";
import { Search, Mail, ChevronRight, Loader2, UserCheck, ShieldCheck, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-deboubce"; 
import { cn } from "@/lib/utils";

interface StudentSearchSelectorProps {
  onSelect: (student: any) => void;
}

export default function StudentSearchSelector({ onSelect }: StudentSearchSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: students = [], isLoading, isFetching } = useQuery({
    queryKey: ["search-students", debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) return [];
      const res = await axios.get(`/api/admin/students/search?q=${debouncedSearch}`);
      return res.data.students || [];
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 60,
  });

  return (
    <div className="w-full space-y-8 p-1">
      {/* CHAMP DE RECHERCHE HAUTE PRÉCISION */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none z-20">
          {isFetching ? (
            <Loader2 className="animate-spin text-[#db9b16]" size={24} strokeWidth={3} />
          ) : (
            <Search className={cn(
                "transition-all duration-500",
                searchTerm ? "text-[#db9b16] scale-110" : "text-slate-300"
            )} size={24} strokeWidth={3} />
          )}
        </div>
        
        <input
          type="text"
          placeholder="Rechercher par nom, matricule ou email..."
          className={cn(
            "w-full pl-16 pr-8 py-8 bg-white border-2 border-slate-50 rounded-[3rem] outline-none transition-all duration-500",
            "font-black text-slate-900 text-lg placeholder:text-slate-200 placeholder:font-black placeholder:uppercase placeholder:text-xs placeholder:tracking-[0.2em]",
            "focus:border-[#db9b16]/30 focus:shadow-[0_20px_50px_-15px_rgba(219,155,22,0.15)] focus:bg-white"
          )}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />

        {/* Badge indicateur de statut */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <ShieldCheck size={14} className="text-[#db9b16]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Base Sécurisée</span>
        </div>
      </div>

      {/* RÉSULTATS DE RECHERCHE */}
      <div className="space-y-4 max-h-500 overflow-y-auto pr-2 custom-scrollbar transition-all">
        {debouncedSearch.length >= 2 && students.length > 0 ? (
          <div className="grid gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between px-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Sparkles size={12} className="text-[#db9b16]" />
                  Index Étudiants ({students.length})
                </p>
            </div>

            {students.map((student: any) => (
              <button
                key={student.id}
                onClick={() => onSelect(student)}
                className="group w-full flex items-center justify-between p-6 bg-white border border-slate-50 rounded-[2.5rem] hover:border-[#db9b16]/50 hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-500 relative overflow-hidden"
              >
                {/* Effet de brillance au hover */}
                <div className="absolute inset-0 -translate-x-ful group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-[#db9b16]/5 to-transparent z-0" />

                <div className="flex items-center gap-6 relative z-10">
                  <div className="h-16 w-16 rounded-[1.8rem] bg-slate-900 flex items-center justify-center text-[#db9b16] font-black text-2xl group-hover:rotate-6 transition-all duration-500 shadow-xl group-hover:shadow-[#db9b16]/20">
                    {student.fullName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="text-left">
                    <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic group-hover:text-[#db9b16] transition-colors leading-none">
                      {student.fullName}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mail size={12} className="group-hover:text-[#db9b16]" />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                            {student.email}
                          </span>
                        </div>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-[9px] font-black text-slate-300 uppercase italic">ID: {student.id.slice(-6).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10 h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-[#db9b16] group-hover:translate-x-2 transition-all duration-500">
                  <ChevronRight size={24} strokeWidth={3} />
                </div>
              </button>
            ))}
          </div>
        ) : debouncedSearch.length >= 2 && !isLoading ? (
          <div className="py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 animate-in zoom-in-95 duration-500 shadow-inner">
            <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search className="text-slate-200 scale-125" size={32} />
            </div>
            <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-2">
                Aucun profil détecté
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                Vérifiez l'orthographe ou le matricule
            </p>
          </div>
        ) : debouncedSearch.length < 2 && (
          <div className="py-28 text-center flex flex-col items-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-[#db9b16]/10 blur-3xl rounded-full scale-150 animate-pulse" />
                <UserCheck className="relative text-slate-200" size={100} strokeWidth={1} />
            </div>
            <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.5em] mb-3">
                Sélection Requise
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-250 leading-relaxed">
                Entrez les identifiants pour accéder aux dossiers académiques
            </p>
          </div>
        )}
      </div>
    </div>
  );
}