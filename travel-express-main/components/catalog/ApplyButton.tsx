'use client';

import { createApplicationAction } from "@/actions/application.actions";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, ArrowRight, Globe } from "lucide-react";

interface ApplyButtonProps {
  countryName: string; 
  isConnected: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ApplyButton({ countryName, isConnected, className, children }: ApplyButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isConnected) {
      // On redirige vers le login en gardant en mémoire le pays choisi
      window.location.href = `/login?redirect_country=${encodeURIComponent(countryName)}`;
      return;
    }

    startTransition(async () => {
      try {
        const data = new FormData();
        data.append("country", countryName); 
        
        const result = await createApplicationAction(data);
        
        if (result?.error) {
          toast.error(result.error);
        }
      } catch (err) {
        toast.error("Erreur lors de la création du dossier.");
      }
    });
  };

  if (children) {
    return (
      <div 
        onClick={handleApply} 
        className={cn("cursor-pointer relative transition-all active:scale-95", className)}
      >
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl z-20">
            <Loader2 className="animate-spin text-[#db9b16]" size={24} />
          </div>
        )}
        {children}
      </div>
    );
  }

  // Bouton standard Travel Express
  return (
    <Button 
      onClick={handleApply} 
      isLoading={isPending}
      className={cn("w-full group py-7 rounded-2xl font-black uppercase tracking-widest", className)}
      variant={isConnected ? "glow" : "primary"}
    >
      <span className="flex items-center gap-3">
        <Globe size={18} className={isConnected ? "text-[#db9b16]" : "text-slate-400"} />
        {isConnected ? `Postuler pour : ${countryName}` : 'Se connecter pour postuler'}
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Button>
  );
}