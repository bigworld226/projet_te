'use client'
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50/50 backdrop-blur-sm flex flex-col items-center justify-center px-6">
      <div className="relative flex items-center justify-center">
        {/* Effet de halo doré en arrière-plan */}
        <div className="absolute w-24 h-24 bg-[#db9b16]/20 rounded-full blur-2xl animate-pulse" />
        
        {/* Spinner principal */}
        <Loader2 className="w-12 h-12 text-[#db9b16] animate-spin relative z-10" />
      </div>

      <div className="mt-6 text-center space-y-2">
        <h2 className="text-xl font-black text-slate-900 tracking-tight animate-pulse">
          Chargement en cours...
        </h2>
        <p className="text-slate-500 text-sm font-medium">
          Nous préparons vos informations de voyage.
        </p>
      </div>

      {/* Barre de progression discrète en bas */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#db9b16] to-slate-900 w-1/3 animate-[loading_1.5s_infinite_ease-in-out]" />
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}