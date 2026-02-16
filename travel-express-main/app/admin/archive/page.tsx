import {prisma} from "@/lib/prisma";
import Link from "next/link";
import { Search, Filter, Archive, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function ArchivePage() {
  const archivedApplications = await prisma.application.findMany({
    where: {
        status: 'COMPLETED'
    },
    include: {
        user: true,
        university: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <main className="p-8 md:p-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Archives</h1>
          <p className="text-slate-500 font-medium mt-1">Dossiers finalisés et clôturés</p>
        </div>
        
        <div className="flex gap-3">
             <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                   type="text" 
                   placeholder="Rechercher..." 
                   className="pl-10 pr-4 h-12 rounded-xl border-none shadow-sm bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 w-64 outline-none"
                />
             </div>
             <Button variant="outline" className="h-12 w-12 rounded-xl bg-white border-none shadow-sm text-slate-500 p-0 flex items-center justify-center">
                <Filter size={20} />
             </Button>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100/50 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="py-5 px-6">Étudiant</th>
              <th className="py-5 px-6">Université</th>
              <th className="py-5 px-6">Programme</th>
              <th className="py-5 px-6">Date de Clôture</th>
              <th className="py-5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {archivedApplications.map((app:any) => (
              <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">
                        {app.user.fullName?.substring(0,2).toUpperCase() || 'NA'}
                     </div>
                     <div>
                        <div className="font-bold text-slate-800">{app.user.fullName}</div>
                        <div className="text-slate-400 text-xs font-medium">{app.user.email}</div>
                     </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                   <div className="font-bold text-slate-700 text-sm">{app.university.name}</div>
                   <div className="text-slate-400 text-xs">{app.university.city}</div>
                </td>
                <td className="py-4 px-6">
                   <div className="text-slate-600 text-sm font-medium bg-slate-100 px-2 py-1 rounded-md inline-block">
                        {app.desiredProgram || 'Non spécifié'}
                   </div>
                </td>
                <td className="py-4 px-6 text-slate-500 text-sm font-medium">
                   {new Date(app.updatedAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-right">
                   <Link href={`/admin/applications/${app.id}`}>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                         <ExternalLink size={18} />
                      </Button>
                   </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {archivedApplications.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <Archive size={40} />
                </div>
                <h3 className="text-slate-800 font-bold text-lg">Aucune archive</h3>
                <p className="text-slate-400 mt-1 max-w-sm">
                    Les dossiers avec le statut "Complété" apparaîtront ici.
                </p>
           </div>
        )}
      </div>
    </main>
  );
}