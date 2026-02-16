import Link from 'next/link';
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { authService } from '@/services/auth.service';
import { 
  FileText, MessageCircle, ChevronRight, Check, 
  GraduationCap, Download, MapPin, Loader2, 
  Sparkles, Building2, Search, ArrowLeft, Globe2
} from "lucide-react"
import { getFileUrl } from '@/lib/storage';
import { UploadDocumentButton } from "@/components/student/UploadDocumentButton";
import { UniversityImage } from "@/components/student/UniversityImage";
import { MessageBox } from "@/components/student/MessageBox";
import { cn } from "@/lib/utils";

const TIMELINE_STEPS = [
  { id: 'DRAFT', title: "Constitution du dossier", desc: "Création du compte et téléversement des pièces justificatives." },
  { id: 'SUBMITTED', title: "Vérification Agence", desc: "Nos experts vérifient la conformité de vos documents." },
  { id: 'UNDER_REVIEW', title: "Instruction Université", desc: "Votre dossier est envoyé à l'université pour étude." },
  { id: 'ACCEPTED', title: "Admission Validée", desc: "Bravo ! L'université a accepté votre candidature." },
  { id: 'JW202_RECEIVED', title: "Formulaire Visa (JW202)", desc: "Réception du document officiel nécessaire pour le visa." },
  { id: 'VISA_GRANTED', title: "Obtention du Visa", desc: "Visa étudiant accordé par l'ambassade." },
  { id: 'FLIGHT_BOOKED', title: "Réservation Vol", desc: "Billet d'avion pris, préparatifs de départ." },
  { id: 'COMPLETED', title: "Arrivée à destination", desc: "Installation, inscription finale et début des cours !" }
];

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await authService.requireUser();

  if (!userId) redirect('/login');

  const app = await prisma.application.findUnique({
    where: { id: id, userId: userId },
    include: { university: true, documents: true, user: true }
  });

 if (!app) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
      <h1 className="text-2xl font-black text-slate-900 mb-4 uppercase italic">Dossier Introuvable</h1>
      <p className="text-slate-500 mb-8 max-w-md">
        Le dossier <span className="font-mono text-[#db9b16]">{id}</span> n'existe pas ou n'est pas lié à votre compte actuel (<span className="font-mono">{userId}</span>).
      </p>
      <Link href="/student/" className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest">
        Retour au Dashboard
      </Link>
    </div>
  );
}

  const currentIndex = TIMELINE_STEPS.findIndex((s) => s.id === app.status);
  const hasUniversity = !!app.university;

  const documentsWithUrls = await Promise.all(
    app.documents.map(async (doc) => ({
      ...doc,
      fileUrl: await getFileUrl(doc.url)
    }))
  );

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans selection:bg-[#db9b16] selection:text-white pb-20">
 

      <main className="max-w-7xl mx-auto px-6 pt-12">
        
        {/* 🎫 TOP BAR & ID */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-[#db9b16]/10 text-[#db9b16] px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-[#db9b16]/20">
                DOSSIER N°{app.id.slice(-6).toUpperCase()}
              </span>
              <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                <Globe2 size={14} className="text-slate-300" /> {app.country}
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter leading-[0.85] italic uppercase">
              Mon <span className="text-[#db9b16] not-italic">Admission</span>
            </h1>
          </div>

          {/* PROGRESS PERCENTAGE BADGE */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 min-w-[240px]">
             <div className="relative h-16 w-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-50" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
                    strokeDasharray={175.9} 
                    strokeDashoffset={175.9 - (175.9 * (currentIndex + 1)) / TIMELINE_STEPS.length} 
                    strokeLinecap="round" className="text-[#db9b16]" />
                </svg>
                <span className="absolute text-xs font-black text-slate-900">
                  {Math.round(((currentIndex + 1) / TIMELINE_STEPS.length) * 100)}%
                </span>
             </div>
             <div>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Progression</div>
               <div className="text-sm font-black text-slate-900 uppercase italic">Étape {currentIndex + 1} / {TIMELINE_STEPS.length}</div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* 📍 COLONNE GAUCHE : TIMELINE EXPÉRIENTIELLE */}
          <section className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm relative overflow-hidden">
               {/* Filigrane décoratif */}
               <div className="absolute top-10 right-10 text-slate-50 pointer-events-none -rotate-12">
                  <Sparkles size={120} />
               </div>

              <div className="relative">
                {/* Ligne de progression dynamique */}
                <div className="absolute left-[23px] top-6 bottom-12 w-1 bg-slate-50 rounded-full" />
                <div 
                  className="absolute left-[23px] top-6 w-1 bg-gradient-to-b from-green-400 to-[#db9b16] rounded-full transition-all duration-1000 ease-in-out" 
                  style={{ height: `${(currentIndex / (TIMELINE_STEPS.length - 1)) * 90}%` }}
                />

                <div className="space-y-12 relative">
                  {TIMELINE_STEPS.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isFuture = index > currentIndex;
                    return (
                      <div key={step.id} className={cn("flex gap-8 relative transition-all duration-700", isFuture && "opacity-20")}> 
                        <div className={cn(
                          "z-10 h-12 w-12 rounded-2xl border-4 flex items-center justify-center shrink-0 transition-all duration-500 bg-white",
                          isCompleted ? "border-green-500 bg-green-50 text-green-500" : 
                          isCurrent ? "border-[#db9b16] bg-[#db9b16] text-white shadow-2xl shadow-[#db9b16]/40 scale-125 rotate-3" : 
                          "border-slate-50 text-slate-200"
                        )}>
                          {isCompleted ? <Check size={20} strokeWidth={4} /> : <CircleIcon size={20} isCurrent={isCurrent} />}
                        </div>
                        <div className="pt-1"> 
                          <h3 className={cn("font-black text-xl leading-none mb-3 italic tracking-tight uppercase", isCurrent ? "text-slate-950" : "text-slate-900")}> 
                            {step.title}
                          </h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 📂 COLONNE DROITE : FOCUS UNIVERSITÉ & DOCS */}
          <section className="lg:col-span-5 space-y-10 animate-in fade-in slide-in-from-right-6 duration-1000 delay-200">
            
            {/* UNIVERSITÉ CARD : LOOK "BOARDING PASS" */}
            {hasUniversity ? (
              <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-45 transition-transform duration-1000">
                  <Building2 size={200} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                     <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#db9b16]">Admission Confirmée</span>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-10">
                    <div className="h-20 w-20 shrink-0 rounded-[2rem] overflow-hidden bg-white flex items-center justify-center border-4 border-white/5 relative shadow-2xl">
                      {app.university?.imageUrl ? (
                        <UniversityImage
                          src={app.university.imageUrl}
                          alt={app.university.name}
                          className="w-full h-full object-cover relative z-10"
                          fallback={
                            <div className="absolute inset-0 flex items-center justify-center text-slate-950 font-black text-2xl bg-[#db9b16]">
                              {app.university?.name?.charAt(0) || "U"}
                            </div>
                          }
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-950 font-black text-2xl bg-[#db9b16]">
                          {app.university?.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-2xl font-black leading-none tracking-tighter uppercase italic group-hover:text-[#db9b16] transition-colors">
                        {app.university?.name}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-3">
                        <MapPin size={14} className="text-[#db9b16]" /> 
                        {app.university?.city}, {app.country}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-10 pt-10 border-t border-white/10">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Rentrée Universitaire</div>
                      <div className="text-lg font-black italic tracking-tight uppercase">Septembre 2026</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Type de Bourse</div>
                      <div className="text-lg font-black italic tracking-tight uppercase text-[#db9b16]">Excellence</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-12 text-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                   <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner">
                    <Search className="text-[#db9b16]" size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter mb-3">Recherche Active</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[240px] mx-auto">
                    Nous finalisons les négociations avec l'établissement idéal pour votre projet en <span className="text-slate-950 font-bold">{app.country}</span>.
                  </p>
                </div>
              </div>
            )}

            {/* DOCUMENTS : ÉLÉGANCE FONCTIONNELLE */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <h3 className="font-black text-slate-950 uppercase italic tracking-tighter text-2xl flex items-center gap-3">
                  <FileText className="text-[#db9b16]" size={24}/> Dossier <span className="text-slate-200 not-italic">/</span> Documents
                </h3>
              </div>
              
              <div className="space-y-4 mb-10">
                {documentsWithUrls.map((doc) => (
                  <div key={doc.id} className="group flex items-center justify-between p-5 rounded-[1.8rem] bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-sm hover:shadow-xl hover:shadow-slate-200/50">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#db9b16] shadow-sm transition-all group-hover:rotate-3">
                        <FileText size={20} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-950 truncate uppercase tracking-tight">{doc.name}</div>
                        <div className={cn(
                          "text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mt-1",
                          doc.status === 'APPROVED' ? "text-green-500" : "text-amber-500"
                        )}>
                          <div className={cn("h-1 w-1 rounded-full", doc.status === 'APPROVED' ? "bg-green-500" : "bg-amber-500")} />
                          {doc.status}
                        </div>
                      </div>
                    </div>
                    {typeof doc.fileUrl === 'string' ? (
                      <Link href={doc.fileUrl} target="_blank" className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-950 hover:text-white text-slate-300 transition-all">
                        <Download size={18} strokeWidth={3} />
                      </Link>
                    ) : (
                      <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-200 text-slate-400 cursor-not-allowed">
                        <Download size={18} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <UploadDocumentButton applicationId={app.id} className="w-full bg-slate-950 hover:bg-[#db9b16] text-white py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3" />
            </div>

            {/* MESSAGERIE AVEC L'AGENCE */}
            <MessageBox 
              applicationId={app.id} 
              currentUserId={userId} 
              className="min-h-[600px]"
            />

            {/* WHATSAPP CTA PREMIUM */}
            <Link 
              href="https://wa.me/+22665604592" 
              className="flex items-center gap-6 p-8 bg-emerald-50 rounded-[3rem] border border-emerald-100/50 group transition-all hover:shadow-2xl hover:shadow-emerald-200/50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="h-16 w-16 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all">
                <MessageCircle size={32} />
              </div>
              <div className="text-left relative z-10">
                <div className="font-black text-emerald-950 text-base uppercase italic tracking-tighter">Votre Conseiller</div>
                <p className="text-[10px] text-emerald-600/80 font-black uppercase tracking-widest">Réponse en moins de 2h</p>
              </div>
              <div className="ml-auto h-10 w-10 flex items-center justify-center rounded-full bg-white text-emerald-500 shadow-sm group-hover:translate-x-2 transition-transform">
                <ChevronRight size={20} strokeWidth={3} />
              </div>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

function CircleIcon({ size, isCurrent }: { size: number, isCurrent: boolean }) {
  return isCurrent ? <Loader2 size={size} className="animate-spin" strokeWidth={3} /> : <GraduationCap size={size} strokeWidth={2.5} />;
}