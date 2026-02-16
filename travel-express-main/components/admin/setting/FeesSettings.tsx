'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
  Plus, Loader2, Trash2, Globe, Banknote, Coins, ArrowRight, Wallet, Check, X, Edit2
} from 'lucide-react';
import { getFeesAction, updateFeeAction, deleteFeeAction } from '@/actions/fees.action';
import { Button } from '@/components/ui/Button';
import { toast } from "sonner";

export function FeesSettings() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stocke l'ID de la ligne en cours d'édition
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await getFeesAction();
      setFees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  // Fonction pour activer le mode édition
  const startEdit = (fee: any) => {
    setEditingId(fee.id);
    setEditAmount(fee.amount.toString());
  };

  // Sauvegarde de l'édition
  const handleInlineUpdate = async (feeId: string, country: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', feeId);
      formData.append('country', country);
      formData.append('amount', editAmount);

      const res = await updateFeeAction(formData);
      if (res.success) {
        toast.success("Prix mis à jour");
        setEditingId(null);
        await refreshData();
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    });
  };

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateFeeAction(formData);
      if (res.success) {
        toast.success("Tarification enregistrée");
        (document.getElementById('fee-form') as HTMLFormElement).reset();
        await refreshData();
      } else {
        toast.error("Échec de l'enregistrement");
      }
    });
  }

  return (
    <div className="space-y-10">

      {/* FORMULAIRE D'AJOUT */}
      <form id="fee-form" action={handleSubmit} className="relative group p-1 rounded-[2.5rem] bg-linear-to-r from-slate-100 via-slate-50 to-slate-100 shadow-sm">
        <div className="bg-white rounded-[2.3rem] p-6 flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-240 space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Destination</label>
            <div className="relative">
              <Globe size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#db9b16]" />
              <input name="country" placeholder="Ex: Canada, France..." className="w-full bg-slate-50 border-none focus:ring-2 focus:ring-[#db9b16]/20 rounded-2xl p-4 pl-14 font-bold text-slate-700 placeholder:text-slate-300 transition-all" required />
            </div>
          </div>
          <div className="w-full md:w-64 space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Frais (FCFA)</label>
            <div className="relative">
              <Banknote size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#db9b16]" />
              <input name="amount" type="number" placeholder="0.00" className="w-full bg-slate-50 border-none focus:ring-2 focus:ring-[#db9b16]/20 rounded-2xl p-4 pl-14 font-bold text-slate-700 placeholder:text-slate-300 transition-all" required />
            </div>
          </div>
          <Button disabled={isPending} className="h-60 px-8 bg-slate-900 hover:bg-[#db9b16] text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all">
            {isPending ? <Loader2 className="animate-spin" /> : <Plus className="mr-2" size={20} strokeWidth={3} />}
            Ajouter
          </Button>
        </div>
      </form>

      {/* LISTE DES FRAIS */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex flex-col items-center py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
            <Loader2 className="animate-spin text-[#db9b16] mb-4" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chargement...</p>
          </div>
        ) : fees.map((fee) => (
          <div key={fee.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-4xl hover:shadow-xl transition-all">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-[#db9b16]/10 group-hover:text-[#db9b16] transition-all">
                {fee.country.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-black text-slate-900 uppercase tracking-tight">{fee.country}</h4>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tarification active</span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[10px] font-black text-[#db9b16] uppercase tracking-[0.2em] mb-0.5">Montant</p>
                {editingId === fee.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineUpdate(fee.id, fee.country);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-32 bg-slate-50 border-2 border-[#db9b16] rounded-lg px-3 py-1 font-black text-slate-900 text-xl outline-none"
                    />
                    <button onClick={() => handleInlineUpdate(fee.id, fee.country)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"><Check size={20}/></button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:bg-red-50 rounded"><X size={20}/></button>
                  </div>
                ) : (
                  <p onClick={() => startEdit(fee)} className="font-black text-slate-900 text-2xl tracking-tighter cursor-pointer hover:text-[#db9b16] transition-colors">
                    {Number(fee.amount).toLocaleString()} 
                    <span className="text-[11px] ml-1 text-slate-400">FCFA</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pr-2">
                <button 
                  onClick={() => startEdit(fee)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-[#db9b16] hover:bg-slate-50 transition-all"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={async () => {
                    if(confirm('Supprimer ce tarif ?')) {
                      startTransition(async () => {
                        await deleteFeeAction(fee.id);
                        await refreshData();
                        toast.success("Destination supprimée");
                      });
                    }
                  }}
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}