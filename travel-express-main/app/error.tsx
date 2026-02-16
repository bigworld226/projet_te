"use client"; // Obligatoire pour les fichiers error.tsx

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log de l'erreur dans ta console ou un service de monitoring
    console.error("Erreur d'application:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-red-50 text-center space-y-6">
        
        {/* Icône d'alerte douce */}
        <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
          <AlertTriangle className="text-red-500 w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">
            Quelque chose s'est mal passé
          </h2>
          <p className="text-slate-500 font-medium">
            Nous n'avons pas pu charger ces informations. Cela peut être dû à une interruption temporaire de la connexion.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => reset()} // Tente de re-rendre la page sans recharger tout le navigateur
            className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-500 transition-all shadow-xl shadow-slate-200"
          >
            <RefreshCcw size={20} />
            Réessayer maintenant
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors py-2"
          >
            <Home size={18} />
            Retour à l'accueil
          </Link>
        </div>

        {/* Identifiant technique (Optionnel, utile pour le support) */}
        {error.digest && (
          <p className="text-[10px] text-slate-300 font-mono">
            ID Erreur : {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}