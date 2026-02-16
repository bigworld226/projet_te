"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button"; 
import { Plane, ShieldPlus, FileText, User, Plus, Trash2, Loader2 } from "lucide-react";
import { createApplicationAction } from "@/actions/application.actions";
import { toast } from "sonner";
import { Suspense } from "react";

 function ApplyPage() {
  const searchParams = useSearchParams();
  const country = searchParams.get("country") || "Chine";
  
  const [isPending, setIsPending] = useState(false);
  const [diseases, setDiseases] = useState<string[]>([""]);

  const addDisease = () => setDiseases([...diseases, ""]);
  
  const removeDisease = (index: number) => {
    if (diseases.length > 1) {
      setDiseases(diseases.filter((_, i) => i !== index));
    }
  };

  const handleDiseaseChange = (index: number, value: string) => {
    const newDiseases = [...diseases];
    newDiseases[index] = value;
    setDiseases(newDiseases);
  };

  // Gestion de la soumission
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    
    // On nettoie les maladies pour ne pas envoyer de strings vides
    const cleanedDiseases = diseases.filter(d => d.trim() !== "");
    formData.delete("diseases"); // On enlève les anciennes valeurs
    cleanedDiseases.forEach(d => formData.append("diseases", d));

    try {
      const result = await createApplicationAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Candidature envoyée avec succès !");
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'envoi");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#db9b16]/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#db9b16]/20 rounded-lg">
              <Plane className="text-[#db9b16] w-5 h-5" />
            </div>
            <span className="text-[#db9b16] font-black uppercase tracking-[0.2em] text-xs">Dossier d'admission</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Destination : {country}</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">Complétez votre profil pour lancer la procédure.</p>
        </div>

        <form onSubmit={onSubmit} className="p-10 space-y-8">
          <input type="hidden" name="country" value={country} />

          {/* Section 1 : Identité */}
          <div className="space-y-5">
            <h2 className="flex items-center gap-3 font-black text-slate-900 uppercase text-sm tracking-wider">
              <User size={18} className="text-blue-600" /> Informations Personnelles
            </h2>
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-xs font-bold text-slate-500 uppercase ml-1">
                Nom Complet (tel que sur le passeport)
              </label>
              <input 
                id="fullName"
                name="fullName" 
                type="text" 
                required 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium" 
                placeholder="Ex: Marcelle Bakouan" 
              />
            </div>
          </div>

          {/* Section 2 : Documents */}
          <div className="space-y-5">
            <h2 className="flex items-center gap-3 font-black text-slate-900 uppercase text-sm tracking-wider">
              <FileText size={18} className="text-blue-600" /> Documents
            </h2>
            <div className="space-y-2">
              <label htmlFor="passportNumber" className="text-xs font-bold text-slate-500 uppercase ml-1">
                Numéro de Passeport (Facultatif au départ)
              </label>
              <input 
                id="passportNumber"
                name="passportNumber" 
                type="text" 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-mono" 
                placeholder="N° de passeport" 
              />
            </div>
          </div>

          {/* Section 3 : Médicale */}
          <div className="space-y-5">
            <h2 className="flex items-center gap-3 font-black text-slate-900 uppercase text-sm tracking-wider">
              <ShieldPlus size={18} className="text-red-500" /> État de santé
            </h2>
            
            <div className="space-y-3">
              {diseases.map((disease, index) => (
                <div key={index} className="flex gap-2 group animate-in fade-in slide-in-from-top-2">
                  <input 
                    value={disease}
                    onChange={(e) => handleDiseaseChange(index, e.target.value)}
                    type="text" 
                    className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none transition-all font-medium" 
                    placeholder="Allergie, maladie chronique..." 
                  />
                  {diseases.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeDisease(index)}
                      className="p-4 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button 
              type="button" 
              onClick={addDisease}
              className="flex items-center gap-2 text-sm text-blue-600 font-bold hover:gap-3 transition-all px-1"
            >
              <Plus size={16} /> Ajouter une mention médicale
            </button>
          </div>

          {/* Bouton de soumission */}
          <Button 
            disabled={isPending}
            type="submit" 
            className="w-full bg-slate-900 text-white py-8 rounded-[1.5rem] font-black text-xl shadow-xl hover:bg-[#db9b16] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin h-6 w-6" />
                Traitement en cours...
              </>
            ) : (
              `Soumettre mon dossier pour la ${country}`
            )}
          </Button>
          
          <p className="text-center text-slate-400 text-xs font-medium">
            En soumettant ce formulaire, vous acceptez d'être contacté par un agent pour le suivi.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function page() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin h-10 w-10 text-slate-400" />
        </div>
      }>
        <ApplyPage />
      </Suspense>
    </div>
  );
}