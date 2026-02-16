"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Check, CreditCard, FileText, User, 
  ChevronRight, ArrowLeft, Sparkles, Globe2 
} from "lucide-react";
import AddPaymentForm from "./AddPaymentForm";
import { cn } from "@/lib/utils";

export default function NewPaymentStepper({ studentId }: { studentId: string }) {
  const [step, setStep] = useState(2); // On commence directement à l'étape 2 car l'élève est déjà connu
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["student-apps", studentId],
    queryFn: () => fetch(`/api/admin/students/${studentId}/applications`).then(res => res.json())
  });

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* HEADER DU STEPPER */}
      <div className="flex flex-col items-center mb-16">
        <div className="flex items-center justify-center w-full max-w-md">
            <StepIndicator active={step >= 1} done={step > 1} label="Identité" Icon={User} />
            <div className={cn("h-[2px] flex-1 mx-4 transition-all duration-700", step > 1 ? "bg-emerald-500" : "bg-slate-100")} />
            <StepIndicator active={step >= 2} done={step > 2} label="Dossier" Icon={FileText} />
            <div className={cn("h-[2px] flex-1 mx-4 transition-all duration-700", step > 2 ? "bg-emerald-500" : "bg-slate-100")} />
            <StepIndicator active={step >= 3} done={step > 3} label="Paiement" Icon={CreditCard} />
        </div>
      </div>

      {/* ÉTAPE 2 : SÉLECTION DU DOSSIER CIBLE */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-[#db9b16] rounded-full mb-4">
                <Sparkles size={12} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sélection Critique</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Ciblez l'admission</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Liez cet encaissement à un processus actif</p>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
                <div className="py-20 text-center uppercase text-[10px] font-black text-slate-300 animate-pulse tracking-[0.3em]">Synchronisation des dossiers...</div>
            ) : (
                applications?.map((app: any) => (
                    <button
                      key={app.id}
                      onClick={() => { setSelectedApp(app); setStep(3); }}
                      className="group relative w-full flex items-center justify-between p-7 bg-white border border-slate-100 rounded-[2.5rem] hover:border-[#db9b16]/40 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 text-left overflow-hidden"
                    >
                      {/* Watermark pays */}
                      <span className="absolute -right-4 -bottom-4 text-slate-50 font-black text-7xl italic pointer-events-none group-hover:text-slate-100/50 transition-colors uppercase">
                        {app.countryCode}
                      </span>

                      <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 w-16 bg-slate-950 rounded-2xl flex items-center justify-center text-[#db9b16] group-hover:scale-110 transition-transform duration-500 shadow-lg">
                          <Globe2 size={28} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-[#db9b16] transition-colors">
                            {app.universityName}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{app.country}</span>
                             <span className="h-1 w-1 rounded-full bg-slate-200" />
                             <span className="text-[10px] uppercase font-bold text-[#db9b16] tracking-tighter italic">{app.program}</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative z-10 h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-[#db9b16] transition-all duration-500">
                        <ChevronRight size={24} strokeWidth={3} />
                      </div>
                    </button>
                  ))
            )}
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : FORMULAIRE DE PAIEMENT DÉFINITIF */}
      {step === 3 && selectedApp && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <button 
            onClick={() => setStep(2)}
            className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-6 transition-colors"
          >
            <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-100 transition-all">
                <ArrowLeft size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Changer de dossier</span>
          </button>

          <div className="relative">
             {/* Un petit rappel flottant du dossier sélectionné */}
             <div className="absolute -top-4 right-8 z-20 px-4 py-2 bg-emerald-500 text-white rounded-xl shadow-lg flex items-center gap-2 border-2 border-white">
                <Check size={12} strokeWidth={4} />
                <span className="text-[9px] font-black uppercase tracking-widest">Dossier Validé</span>
             </div>

             <AddPaymentForm 
               applicationId={selectedApp.id} 
               onCancel={() => setStep(2)}
               onSuccess={() => {
                 // Optionnel : rediriger ou afficher un succès global ici
               }}
             />
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ active, done, label, Icon }: any) {
  return (
    <div className="flex flex-col items-center gap-3 relative">
      <div className={cn(
        "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
        done 
          ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' 
          : active 
            ? 'bg-slate-900 border-slate-900 text-[#db9b16] shadow-2xl shadow-slate-200 scale-110' 
            : 'bg-white border-slate-100 text-slate-300'
      )}>
        {done ? <Check size={24} strokeWidth={3} /> : <Icon size={24} strokeWidth={2} />}
      </div>
      <div className="flex flex-col items-center">
        <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
            active ? 'text-slate-900' : 'text-slate-300'
        )}>
            {label}
        </span>
        {active && !done && (
            <div className="h-1 w-1 rounded-full bg-[#db9b16] mt-1 animate-ping" />
        )}
      </div>
    </div>
  );
}