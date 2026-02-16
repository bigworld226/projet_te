'use client';

import { useRouter } from 'next/navigation';
import { useState } from "react";
import {
  Loader2, ArrowLeft, Upload, CheckCircle2,
  FileText, X, School, Globe,
  AlertCircle, MapPin, Image as ImageIcon,
  ChevronRight, DollarSign, BookOpen, Languages, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { saveUniversityAction } from "@/actions/university.actions";

export default function AddNewUniversity() {
  const router = useRouter();
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    let newFiles = [...selectedFiles];
    for (const file of files) {
      if (newFiles.length >= 3) break;
      if (!newFiles.some(f => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    }
    setSelectedFiles(newFiles);
    setPreviews(newFiles.map(file => URL.createObjectURL(file)));
    e.target.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    // On nettoie et on ajoute les fichiers manuellement pour être sûr des clés
    formData.delete('images');
    selectedFiles.forEach(file => formData.append('images', file));

    if (selectedPdf) {
      formData.set('pdf', selectedPdf);
    }

    try {
      // Utilisation directe de la Server Action pour éviter les erreurs d'API route
      const result = await saveUniversityAction(formData);

      if (result.success) {
        toast.success("Institution publiée avec succès");
        router.push('/admin/universities');
        router.refresh();
      } else {
        setError(result.error || "Une erreur est survenue.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Erreur de communication avec le serveur.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-16 px-4 selection:bg-[#db9b16]/30">
      <div className="max-w-5xl mx-auto">

        <nav className="flex items-center gap-4 mb-10">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-black text-[10px] uppercase tracking-[0.2em]">
            <ArrowLeft size={14} strokeWidth={3} /> Catalogue
          </button>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em]">Ajout Institution</span>
        </nav>

        <div className="bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">

          <header className="bg-slate-900 p-12 md:p-16 text-white relative">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#db9b16]/20 border border-[#db9b16]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#db9b16] animate-pulse" />
                <span className="text-[9px] font-black text-[#db9b16] uppercase tracking-widest">Console Admin</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic leading-none">
                Déployer une <br /><span className="text-[#db9b16]">Nouvelle Université</span>
              </h1>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="p-10 md:p-20 space-y-20">
            {error && (
              <div className="flex items-center gap-4 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-2xl text-red-600">
                <AlertCircle size={20} />
                <span className="text-xs font-black uppercase tracking-wider">{error}</span>
              </div>
            )}

            {/* Section 1: Identité */}
            <section className="grid lg:grid-cols-3 gap-12">
              <aside className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#db9b16] shadow-sm"><Globe size={24} /></div>
                <h2 className="text-lg font-black text-slate-900 uppercase italic leading-tight">Identité &<br />Lieu</h2>
              </aside>
              <div className="lg:col-span-2 space-y-12">
                <InputWrapper label="Nom de l'établissement" required>
                  <div className="relative group">
                    <School className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#db9b16] transition-colors" size={20} />
                    <input name="name" required placeholder="EX: TSINGHUA UNIVERSITY" className="premium-input" />
                  </div>
                </InputWrapper>
                <div className="grid md:grid-cols-2 gap-10">
                  <InputWrapper label="Ville" required>
                    <div className="relative group">
                      <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#db9b16] transition-colors" size={20} />
                      <input name="city" required placeholder="EX: PÉKIN" className="premium-input" />
                    </div>
                  </InputWrapper>
                  <InputWrapper label="Pays de destination" required>
                    <select name="country" required className="premium-input appearance-none">
                      {["Chine", "France", "Canada", "Espagne", "Allemagne", "Maroc"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </InputWrapper>
                </div>
              </div>
            </section>

            {/* Section 2: Académique - LES BONS NOMS POUR PRISMA */}
            <section className="grid lg:grid-cols-3 gap-12">
              <aside className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#db9b16] shadow-sm"><BookOpen size={24} /></div>
                <h2 className="text-lg font-black text-slate-900 uppercase italic leading-tight">Cursus &<br />Finances</h2>
              </aside>
              <div className="lg:col-span-2 space-y-12">
                <div className="grid md:grid-cols-2 gap-10">
                  <InputWrapper label="Frais de scolarité (Prix en fcfa)" required>
                    <div className="relative group">
                      <DollarSign className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#db9b16] transition-colors" size={20} />
                      <input name="tuitionFee" required placeholder="EX: 1200000 XOF" className="premium-input" />
                    </div>
                  </InputWrapper>
                  <InputWrapper label="Résumé court (summary)" required>
                    <div className="relative group">
                      <FileText className="absolute left-0 top-6 text-slate-300 group-focus-within:text-[#db9b16] transition-colors" size={20} />
                      <textarea
                        name="summary"
                        required
                        rows={2}
                        placeholder="EX:Resume bref de l'institution ou university..."
                        className="premium-input resize-none min-h-80 pt-6"
                      />
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-2 ml-1 tracking-widest">
                      Apparaît sur les cartes de recherche (Max 160 caractères conseillé)
                    </p>
                  </InputWrapper>
                </div>
                <InputWrapper label="Programmes disponibles (programs)" required>
                  <div className="relative group">
                    <Info className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#db9b16] transition-colors" size={20} />
                    <input name="levels" required placeholder="EX: MASTER, LICENCE" className="premium-input" />
                  </div>
                </InputWrapper>
                <InputWrapper label="Description complète" required>
                  <textarea name="description" required rows={4} className="premium-input resize-none pl-0 focus:pl-4" placeholder="DÉTAILLEZ L'OFFRE ACADÉMIQUE..." />
                </InputWrapper>
              </div>
            </section>

            {/* Section 3: Médias */}
            <section className="grid lg:grid-cols-3 gap-12">
              <aside className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#db9b16] shadow-sm"><ImageIcon size={24} /></div>
                <h2 className="text-lg font-black text-slate-900 uppercase italic leading-tight">Médias &<br />Brochure</h2>
              </aside>
              <div className="lg:col-span-2 space-y-12">
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Galerie Photos (Max 3)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previews.map((src, i) => (
                      <div key={i} className="aspect-square relative group rounded-3xl overflow-hidden bg-slate-100 shadow-md">
                        <img src={src} className="h-full w-full object-cover" alt="preview" />
                        <button type="button" onClick={() => {
                          const updated = selectedFiles.filter((_, idx) => idx !== i);
                          setSelectedFiles(updated);
                          setPreviews(updated.map(f => URL.createObjectURL(f)));
                        }} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                    {selectedFiles.length < 3 && (
                      <label className="aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all">
                        <Upload size={24} className="text-slate-300" />
                        <input type="file" hidden accept="image/*" multiple onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Plaquette PDF (pdfUrl)</label>
                  <label className={cn(
                    "relative flex items-center gap-6 p-8 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer",
                    selectedPdf ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
                  )}>
                    <FileText size={32} className={selectedPdf ? "text-emerald-500" : "text-slate-300"} />
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-slate-900 uppercase">{selectedPdf ? selectedPdf.name : "Joindre le guide PDF"}</h4>
                    </div>
                    <input type="file" name="pdf" accept="application/pdf" className="hidden" onChange={(e) => setSelectedPdf(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            </section>

            <button type="submit" disabled={isSubmitting} className={cn(
              "w-full py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4",
              isSubmitting ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-[#db9b16]'
            )}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              {isSubmitting ? "Publication en cours..." : "Publier l'institution"}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .premium-input {
          width: 100%; border-bottom: 2px solid #F1F5F9; border-top: none; border-left: none; border-right: none;
          padding: 1.5rem 0 1.5rem 3rem; background: transparent; font-weight: 800; font-size: 14px; color: #0F172A;
          transition: all 0.4s; outline: none; text-transform: uppercase;
        }
        .premium-input:focus { border-bottom-color: #db9b16; }
      `}</style>
    </main>
  );
}

function InputWrapper({ label, children, required }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
        {label} {required && <span className="text-[#db9b16]">*</span>}
      </label>
      {children}
    </div>
  );
}