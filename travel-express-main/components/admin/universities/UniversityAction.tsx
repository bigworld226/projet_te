'use client';

import { useState } from "react";
import { UniversitySelector } from "./UniversitiesSelector";
import { X, Edit3, School, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function UniversityAction({ 
  applicationId, 
  currentUniversityName 
}: { 
  applicationId: string; 
  currentUniversityName?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSuccess = () => {
    setIsEditing(false);
  };

  // MODE ÉDITION OU AUCUNE ASSIGNATION
  if (isEditing || !currentUniversityName) {
    return (
      <div className={cn(
        "mt-4 p-6 rounded-[2rem] border-2 transition-all duration-500 animate-in zoom-in-95",
        !currentUniversityName 
          ? "bg-amber-50/30 border-dashed border-amber-200 shadow-inner" 
          : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
      )}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center shadow-sm",
                !currentUniversityName ? "bg-[#db9b16] text-white" : "bg-slate-900 text-[#db9b16]"
            )}>
              {currentUniversityName ? <Edit3 size={14} /> : <AlertCircle size={16} className="animate-pulse" />}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                  {currentUniversityName ? "Mettre à jour" : "Affectation Requise"}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Sélectionnez l'établissement de destination
                </span>
            </div>
          </div>

          {currentUniversityName && (
            <button 
              onClick={() => setIsEditing(false)} 
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all group"
            >
              <X size={14} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            </button>
          )}
        </div>
        
        <div className="relative">
            <UniversitySelector 
              applicationId={applicationId} 
              onSuccess={handleSuccess} 
            />
        </div>
        
        {!currentUniversityName && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-white/50 rounded-lg border border-amber-100/50">
            <div className="h-1.5 w-1.5 rounded-full bg-[#db9b16] animate-ping" />
            <p className="text-[9px] font-black text-amber-700 uppercase italic tracking-tighter">
              Le dossier est en attente d'une institution pour validation.
            </p>
          </div>
        )}
      </div>
    );
  }

  // MODE AFFICHAGE PRESTIGE
  return (
    <div className="group/uni relative flex items-center justify-between p-4 bg-white rounded-[1.5rem] border border-slate-50 shadow-sm hover:shadow-md hover:border-[#db9b16]/20 transition-all duration-500">
      {/* Background Glow au hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#db9b16]/0 to-[#db9b16]/5 opacity-0 group-hover/uni:opacity-100 transition-opacity rounded-[1.5rem]" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-[#db9b16] shadow-lg group-hover/uni:scale-110 group-hover/uni:-rotate-3 transition-all duration-500">
          <School size={20} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Institution Assignée</span>
            <div className="font-black text-slate-900 text-sm uppercase tracking-tight flex items-center gap-2">
              {currentUniversityName}
              <ArrowRight size={12} className="text-[#db9b16] opacity-0 -translate-x-2 group-hover/uni:opacity-100 group-hover/uni:translate-x-0 transition-all" />
            </div>
        </div>
      </div>

      <button 
        onClick={() => setIsEditing(true)}
        className={cn(
          "relative z-10 flex items-center gap-2 py-2 px-4 rounded-xl border-2 border-slate-100 bg-white shadow-sm",
          "text-[9px] font-black text-slate-500 uppercase tracking-widest",
          "opacity-0 translate-x-4 group-hover/uni:opacity-100 group-hover/uni:translate-x-0 hover:border-[#db9b16] hover:text-[#db9b16] transition-all duration-300"
        )}
      >
        <Edit3 size={12} strokeWidth={3} />
        Éditer
      </button>
    </div>
  );
}