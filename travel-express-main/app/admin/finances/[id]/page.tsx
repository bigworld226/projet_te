'use client';

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  ArrowLeft, Printer, Calendar, 
  Building2, ShieldCheck, Hash, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const paymentId = resolvedParams.id;

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ["payment-detail", paymentId],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/finances/${paymentId}`);
      return res.data.payment;
    }
  });

  if (isLoading) return <LoadingState />;
  if (error || !payment) return <ErrorState back={() => router.back()} />;

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Force une seule page sans défilement */
          html, body {
            height: 100vh;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          /* Cacher l'UI de l'app */
          body * {
            visibility: hidden !important;
          }

          /* Afficher uniquement le reçu */
          #print-area, #print-area * {
            visibility: visible !important;
          }

          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-height: 270mm !important; /* Limite la hauteur pour éviter la page 2 */
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
          }

          /* Forcer les couleurs de fond */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[#fcfcfd] py-10 px-6">
        <div className="max-w-3xl mx-auto">
          
          {/* ACTIONS (Caché à l'impression) */}
          <div className="flex justify-between items-center mb-8" id="no-print-header">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400"
            >
              <ArrowLeft size={16} /> Retour
            </button>

            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-4 bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95"
            >
              <Printer size={18} /> Imprimer sur 1 page
            </button>
          </div>

          {/* ZONE D'IMPRESSION CONDENSÉE */}
          <div 
            id="print-area" 
            className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* EN-TÊTE RÉDUIT */}
            <div 
              className="p-8 text-white flex justify-between items-center"
              style={{ backgroundColor: '#0f172a' }} 
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Reçu de paiement</span>
                </div>
                <h1 className="text-3xl font-black italic tracking-tighter">Validé</h1>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                  <Hash size={10} /> ID : {payment.id.toUpperCase()}
                </p>
              </div>

              <div className="text-right p-5 rounded-2xl border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <p className="text-3xl font-black text-yellow-500">
                  {payment.amount.toLocaleString()} <span className="text-xs font-bold opacity-60">XOF</span>
                </p>
                <span className="text-[8px] font-black uppercase text-green-400 tracking-tighter">
                  Transaction Confirmée
                </span>
              </div>
            </div>

            {/* CONTENU EN GRILLE SERRÉE */}
            <div className="p-8 grid grid-cols-2 gap-8 bg-white">
              <div className="space-y-6">
                <section>
                  <label className="text-[9px] font-black uppercase text-slate-300 mb-2 block">Bénéficiaire</label>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#f8fafc] rounded-lg flex items-center justify-center font-black text-slate-900 border border-slate-100">
                      {payment.user.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{payment.user.fullName}</p>
                      <p className="text-[10px] font-bold text-slate-400">{payment.user.email}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <label className="text-[9px] font-black uppercase text-slate-300 mb-2 block">Détails Dossier</label>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#f8fafc] rounded-lg flex items-center justify-center text-yellow-500 border border-slate-100">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-xs">{payment.application?.university?.name || "Universite non definie"}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{payment.application?.university?.country || "Pays non definie"}</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="bg-[#f8fafc] rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2">
                    <Calendar size={12} /> Date
                  </span>
                  <span className="font-black text-slate-900 text-xs">
                    {new Date(payment.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2">
                    <ShieldCheck size={12} /> Sécurité
                  </span>
                  <span className="font-black text-slate-900 text-[9px] uppercase">
                    {payment.method || "Certifiée"}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] text-slate-500 italic leading-tight">
                    {payment.notes || "Quittance officielle pour frais d'accompagnement académique."}
                  </p>
                </div>
              </div>
            </div>

            {/* BAS DE PAGE TRÈS FIN */}
            <div className="mt-auto p-6 border-t border-slate-100 flex justify-between items-center bg-[#f8fafc]">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Elite Agency Management</p>
              <p className="text-[8px] font-bold text-slate-300 uppercase">Document Numérique Certifié</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfcfd]">
      <Loader2 className="animate-spin text-yellow-500 mr-3" size={24} />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chargement...</span>
    </div>
  );
}

function ErrorState({ back }: { back: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p className="text-[10px] font-black uppercase text-slate-400">Données introuvables</p>
      <button onClick={back} className="mt-4 text-yellow-500 font-bold text-xs uppercase underline">Retour</button>
    </div>
  );
}