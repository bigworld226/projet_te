"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  User, 
  LayoutGrid, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

// Sous-composants spécialisés
import StudentSearchSelector from "@/components/admin/students/StudentSearchSelector";
import StudentAppSelector from "@/components/admin/students/StudentAppSelector";
import AddPaymentForm from "@/components/admin/payments/AddPaymentForm";

export default function NewPaymentPage() {
  const router = useRouter();
  
  // États du Stepper
  const [step, setStep] = useState(1); 
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setStep(2);
  };

  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId);
    setStep(3);
  };

  return (
    <main className="min-h-screen bg-[#fcfcfd] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* HEADER DE NAVIGATION */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all"
          >
            <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
              <ArrowLeft size={14} />
            </div>
            {step > 1 ? "Étape précédente" : "Annuler l'opération"}
          </button>

          {/* INDICATEUR DE PROGRESSION */}
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  step === i ? 'w-12 bg-yellow-500' : step > i ? 'w-6 bg-slate-900' : 'w-6 bg-slate-200'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* CONTAINER PRINCIPAL */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden min-h-[500px] flex flex-col">
          
          {/* ÉTAPE 1 : IDENTIFICATION */}
          {step === 1 && (
            <div className="p-12 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10 text-center">
                <div className="h-20 w-20 bg-yellow-50 text-yellow-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Search size={32} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Identifier l'étudiant</h1>
                <p className="text-sm text-slate-400 font-medium">Recherchez le profil client pour l'imputation financière.</p>
              </div>
              
              <div className="max-w-md mx-auto w-full">
                <StudentSearchSelector onSelect={handleStudentSelect} />
              </div>
              
              <div className="mt-auto pt-10 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                   <ShieldCheck size={14} className="text-slate-300" />
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Système de transaction sécurisé</span>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : SÉLECTION DU DOSSIER (APPLICATION) */}
          {step === 2 && (
            <div className="p-12 flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                    {selectedStudent?.fullName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Étudiant</p>
                    <h2 className="text-xl font-black text-slate-900">{selectedStudent?.fullName}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID Client</p>
                  <p className="text-xs font-bold text-slate-400">#{selectedStudent?.id?.slice(-6)}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-900">
                  <LayoutGrid size={18} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Sélectionner le dossier cible</h3>
                </div>
                <StudentAppSelector 
                  studentId={selectedStudent?.id} 
                  onAppSelect={handleAppSelect} 
                />
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : ENREGISTREMENT DU PAIEMENT */}
          {step === 3 && (
            <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500">
              {/* Header Dark pour marquer l'aspect transactionnel */}
              <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-2">Finalisation</p>
                  <h2 className="text-2xl font-black tracking-tight">Saisir le versement</h2>
                </div>
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                  <CheckCircle2 size={24} className="text-yellow-500" />
                </div>
              </div>
              
              <div className="p-2">
                <AddPaymentForm 
                  applicationId={selectedAppId!} 
                  onSuccess={() => router.push('/admin/finances')}
                  onCancel={() => setStep(2)}
                />
              </div>
            </div>
          )}

        </div>

        {/* FOOTER DES ÉTAPES */}
        <div className="mt-8 text-center">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
             Step {step} of 3 — Financial Ledger
           </p>
        </div>
      </div>
    </main>
  );
}