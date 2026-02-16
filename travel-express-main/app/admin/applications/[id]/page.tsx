// application-details-page.tsx
import { applicationService } from "@/services/application.service";
import { DocumentActions } from "@/components/admin/DocumentActions";
import { UniversityAction } from "@/components/admin/universities/UniversityAction";
import { ApplicationStatusControl } from "@/components/admin/applications/ApplicationStatusControl";
import { FileText, Calendar, Download, AlertCircle, ArrowLeft, ShieldCheck, Banknote, MapPin } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFileUrl } from "@/lib/storage"; // Assurez-vous d'importer la version 'Public'
import { convertToXOF } from "@/services/currency.service";
import { prisma } from "@/lib/prisma";

export default async function ApplicationDetailsPage(props: { params: Promise<{ id: string }> }) {
  // NEXT.JS 15/16 : On attend la résolution des params
  const params = await props.params;
  const applicationRaw = await applicationService.getApplicationById(params.id);
  if (!applicationRaw) redirect('/admin/students');

  // --- 1. TRAITEMENT DES DOCUMENTS (URL PUBLIQUES) ---
  // 1. On prépare le traitement des documents
// Dans ton composant ApplicationDetailsPage
const documentsWithUrls = await Promise.all(
  (applicationRaw.documents || []).map(async (doc: any) => {
    let currentUrl = doc.url || "";
    let needsUpdate = false;

    // 1. Détection et extraction du chemin relatif
    if (currentUrl.startsWith('http')) {
      if (currentUrl.includes('/public/agence/')) {
        // On récupère ce qu'il y a après /public/agence/
        let pathPart = currentUrl.split('/public/agence/')[1];
        
        // CRUCIAL : On enlève les paramètres (?t=...) pour avoir le vrai chemin
        currentUrl = pathPart.split('?')[0];
        needsUpdate = true;
      }
    }

    // 2. Nettoyage final (enlève les slashes au début si existants)
    const cleanPath = currentUrl.replace(/^\/+/, '');
    if (cleanPath !== doc.url && !doc.url.startsWith('http')) {
        // Si le chemin a été modifié par le nettoyage des slashes
        currentUrl = cleanPath;
        needsUpdate = true;
    }

    // 3. Mise à jour de la DB si le format a changé
    if (needsUpdate) {
      try {
        await prisma.document.update({
          where: { id: doc.id },
          data: { url: currentUrl } 
        });
        console.log(`✅ Chemin DB rectifié : ${currentUrl}`);
      } catch (e) {
        console.error("Erreur update DB doc:", e);
      }
    }

    // 4. Génération de l'URL signée
    // On passe le chemin propre à getFileUrl
    const displayUrl = await getFileUrl(currentUrl);

    return { 
      ...doc, 
      url: displayUrl || '#' 
    };
  })
);

  const application = { ...applicationRaw, documents: documentsWithUrls };

  // --- 2. CALCULS FINANCIERS (SECURISÉS) ---
  const payments = await prisma.payment.findMany({
    where: { applicationId: params.id },
    orderBy: { createdAt: "desc" },
  });

  const totalPayeXOF = payments.reduce((sum, p) => {
    // Conversion sécurisée des Decimal Prisma en Number
    const amount = Number(p.amount) || 0;
    const currency = (p.currency || "XOF") as "XOF" | "EUR" | "USD";
    return sum + convertToXOF(amount, currency);
  }, 0);

  const montantAttendu = Number(application.applicationFee) || 0;
  const resteAPayer = Math.max(0, montantAttendu - totalPayeXOF);
  
  // Ratio pour la barre de progression (évite division par 0)
  const progressionRatio = montantAttendu > 0 ? (totalPayeXOF / montantAttendu) * 100 : 0;

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20">
      
      {/* --- STICKY HEADER --- */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link href="/admin/students" className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-widest mb-1">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Retour Étudiants
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {application.user?.fullName || "Étudiant Inconnu"}
              </h1>
              <span className="hidden md:block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono text-[10px] uppercase">
                #{application.id.substring(0, 8)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <ApplicationStatusControl id={application.id} currentStatus={application.status} />
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* --- COLONNE GAUCHE (4/12) --- */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CARTE: DESTINATION & CURSUS */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-5 md:p-6 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
              <MapPin size={120} />
            </div>

            <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] block mb-6">
              Destination & Cursus
            </label>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 text-center sm:text-left">
              <div className="h-20 w-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl shadow-slate-200 shrink-0">
                {application.country?.substring(0, 2).toUpperCase() || "??"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 break-words">
                  {application.country || "Non défini"}
                </h3>
                <div className="flex items-center justify-center sm:justify-start gap-2 py-1 px-3 bg-slate-50 rounded-full w-fit mx-auto sm:mx-0 border border-slate-100">
                  <Calendar size={12} className="text-slate-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    Ouvert le {new Date(application.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Université */}
              <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 transition-colors hover:bg-slate-50">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Université Assignée
                </label>
                <UniversityAction 
                  applicationId={application.id} 
                  currentUniversityName={application.university?.name} 
                />
                {!application.university && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 text-[10px] text-amber-700 font-black animate-pulse">
                    <AlertCircle size={12} /> ASSIGNATION REQUISE
                  </div>
                )}
              </div>

              {/* Grid Passeport / Santé */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bloc Passeport */}
                <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[100px] overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <ShieldCheck size={12} className="text-blue-600" />
                    </div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Passeport
                    </label>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    <p className="font-mono text-[13px] sm:text-sm font-black text-slate-900 tracking-tight break-all">
                      {application.user?.passportNumber || "—"}
                    </p>
                  </div>
                </div>

                {/* Bloc Santé */}
                <div className={`p-4 rounded-3xl border transition-all duration-300 min-h-[100px] flex flex-col ${
                  application.user?.specificDiseases?.length > 0 
                  ? 'bg-red-50/40 border-red-100 shadow-sm' 
                  : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                      application.user?.specificDiseases?.length > 0 ? 'bg-red-100' : 'bg-emerald-50'
                    }`}>
                      {application.user?.specificDiseases?.length > 0 
                        ? <AlertCircle size={12} className="text-red-600" /> 
                        : <ShieldCheck size={12} className="text-emerald-600" />
                      }
                    </div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Santé
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {application.user?.specificDiseases?.length > 0 ? (
                      application.user.specificDiseases.map((disease: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-red-100 text-red-700 text-[9px] font-bold rounded-lg shadow-sm whitespace-nowrap">
                          {disease}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100/50">
                        RAS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARTE: STATUT FINANCIER */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 relative overflow-hidden group">
            <Banknote className="absolute -right-6 -bottom-6 h-32 w-32 text-slate-50 opacity-[0.03] -rotate-12 transition-transform group-hover:rotate-0 duration-700 pointer-events-none" />

            <div className="flex justify-between items-start mb-10">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                  Statut Financier
                </label>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${resteAPayer > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`} />
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">
                    {resteAPayer > 0 ? 'Recouvrement en cours' : 'Dossier intégralement soldé'}
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm text-slate-400">
                <Banknote size={20} />
              </div>
            </div>

            <div className="space-y-8">
              {/* Montant Principal */}
              <div className="relative">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Total Engagement</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">
                    {montantAttendu.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-slate-400 uppercase">Xof</span>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <span>Encaissement</span>
                  <span>{Math.min(100, Math.round(progressionRatio))}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(100, progressionRatio)}%` }}
                  />
                </div>
              </div>

              {/* Grid Détails */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-colors hover:bg-white hover:border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Déjà Perçu</p>
                  <p className="text-sm font-black text-emerald-600">
                    +{totalPayeXOF.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-colors hover:bg-white hover:border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Reste à payer</p>
                  <p className="text-sm font-black text-slate-900">
                    {resteAPayer.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Badge Validation */}
              <div className={`mt-4 p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all duration-500 ${
                resteAPayer > 0 
                ? 'bg-white border-slate-200 text-slate-500 shadow-sm' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-md shadow-emerald-500/5 scale-[1.02]'
              }`}>
                {resteAPayer > 0 ? (
                  <>
                    <AlertCircle size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">Solde Partiel</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">Conformité Financière validée</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- COLONNE DROITE (8/12) --- */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="text-blue-500" size={20} /> 
                  DOCUMENTS TRANSMIS
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Vérification de conformité
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black shadow-sm">
                {application.documents?.length || 0}
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {application.documents && application.documents.length > 0 ? (
                application.documents.map((doc: any) => (
                  <div key={doc.id} className="group p-6 hover:bg-slate-50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm border border-slate-100 transition-all group-hover:rotate-3 shrink-0">
                        <FileText size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="truncate">{doc.name}</span>
                          {doc.status === 'APPROVED' && <ShieldCheck size={14} className="text-emerald-500 shrink-0" />}
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                          {doc.type} <span className="opacity-30">•</span> {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-center">
                      {/* LIEN PUBLIC DIRECT (Balise 'a' pour téléchargement externe) */}
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none h-10 px-4 flex items-center justify-center gap-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                      >
                        <Download size={14} /> Aperçu
                      </a>
                      <DocumentActions id={doc.id} currentStatus={doc.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-4 border border-dashed border-slate-200">
                    <FileText size={32} />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">Le coffre-fort est vide.</p>
                  <p className="text-xs text-slate-300">Aucun document n'a été transmis par l'étudiant.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}