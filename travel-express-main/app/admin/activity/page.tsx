'use client';
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ActivityList, ActivityItem } from "@/components/admin/ActivityList";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AdminActivityPage() {
  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ["adminActivities"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/activities");
      return res.data.activities || [];
    }
  });

  if (isLoading) return <div className="p-12 text-center font-black text-[#db9b16] animate-pulse uppercase italic tracking-widest text-xs">Chargement des activités...</div>;
  
  if (error) {
    const isForbidden = axios.isAxiosError(error) && error.response?.status === 403;
    const errorMessage = isForbidden 
      ? error.response?.data?.message || "Vous n'avez pas la permission de consulter les activités." 
      : "Erreur lors du chargement des activités.";

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
    <main className="p-8 md:p-12 max-w-4xl mx-auto">
      <header className="mb-12">
          <h1 className="text-3xl font-bold text-slate-800">Fil d'Activité</h1>
          <p className="text-slate-500 font-medium mt-1">Historique des actions récentes sur la plateforme.</p>
      </header>

      <ActivityList initialActivities={activities} />
    </main>
  );
}
