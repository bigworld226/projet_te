"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  FileText, ChevronRight, Loader2, MapPin, 
  GraduationCap, AlertCircle, Coins, Fingerprint, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentAppSelectorProps {
  studentId: string;
  onAppSelect: (appId: string) => void;
}

const STATUS_CONFIG: Record<string, { bg: string, label: string }> = {
  'PENDING': { bg: 'bg-amber-500', label: 'En attente' },
  'APPROVED': { bg: 'bg-emerald-500', label: 'Approuvé' },
  'REJECTED': { bg: 'bg-rose-500', label: 'Refusé' },
  'PROCESSING': { bg: 'bg-blue-600', label: 'Traitement' },
};

export default function StudentAppSelector({ studentId, onAppSelect }: StudentAppSelectorProps) {
  
  const { data: applications, isLoading, isError } = useQuery({
    queryKey: ["student-apps", studentId], 
    queryFn: async () => {
      if (!studentId) return [];
      const res = await axios.get(`/api/admin/students/${studentId}/applications`);
      return Array.isArray(res.data.applications) ? res.data.applications : [];
    },
    enabled: !!studentId, 
  });

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50/50 -z-10" />
        <div className="relative mb-6">
            <Loader2 className="animate-spin text-slate-900" size={48} strokeWidth={1.5} />
            <div className="absolute inset-0 blur-2xl bg-[#db9b16]/30 animate-pulse"></div>
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900 mb-2">Extraction Data</h3>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Analyse des dossiers en cours...</p>
      </div>
    );
  }

  if (isError || !applications || applications.length === 0) {
    return (
      <div className="py-20 px-10 border-2 border-dashed border-slate-100 rounded-[3.5rem] text-center bg-white group hover:border-[#db9b16]/20 transition-colors">
        <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-transform group-hover:rotate-12">
            <Fingerprint className="text-slate-200" size={40} />
        </div>
        <h3 className="text-slate-900 font-black text-xs uppercase tracking-[0.3em] italic">Archive Vide</h3>
        <p className="text-slate-400 text-[10px] font-bold mt-3 uppercase leading-loose tracking-widest max-w-280 mx-auto opacity-70">
            Aucun processus d'admission n'a été détecté pour cet identifiant.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between px-4">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#db9b16] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900 italic">Dossiers Actifs</span>
         </div>
         <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase">{applications.length} Entrées</span>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {applications.map((app: any) => (
          <button
            key={app.id}
            onClick={() => onAppSelect(app.id)}
            className="group relative w-full bg-white p-7 rounded-[3rem] border border-slate-50 hover:border-[#db9b16]/30 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex items-center justify-between overflow-hidden text-left"
          >
            {/* Décoration de fond (Watermark) */}
            <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-1000 text-slate-900">
              <FileText size={180} strokeWidth={1} />
            </div>

            <div className="flex items-center gap-8 relative z-10">
              {/* Conteneur Icône Premium */}
              <div className="h-20 w-20 bg-slate-900 rounded-4xl flex items-center justify-center text-[#db9b16] group-hover:scale-105 transition-all duration-500 shadow-xl group-hover:shadow-[#db9b16]/20">
                <FileText size={32} strokeWidth={2} />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className={cn(
                    "text-[8px] font-black text-white px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm",
                    STATUS_CONFIG[app.status]?.bg || 'bg-slate-900'
                  )}>
                    {STATUS_CONFIG[app.status]?.label || app.status}
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                    <MapPin size={12} className="text-[#db9b16]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {app?.country || "Non défini"}
                    </span>
                  </div>
                </div>

                <div>
                    <h4 className="text-2xl font-black text-slate-900 leading-none group-hover:text-[#db9b16] transition-colors uppercase italic tracking-tighter">
                      {app.university?.name || "Affectation Pendante"}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <Calendar size={10} strokeWidth={3} />
                        Session {app?.session || "2024 - 2025"}
                    </p>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-2xl group-hover:bg-[#db9b16] transition-all duration-300">
                        <Coins size={14} className="text-[#db9b16] group-hover:text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {app?.applicationFee ? `${app.applicationFee.toLocaleString()} XOF` : "0 XOF"}
                        </span>
                    </div>
                </div>
              </div>
            </div>

            {/* Bouton d'entrée Stylisé */}
            <div className="relative z-10 h-16 w-16 rounded-4xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-[#db9b16] group-hover:rotate-90 transition-all duration-500 border border-slate-100 group-hover:border-slate-900">
              <ChevronRight size={32} strokeWidth={2.5} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}