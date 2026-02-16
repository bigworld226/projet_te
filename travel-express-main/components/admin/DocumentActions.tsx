'use client';

import { verifyDocumentAction } from "@/actions/document.actions";
import { Button } from "@/components/ui/Button";
import { Check, X, Loader2, RotateCcw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentActionsProps {
  id: string;
  currentStatus: string;
}

export function DocumentActions({ id, currentStatus }: DocumentActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleVerify = (status: 'APPROVED' | 'REJECTED') => {
    startTransition(async () => {
      try {
        const result = await verifyDocumentAction(id, status);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(status === 'APPROVED' ? "Document validé" : "Document rejeté");
        }
      } catch (e) {
        toast.error("Une erreur est survenue lors de la vérification.");
      }
    });
  };

  // Affichage du Badge si déjà traité
  if (currentStatus === 'APPROVED') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-100 rounded-full flex items-center gap-1.5 animate-in zoom-in-95">
          <Check size={12} strokeWidth={3} /> Validé
        </span>
      </div>
    );
  }
  
  if (currentStatus === 'REJECTED') {
    return (
      <span className="text-red-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-100 rounded-full flex items-center gap-1.5 animate-in zoom-in-95">
        <X size={12} strokeWidth={3} /> Rejeté
      </span>
    );
  }

  // État d'attente de vérification (Actions disponibles)
  return (
    <div className="flex gap-2 items-center">
      <Button 
        onClick={() => handleVerify('APPROVED')} 
        disabled={isPending}
        className={cn(
          "h-9 w-9 p-0 bg-white text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-200 rounded-xl transition-all shadow-sm",
          isPending && "opacity-50"
        )}
        title="Approuver le document"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
      </Button>

      <Button 
        onClick={() => handleVerify('REJECTED')} 
        disabled={isPending}
        className={cn(
          "h-9 w-9 p-0 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border-2 border-slate-100 hover:border-red-200 rounded-xl transition-all shadow-sm",
          isPending && "opacity-50"
        )}
        title="Rejeter le document"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <X size={18} strokeWidth={2.5} />}
      </Button>
    </div>
  );
}