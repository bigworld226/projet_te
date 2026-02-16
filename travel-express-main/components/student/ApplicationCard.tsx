"use client";
import Link from "next/link";
import {
  GraduationCap,
  MapPin,
  Loader2,
  FileText,
  ExternalLink,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

// Helper pour traduire les statuts Prisma en texte lisible
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "text-slate-400 bg-slate-100" },
  SUBMITTED: { label: "Dossier soumis", color: "text-blue-600 bg-blue-50" },
  UNDER_REVIEW: { label: "En cours d'examen", color: "text-amber-600 bg-amber-50" },
  ACCEPTED: { label: "Admis", color: "text-emerald-600 bg-emerald-50" },
  REJECTED: { label: "Refusé.", color: "text-red-600 bg-red-50" },
  VISA_GRANTED: { label: "Visa obtenu ✈️", color: "text-purple-600 bg-purple-50" },
};

export default function ApplicationCard({ app }: { app: any }) {
  const hasUniversity = !!app.university;
  const statusInfo = STATUS_MAP[app.status] || { label: app.status, color: "text-slate-400 bg-slate-100" };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-7 flex flex-col gap-6 hover:border-[#db9b16]/30 transition-all group relative overflow-hidden h-full">

      {/* 1. HEADER : IDENTITÉ */}
      <div className="flex items-start gap-4">
        <div className={`p-4 rounded-2xl transition-colors shrink-0 ${hasUniversity ? 'bg-[#db9b16]/10 text-[#db9b16]' : 'bg-slate-100 text-slate-400'}`}>
          <GraduationCap size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-xl text-slate-900 leading-tight truncate">
            {hasUniversity ? app.university?.name : "Analyse du profil..."}
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.1em]">
            <MapPin size={12} className="text-[#db9b16] shrink-0" />
            <span className="truncate">
              {hasUniversity
                ? `${app.university?.city}, ${app.university?.country}`
                : `Destination : ${app.country || 'Chine'}`}
            </span>
          </div>
          <h2 > Frais des dossiers:
            <span className="text-amber-300">
              {app.applicationFee ?? '500000'} F CFA</span>
          </h2>
        </div>
      </div>

      {/* 2. STATUT DU DOSSIER (Optimisé) */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border ${statusInfo.color.split(' ')[1]} border-current/10`}>
        <div className="flex flex-col">
          <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">État actuel</span>
          <span className={`text-sm font-black ${statusInfo.color.split(' ')[0]}`}>{statusInfo.label}</span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-white/50 flex items-center justify-center shadow-sm backdrop-blur-sm">
          {!hasUniversity || app.status === 'UNDER_REVIEW'
            ? <Loader2 size={18} className="animate-spin text-[#db9b16]" />
            : <CheckCircle2 size={18} className="text-emerald-500" />
          }
        </div>
      </div>

      {/* 3. DOCUMENTS / INFO (Le Correctif) */}
      <div className="flex-1 space-y-4">
        {hasUniversity ? (
          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ressources d'admission :</span>

            <div className="flex flex-col gap-2">
              {app.university?.pdfUrl && (
                <a
                  href={app.university.pdfUrl}
                  target="_blank"
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl transition-all group/link border border-slate-100"
                >
                  <div className="flex items-center gap-2 font-bold text-[10px] uppercase">
                    <FileText size={16} className="text-[#db9b16]" />
                    Guide d'admission
                  </div>
                  <ExternalLink size={14} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </a>
              )}
              
            </div>
          </div>
        ) : (
          <div className="bg-[#db9b16]/5 p-4 rounded-2xl border border-dashed border-[#db9b16]/20">
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              <span className="text-[#db9b16] font-bold">Travel Express</span> étudie actuellement les meilleures universités pour votre projet en <span className="font-black">{app.country}</span>.
            </p>
          </div>
        )}
      </div>

      {/* 4. ACTIONS */}
      <div className="pt-2">
        <Link
          href={`/student/${app.id}`}
          className="flex items-center justify-center w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-[#db9b16] transition-all shadow-xl shadow-slate-900/10 gap-2 group/btn"
        >
          Gérer ma candidature
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-4">
          ID: {app.id.slice(-8).toUpperCase()}
        </p>
      </div>
    </div>
  );
}