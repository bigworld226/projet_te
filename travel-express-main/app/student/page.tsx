import Link from 'next/link';
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { 
  GraduationCap, 
  Flag, 
  Plus,
  ArrowRight,
  CircleDot,
  Globe2,
  Compass,
  Map,
  ShieldCheck,
  CheckCircle2
} from "lucide-react"
import { authService } from "@/services/auth.service";
import ApplicationCard from '@/components/student/ApplicationCard';

async function getStudentData() {
  const session = await authService.getSession();
  if (!session) return null;

  return await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      applications: {
        include: {
          university: true,
          documents: true,
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
}

export default async function StudentDashboard() {
  const student = await getStudentData();
  if (!student) redirect('/login');

  // Groupage des candidatures par pays
  const groupedApplications = student.applications.reduce<Record<string, any[]>>((acc, app) => {
    const countryName = app.university?.country || 'Destination en attente';
    if (!acc[countryName]) acc[countryName] = [];
    acc[countryName].push(app);
    return acc;
  }, {});

  const totalApps = student.applications.length;

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans selection:bg-[#db9b16] selection:text-white">
      
    

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* ✈️ HERO SECTION & STATS COMPACTES */}
        <div className="relative mb-16 p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12">
            <Globe2 size={280} />
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#db9b16]/10 text-[#db9b16] rounded-full mb-4">
                <CircleDot size={12} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Espace Étudiant Certifié</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter italic leading-none">
                Bienvenue, <br />
                <span className="text-slate-300 not-italic">{student.fullName?.split(' ')[0]}</span>
              </h1>
              <p className="text-slate-400 mt-6 font-medium max-w-md uppercase text-[10px] tracking-[0.2em] leading-relaxed">
                Suivez l'évolution de vos demandes d'admission et préparez votre départ.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="group bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] min-w-[180px] hover:bg-slate-950 hover:text-white transition-all duration-700">
                <div className="flex items-center justify-between mb-4 text-[#db9b16]">
                  <Map size={24} strokeWidth={1.5} />
                  <div className="h-1 w-8 bg-[#db9b16]/20 rounded-full" />
                </div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Dossiers Actifs</div>
                <div className="text-4xl font-black tracking-tighter italic">{totalApps}</div>
              </div>

              <div className="group bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] min-w-[180px] hover:bg-slate-950 hover:text-white transition-all duration-700">
                <div className="flex items-center justify-between mb-4 text-[#db9b16]">
                  <Compass size={24} strokeWidth={1.5} />
                  <div className="h-1 w-8 bg-[#db9b16]/20 rounded-full" />
                </div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Pays Visés</div>
                <div className="text-4xl font-black tracking-tighter italic">{Object.keys(groupedApplications).length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 🗺️ AFFICHAGE DES GROUPES PAR PAYS */}
        {totalApps > 0 ? (
          <div className="space-y-24">
            {Object.entries(groupedApplications).map(([country, apps]) => {
              return (
                                              <section key={country} className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="flex items-center gap-6 mb-10">
                  <div className="h-16 w-16 bg-slate-950 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-2xl shadow-slate-200 relative overflow-hidden group">
                    <Flag className="text-[#db9b16] relative z-10 group-hover:scale-110 transition-transform duration-500" size={28} />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#db9b16]/20 to-transparent" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">{country}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#db9b16] animate-pulse" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        {apps.length} dossier{apps.length > 1 ? 's' : ''} en instruction
                      </p>
                    </div>
                  </div>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-100 via-slate-50 to-transparent ml-6" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {apps.map((app) => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              </section>
              )
            }
            )}

            {/* 🚀 CTA RÉENGAGEMENT FINAL : VERSION LUMIÈRE & PRESTIGE */}
                        <section className="mt-32 p-12 md:p-20 rounded-[4rem] bg-white border border-slate-100 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.03)]">
                          {/* Effets de lumière colorés très subtils en arrière-plan */}
                          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#db9b16]/5 rounded-full blur-[120px] -mr-64 -mt-64" />
                          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />
                          
                          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="max-w-xl text-center md:text-left">
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full mb-6">
                                <ShieldCheck className="text-[#db9b16] w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Optimisez votre profil</span>
                              </div>
                              
                              <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-6 text-slate-950 leading-[0.9]">
                                Explorez d'autres <br />
                                <span className="text-[#db9b16] not-italic">Horizons Académiques</span>
                              </h3>
                              
                              <p className="text-slate-500 font-medium text-lg leading-relaxed italic">
                                "Saviez-vous que postuler dans au moins deux pays différents augmente statistiquement vos chances d'admission de <span className="text-slate-900 font-bold">65%</span> ?"
                              </p>
                            </div>

                            <Link href="/#destinations" className="shrink-0 group">
                              <button className="relative bg-slate-950 text-white px-14 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all duration-500 hover:bg-[#db9b16] hover:text-slate-950 hover:scale-105 shadow-2xl shadow-slate-200 flex items-center gap-4 overflow-hidden">
                                {/* Effet de brillance au survol */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                
                                <span className="relative z-10">Nouvelle destination</span>
                                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                              </button>
                            </Link>
                          </div>

                          {/* Petite décoration de fond : un globe discret en filigrane */}
                          <div className="absolute bottom-[-10%] right-[-5%] opacity-[0.02] text-slate-950 pointer-events-none">
                            <Globe2 size={400} />
                          </div>
                        </section>
                      </div>
        ) : (
          /* 📭 EMPTY STATE ÉLITE */
          <div className="text-center py-40 rounded-[5rem] bg-white border-2 border-dashed border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-700">
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-[#db9b16]/20 blur-3xl rounded-full" />
              <div className="relative h-32 w-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
                <GraduationCap size={64} strokeWidth={1} />
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Prêt pour le grand saut ?</h3>
            <p className="text-slate-400 mt-4 mb-12 max-w-sm mx-auto text-base font-medium leading-relaxed">
              Votre tableau de bord est actuellement vierge. Sélectionnez votre destination de rêve et laissez-nous gérer le reste.
            </p>
            <Link href="/#destinations">
              <button className="bg-slate-950 text-white px-14 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-200 hover:bg-[#db9b16] hover:text-slate-950 transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                <Compass size={18} />
                Lancer ma première candidature
              </button>
            </Link>
          </div>
        )}
      </main>

      {/* 🛠 FOOTER ASSISTANCE */}
      <footer className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex flex-col md:flex-row items-center gap-6 bg-white border border-slate-100 px-10 py-6 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-slate-900 text-[10px] font-black uppercase tracking-[0.2em]">
              Agent Travel Express en ligne
            </p>
          </div>
          <div className="h-px w-12 bg-slate-100 hidden md:block" />
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Une question ? Contactez votre conseiller via WhatsApp
          </p>
        </div>
        <p className="mt-12 text-slate-300 text-[9px] font-black uppercase tracking-[0.5em]">
          © {new Date().getFullYear()} Travel Express International — Excellence Without Borders
        </p>
      </footer>
    </div>
  );
}