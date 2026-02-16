'use client';
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Eye, FileText, Search, Filter, Globe, Banknote, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DeleteStudentButton } from "@/components/admin/students/DeleteStudentButton";

export default function AdminStudentsPage() {
  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ["adminStudents"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/students");
      return res.data.users || [];
    }
  });

  if (isLoading) return <div className="p-12 text-center font-medium">Chargement des étudiants...</div>;

  if (error) {
    const isForbidden = axios.isAxiosError(error) && error.response?.status === 403;
    const errorMessage = isForbidden 
      ? error.response?.data?.message || "Accès refusé" 
      : "Erreur lors du chargement des données. Veuillez réessayer.";

    return (
      <div className="p-12 flex flex-col items-center justify-center text-center h-[60vh]">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-red-500/10">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter mb-4">
          {isForbidden ? "Accès Restreint" : "Oups !"}
        </h2>
        <p className="text-slate-500 max-w-lg mb-10 font-medium leading-relaxed">
          {errorMessage}
        </p>
        <div className="flex gap-4">
          <Link href="/admin/dashboard">
            <Button className="bg-slate-950 text-white rounded-2xl px-10 py-6 font-black uppercase text-xs tracking-widest hover:bg-[#db9b16] transition-all">
              Tableau de bord
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8 md:p-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestion des Étudiants</h1>
          <p className="text-slate-500 font-medium mt-1">
            {students.length} étudiant{students.length > 1 ? 's' : ''} inscrit{students.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-3">
             <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                   type="text" 
                   placeholder="Rechercher un nom ou email..." 
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
              <th className="py-5 px-6">Dossier(s) / Pays</th>
              <th className="py-5 px-6">Frais Dossier</th>
              <th className="py-5 px-6">Passeport</th>
              <th className="py-5 px-6">Date Inscription</th>
              <th className="py-5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {students.map((student: any) => (
              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {(student.fullName || student.email || "?").substring(0,2).toUpperCase()}
                     </div>
                     <div>
                        <div className="font-bold text-slate-800">
                          <Link href={`/admin/students/${student.id}`} className="hover:underline">
                            {student.fullName || "Sans nom"}
                          </Link>
                        </div>
                        <div className="text-slate-400 text-xs font-medium">{student.email}</div>
                     </div>
                  </div>
                </td>

                <td className="py-4 px-6">
                   {student.applications && student.applications.length > 0 ? (
                     <div className="space-y-1">
                        {student.applications.map((app: any) => (
                          <div key={app.id} className="flex items-center gap-2">
                            <Globe size={14} className="text-blue-500" />
                            <span className="text-sm font-bold text-slate-700">{app.country}</span>
                            <StatusBadge status={app.status} />
                          </div>
                        ))}
                     </div>
                   ) : (
                     <span className="text-slate-400 text-xs italic">Aucun dossier créé</span>
                   )}
                </td>

                <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                        {student.applications?.map((app: any) => (
                            <div key={app.id} className="flex items-center gap-1 text-slate-600 text-sm font-bold">
                                <Banknote size={16} className="text-emerald-500" />
                                {app.applicationFee?.toLocaleString()} <span className="text-[10px] text-slate-400">XOF</span>
                            </div>
                        ))}
                    </div>
                </td>

                <td className="py-4 px-6 text-slate-500 text-sm font-medium">
                   {student.passportNumber || <span className="text-red-400 text-xs">Manquant</span>}
                </td>

                <td className="py-4 px-6 text-slate-500 text-sm font-medium">
                   {new Date(student.createdAt).toLocaleDateString()}
                </td>

                <td className="py-4 px-6 text-right">
                   <div className="flex items-center justify-end gap-2">
                     <Link href={`/admin/students/${student.id}`}>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                           <Eye size={18} />
                        </Button>
                     </Link>
                     <DeleteStudentButton studentId={student.id} studentName={student.fullName || student.email} />
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {students.length === 0 && (
           <div className="p-12 text-center text-slate-400">Aucun étudiant inscrit pour le moment.</div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
   const styles: any = {
      'DRAFT': "bg-slate-100 text-slate-500",
      'SUBMITTED': "bg-blue-50 text-blue-600 border border-blue-100",
      'UNDER_REVIEW': "bg-amber-50 text-amber-600 border border-amber-100",
      'ACCEPTED': "bg-emerald-50 text-emerald-600 border border-emerald-100",
      'REJECTED': "bg-red-50 text-red-600 border border-red-100",
   }
   
   return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${styles[status] || styles['DRAFT']}`}>
         {status.replace(/_/g, ' ')}
      </span>
   )
}