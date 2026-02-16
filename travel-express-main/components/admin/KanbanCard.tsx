'use client';

import { updateApplicationStatusAction, rejectApplicationAction } from "@/actions/application.actions";
import { ApplicationStatus } from "@prisma/client";
import { useTransition } from "react";
import { Trash2, Loader2, Calendar, School } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface KanbanCardProps {
  application: any; 
}

export function KanbanCard({ application }: KanbanCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ApplicationStatus;
    
    startTransition(async () => {
      const result = await updateApplicationStatusAction(application.id, newStatus);
      if (result?.success) {
        toast.success(`Statut mis à jour : ${newStatus}`);
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    });
  };

  return (
    <div className={cn(
      "bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-4 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group relative",
      isPending && "opacity-60 pointer-events-none"
    )}>
      
      {/* Indicateur de chargement discret */}
      {isPending && (
        <div className="absolute top-4 right-4">
          <Loader2 className="animate-spin text-[#db9b16]" size={16} />
        </div>
      )}

      {/* Header : Nom & Progression */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">
          {application.user?.fullName || "Étudiant Inconnu"}
        </h3>
        <span className="text-[10px] font-black bg-[#db9b16]/10 text-[#db9b16] px-2.5 py-1 rounded-full">
          {application.progress}%
        </span>
      </div>
      
      {/* Infos Université & Date */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-slate-500">
          <School size={13} className="shrink-0 text-slate-400" />
          <p className="text-xs font-bold truncate">
            {application.university?.name || application.country || "Destination non définie"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar size={13} className="shrink-0" />
          <p className="text-[10px] font-medium">
            {new Date(application.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Actions : Selecteur de statut */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <select 
            disabled={isPending}
            value={application.status} 
            onChange={handleStatusChange}
            className="w-full text-[10px] font-black uppercase tracking-widest border-2 border-slate-50 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-700 outline-none focus:border-[#db9b16] transition-all appearance-none cursor-pointer"
          >
            <option value="SUBMITTED">Soumis 📩</option>
            <option value="UNDER_REVIEW">Analyse Admin 🧐</option>
            <option value="ACCEPTED">Accepté ✅</option>
            <option value="JW202_RECEIVED">Visa (JW202) 📄</option>
            <option value="VISA_GRANTED">Visa OK ✈️</option>
            <option value="COMPLETED">Terminé 🎓</option>
            <option value="REJECTED">Rejeté ❌</option>
          </select>
        </div>
        
        {/* On pourrait ici ajouter un bouton pour ouvrir les détails complets */}
        <button 
          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title="Supprimer le dossier"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}