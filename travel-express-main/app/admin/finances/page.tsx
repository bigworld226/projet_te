"use client";

import { useMemo } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, Plus, Calendar, 
  Loader2, ArrowRight, Wallet,
  BadgeCent,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AdminFinancesPage() {
  const router = useRouter();

  const { data: finances = [], isLoading, isError, error } = useQuery({
    queryKey: ["adminFinances"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/finances");
      return res.data.finances || [];
    }
  });

  // Calcul des totaux groupés par devise pour ne pas mélanger les serviettes et les torchons
  const totalsByCurrency = useMemo(() => {
    return finances.reduce((acc: Record<string, number>, curr: any) => {
      const amount = Number(curr.amount) || 0;
      const currency = curr.currency || "XOF"; 
      
      if (!acc[currency]) {
        acc[currency] = 0;
      }
      acc[currency] += amount;
      
      return acc;
    }, {});
  }, [finances]);

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfd]">
      <Loader2 className="animate-spin text-yellow-500 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronisation des registres...</p>
    </div>
  );

  if (isError) {
    const isForbidden = axios.isAxiosError(error) && error.response?.status === 403;
    const errorMessage = isForbidden 
      ? error.response?.data?.message || "Vous n'avez pas accès aux données financières." 
      : "Erreur lors du chargement des flux financiers.";

    return (
      <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-red-500/10">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter mb-4">
          {isForbidden ? "Accès Restreint" : "Oups !"}
        </h2>
        <p className="text-slate-500 max-w-lg mb-10 font-medium leading-relaxed">
          {errorMessage}
        </p>
        <Link href="/admin/dashboard">
          <Button className="bg-slate-950 text-white rounded-2xl px-10 py-6 font-black uppercase text-xs tracking-widest hover:bg-[#db9b16] transition-all">
            Retour au Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfcfd] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="animate-in slide-in-from-left duration-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Trésorerie & Multi-Devises</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight italic">Trésorerie</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 animate-in slide-in-from-right duration-700">
            {/* Génération dynamique des badges de totaux par devise */}
            {Object.entries(totalsByCurrency).map(([currency, total]) => (
              <div key={currency} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-4 px-6 transition-transform hover:scale-105">
                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total {currency}</p>
                  <p className="text-xl font-black text-slate-900 leading-none">
                    {(total as number).toLocaleString('fr-FR')} <span className="text-[10px] font-bold text-yellow-600">{currency}</span>
                  </p>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => router.push('/admin/finances/new')}
              className="group flex items-center gap-4 bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-yellow-500 transition-all shadow-2xl shadow-slate-900/20 active:scale-95 ml-2"
            >
              <Plus size={20} />
              Nouveau Paiement
            </button>
          </div>
        </header>

        {/* TABLEAU DES FLUX */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
             <div className="flex items-center gap-3">
               <BadgeCent className="text-slate-400" size={20} />
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Journal des Flux Entrants</h3>
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 text-right">
                {finances.length} opérations <br/> consolidées
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-white">
                  <th className="py-6 px-10 text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">Date</th>
                  <th className="py-6 px-10 text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">Étudiant</th>
                  <th className="py-6 px-10 text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">Description</th>
                  <th className="py-6 px-10 text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {finances.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-32 text-center">
                      <div className="inline-flex h-16 w-16 bg-slate-50 rounded-full items-center justify-center mb-4">
                        <Wallet className="text-slate-200" size={30} />
                      </div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Aucun mouvement de caisse</p>
                    </td>
                  </tr>
                ) : (
                  finances.map((f: any) => (
                    <tr 
                      key={f.id} 
                      className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                      onClick={() => router.push(`/admin/finances/${f.id}`)}
                    >
                      <td className="py-8 px-10">
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-slate-300" />
                          <span className="text-sm font-bold text-slate-600">
                            {f.createdAt ? new Date(f.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                          </span>
                        </div>
                      </td>
                      <td className="py-8 px-10">
                        <div>
                          <p className="font-black text-slate-900 text-sm tracking-tight">{f.user?.fullName || 'Client Anonyme'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{f.user?.email || '-'}</p>
                        </div>
                      </td>
                      <td className="py-8 px-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            {f.application?.country ? `Dossier ${f.application.country}` : (f.type || "Service")}
                          </span>
                        </div>
                      </td>
                      <td className="py-8 px-10 text-right">
                        <div className="flex items-center justify-end gap-4 font-black text-slate-900 text-xl italic">
                          {Number(f.amount).toLocaleString('fr-FR')} 
                          <span className="text-[10px] text-yellow-600 font-bold not-italic">
                            {f.currency || 'XOF'}
                          </span>
                          <div className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                            <ArrowRight size={16} className="text-yellow-500" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}