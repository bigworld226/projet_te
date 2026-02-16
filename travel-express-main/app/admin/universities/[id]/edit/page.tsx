'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Save, Upload, X, Loader2,
  Image as ImageIcon, School, MapPin,
  FileText, DollarSign, BookOpen, Trash2, Globe
} from "lucide-react";
import { toast } from "sonner";
import { saveUniversityAction } from "@/actions/university.actions";
import axios from "axios";

export default function EditUniversityPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    city: "",
    country: "", // ✅ Ajouté pour Prisma
    summary: "",
    description: "",
    costRange: "",
    programs: "",
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [oldImages, setOldImages] = useState<string[]>([]);
  const [oldPdfUrl, setOldPdfUrl] = useState<string | null>(null);
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);

  const { data: university, isLoading } = useQuery({
    queryKey: ["university", id],
    queryFn: async () => {
      const res = await axios.get(`/api/universities/${id}`);
      return res.data.university;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (university) {
      setForm({
        name: university.name || "",
        city: university.city || "",
        country: university.country || "", // ✅ Chargement du pays
        summary: university.summary || "",
        description: university.description || "",
        costRange: university.costRange || "",
        programs: university.programs || "",
      });
      setOldImages(university.images || []);
      setOldPdfUrl(university.pdfUrl || null);
    }
  }, [university]);

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await saveUniversityAction(formData);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["university", id] });
      toast.success("Mise à jour réussie");
      router.push(`/admin/universities`);
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();

    // ✅ Injection de toutes les données nécessaires
    formData.append('id', id as string);
    formData.append('name', form.name);
    formData.append('city', form.city);
    formData.append('country', form.country); // ✅ FIX: Cette ligne manquait
    formData.append('description', form.description);
    formData.append('summary', form.summary);
    formData.append('tuitionFee', form.costRange);
    formData.append('levels', form.programs);

    selectedFiles.forEach(f => formData.append('images', f));
    formData.append('existingImages', JSON.stringify(oldImages));

    if (newPdfFile) {
      formData.append('pdf', newPdfFile);
    }

    updateMutation.mutate(formData);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <main className="min-h-screen bg-[#fcfcfd] py-12 px-4 italic">
      <div className="max-w-3xl mx-auto">

        <Link href={`/admin/universities`} className="flex items-center gap-2 text-slate-400 mb-8 font-black text-[10px] uppercase tracking-widest">
          <ArrowLeft size={14} /> Annuler
        </Link>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-10 text-white">
            <h1 className="text-2xl font-black uppercase italic">Éditer <span className="text-blue-500">l'établissement</span></h1>
          </div>

          <form className="p-10 space-y-10" onSubmit={handleSubmit}>

            {/* IDENTITÉ */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="label-style">Nom</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="premium-input-edit" required />
              </div>
              <div className="space-y-2">
                <label className="label-style">Ville</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="premium-input-edit" required />
              </div>
              <div className="space-y-2">
                <label className="label-style">Pays</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="premium-input-edit bg-white"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="Chine">Chine</option>
                  <option value="France">France</option>
                  <option value="Canada">Canada</option>
                  <option value="Espagne">Espagne</option>
                  <option value="Maroc">Maroc</option>
                  <option value="Sénégal">Sénégal</option>
                </select>
              </div>
            </div>

            {/* ACADÉMIQUE */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="label-style">Description</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="premium-input-edit" required />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-style">Frais de scolarité</label>
                  <input value={form.costRange} onChange={(e) => setForm({ ...form, costRange: e.target.value })} className="premium-input-edit" required />
                </div>
                <div className="space-y-2">
                  <label className="label-style">Niveaux / Programmes</label>
                  <input value={form.programs} onChange={(e) => setForm({ ...form, programs: e.target.value })} className="premium-input-edit" required />
                </div>
              </div>
            </div>

            {/* IMAGES */}
            <div className="space-y-4">
              <label className="label-style">Galerie Photos (Max 3)</label>
              <div className="grid grid-cols-3 gap-4">
                {oldImages.map((src, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden group">
                    <img src={src} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setOldImages(oldImages.filter(img => img !== src))} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                {oldImages.length + selectedFiles.length < 3 && (
                  <label className="aspect-video border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50">
                    <Upload className="text-slate-300" />
                    <input type="file" hidden accept="image/*" multiple onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles([...selectedFiles, ...files]);
                    }} />
                  </label>
                )}
              </div>
            </div>

            {/* SECTION 4 : DOCUMENT PDF (GUIDE) */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <FileText size={14} className="text-blue-500" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Guide ou Brochure (PDF)</h2>
              </div>

              <div className="space-y-3">
                {/* Affichage du PDF existant si aucun nouveau n'est sélectionné */}
                {oldPdfUrl && !newPdfFile && (
                  <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg text-emerald-500 shadow-sm border border-emerald-50">
                        <FileText size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Document actuel</span>
                        <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">Voir le guide enregistré</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOldPdfUrl(null)}
                      className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                      title="Supprimer le document actuel"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}

                {/* Affichage du nouveau PDF sélectionné */}
                {newPdfFile && (
                  <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm">
                        <Upload size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Nouveau fichier prêt</span>
                        <span className="text-xs font-bold text-blue-900 truncate max-w-[200px]">{newPdfFile.name}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewPdfFile(null)}
                      className="text-blue-300 hover:text-red-500 p-2"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                {/* Zone d'upload (visible seulement si aucun PDF n'est présent ou sélectionné) */}
                {!oldPdfUrl && !newPdfFile && (
                  <label className="flex items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-blue-500">
                      <Upload size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600">Télécharger un guide PDF</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Format PDF uniquement (Max 10Mo)</p>
                    </div>
                    <input
                      type="file"
                      hidden
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setNewPdfFile(file);
                      }}
                    />
                  </label>
                )}
              </div>
            </section>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.4em] hover:bg-blue-600 transition-all disabled:bg-slate-200"
            >
              {updateMutation.isPending ? "Enregistrement..." : "Mettre à jour"}
            </button>

          </form>
        </div>
      </div>

      <style jsx>{`
        .premium-input-edit { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font-weight: 700; font-size: 13px; outline: none; transition: all 0.2s; }
        .premium-input-edit:focus { border-color: #3b82f6; background: white; }
        .label-style { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px; }
      `}</style>
    </main>
  );
}