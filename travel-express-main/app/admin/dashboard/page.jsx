'use client';
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Bell, Users, FileText, Briefcase, Building2, ChevronRight, LayoutDashboard, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdminDashboardPage() {
   const { data, isLoading, error } = useQuery({
      queryKey: ["adminDashboard"],
      queryFn: async () => {
         const res = await axios.get("/api/admin/dashboard");
         return res.data;
      }
   });

   const applications = data?.applications || [];
   const pendingApps = applications.filter((a) => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(a.status));
   const acceptedApps = applications.filter((a) => ['ACCEPTED', 'VISA_GRANTED'].includes(a.status));

   const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
      queryKey: ["recentActivities"],
      queryFn: async () => {
         const res = await axios.get("/api/admin/activities");
         return res.data.activities || [];
      }
   });

   if (isLoading) return <div className="flex h-screen items-center justify-center font-black text-[#db9b16] animate-pulse italic uppercase tracking-widest text-xs">Chargement du dashboard...</div>;
   
   if (error) {
      const isForbidden = axios.isAxiosError(error) && error.response?.status === 403;
      const errorMessage = isForbidden 
        ? error.response?.data?.message || "Vous n'avez pas accès à ce tableau de bord." 
        : "Erreur lors de la connexion au serveur.";

      return (
        <div className="p-12 flex flex-col items-center justify-center text-center h-screen bg-[#F4F7FE]">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-red-500/10">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter mb-4">
            {isForbidden ? "Accès Interdit" : "Oups !"}
          </h2>
          <p className="text-slate-500 max-w-lg mb-10 font-medium leading-relaxed">
            {errorMessage}
          </p>
          <Link href="/login">
            <Button className="bg-slate-950 text-white rounded-2xl px-10 py-6 font-black uppercase text-xs tracking-widest hover:bg-[#db9b16] transition-all">
               Se reconnecter
            </Button>
          </Link>
        </div>
      );
   }

  return (
    <>
      <main className="flex-1 p-8 md:p-12 overflow-y-auto h-screen bg-[#F4F7FE] font-sans">
          {/* HEADER STYLE TRAVEL EXPRESS */}
          <header className="flex justify-between items-center mb-12">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard size={16} className="text-[#db9b16]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Administration</span>
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">Dashboard</h1>
            </div>
          </header>

          {/* 📊 STATS CARDS */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                  { label: "Utilisateurs", val: data?.studentCount ?? 0, icon: Users, color: "bg-purple-100 text-purple-600" },
                  { label: "Universités", val: data?.universityCount ?? 0, icon: Building2, color: "bg-cyan-100 text-cyan-600" },
                  { label: "Dossiers", val: applications.length, icon: Briefcase, color: "bg-[#db9b16]/10 text-[#db9b16]" },
                  { label: "Documents", val: data?.documentCount ?? 0, icon: FileText, color: "bg-emerald-100 text-emerald-600" }
              ].map((stat, i) => (
                  <div key={i} className="bg-white p-7 rounded-[28px] shadow-sm border border-slate-100/50 flex items-center gap-5 hover:-translate-y-2 transition-all duration-300 group">
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${stat.color}`}>
                         <stat.icon size={28} />
                      </div>
                      <div>
                         <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">{stat.label}</div>
                         <div className="text-3xl font-black text-slate-800 leading-none">{stat.val}</div>
                      </div>
                  </div>
              ))}
           </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
             
             {/* 📋 GAUCHE - PENDING APPLICATIONS */}
             <div className="xl:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100/50">
                   <div className="flex justify-between items-center mb-10">
                      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter border-b-4 border-[#db9b16] pb-1">Pending Applications</h2>
                      <Link href="/admin/students" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#db9b16] hover:gap-2 transition-all">
                        View All <ChevronRight size={14} />
                      </Link>
                   </div>
                   
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                           <tr>
                              <th className="py-4 px-4 rounded-l-2xl">File Name</th>
                              <th className="py-4 px-4">Type</th>
                              <th className="py-4 px-4">Date</th>
                              <th className="py-4 px-4 rounded-r-2xl text-right">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {pendingApps.slice(0, 5).map((app, i) => (
                              <tr key={i} className="group hover:bg-slate-50/80 transition-all">
                                 <td className="py-6 px-4">
                                    <div className="font-black text-slate-700">#{app.userId?.substring(0,8)}...</div>
                                    <div className="text-[10px] text-[#db9b16] font-bold uppercase mt-1">Admission en cours</div>
                                 </td>
                                 <td className="py-6 px-4 text-slate-500 font-bold text-sm italic">Dossier</td>
                                 <td className="py-6 px-4 text-slate-500 text-sm font-medium">
                                    {new Date(app.updatedAt).toLocaleDateString()}
                                 </td>
                                 <td className="py-6 px-4 text-right">
                                    <Link href={`/admin/applications/${app.id}`} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#db9b16] transition-colors">
                                      Review
                                    </Link>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </div>

                {/* FIL D'ACTIVITÉS */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100/50">
                      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-10">Recent Activities</h2>
                      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-100">
                         {activitiesData?.map((activity) => {
                            // Icone dynamique selon le type d'activité
                            let Icon = FileText;
                            let iconColor = "text-[#db9b16]";
                            if (activity.type?.startsWith("PAYMENT")) { Icon = Bell; iconColor = "text-yellow-500"; }
                            if (activity.type === "APP_NEW" || activity.type === "APP_UPDATE") { Icon = Briefcase; iconColor = "text-blue-500"; }
                            if (activity.type === "DOC_VERIFIED") { Icon = FileText; iconColor = "text-green-500"; }
                            if (activity.type === "DOC_REJECTED") { Icon = FileText; iconColor = "text-red-500"; }
                            if (activity.type === "PAYMENT_DELETE") { Icon = Bell; iconColor = "text-red-500"; }
                            return (
                              <div key={activity.id} className="relative flex items-start gap-8 group">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-2xl border-4 border-white bg-white ${iconColor} shadow-xl shadow-slate-200 shrink-0 z-10`}>
                                   <Icon size={18} />
                                </div>
                                <div className="flex-1 bg-slate-50/50 p-5 rounded-[24px] border border-slate-100 group-hover:bg-white group-hover:border-[#db9b16]/20 transition-all">
                                   <div className="flex items-center justify-between mb-2">
                                      <div className="font-black text-slate-800 text-xs uppercase">{activity.title}</div>
                                      <time className="text-[10px] font-black text-[#db9b16] uppercase">
                                        {activity.date ? new Date(activity.date).toLocaleString() : ''}
                                      </time>
                                   </div>
                                   <div className="text-slate-500 text-sm font-medium italic leading-relaxed">{activity.description}</div>
                                </div>
                              </div>
                            );
                         })}
                      </div>
                </div>
             </div>

             {/* 📈 DROITE - SUMMARY */}
             <div className="space-y-8">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100/50">
                   <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-10 text-center">Summary</h2>
                   <div className="relative flex items-center justify-center w-full h-44 mb-10">
                      <svg viewBox="0 0 36 36" className="w-40 h-40 transform -rotate-90">
                         <path className="text-slate-50" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                         <path className="text-blue-500"
                               strokeDasharray={`${Math.max(0, (pendingApps.length / (applications.length || 1)) * 100 - 4)}, 100`}
                               d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                               fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-5xl font-black text-slate-800 tracking-tighter">{pendingApps.length}</span>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                         <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase"><span className="h-2 w-2 rounded-full bg-blue-500"></span> En attente</span>
                         <span className="font-black text-slate-800">{pendingApps.length}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                         <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase"><span className="h-2 w-2 rounded-full bg-emerald-400"></span> Acceptés</span>
                         <span className="font-black text-slate-800">{acceptedApps.length}</span>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-800 overflow-hidden relative">
                   <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8">Weekly Analysis</h2>
                   <div className="h-40 flex items-end justify-between gap-3 px-2">
                      {[40, 70, 45, 90, 60, 80].map((h, i) => (
                         <div key={i} className="flex-1 flex gap-1 items-end h-full group/bar">
                            <div style={{height: `${h}%`}} className="w-full bg-blue-500 rounded-t-lg opacity-80 group-hover/bar:bg-[#db9b16] transition-all"></div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
      </main>
    </>
  );
}