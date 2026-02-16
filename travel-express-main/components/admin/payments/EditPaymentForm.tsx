"use client";

import { useState, useTransition } from "react";
import { 
  Check, 
  X, 
  RefreshCw, 
  Banknote, 
  ChevronDown,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  currency: string;
}

interface EditPaymentFormProps {
  payment: Payment;
  onSave: (payment: Payment) => void | Promise<void>;
  onCancel: () => void;
}

export default function EditPaymentForm({ payment, onSave, onCancel }: EditPaymentFormProps) {
  const [amount, setAmount] = useState(payment.amount);
  const [currency, setCurrency] = useState(payment.currency);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      await onSave({ ...payment, amount, currency });
    });
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex flex-wrap md:flex-nowrap items-center gap-3 p-3 bg-slate-900 rounded-[1.5rem] border border-white/10 shadow-2xl animate-in slide-in-from-left-2 duration-300"
    >
      {/* INDICATEUR D'ÉDITION */}
      <div className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center bg-[#db9b16]/10 text-[#db9b16] rounded-xl border border-[#db9b16]/20">
        <RefreshCw size={16} className={cn(isPending && "animate-spin")} />
      </div>

      {/* INPUT MONTANT */}
      <div className="relative flex-1 min-w-[120px]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <Banknote size={14} />
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-black text-sm outline-none focus:border-[#db9b16]/50 focus:bg-white/10 transition-all tracking-tight"
          placeholder="Montant"
          min={0}
          required
        />
      </div>

      {/* SELECT DEVISE */}
      <div className="relative shrink-0">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-[11px] uppercase tracking-widest outline-none focus:border-[#db9b16]/50 transition-all cursor-pointer"
          required
        >
          <option value="XOF" className="bg-slate-900">XOF</option>
          <option value="EUR" className="bg-slate-900">EUR</option>
          <option value="USD" className="bg-slate-900">USD</option>
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <X size={16} className="md:mr-2" />
          <span className="hidden md:inline">Annuler</span>
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-6 flex items-center justify-center rounded-xl bg-[#db9b16] text-slate-950 font-black text-[10px] uppercase tracking-[0.15em] hover:bg-[#f2ac1b] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#db9b16]/20 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Check size={16} className="md:mr-2" strokeWidth={3} />
              <span className="hidden md:inline">Enregistrer</span>
            </>
          )}
        </button>
      </div>

      {/* TOOLTIP DE SÉCURITÉ */}
      <div className="md:hidden w-full flex items-center gap-2 px-2 pb-1">
        <AlertCircle size={10} className="text-[#db9b16]" />
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Modification de pièce comptable</span>
      </div>
    </form>
  );
}