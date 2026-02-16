"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import axios from "axios";
import { 
  Plus, 
  Search, 
  MapPin, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Loader2, 
  School,
  Globe
} from "lucide-react";

export default function AdminUniversitiesPage() {
  const queryClient = useQueryClient();

  // Fetching avec sécurité sur le format de données
  const { data: universities = [], isLoading, error } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const res = await axios.get("/api/universities");
      // Gère le format { universities: [] } ou []
      return Array.isArray(res.data) ? res.data : res.data.universities || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/universities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["universities"] });
    }
  });

  function handleDelete(id: string) {
    if (!confirm("Cette action est irréversible. Supprimer l'institution ?")) return;
    deleteMutation.mutate(id);
  }

  // Groupement optimisé par pays
  const groupedUniversities = universities.reduce((acc: any, u: any) => {
    const country = u.country || "Autres Destinations";
    if (!acc[country]) acc[country] = [];
    acc[country].push(u);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#fcfcfd] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header de Prestige */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catalogue Académique</h1>
            <p className="text-slate-400 font-medium mt-1">Gérez les institutions et les offres de bourses internationales.</p>
          </div>
          <Link 
            href="/admin/universities/new" 
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
          >
            <Plus size={16} />
            Ajouter une institution
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="font-bold text-xs uppercase tracking-widest">Chargement du catalogue...</p>
          </div>
        ) : error ? (
          (() => {
            const isForbidden = axios.isAxiosError(error) && error.response?.status === 403;
            const errorMessage = isForbidden
              ? error.response?.data?.message || "Vous n'avez pas la permission d'accéder au catalogue des universités."
              : "Une erreur est survenue lors de la récupération des données.";
            return (
              <div className={isForbidden ? "bg-red-50 text-red-600 p-10 rounded-3xl border border-red-100 font-bold text-center flex flex-col items-center justify-center gap-6" : "bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 font-bold text-center"}>
                {isForbidden && <School size={48} className="mx-auto text-red-200 mb-4" />}
                <span>{errorMessage}</span>
                {isForbidden && (
                  <Link href="/admin/dashboard" className="mt-4 inline-block bg-slate-950 text-white rounded-2xl px-10 py-6 font-black uppercase text-xs tracking-widest hover:bg-[#db9b16] transition-all">
                    Retour au Dashboard
                  </Link>
                )}
              </div>
            );
          })()
        ) : (
          Object.entries(groupedUniversities).map(([country, unis]: [string, any]) => (
            <div key={country} className="mb-16">
              {/* Badge Pays */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-slate-100"></div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
                  <Globe size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{country}</span>
                </div>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>

              {/* Grille de Tableaux Épurés */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Institution</th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Localisation</th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {unis.map((u: any) => (
                      <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                              <img 
                                src={u.images?.[0] || "/images/university-default.png"} 
                                alt="" 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{u.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">ID: {u.id.substring(0,8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                            <MapPin size={14} className="text-slate-300" />
                            {u.city}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Link 
                              href={`/admin/universities/${u.id}`}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Voir détails"
                            >
                              <ExternalLink size={18} />
                            </Link>
                            <Link 
                              href={`/admin/universities/${u.id}/edit`}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Modifier"
                            >
                              <Edit3 size={18} />
                            </Link>
                            <button 
                              onClick={() => handleDelete(u.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        {/* État vide */}
        {!isLoading && universities.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <School size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune université enregistrée</p>
          </div>
        )}
      </div>
    </main>
  );
}