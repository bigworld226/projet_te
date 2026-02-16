"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, Loader2, Wallet, AlertCircle, 
  ArrowRight, ChevronDown, Banknote, ShieldCheck, 
  User as UserIcon, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddPaymentFormProps {
  applicationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddPaymentForm({ applicationId, onSuccess, onCancel }: AddPaymentFormProps) {
  const queryClient = useQueryClient();
  const [isFinished, setIsFinished] = useState(false);

  const [form, setForm] = useState({
    amount: "",
    currency: "XOF",
    method: "CASH",
    reference: ""
  });

  const { data: appDetails, isLoading } = useQuery({
    queryKey: ["application-details", applicationId],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/applications/${applicationId}`);
      return res.data.application;
    },
    enabled: !!applicationId
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await axios.post("/api/admin/finances", {
        ...data,
        applicationId,
        userId: appDetails?.userId,
        universityId: appDetails?.universityId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFinances"] });
      setIsFinished(true);
      if (onSuccess) setTimeout(onSuccess, 2000);
    }
  });

  if (isLoading) return (
    <div className="p-24 flex flex-col items-center justify-center bg-white rounded-[3rem]">
      <div className="relative mb-6">
        <Loader2 className="animate-spin text-[#db9b16]" size={48} strokeWidth={1.5} />
        <div className="absolute inset-0 blur-2xl bg-[#db9b16]/20 animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Initialisation du terminal...</p>
    </div>
  );

  if (isFinished) return (
    <div className="p-16 flex flex-col items-center text-center animate-in zoom-in-95 duration-500 bg-white rounded-[3rem]">
      <div className="h-24 w-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 border border-emerald-100 shadow-2xl shadow-emerald-500/20 relative">
        <CheckCircle2 size={48} strokeWidth={2.5} />
        <div className="absolute -right-2 -top-2 h-8 w-8 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-white">
            <ShieldCheck size={16} />
        </div>
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-3 italic tracking-tighter">TRANSAC RÉUSSIE</h2>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-70 leading-relaxed">
        Le montant de <span className="text-slate-900">{form.amount} {form.currency}</span> a été provisionné avec succès.
      </p>
    </div>
  );

  return (
    <form 
      className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(form);
      }}
    >
      {/* HEADER : RÉCAPITULATIF PRESTIGE */}
      <div className="p-8 bg-slate-950 text-white relative overflow-hidden">
        {/* Grille décorative */}
        <div 
    className="absolute inset-0 opacity-10 pointer-events-none" 
    style={{ 
      backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', 
      backgroundSize: '24px 24px' // Utilisation de backgroundSize au lieu de size
    }} 
  />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-[#db9b16] rounded-2xl flex items-center justify-center shadow-lg shadow-[#db9b16]/20 rotate-3">
              <Wallet className="text-slate-950" size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#db9b16] mb-1">Guichet Administration</p>
              <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">Nouvel Encaissement</h3>
            </div>
          </div>
          <div className="text-right flex flex-col gap-1">
             <div className="flex items-center gap-2 justify-end text-[#db9b16]">
                <Building2 size={12} />
                <span className="text-[10px] font-black uppercase truncate max-w-[150px]">{appDetails?.university?.name}</span>
             </div>
             <div className="flex items-center gap-2 justify-end text-white/40">
                <UserIcon size={12} />
                <span className="text-[10px] font-bold uppercase">{appDetails?.user?.fullName}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* SECTION MONTANT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Valeur Transactionnelle</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#db9b16] transition-colors">
                <Banknote size={20} strokeWidth={2.5} />
              </div>
              <input 
                type="number" 
                required
                placeholder="0.00"
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-[#db9b16]/30 focus:bg-white rounded-2xl outline-none transition-all font-black text-2xl tracking-tighter shadow-inner"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({...form, amount: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Unité Monétaire</label>
            <div className="relative">
              <select 
                className="w-full appearance-none px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-[#db9b16]/30 focus:bg-white rounded-2xl outline-none transition-all font-black text-slate-700 uppercase tracking-widest text-xs"
                value={form.currency}
                onChange={(e) => setForm({...form, currency: e.target.value})}
              >
                <option value="XOF">Franc CFA (XOF)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* SECTION MODE & RÉFÉRENCE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Canal de Règlement</label>
            <div className="relative">
                <select 
                  className="w-full appearance-none px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-[#db9b16]/30 focus:bg-white rounded-2xl outline-none transition-all font-black text-slate-700 uppercase tracking-widest text-xs"
                  value={form.method}
                  onChange={(e) => setForm({...form, method: e.target.value})}
                >
                  <option value="CASH">💵 Espèces</option>
                  <option value="ORANGE_MONEY">📱 Orange Money</option>
                  <option value="MOOV_MONEY">📱 Moov Money</option>
                  <option value="TRANSFER">🏦 Virement Bancaire</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} strokeWidth={3} />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Identifiant de Référence</label>
            <input 
              type="text"
              placeholder="Ex: TR-998..."
              className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-[#db9b16]/30 focus:bg-white rounded-2xl outline-none transition-all font-black uppercase tracking-widest text-xs placeholder:text-slate-200 shadow-inner"
              value={form.reference}
              onChange={(e) => setForm({...form, reference: e.target.value})}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col md:flex-row items-center gap-4 pt-6">
          {onCancel && (
            <button 
              type="button"
              onClick={onCancel}
              className="w-full md:w-1/3 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-red-500 transition-all border-2 border-transparent hover:border-red-50"
            >
              Interrompre
            </button>
          )}
          <button 
            type="submit"
            disabled={mutation.isPending || !form.amount}
            className={cn(
                "w-full md:flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl",
                mutation.isPending || !form.amount 
                    ? "bg-slate-100 text-slate-300 shadow-none cursor-not-allowed" 
                    : "bg-slate-900 text-[#db9b16] hover:bg-slate-800 shadow-slate-900/20 active:scale-[0.97]"
            )}
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Exécuter le dépôt
                <ArrowRight size={18} strokeWidth={3} />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 justify-center py-4 px-6 bg-slate-50 rounded-2xl">
          <ShieldCheck size={14} className="text-[#db9b16]" />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Transaction auditée & sécurisée par Travel Express Admin
          </p>
        </div>
      </div>
    </form>
  );
}