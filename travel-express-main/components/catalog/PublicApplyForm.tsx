'use client';

import { createApplicationAction } from "@/actions/application.actions";
import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function PublicApplyForm({ countryName }: { countryName: string }) {
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      // On passe le formData à l'action (qui contient maintenant le pays)
      const result = await createApplicationAction(formData);

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (e: any) {
      setError("Une erreur réseau est survenue.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6 bg-white p-8 rounded-4xl shadow-xl border border-slate-100 max-w-lg mx-auto mt-8 transition-all"
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 italic uppercase">
          Destination : {countryName}
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Lancez votre dossier d'inscription
        </p>
      </div>

      {/* Champ caché pour envoyer le pays à l'action sans saisie utilisateur */}
      <input type="hidden" name="country" value={countryName} />

      <button 
        type="submit" 
        disabled={isPending || success}
        className="w-full bg-slate-900 text-white px-6 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#db9b16] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Traitement...
          </>
        ) : (
          "Confirmer ma candidature"
        )}
      </button>

      {/* Messages de retour */}
      {success && (
        <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={20} />
          <span className="text-sm font-black uppercase italic">Candidature envoyée avec succès !</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100 animate-in shake">
          <AlertCircle size={20} />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}
    </form>
  );
}