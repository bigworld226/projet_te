'use client';

import { useState, useTransition } from 'react';
import { 
  Lock, ShieldCheck, ShieldAlert, Loader2, 
  CheckCircle, AlertCircle, Key, Eye, EyeOff 
} from 'lucide-react';
import { updatePasswordAction } from '@/actions/user.actions';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from "sonner";

export function SecuritySettings() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);

  async function handlePasswordUpdate(formData: FormData) {
    setStatus(null);
    startTransition(async () => {
      const res = await updatePasswordAction(formData);
      
      if (res?.success) {
        setStatus({ type: 'success', msg: 'Accès sécurisés avec succès.' });
        (document.getElementById('pwd-form') as HTMLFormElement).reset();
        toast.success("Sécurité mise à jour");
        setTimeout(() => setStatus(null), 5000);
      } else {
        setStatus({ type: 'error', msg: res?.error || 'Erreur d\'authentification.' });
        toast.error("Échec de la mise à jour");
      }
    });
  }

  return (
    <form id="pwd-form" action={handlePasswordUpdate} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER AVEC STYLE "VAULT" */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-[#db9b16] shadow-xl shadow-slate-200">
            <Lock size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Sécurité</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Protection de vos accès administrateur</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
          <ShieldCheck size={14} className="text-blue-500" />
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Chiffrement AES-256</span>
        </div>
      </header>

      {/* ZONE DE SAISIE "COFFRE-FORT" */}
      <div className="max-w-2xl space-y-8">
        <div className="relative group">
          <SecurityInputGroup 
            label="Mot de passe actuel" 
            name="currentPassword" 
            type={showCurrent ? "text" : "password"} 
            icon={Key}
            placeholder="••••••••••••"
          />
          <button 
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-6 top-13.5 text-slate-300 hover:text-slate-600 transition-colors"
          >
            {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
          <SecurityInputGroup 
            label="Nouveau secret" 
            name="newPassword" 
            type="password" 
            icon={ShieldCheck}
            placeholder="Min. 8 caractères"
          />
          <SecurityInputGroup 
            label="Confirmation" 
            name="confirmPassword" 
            type="password" 
            icon={CheckCircle}
            placeholder="Répétez le secret"
          />
        </div>
      </div>

      {/* FOOTER & ACTIONS */}
      <div className="pt-8 flex flex-col sm:flex-row items-center gap-6 border-t border-slate-50">
        <Button 
          disabled={isPending} 
          className={cn(
            "h-16 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl active:scale-95",
            isPending 
              ? "bg-slate-100 text-slate-400" 
              : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200"
          )}
        >
          {isPending ? <Loader2 className="animate-spin mr-3" size={18} /> : <Lock className="mr-3 text-[#db9b16]" size={18} />}
          {isPending ? "Mise à jour..." : "Sécuriser les accès"}
        </Button>

        {status && (
          <div className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-2xl animate-in zoom-in-95 duration-300",
            status.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {status.type === 'success' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{status.msg}</span>
          </div>
        )}
      </div>
    </form>
  );
}

function SecurityInputGroup({ label, name, type = "password", icon: Icon, placeholder }: any) {
  return (
    <div className="space-y-3 group">
      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1 group-focus-within:text-slate-900 transition-colors">
        {label}
      </label>
      <div className="relative">
        <Icon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#db9b16] transition-colors" />
        <input 
          name={name}
          type={type}
          placeholder={placeholder}
          className="w-full p-5 pl-14 rounded-2xl bg-slate-50/50 border-2 border-transparent focus:border-slate-100 focus:bg-white focus:shadow-xl focus:shadow-slate-100 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-200"
          required
        />
      </div>
    </div>
  );
}