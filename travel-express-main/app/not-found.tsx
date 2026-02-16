'use client'
import Link from "next/link";
import { MoveLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Illustration visuelle */}
        <div className="relative">
          <h1 className="text-[12rem] font-black text-slate-200 leading-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-[#db9b16] text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg">
              Page introuvable
            </span>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Oups ! Destination inconnue.
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Désolé, la page que vous recherchez semble avoir pris un autre vol 
            ou n'a jamais existé dans nos dossiers.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#db9b16] transition-all shadow-xl shadow-slate-200"
          >
            <Home size={20} />
            Retour à l'accueil
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors py-2"
          >
            <MoveLeft size={18} />
            Revenir en arrière
          </button>
        </div>

        {/* Déco */}
        <div className="pt-12">
          <div className="w-12 h-1.5 bg-[#db9b16]/20 rounded-full mx-auto" />
        </div>
      </div>
    </div>
  );
}