'use client';
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { DocumentActions } from "@/components/admin/DocumentActions"; 
import Link from "next/link";
import { FileText, Search, Filter, Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMemo, useState } from "react";

function resolveDocumentUrl(url?: string | null) {
  if (!url) return "";
  return String(url).trim();
}

function normalizeDateInput(dateInput: string) {
  if (!dateInput) return null;
  const date = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export default function AdminDocumentsPage() {
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ["adminDocuments"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/documents");
      return res.data.documents || [];
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((doc: any) => {
      if (doc?.type) types.add(String(doc.type));
    });
    return ["ALL", ...Array.from(types).sort((a, b) => a.localeCompare(b))];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const startDate = normalizeDateInput(dateFrom);
    const endDate = normalizeDateInput(dateTo);

    return documents.filter((doc: any) => {
      const docDate = new Date(doc.createdAt);
      const userName = doc?.application?.user?.fullName || "";
      const userEmail = doc?.application?.user?.email || "";
      const docName = doc?.name || "";
      const docType = doc?.type || "";

      const matchesText =
        !query ||
        String(docName).toLowerCase().includes(query) ||
        String(docType).toLowerCase().includes(query) ||
        String(userName).toLowerCase().includes(query) ||
        String(userEmail).toLowerCase().includes(query);

      const matchesType = selectedType === "ALL" || docType === selectedType;

      const matchesStartDate =
        !startDate || (!Number.isNaN(docDate.getTime()) && docDate >= startDate);

      const matchesEndDate = (() => {
        if (!endDate) return true;
        if (Number.isNaN(docDate.getTime())) return false;
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return docDate <= end;
      })();

      return matchesText && matchesType && matchesStartDate && matchesEndDate;
    });
  }, [documents, searchTerm, selectedType, dateFrom, dateTo]);

  if (isLoading) return <div className="p-12 text-center font-black text-[#db9b16] animate-pulse uppercase italic tracking-widest text-xs">Chargement des documents...</div>;
  
  if (error) {
    const isForbidden = axios.isAxiosError(error) && error.response?.status === 403;
    const errorMessage = isForbidden 
      ? error.response?.data?.message || "Vous n'avez pas la permission de gérer les documents." 
      : "Erreur lors du chargement des documents.";

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
        <Link href="/admin/dashboard">
          <Button className="bg-slate-950 text-white rounded-2xl px-10 py-6 font-black uppercase text-xs tracking-widest hover:bg-[#db9b16] transition-all">
            Retour
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="p-8 md:p-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestion des Documents</h1>
          <p className="text-slate-500 font-medium mt-1">Tous les fichiers téléversés</p>
        </div>
        
        <div className="flex gap-3">
             <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                   type="text" 
                   placeholder="Rechercher un document..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10 pr-4 h-12 rounded-xl border-none shadow-sm bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 w-64 outline-none"
                />
             </div>
             <Button
                variant="outline"
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`h-12 w-12 rounded-xl border-none shadow-sm p-0 flex items-center justify-center transition-colors ${showFilters ? "bg-[#db9b16] text-white" : "bg-white text-slate-500"}`}
             >
                <Filter size={20} />
             </Button>
        </div>
      </header>

      {showFilters && (
        <div className="mb-6 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Type de document</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-11 w-full rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#db9b16]"
            >
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "ALL" ? "Tous les types" : type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Date de début</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#db9b16]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Date de fin</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#db9b16]"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedType("ALL");
              setDateFrom("");
              setDateTo("");
              setSearchTerm("");
            }}
            className="h-11 rounded-xl"
          >
            Réinitialiser
          </Button>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100/50 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="py-5 px-6">Document</th>
              <th className="py-5 px-6">Étudiant</th>
              <th className="py-5 px-6">Type</th>
              <th className="py-5 px-6">Date</th>
              <th className="py-5 px-6">Statut</th>
              <th className="py-5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredDocuments.map((doc: any) => {
              const fileUrl = resolveDocumentUrl(doc.url);
              const ext = doc?.name?.split(".").pop() || doc?.url?.split(".").pop() || "file";
              return (
              <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="py-4 px-6">
                  {fileUrl ? (
                    <Link href={fileUrl} target="_blank" className="flex items-center gap-3 group/link">
                       <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover/link:bg-blue-600 group-hover/link:text-white transition-colors">
                          <FileText size={20} />
                       </div>
                       <div>
                          <div className="font-bold text-slate-800 group-hover/link:text-blue-600 transition-colors">{doc.name}</div>
                          <div className="text-slate-400 text-xs font-medium uppercase">{ext}</div>
                       </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                      <span className="animate-pulse">Lien en cours…</span>
                    </div>
                  )}
                </td>
                <td className="py-4 px-6">
                   <div className="font-bold text-slate-700 text-sm">{doc.application.user.fullName}</div>
                   <div className="text-slate-400 text-xs">{doc.application.user.email}</div>
                </td>
                <td className="py-4 px-6">
                   <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                      {doc.type}
                   </span>
                </td>
                <td className="py-4 px-6 text-slate-500 text-sm font-medium">
                   {new Date(doc.createdAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-6">
                   <StatusBadge status={doc.status} />
                </td>
                <td className="py-4 px-6 text-right flex justify-end items-center gap-2">
                   {fileUrl ? (
                     <a href={fileUrl} target="_blank" rel="noreferrer" download>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                           <Download size={18} />
                        </Button>
                     </a>
                   ) : (
                     <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg text-slate-400 opacity-50 cursor-not-allowed" disabled>
                       <Download size={18} />
                     </Button>
                   )}
                   <div className="scale-90 origin-right">
                      <DocumentActions id={doc.id} currentStatus={doc.status} />
                   </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
        </div>
        {documents.length === 0 && (
           <div className="p-12 text-center text-slate-400">Aucun document téléversé.</div>
        )}
        {documents.length > 0 && filteredDocuments.length === 0 && (
           <div className="p-12 text-center text-slate-400">Aucun document ne correspond aux filtres actuels.</div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
   const styles: any = {
      'PENDING': "bg-amber-100 text-amber-600",
      'APPROVED': "bg-emerald-100 text-emerald-600",
      'REJECTED': "bg-red-100 text-red-600"
   }
   
   return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border border-transparent ${styles[status]}`}>
         {status}
      </span>
   )
}
