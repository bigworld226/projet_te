// @/app/admin/settings/page.tsx
"use client";
import { SettingsView } from "@/components/admin/setting/SettingsView";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUserAction } from "@/actions/user.actions"; // Import de l'action

export default function SettingsPage() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const data = await getCurrentUserAction();
      if (!data) throw new Error("Utilisateur non trouvé");
      return data;
    },
  });

  if (isLoading) return <div className="p-12 font-black text-slate-300 animate-pulse">Chargement du profil...</div>;
  if (error) return <div className="p-12 text-red-500">Erreur de session.</div>;

  return (
    <main className="p-8 md:p-12 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Paramètres</h1>
        <p className="text-slate-500 font-medium mt-2">
          Gérez vos informations personnelles et votre sécurité.
        </p>
      </header>

      {/* Maintenant 'user' contient bien fullName, email, phone, etc. */}
      <SettingsView user={user} />
    </main>
  );
}